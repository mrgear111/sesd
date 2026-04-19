import { Request, Response, NextFunction } from 'express';
import { CommentService } from '../services/CommentService';

/**
 * Comment controller
 * Handles HTTP requests for comment management
 */
export class CommentController {
  constructor(private commentService: CommentService) {}

  /**
   * POST /api/tasks/:taskId/comments
   * Adds a comment to a task
   */
  async addComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const { content } = req.body;
      const comment = await this.commentService.createComment(
        taskId,
        { content },
        req.user.id
      );
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tasks/:taskId/comments
   * Lists all comments for a task
   */
  async listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const comments = await this.commentService.getCommentsByTask(taskId);
      res.json(comments);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/comments/:commentId
   * Deletes a comment (placeholder - not implemented in service)
   */
  async deleteComment(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Delete functionality not implemented in CommentService
      // This is a placeholder for future implementation
      res.status(501).json({ message: 'Delete comment not implemented' });
    } catch (error) {
      next(error);
    }
  }
}
