import Joi from 'joi';

/**
 * Task validation schemas
 */

export const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Task title must be at least 1 character',
    'string.max': 'Task title must not exceed 200 characters',
    'any.required': 'Task title is required',
  }),
  description: Joi.string().allow('').optional(),
  priority: Joi.string()
    .valid('Low', 'Medium', 'High')
    .required()
    .messages({
      'any.only': 'Priority must be one of: Low, Medium, High',
      'any.required': 'Priority is required',
    }),
  assigneeId: Joi.string().uuid().allow(null).optional().messages({
    'string.guid': 'Assignee ID must be a valid UUID',
  }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.format': 'Due date must be a valid ISO date',
  }),
});

export const updateStatusSchema = Joi.object({
  workflowId: Joi.string().uuid().required().messages({
    'string.guid': 'Workflow ID must be a valid UUID',
    'any.required': 'Workflow ID is required',
  }),
});

export const assignTaskSchema = Joi.object({
  assigneeId: Joi.string().uuid().allow(null).required().messages({
    'string.guid': 'Assignee ID must be a valid UUID',
  }),
});

export const taskIdSchema = Joi.object({
  taskId: Joi.string().uuid().required().messages({
    'string.guid': 'Task ID must be a valid UUID',
    'any.required': 'Task ID is required',
  }),
});

export const taskFiltersSchema = Joi.object({
  workflowId: Joi.string().uuid().optional().messages({
    'string.guid': 'Workflow ID must be a valid UUID',
  }),
  assigneeId: Joi.string().uuid().optional().messages({
    'string.guid': 'Assignee ID must be a valid UUID',
  }),
  priority: Joi.string().valid('Low', 'Medium', 'High').optional().messages({
    'any.only': 'Priority must be one of: Low, Medium, High',
  }),
  search: Joi.string().optional(),
});
