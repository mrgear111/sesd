import { Request, Response, NextFunction } from 'express';
import { IJWTService } from '../services/IJWTService';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user context to request
 */
export const createAuthMiddleware = (jwtService: IJWTService) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.replace('Bearer ', '');
      if (!token) {
        throw new UnauthorizedError('No token provided');
      }

      // Verify token
      const payload = jwtService.verify(token);

      // Attach user context to request
      req.user = { id: payload.userId };

      next();
    } catch (error) {
      next(error);
    }
  };
};
