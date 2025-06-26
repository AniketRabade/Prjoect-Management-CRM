//taslController.js

import Task from '../models/Task.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Get all tasks
// @route   GET /api/v1/tasks
// @access  Private/Admin/Manager
export const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find()
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedEntity', 'name projectName')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/v1/tasks/:id
// @access  Private
export const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('relatedEntity', 'name projectName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    
    // Check if user has access to the task
    if (
      task.assignedTo._id.toString()!== req.user.id &&
      task.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get logged in user's tasks
// @route   GET /api/v1/tasks/my-tasks
// @access  Private
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('createdBy', 'name email')
      .populate('relatedEntity', 'name projectName')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tasks by project
// @route   GET /api/v1/tasks/project/:projectId
// @access  Private
export const getTasksByProject = async (req, res, next) => {
  try {
    // Check if project exists
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is part of the project team or admin/manager
    if (
      !project.teamMembers.includes(req.user.id) &&
      project.projectManager !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access tasks for this project'
      });
    }

    const tasks = await Task.find({
      relatedTo: 'Project',
      relatedEntity: req.params.projectId
    })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create task
// @route   POST /api/v1/tasks
// @access  Private/Admin/Manager
export const createTask = async (req, res, next) => {
  try {
    // Add createdBy to the request body
    req.body.createdBy = req.user.id;

    // Validate related entity exists
    const relatedModel = req.body.relatedTo === 'Project' ? Project : null
    req.body.relatedTo === 'Client' ? Client : null
    req.body.relatedTo === "Lead" ? Lead : null
    req.body.relatedTo === "Sale" ? Sale : null
    req.body.relatedTo === "Other" ? "Other" : null;


    if (!relatedModel) {
      return res.status(400).json({
        success: false,
        message: 'Invalid related entity type'
      });
    }

    if (req.body.relatedTo !== "Other") {
      const relatedEntity = await relatedModel.findById(req.body.relatedEntity);
      if (!relatedEntity) {
        return res.status(404).json({
          success: false,
          message: `${req.body.relatedTo} not found`
        });
      }
    }

    // Validate assigned user exists
    if (req.body.assignedTo) {
      const assignedUser = await User.findById(req.body.assignedTo);
      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: 'Assigned user not found'
        });
      }
    }

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/v1/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to update
    if (
      task.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task'
      });
    }

    // Prevent changing certain fields
    const { createdBy, relatedTo, relatedEntity, ...updateData } = req.body;

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task status
// @route   PATCH /api/v1/tasks/:id/status
// @access  Private
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide status'
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user is assigned to the task or is admin/manager
    if (
      task.assignedTo._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin' &&
      req.user.accountType !== 'manager'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task status'
      });
    }

    // Set completedAt if status is completed
    const updateData = { status };
    if (status === 'completed' && !task.completedAt) {
      updateData.completedAt = new Date();
    } else if (status !== 'completed') {
      updateData.completedAt = null;
    }

    task = await Task.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private/Admin/Manager
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to delete
    if (
      task.createdBy._id.toString() !== req.user.id &&
      req.user.accountType !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task'
      });
    }
    
        await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};











