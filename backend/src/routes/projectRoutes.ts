import { Router } from 'express';
import { ProjectController } from '../controllers/ProjectController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import {
  createProjectSchema,
  addMemberSchema,
  projectIdSchema,
} from '../validators/projectValidators';

/**
 * Project routes
 * Defines routes for project management
 */
export const createProjectRoutes = (
  projectController: ProjectController,
  jwtService: IJWTService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // All project routes require authentication
  router.use(authMiddleware);

  // Project CRUD operations
  router.post(
    '/projects',
    validateBody(createProjectSchema),
    (req, res, next) => projectController.createProject(req, res, next)
  );
  
  router.get('/projects', (req, res, next) => projectController.listProjects(req, res, next));
  
  router.get(
    '/projects/:projectId',
    validateParams(projectIdSchema),
    (req, res, next) => projectController.getProject(req, res, next)
  );
  
  router.delete(
    '/projects/:projectId',
    validateParams(projectIdSchema),
    (req, res, next) => projectController.deleteProject(req, res, next)
  );

  // Project member management
  router.post(
    '/projects/:projectId/members',
    validateParams(projectIdSchema),
    validateBody(addMemberSchema),
    (req, res, next) => projectController.addMember(req, res, next)
  );

  return router;
};
