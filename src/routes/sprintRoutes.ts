import { Router } from 'express';
import { SprintController } from '../controllers/SprintController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';

/**
 * Sprint routes
 * Defines routes for sprint management
 */
export const createSprintRoutes = (
  sprintController: SprintController,
  jwtService: IJWTService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // All sprint routes require authentication
  router.use(authMiddleware);

  // Sprint operations under projects
  router.post('/projects/:projectId/sprints', (req, res, next) =>
    sprintController.createSprint(req, res, next)
  );
  router.get('/projects/:projectId/sprints', (req, res, next) =>
    sprintController.listSprints(req, res, next)
  );

  // Sprint operations by sprint ID
  router.get('/sprints/:sprintId', (req, res, next) =>
    sprintController.getSprint(req, res, next)
  );
  router.patch('/sprints/:sprintId', (req, res, next) =>
    sprintController.updateSprint(req, res, next)
  );
  router.delete('/sprints/:sprintId', (req, res, next) =>
    sprintController.deleteSprint(req, res, next)
  );

  return router;
};
