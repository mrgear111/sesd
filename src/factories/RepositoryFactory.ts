import { Pool } from 'pg';
import { IUserRepository } from '../repositories/IUserRepository';
import { IProjectRepository } from '../repositories/IProjectRepository';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { IWorkflowRepository } from '../repositories/IWorkflowRepository';
import { ISprintRepository } from '../repositories/ISprintRepository';
import { ICommentRepository } from '../repositories/ICommentRepository';
import { IAuditLogRepository } from '../repositories/IAuditLogRepository';
import { UserRepository } from '../repositories/UserRepository';
import { ProjectRepository } from '../repositories/ProjectRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { SprintRepository } from '../repositories/SprintRepository';
import { CommentRepository } from '../repositories/CommentRepository';
import { AuditLogRepository } from '../repositories/AuditLogRepository';

/**
 * Repository factory
 * Creates repository instances with shared connection pool
 */
export class RepositoryFactory {
  constructor(private pool: Pool) {}

  createUserRepository(): IUserRepository {
    return new UserRepository(this.pool);
  }

  createProjectRepository(): IProjectRepository {
    return new ProjectRepository(this.pool);
  }

  createTaskRepository(): ITaskRepository {
    return new TaskRepository(this.pool);
  }

  createWorkflowRepository(): IWorkflowRepository {
    return new WorkflowRepository(this.pool);
  }

  createSprintRepository(): ISprintRepository {
    return new SprintRepository(this.pool);
  }

  createCommentRepository(): ICommentRepository {
    return new CommentRepository(this.pool);
  }

  createAuditLogRepository(): IAuditLogRepository {
    return new AuditLogRepository(this.pool);
  }
}
