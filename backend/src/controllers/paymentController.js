const { Payment, Quotation, File, Employee, WorkflowTask } = require('../models');
const { getQuotationSummaryForFile } = require('../services/quotationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getTotalPaidForFile = async (fileId, excludedPaymentId = null) => {
  const payments = await Payment.findAll({ where: { file_id: fileId } });
  return payments.reduce((total, payment) => {
    return payment.id === excludedPaymentId ? total : total + parseFloat(payment.amount);
  }, 0);
};

const getPaymentsByFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const payments = await Payment.findAll({
      where: { file_id: fileId },
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Quotation, as: 'quotation', attributes: ['id', 'quotation_number', 'amount', 'status'] }
      ],
      order: [['payment_date', 'DESC']]
    });

    const summary = await getQuotationSummaryForFile(fileId);

    return successResponse(res, 200, {
      payments,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const {
      quotation_id,
      amount,
      payment_type,
      payment_date,
      payment_method,
      reference_number,
      notes
    } = req.body;

    if (!amount || !payment_date || !payment_method) {
      return errorResponse(res, 400, 'amount, payment_date, and payment_method are required fields');
    }

    if (parseFloat(amount) <= 0) {
      return errorResponse(res, 400, 'Payment amount must be greater than zero');
    }

    const file = await File.findByPk(fileId);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const totalPaid = await getTotalPaidForFile(fileId);
    if (totalPaid + parseFloat(amount) > parseFloat(file.estimated_amount || 0)) {
      return errorResponse(res, 400, 'Total payments cannot exceed the quotation amount');
    }

    if (quotation_id) {
      const quotation = await Quotation.findByPk(quotation_id);
      if (!quotation || quotation.file_id !== parseInt(fileId, 10)) {
        return errorResponse(res, 400, 'Invalid quotation_id for this file');
      }
    }

    const payment = await Payment.create({
      file_id: parseInt(fileId, 10),
      quotation_id: quotation_id ? parseInt(quotation_id, 10) : null,
      amount: parseFloat(amount),
      payment_type: payment_type || 'ADVANCE',
      payment_date,
      payment_method,
      reference_number: reference_number || null,
      notes: notes || null,
      created_by: req.user.id
    });

    await WorkflowTask.update(
      { completed_by: req.user.id, completed_at: new Date() },
      { where: { file_id: parseInt(fileId, 10), task_key: 'collect_client_payment', completed_at: null } }
    );

    const created = await Payment.findByPk(payment.id, {
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name'] },
        { model: Quotation, as: 'quotation', attributes: ['id', 'quotation_number'] }
      ]
    });

    const summary = await getQuotationSummaryForFile(fileId);

    return successResponse(res, 201, { payment: created, summary }, 'Payment registered successfully');
  } catch (error) {
    next(error);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fileId } = req.params;
    const payment = await Payment.findByPk(id);

    if (!payment) {
      return errorResponse(res, 404, 'Payment not found');
    }

    if (fileId && payment.file_id !== parseInt(fileId, 10)) {
      return errorResponse(res, 404, 'Payment not found for this file');
    }

    const {
      amount,
      payment_type,
      payment_date,
      payment_method,
      reference_number,
      notes
    } = req.body;

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return errorResponse(res, 400, 'Payment amount must be greater than zero');
      }
      const file = await File.findByPk(payment.file_id);
      const totalPaidExcludingCurrent = await getTotalPaidForFile(payment.file_id, payment.id);
      if (totalPaidExcludingCurrent + parseFloat(amount) > parseFloat(file?.estimated_amount || 0)) {
        return errorResponse(res, 400, 'Total payments cannot exceed the quotation amount');
      }
      payment.amount = parseFloat(amount);
    }
    if (payment_type !== undefined) payment.payment_type = payment_type;
    if (payment_date !== undefined) payment.payment_date = payment_date;
    if (payment_method !== undefined) payment.payment_method = payment_method;
    if (reference_number !== undefined) payment.reference_number = reference_number || null;
    if (notes !== undefined) payment.notes = notes || null;

    await payment.save();

    const updated = await Payment.findByPk(payment.id, {
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name'] },
        { model: Quotation, as: 'quotation', attributes: ['id', 'quotation_number'] }
      ]
    });
    const summary = await getQuotationSummaryForFile(payment.file_id);

    return successResponse(res, 200, { payment: updated, summary }, 'Payment updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPaymentsByFile,
  createPayment,
  updatePayment
};
