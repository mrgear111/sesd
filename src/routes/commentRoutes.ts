import { Router } from 'express';
import { CommentController } from '../controllers/CommentController';
import { IJWTService } from '../services/IJWTService';
import { createAuthMiddleware } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validationMiddleware';
import {
  createCommentSchema,
  taskIdSchema,
  commentIdSchema,
} from '../validators/commentValidators';

/**
 * Comment routes
 * Defines routes for comment management
 */
export const createCommentRoutes = (
  commentController: CommentController,
  jwtService: IJWTService
): Router => {
  const router = Router();
  const authMiddleware = createAuthMiddleware(jwtService);

  // All comment routes require authentication
  router.use(authMiddleware);

  // Comment operations under tasks
  router.post(
    '/tasks/:taskId/comments',
    validateParams(taskIdSchema),
    validateBody(createCommentSchema),
    (req, res, next) => commentController.addComment(req, res, next)
  );
  
  router.get(
    '/tasks/:taskId/comments',
    validateParams(taskIdSchema),
    (req, res, next) => commentController.listComments(req, res, next)
  );

  // Comment operations by comment ID
  router.delete(
    '/comments/:commentId',
    validateParams(commentIdSchema),
    (req, res, next) => commentController.deleteComment(req, res, next)
  );

  return router;
};
