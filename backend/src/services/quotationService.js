const { Payment, File } = require('../models');

const getQuotationSummaryForFile = async (fileId) => {

  const payments = await Payment.findAll({
    where: { file_id: fileId }
  });

  const file = await File.findByPk(fileId, { attributes: ['estimated_amount'] });
  const totalQuotationAmount = parseFloat(file?.estimated_amount || 0);

  const totalReceivedAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const outstandingAmount = Math.max(0, totalQuotationAmount - totalReceivedAmount);

  return {
    totalQuotationAmount,
    totalReceivedAmount,
    totalPaidAmount: totalReceivedAmount,
    outstandingAmount
  };
};

module.exports = {
  getQuotationSummaryForFile
};
