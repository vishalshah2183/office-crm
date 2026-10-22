const { Op } = require('sequelize');
const { sequelize, File, Employee, Payment, Expense, WorkflowTask } = require('../models');
const { successResponse } = require('../utils/apiResponse');

const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    // Total files count
    const totalFiles = await File.count();

    // Files grouped by current_status
    const filesByStatusRaw = await File.findAll({
      attributes: ['current_status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['current_status']
    });

    const filesByStatus = {};
    filesByStatusRaw.forEach(item => {
      filesByStatus[item.current_status] = parseInt(item.get('count'), 10);
    });

    const filesByWorkTypeRaw = await File.findAll({
      attributes: ['work_type', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['work_type']
    });
    const filesByWorkType = {};
    filesByWorkTypeRaw.forEach(item => {
      filesByWorkType[item.work_type] = parseInt(item.get('count'), 10);
    });

    // Total quotation amount (Finalized or Accepted)
    const totalQuotationRaw = await File.sum('estimated_amount') || 0;

    // Total payments received
    const totalReceivedRaw = await Payment.sum('amount') || 0;

    const totalQuotationAmount = parseFloat(totalQuotationRaw);
    const totalReceived = parseFloat(totalReceivedRaw);
    const outstandingAmount = Math.max(0, totalQuotationAmount - totalReceived);

    const isAdmin = ['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(req.user?.role?.name?.toUpperCase()) || req.user?.role_id === 1;
    const expenseWhere = {};
    if (startDate && endDate) {
      expenseWhere.expense_date = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      expenseWhere.expense_date = { [Op.gte]: startDate };
    } else if (endDate) {
      expenseWhere.expense_date = { [Op.lte]: endDate };
    }
    const totalExpenses = isAdmin
      ? parseFloat(await Expense.sum('amount', { where: expenseWhere }) || 0)
      : undefined;

    const pendingTaskCount = await WorkflowTask.count({ where: { completed_at: null } });

    const completedFilesCount = await File.count({ where: { current_status: 'COMPLETED' } });
    const pendingFilesCount = totalFiles - completedFilesCount;

    return successResponse(res, 200, {
      summary: {
        totalFiles,
        pendingFilesCount,
        completedFilesCount,
        filesByStatus,
        filesByWorkType,
        pendingTaskCount,
        totalQuotationAmount,
        totalReceived,
        outstandingAmount,
        ...(isAdmin ? { totalExpenses } : {})
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSummary
};
