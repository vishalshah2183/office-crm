const { File, Employee, WorkflowTask, Quotation, Payment, DesignFile } = require('../models');
const { createFileWithWorkflow, queryFiles, syncWorkflowTasksForFile } = require('../services/fileService');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getFiles = async (req, res, next) => {
  try {
    const result = await queryFiles(req.query);
    return successResponse(res, 200, result);
  } catch (error) {
    next(error);
  }
};

const createFile = async (req, res, next) => {
  try {
    const {
      file_number,
      odps_number,
      work_type,
      applicant_name,
      applicant_address,
      applicant_mobile,
      revenue_survey_no,
      city_survey_no,
      tp_scheme_no,
      final_plot_no,
      plot_no,
      permission_type,
      floors,
      specific_built_up_area,
      estimated_amount,
      advance_payment
    } = req.body;

    if (!file_number || !work_type || !applicant_name || !applicant_mobile?.trim() || (work_type === 'Building Permission' && !permission_type)) {
      return errorResponse(res, 400, 'file_number, work_type, applicant_name, and applicant_mobile are required; permission_type is required for Building Permission');
    }

    if (advance_payment) {
      if (!advance_payment.amount || parseFloat(advance_payment.amount) <= 0 || !advance_payment.payment_date || !advance_payment.payment_method) {
        return errorResponse(res, 400, 'Advance payment amount, date, and method are required');
      }
      if (!estimated_amount || parseFloat(estimated_amount) <= 0) {
        return errorResponse(res, 400, 'Quotation amount is required before registering an advance payment');
      }
      if (parseFloat(advance_payment.amount) > parseFloat(estimated_amount)) {
        return errorResponse(res, 400, 'Advance payment cannot exceed the quotation amount');
      }
    }

    const existingFile = await File.findOne({ where: { file_number } });
    if (existingFile) {
      return errorResponse(res, 400, `File with number '${file_number}' already exists`);
    }

    const newFile = await createFileWithWorkflow(
      {
        file_number,
        odps_number: odps_number || null,
        work_type,
        applicant_name,
        applicant_address: applicant_address || null,
        applicant_mobile: applicant_mobile || null,
        revenue_survey_no: revenue_survey_no || null,
        city_survey_no: city_survey_no || null,
        tp_scheme_no: tp_scheme_no || null,
        final_plot_no: final_plot_no || null,
        plot_no: plot_no || null,
        permission_type: work_type === 'Building Permission' ? permission_type : null,
        floors: floors || null,
        specific_built_up_area: specific_built_up_area || null,
        estimated_amount: estimated_amount || null,
        advance_payment: advance_payment || null
      },
      req.user.id
    );

    return successResponse(res, 201, { file: newFile }, 'File created successfully');
  } catch (error) {
    next(error);
  }
};

const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id, {
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] },
        {
          model: WorkflowTask,
          as: 'workflowTasks',
          include: [
            { model: Employee, as: 'assignee', attributes: ['id', 'name', 'email', 'designation'] },
            { model: Employee, as: 'assigner', attributes: ['id', 'name', 'email', 'designation'] },
            { model: Employee, as: 'completer', attributes: ['id', 'name', 'email', 'designation'] }
          ],
          order: [['sequence', 'ASC']]
        },
        { model: Quotation, as: 'quotations' },
        { model: Payment, as: 'payments' },
        {
          model: DesignFile,
          as: 'designFiles',
          include: [{ model: Employee, as: 'uploader', attributes: ['id', 'name'] }]
        }
      ]
    });

    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    return successResponse(res, 200, { file });
  } catch (error) {
    next(error);
  }
};

const updateFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);

    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const oldWorkType = file.work_type;

    const {
      file_number,
      odps_number,
      work_type,
      applicant_name,
      applicant_address,
      applicant_mobile,
      revenue_survey_no,
      city_survey_no,
      tp_scheme_no,
      final_plot_no,
      plot_no,
      permission_type,
      floors,
      specific_built_up_area,
      estimated_amount
    } = req.body;

    if (file_number && file_number !== file.file_number) {
      const existing = await File.findOne({ where: { file_number } });
      if (existing) {
        return errorResponse(res, 400, `File number '${file_number}' is already in use`);
      }
      file.file_number = file_number;
    }
    if (odps_number !== undefined) file.odps_number = odps_number || null;

    if (work_type) file.work_type = work_type;
    if (applicant_name) file.applicant_name = applicant_name;
    if (applicant_address !== undefined) file.applicant_address = applicant_address;
    if (applicant_mobile !== undefined) file.applicant_mobile = applicant_mobile;
    if (revenue_survey_no !== undefined) file.revenue_survey_no = revenue_survey_no;
    if (city_survey_no !== undefined) file.city_survey_no = city_survey_no;
    if (tp_scheme_no !== undefined) file.tp_scheme_no = tp_scheme_no;
    if (final_plot_no !== undefined) file.final_plot_no = final_plot_no;
    if (plot_no !== undefined) file.plot_no = plot_no;
    if (permission_type) file.permission_type = permission_type;
    if (floors !== undefined) file.floors = floors;
    if (specific_built_up_area !== undefined) file.specific_built_up_area = specific_built_up_area;
    if (estimated_amount !== undefined) {
      if (estimated_amount !== null && parseFloat(estimated_amount) <= 0) {
        return errorResponse(res, 400, 'estimated_amount must be a positive number');
      }
      file.estimated_amount = estimated_amount;
    }

    await file.save();

    if (work_type && work_type !== oldWorkType) {
      await syncWorkflowTasksForFile(file.id, work_type);
    }

    return successResponse(res, 200, { file }, 'File updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findByPk(id);

    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    await file.destroy();
    return successResponse(res, 200, {}, 'File deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFiles,
  createFile,
  getFileById,
  updateFile,
  deleteFile
};
