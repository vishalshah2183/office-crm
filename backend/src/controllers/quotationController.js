const { Quotation, File, Employee } = require('../models');
const { getQuotationSummaryForFile } = require('../services/quotationService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getQuotationsByFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const quotations = await Quotation.findAll({
      where: { file_id: fileId },
      include: [{ model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] }],
      order: [['created_at', 'DESC']]
    });

    const summary = await getQuotationSummaryForFile(fileId);

    return successResponse(res, 200, {
      quotations,
      summary
    });
  } catch (error) {
    next(error);
  }
};

const createQuotation = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { quotation_number, amount, status } = req.body;

    if (!quotation_number || !amount) {
      return errorResponse(res, 400, 'quotation_number and amount are required fields');
    }

    if (parseFloat(amount) <= 0) {
      return errorResponse(res, 400, 'Amount must be a positive number');
    }

    const file = await File.findByPk(fileId);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const existing = await Quotation.findOne({ where: { quotation_number } });
    if (existing) {
      return errorResponse(res, 400, `Quotation number '${quotation_number}' already exists`);
    }

    const quotation = await Quotation.create({
      file_id: parseInt(fileId, 10),
      quotation_number,
      amount: parseFloat(amount),
      status: status || 'DRAFT',
      created_by: req.user.id
    });

    const created = await Quotation.findByPk(quotation.id, {
      include: [{ model: Employee, as: 'creator', attributes: ['id', 'name'] }]
    });

    return successResponse(res, 201, { quotation: created }, 'Quotation created successfully');
  } catch (error) {
    next(error);
  }
};

const updateQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quotation_number, amount, status } = req.body;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return errorResponse(res, 404, 'Quotation not found');
    }

    if (quotation_number && quotation_number !== quotation.quotation_number) {
      const existing = await Quotation.findOne({ where: { quotation_number } });
      if (existing) {
        return errorResponse(res, 400, `Quotation number '${quotation_number}' is already in use`);
      }
      quotation.quotation_number = quotation_number;
    }

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return errorResponse(res, 400, 'Amount must be a positive number');
      }
      quotation.amount = parseFloat(amount);
    }

    if (status) {
      const ALLOWED = ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'FINALIZED'];
      if (!ALLOWED.includes(status)) {
        return errorResponse(res, 400, `Invalid status. Allowed: ${ALLOWED.join(', ')}`);
      }
      quotation.status = status;
    }

    await quotation.save();

    return successResponse(res, 200, { quotation }, 'Quotation updated successfully');
  } catch (error) {
    next(error);
  }
};

const finalizeQuotation = async (req, res, next) => {
  try {
    const { id } = req.params;

    const quotation = await Quotation.findByPk(id);
    if (!quotation) {
      return errorResponse(res, 404, 'Quotation not found');
    }

    quotation.status = 'FINALIZED';
    await quotation.save();

    return successResponse(res, 200, { quotation }, 'Quotation finalized successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotationsByFile,
  createQuotation,
  updateQuotation,
  finalizeQuotation
};
