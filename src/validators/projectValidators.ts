import Joi from 'joi';

/**
 * Project validation schemas
 */

export const createProjectSchema = Joi.object({
  name: Joi.string().min(1).max(200).required().messages({
    'string.min': 'Project name must be at least 1 character',
    'string.max': 'Project name must not exceed 200 characters',
    'any.required': 'Project name is required',
  }),
  description: Joi.string().allow('').optional(),
});

export const addMemberSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    'string.guid': 'User ID must be a valid UUID',
    'any.required': 'User ID is required',
  }),
  role: Joi.string()
    .valid('Admin', 'PM', 'Dev', 'QA', 'Viewer')
    .required()
    .messages({
      'any.only': 'Role must be one of: Admin, PM, Dev, QA, Viewer',
      'any.required': 'Role is required',
    }),
});

export const projectIdSchema = Joi.object({
  projectId: Joi.string().uuid().required().messages({
    'string.guid': 'Project ID must be a valid UUID',
    'any.required': 'Project ID is required',
  }),
});
