import { Router } from 'express';
import { createUserRoutes } from './userRoutes';
import { createProjectRoutes } from './projectRoutes';
import { createTaskRoutes } from './taskRoutes';
import { createSprintRoutes } from './sprintRoutes';
import { createCommentRoutes } from './commentRoutes';
import { UserController } from '../controllers/UserController';
import { ProjectController } from '../controllers/ProjectController';
import { TaskController } from '../controllers/TaskController';
import { SprintController } from '../controllers/SprintController';
import { CommentController } from '../controllers/CommentController';
import { IJWTService } from '../services/IJWTService';

/**
 * Main router
 * Aggregates all application routes
 */
export const createApiRoutes = (
  userController: UserController,
  projectController: ProjectController,
  taskController: TaskController,
  sprintController: SprintController,
  commentController: CommentController,
  jwtService: IJWTService
): Router => {
  const router = Router();

  // Mount all route modules
  router.use('/api', createUserRoutes(userController, jwtService));
  router.use('/api', createProjectRoutes(projectController, jwtService));
  router.use('/api', createTaskRoutes(taskController, jwtService));
  router.use('/api', createSprintRoutes(sprintController, jwtService));
  router.use('/api', createCommentRoutes(commentController, jwtService));

  return router;
};
