import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams, validateQuery } from '../middleware/validationMiddleware';
import {
  createTaskSchema,
  updateStatusSchema,
  assignTaskSchema,
  taskIdSchema,
  taskFiltersSchema,
} from '../validators/taskValidators';
import { projectIdSchema } from '../validators/projectValidators';

/**
 * Task routes
 * Defines routes for task management
 */
export const createTaskRoutes = (
  taskController: TaskController,
  jwtService: IJWTService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // All task routes require authentication
  router.use(authMiddleware);

  // Task operations under projects
  router.post(
    '/projects/:projectId/tasks',
    validateParams(projectIdSchema),
    validateBody(createTaskSchema),
    (req, res, next) => taskController.createTask(req, res, next)
  );
  
  router.get(
    '/projects/:projectId/tasks',
    validateParams(projectIdSchema),
    validateQuery(taskFiltersSchema),
    (req, res, next) => taskController.listTasks(req, res, next)
  );

  // Task operations by task ID
  router.patch(
    '/tasks/:taskId/status',
    validateParams(taskIdSchema),
    validateBody(updateStatusSchema),
    (req, res, next) => taskController.updateStatus(req, res, next)
  );
  
  router.patch(
    '/tasks/:taskId/assign',
    validateParams(taskIdSchema),
    validateBody(assignTaskSchema),
    (req, res, next) => taskController.assignTask(req, res, next)
  );

  return router;
};
