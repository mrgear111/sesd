import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';

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
  router.post('/projects/:projectId/tasks', (req, res, next) =>
    taskController.createTask(req, res, next)
  );
  router.get('/projects/:projectId/tasks', (req, res, next) =>
    taskController.listTasks(req, res, next)
  );

  // Task operations by task ID
  router.patch('/tasks/:taskId/status', (req, res, next) =>
    taskController.updateStatus(req, res, next)
  );
  router.patch('/tasks/:taskId/assign', (req, res, next) =>
    taskController.assignTask(req, res, next)
  );

  return router;
};
