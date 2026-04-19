import Joi from 'joi';

/**
 * Comment validation schemas
 */

export const createCommentSchema = Joi.object({
  content: Joi.string().min(1).max(5000).required().messages({
    'string.min': 'Comment content must be at least 1 character',
    'string.max': 'Comment content must not exceed 5000 characters',
    'any.required': 'Comment content is required',
  }),
});

export const taskIdSchema = Joi.object({
  taskId: Joi.string().uuid().required().messages({
    'string.guid': 'Task ID must be a valid UUID',
    'any.required': 'Task ID is required',
  }),
});

export const commentIdSchema = Joi.object({
  commentId: Joi.string().uuid().required().messages({
    'string.guid': 'Comment ID must be a valid UUID',
    'any.required': 'Comment ID is required',
  }),
});
