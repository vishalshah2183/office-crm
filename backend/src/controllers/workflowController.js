const { Op } = require('sequelize');
const { File, WorkflowTask, WorkflowTaskActivity, Employee, Role } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const employeeAttributes = ['id', 'name', 'email', 'designation'];

const taskInclude = [
  { model: Employee, as: 'assignee', attributes: employeeAttributes },
  { model: Employee, as: 'assigner', attributes: employeeAttributes },
  { model: Employee, as: 'completer', attributes: employeeAttributes }
];

const activityInclude = [
  { model: Employee, as: 'actor', attributes: employeeAttributes },
  { model: Employee, as: 'assignedEmployee', attributes: employeeAttributes }
];

const logActivity = (task, actorId, action, assignedTo = null, notes = null) => WorkflowTaskActivity.create({
  task_id: task.id,
  actor_id: actorId,
  action,
  assigned_to: assignedTo,
  notes
});

const getWorkflow = async (req, res, next) => {
  try {
    const file = await File.findByPk(req.params.id);
    if (!file) return errorResponse(res, 404, 'File not found');

    const tasks = await WorkflowTask.findAll({
      where: { file_id: file.id },
      include: taskInclude,
      order: [['sequence', 'ASC']]
    });
    const taskIds = tasks.map((task) => task.id);
    const activities = taskIds.length ? await WorkflowTaskActivity.findAll({
      where: { task_id: taskIds },
      include: activityInclude,
      order: [['created_at', 'DESC']]
    }) : [];
    const activitiesByTask = activities.reduce((grouped, activity) => {
      grouped[activity.task_id] = grouped[activity.task_id] || [];
      grouped[activity.task_id].push(activity);
      return grouped;
    }, {});
    return successResponse(res, 200, {
      tasks: tasks.map((task) => ({ ...task.toJSON(), activities: activitiesByTask[task.id] || [] }))
    });
  } catch (error) {
    next(error);
  }
};

const checkAndUpdateFileCompletion = async (fileId) => {
  try {
    const file = await File.findByPk(fileId);
    if (!file) return;

    const tasks = await WorkflowTask.findAll({ where: { file_id: fileId } });
    if (tasks.length === 0) return;

    const mandatoryTasks = tasks.filter(t => !t.is_optional || t.is_triggered);
    const allCompleted = mandatoryTasks.length > 0 && mandatoryTasks.every(t => t.completed_at !== null);

    if (allCompleted && file.current_status !== 'COMPLETED') {
      file.current_status = 'COMPLETED';
      await file.save();
    } else if (!allCompleted && file.current_status === 'COMPLETED') {
      file.current_status = 'IN_PROGRESS';
      await file.save();
    }
  } catch (err) {
    console.error('Error auto-syncing file completion status:', err);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const task = await WorkflowTask.findOne({ where: { id: req.params.taskId, file_id: req.params.id } });
    if (!task) return errorResponse(res, 404, 'Workflow task not found');

    const { notes } = req.body;
    task.completed_by = req.user.id;
    task.completed_at = new Date();
    if (notes !== undefined) task.notes = notes || null;
    await task.save();
    await logActivity(task, req.user.id, 'COMPLETED', null, notes || null);
    await checkAndUpdateFileCompletion(req.params.id);

    const completed = await WorkflowTask.findByPk(task.id, { include: taskInclude });
    return successResponse(res, 200, { task: completed }, 'Task completed and logged');
  } catch (error) {
    next(error);
  }
};

const undoTaskCompletion = async (req, res, next) => {
  try {
    const task = await WorkflowTask.findOne({ where: { id: req.params.taskId, file_id: req.params.id } });
    if (!task) return errorResponse(res, 404, 'Workflow task not found');

    task.completed_by = null;
    task.completed_at = null;
    await task.save();
    await logActivity(task, req.user.id, 'COMPLETION_UNDONE');
    await checkAndUpdateFileCompletion(req.params.id);

    const resetTask = await WorkflowTask.findByPk(task.id, { include: taskInclude });
    return successResponse(res, 200, { task: resetTask }, 'Task completion undone');
  } catch (error) {
    next(error);
  }
};

const triggerTask = async (req, res, next) => {
  try {
    const task = await WorkflowTask.findOne({ where: { id: req.params.taskId, file_id: req.params.id } });
    if (!task) return errorResponse(res, 404, 'Workflow task not found');
    if (!task.is_optional) return errorResponse(res, 400, 'This task does not require a query trigger');

    const undo = task.is_triggered === true;
    task.is_triggered = !undo;
    if (undo) {
      task.completed_by = null;
      task.completed_at = null;
      task.assigned_to = null;
      task.assigned_by = null;
      task.assigned_at = null;
      task.notes = null;
    } else if (req.body.notes !== undefined) {
      task.notes = req.body.notes || null;
    }
    await task.save();
    await logActivity(task, req.user.id, undo ? 'QUERY_RESET' : 'QUERY_TRIGGERED', null, task.notes);
    await checkAndUpdateFileCompletion(req.params.id);
    const triggered = await WorkflowTask.findByPk(task.id, { include: taskInclude });
    return successResponse(res, 200, { task: triggered }, undo ? 'Query task reset' : 'Query task activated');
  } catch (error) {
    next(error);
  }
};

const assignTask = async (req, res, next) => {
  try {
    const task = await WorkflowTask.findOne({ where: { id: req.params.taskId, file_id: req.params.id } });
    if (!task) return errorResponse(res, 404, 'Workflow task not found');

    const assignedToId = req.body.assigned_to ? Number(req.body.assigned_to) : null;

    if (!assignedToId) {
      task.assigned_to = null;
      task.assigned_by = null;
      task.assigned_at = null;
      if (req.body.notes !== undefined) task.notes = req.body.notes || null;
      await task.save();
      await logActivity(task, req.user.id, 'UNASSIGNED', null, task.notes);

      const unassigned = await WorkflowTask.findByPk(task.id, { include: taskInclude });
      return successResponse(res, 200, { task: unassigned }, 'Task unassigned successfully');
    }

    const assignee = await Employee.findOne({ where: { id: assignedToId, is_active: true } });
    if (!assignee) return errorResponse(res, 404, 'Active assignee not found');

    task.assigned_to = assignee.id;
    task.assigned_by = req.user.id;
    task.assigned_at = new Date();
    if (req.body.notes !== undefined) task.notes = req.body.notes || null;
    await task.save();
    await logActivity(task, req.user.id, 'ASSIGNED', assignee.id, task.notes);

    const assigned = await WorkflowTask.findByPk(task.id, { include: taskInclude });
    return successResponse(res, 200, { task: assigned }, 'Task assigned successfully');
  } catch (error) {
    next(error);
  }
};

const bulkCompleteTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse(res, 400, 'taskIds array is required');
    }

    const tasks = await WorkflowTask.findAll({
      where: {
        file_id: id,
        id: { [Op.in]: taskIds }
      }
    });

    const now = new Date();
    for (const task of tasks) {
      if (!task.completed_at) {
        task.completed_by = req.user.id;
        task.completed_at = now;
        await task.save();
        await logActivity(task, req.user.id, 'COMPLETED', null, 'Bulk completed');
      }
    }

    await checkAndUpdateFileCompletion(id);

    const updatedTasks = await WorkflowTask.findAll({
      where: { file_id: id },
      include: taskInclude,
      order: [['sequence', 'ASC']]
    });

    return successResponse(res, 200, { tasks: updatedTasks }, 'Selected tasks marked as completed');
  } catch (error) {
    next(error);
  }
};

const bulkUndoCompleteTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse(res, 400, 'taskIds array is required');
    }

    const tasks = await WorkflowTask.findAll({
      where: {
        file_id: id,
        id: { [Op.in]: taskIds }
      }
    });

    for (const task of tasks) {
      if (task.completed_at) {
        task.completed_by = null;
        task.completed_at = null;
        await task.save();
        await logActivity(task, req.user.id, 'COMPLETION_UNDONE', null, 'Bulk completion undone');
      }
    }

    await checkAndUpdateFileCompletion(id);

    const updatedTasks = await WorkflowTask.findAll({
      where: { file_id: id },
      include: taskInclude,
      order: [['sequence', 'ASC']]
    });

    return successResponse(res, 200, { tasks: updatedTasks }, 'Selected tasks marked as incomplete');
  } catch (error) {
    next(error);
  }
};

const bulkAssignTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { taskIds, assigned_to } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return errorResponse(res, 400, 'taskIds array is required');
    }

    const assignedToId = assigned_to ? Number(assigned_to) : null;
    let assignee = null;
    if (assignedToId) {
      assignee = await Employee.findOne({ where: { id: assignedToId, is_active: true } });
      if (!assignee) return errorResponse(res, 404, 'Active assignee not found');
    }

    const tasks = await WorkflowTask.findAll({
      where: {
        file_id: id,
        id: { [Op.in]: taskIds }
      }
    });

    const now = new Date();
    for (const task of tasks) {
      if (assignedToId) {
        task.assigned_to = assignee.id;
        task.assigned_by = req.user.id;
        task.assigned_at = now;
        await task.save();
        await logActivity(task, req.user.id, 'ASSIGNED', assignee.id, 'Bulk assigned');
      } else {
        task.assigned_to = null;
        task.assigned_by = null;
        task.assigned_at = null;
        await task.save();
        await logActivity(task, req.user.id, 'UNASSIGNED', null, 'Bulk unassigned');
      }
    }

    const updatedTasks = await WorkflowTask.findAll({
      where: { file_id: id },
      include: taskInclude,
      order: [['sequence', 'ASC']]
    });

    return successResponse(res, 200, { tasks: updatedTasks }, 'Selected tasks assigned successfully');
  } catch (error) {
    next(error);
  }
};

const getMyTasks = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.user.id, {
      include: [{ model: Role, as: 'role' }]
    });

    const userDesignation = (employee?.designation || '').trim();
    const roleName = (employee?.role?.name || '').trim().toLowerCase();

    const isAdminOrOwner =
      roleName === 'admin' ||
      userDesignation.toLowerCase() === 'admin' ||
      userDesignation.toLowerCase() === 'owner';

    const designationMatchList = isAdminOrOwner
      ? ['Owner', 'Admin', 'owner', 'admin', userDesignation]
      : [userDesignation];

    const tasks = await WorkflowTask.findAll({
      where: {
        completed_at: null,
        [Op.and]: [{ [Op.or]: [{ is_optional: false }, { is_triggered: true }] }],
        [Op.or]: [
          { assigned_to: req.user.id },
          { assigned_to: null, default_designation: { [Op.in]: designationMatchList } }
        ]
      },
      include: [{ model: File, as: 'file', attributes: ['id', 'file_number', 'applicant_name', 'work_type'] }],
      order: [['created_at', 'ASC'], ['sequence', 'ASC']]
    });
    return successResponse(res, 200, { tasks });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWorkflow, updateTask, undoTaskCompletion, triggerTask, assignTask, bulkCompleteTasks, bulkUndoCompleteTasks, bulkAssignTasks, getMyTasks };