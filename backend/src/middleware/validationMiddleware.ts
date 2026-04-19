import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';

/**
 * Validation middleware factory
 * Creates middleware that validates request body, params, or query against a Joi schema
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'params' | 'query' = 'body'
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      next(new ValidationError(errorMessage));
      return;
    }

    // Replace request property with validated and sanitized value
    req[property] = value;
    next();
  };
};

/**
 * Convenience functions for validating different request properties
 */
export const validateBody = (schema: Joi.ObjectSchema) => validate(schema, 'body');
export const validateParams = (schema: Joi.ObjectSchema) => validate(schema, 'params');
export const validateQuery = (schema: Joi.ObjectSchema) => validate(schema, 'query');
