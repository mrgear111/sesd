import { Comment } from '../models/Comment';
import { CreateCommentDTO } from '../dto/CreateCommentDTO';
import { ICommentRepository } from '../repositories/ICommentRepository';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { AuthorizationService } from './AuthorizationService';
import { AuditLoggerService } from './AuditLoggerService';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Comment service
 * Handles comment management business logic
 */
export class CommentService {
  constructor(
    private commentRepo: ICommentRepository,
    private taskRepo: ITaskRepository,
    private authzService: AuthorizationService,
    private auditService: AuditLoggerService
  ) {}

  /**
   * Create a new comment on a task
   * Validates user is project member, comment content length, and task exists
   * Creates comment and logs audit event
   */
  async createComment(
    taskId: string,
    dto: CreateCommentDTO,
    userId: string
  ): Promise<Comment> {
    // Verify task exists
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization check - require project member
    await this.authzService.requireProjectMember(userId, task.projectId);

    // Validate comment content length (1-5000 characters)
    if (dto.content.length < 1 || dto.content.length > 5000) {
      throw new ValidationError('Comment content must be between 1 and 5000 characters');
    }

    // Create comment
    const comment = await this.commentRepo.create({
      taskId,
      userId,
      content: dto.content,
    });

    // Log audit event
    await this.auditService.log({
      userId,
      actionType: 'COMMENT_ADDED',
      entityType: 'COMMENT',
      entityId: comment.id,
      details: {
        taskId,
        contentLength: dto.content.length,
      },
    });

    return comment;
  }

  /**
   * Get all comments for a task
   * Returns comments ordered by created_at
   */
  async getCommentsByTask(taskId: string): Promise<Comment[]> {
    return this.commentRepo.findByTaskId(taskId);
  }
}
