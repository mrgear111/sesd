import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';

/**
 * User routes
 * Defines routes for user registration, login, and profile
 */
export const createUserRoutes = (
  userController: UserController,
  jwtService: IJWTService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // Public routes (no authentication required)
  router.post('/auth/register', (req, res, next) => userController.register(req, res, next));
  router.post('/auth/login', (req, res, next) => userController.login(req, res, next));

  // Protected routes (authentication required)
  router.get('/users/me', authMiddleware, (req, res, next) =>
    userController.getProfile(req, res, next)
  );

  return router;
};
