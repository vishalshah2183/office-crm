const { Op } = require('sequelize');
const { sequelize, File, Employee, WorkflowTask, Payment } = require('../models');

const BUILDING_TASKS = [
  ['collect_layout_plan', 'Collect layout plan', 'DOCUMENT', 'Office Assistant'],
  ['collect_na_order', 'Collect NA order', 'DOCUMENT', 'Office Assistant'],
  ['collect_712_property_card', 'Collect 7/12 or Property Card', 'DOCUMENT', 'Office Assistant'],
  ['collect_aeenxer_d', 'Collect Aeenxer-D', 'DOCUMENT', 'Office Assistant'],
  ['collect_aeenxer_e', 'Collect Aeenxer-E', 'DOCUMENT', 'Office Assistant'],
  ['collect_form_2a', 'Collect FORM-2A', 'DOCUMENT', 'Office Assistant'],
  ['collect_bahedhari', 'Collect Bahedhari', 'DOCUMENT', 'Office Assistant'],
  ['collect_joining_certificate', 'Collect Joining Certificate', 'DOCUMENT', 'Office Assistant'],
  ['create_autocad_file', 'Create AutoCAD file', 'TECHNICAL', 'Civil Engineer'],
  ['fill_enagar_form', 'Fill form at eNagar', 'ONLINE', 'Office Assistant'],
  ['pay_scrutiny_fee', 'Pay scrutiny fee', 'FEE', 'Owner'],
  ['solve_enagar_query', 'Solve eNagar query', 'QUERY', 'Civil Engineer'],
  ['nagarpalika_approval', 'Obtain Nagarpalika approval', 'APPROVAL', 'Owner'],
  ['solve_approval_query', 'Solve approval query and upload to eNagar', 'QUERY', 'Civil Engineer'],
  ['pay_sanction_fee', 'Pay sanction fees', 'FEE', 'Owner']
];

const GENERAL_TASKS = [
  ['collect_general_documents', 'Collect general documents and details', 'DOCUMENT', 'Office Assistant'],
  ['complete_file', 'Complete file', 'PROCESSING', 'Owner']
];

const COMMON_TASKS = [
  ['collect_client_payment', 'Collect client payment', 'PAYMENT', 'Owner'],
  ['deliver_file_to_client', 'Deliver file to client', 'DELIVERY', null]
];

const getTasksForWorkType = (workType) => [
  ...(workType === 'Building Permission' ? BUILDING_TASKS : GENERAL_TASKS),
  ...COMMON_TASKS
].map(([task_key, title, category, default_designation], index) => ({
  task_key,
  title,
  category,
  default_designation,
  sequence: index + 1,
  is_optional: category === 'QUERY',
  is_triggered: category !== 'QUERY'
}));

const createFileWithWorkflow = async (fileData, employeeId) => {
  const transaction = await sequelize.transaction();
  try {
    const { advance_payment, ...fileAttributes } = fileData;
    const newFile = await File.create({
      ...fileAttributes,
      current_status: 'NEW',
      created_by: employeeId
    }, { transaction });

    await WorkflowTask.bulkCreate(
      getTasksForWorkType(fileAttributes.work_type).map((task) => ({ ...task, file_id: newFile.id })),
      { transaction }
    );

    if (advance_payment?.amount) {
      await Payment.create({
        file_id: newFile.id,
        amount: parseFloat(advance_payment.amount),
        payment_type: 'ADVANCE',
        payment_date: advance_payment.payment_date,
        payment_method: advance_payment.payment_method,
        reference_number: advance_payment.reference_number || null,
        notes: advance_payment.notes || null,
        created_by: employeeId
      }, { transaction });
    }

    await transaction.commit();

    return await File.findByPk(newFile.id, {
      include: [{ model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] }]
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const queryFiles = async (query) => {
  const {
    search,
    odpsNumber,
    status,
    workType,
    page = 1,
    limit = 20
  } = query;

  const whereClause = {};

  if (status) {
    whereClause.current_status = status;
  }

  if (workType) {
    whereClause.work_type = workType;
  }

  if (search) {
    whereClause[Op.or] = [
      { file_number: { [Op.like]: `%${search}%` } },
      { odps_number: { [Op.like]: `%${search}%` } },
      { applicant_name: { [Op.like]: `%${search}%` } },
      { applicant_mobile: { [Op.like]: `%${search}%` } },
      { revenue_survey_no: { [Op.like]: `%${search}%` } },
      { city_survey_no: { [Op.like]: `%${search}%` } }
    ];
  }

  if (odpsNumber) {
    whereClause.odps_number = { [Op.like]: `%${odpsNumber}%` };
  }

  const includeClause = [
    { model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] }
  ];

  const parsedPage = parseInt(page, 10) || 1;
  const parsedLimit = parseInt(limit, 10) || 20;
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await File.findAndCountAll({
    where: whereClause,
    include: includeClause,
    order: [['created_at', 'DESC']],
    limit: parsedLimit,
    offset: offset,
    distinct: true
  });

  return {
    totalItems: count,
    totalPages: Math.ceil(count / parsedLimit),
    currentPage: parsedPage,
    files: rows
  };
};

const syncWorkflowTasksForFile = async (fileId, newWorkType, transaction = null) => {
  const newTasksConfig = getTasksForWorkType(newWorkType);
  const existingTasks = await WorkflowTask.findAll({
    where: { file_id: fileId },
    transaction
  });

  const existingMap = new Map();
  for (const t of existingTasks) {
    existingMap.set(t.task_key, t);
  }

  const newTaskKeys = new Set(newTasksConfig.map((t) => t.task_key));

  // 1. Remove tasks no longer part of new work_type
  for (const t of existingTasks) {
    if (!newTaskKeys.has(t.task_key)) {
      await t.destroy({ transaction });
    }
  }

  // 2. Add new tasks and sync sequences for existing tasks
  for (const taskCfg of newTasksConfig) {
    const existing = existingMap.get(taskCfg.task_key);
    if (!existing) {
      await WorkflowTask.create({
        ...taskCfg,
        file_id: fileId
      }, { transaction });
    } else {
      existing.sequence = taskCfg.sequence;
      existing.category = taskCfg.category;
      existing.title = taskCfg.title;
      await existing.save({ transaction });
    }
  }
};

module.exports = {
  createFileWithWorkflow,
  getTasksForWorkType,
  queryFiles,
  syncWorkflowTasksForFile
};

