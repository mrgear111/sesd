import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware
 * Catches all errors and returns appropriate HTTP responses
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error with context
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });

  // Handle AppError instances (ValidationError, UnauthorizedError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return;
  }

  // Handle database constraint violations
  if (err.name === 'QueryFailedError' || (err as any).code === '23505') {
    res.status(409).json({
      error: 'Conflict',
      message: 'A resource with this information already exists',
    });
    return;
  }

  // Handle foreign key violations
  if ((err as any).code === '23503') {
    res.status(400).json({
      error: 'Bad Request',
      message: 'Referenced resource does not exist',
    });
    return;
  }

  // Handle unknown errors (don't expose internal details)
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};
