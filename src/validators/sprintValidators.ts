import Joi from 'joi';

/**
 * Sprint validation schemas
 */

export const createSprintSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Sprint name must be at least 1 character',
    'string.max': 'Sprint name must not exceed 100 characters',
    'any.required': 'Sprint name is required',
  }),
  startDate: Joi.date().iso().required().messages({
    'date.format': 'Start date must be a valid ISO date',
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
    'date.format': 'End date must be a valid ISO date',
    'date.greater': 'End date must be after start date',
    'any.required': 'End date is required',
  }),
});

export const updateSprintSchema = Joi.object({
  state: Joi.string().valid('Planned', 'Active', 'Completed').optional().messages({
    'any.only': 'State must be one of: Planned, Active, Completed',
  }),
});

export const sprintIdSchema = Joi.object({
  sprintId: Joi.string().uuid().required().messages({
    'string.guid': 'Sprint ID must be a valid UUID',
    'any.required': 'Sprint ID is required',
  }),
});
