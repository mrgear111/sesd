import { RepositoryFactory } from './RepositoryFactory';
import { AuthenticationService } from '../services/AuthenticationService';
import { AuthorizationService } from '../services/AuthorizationService';
import { ProjectService } from '../services/ProjectService';
import { TaskService } from '../services/TaskService';
import { SprintService } from '../services/SprintService';
import { CommentService } from '../services/CommentService';
import { AuditLoggerService } from '../services/AuditLoggerService';
import { WorkflowEngine } from '../services/WorkflowEngine';
import { JWTService } from '../services/JWTService';
import { BcryptHasher } from '../services/BcryptHasher';
import { IJWTService } from '../services/IJWTService';
import { IPasswordHasher } from '../services/IPasswordHasher';

/**
 * Service factory
 * Creates service instances with proper dependency injection
 */
export class ServiceFactory {
  private passwordHasher: IPasswordHasher;
  private jwtService: IJWTService;
  private authzService: AuthorizationService;
  private auditService: AuditLoggerService;
  private workflowEngine: WorkflowEngine;

  constructor(private repoFactory: RepositoryFactory, jwtSecret: string) {
    // Create shared service instances
    this.passwordHasher = new BcryptHasher(10);
    this.jwtService = new JWTService(jwtSecret, '24h');
    this.authzService = new AuthorizationService(this.repoFactory.createProjectRepository());
    this.auditService = new AuditLoggerService(this.repoFactory.createAuditLogRepository());
    this.workflowEngine = new WorkflowEngine(this.repoFactory.createWorkflowRepository());
  }

  createAuthenticationService(): AuthenticationService {
    return new AuthenticationService(
      this.repoFactory.createUserRepository(),
      this.passwordHasher,
      this.jwtService
    );
  }

  createAuthorizationService(): AuthorizationService {
    return this.authzService;
  }

  createProjectService(): ProjectService {
    return new ProjectService(
      this.repoFactory.createProjectRepository(),
      this.repoFactory.createWorkflowRepository(),
      this.repoFactory.createUserRepository()
    );
  }

  createTaskService(): TaskService {
    return new TaskService(
      this.repoFactory.createTaskRepository(),
      this.repoFactory.createProjectRepository(),
      this.repoFactory.createUserRepository(),
      this.workflowEngine,
      this.authzService
    );
  }

  createSprintService(): SprintService {
    return new SprintService(
      this.repoFactory.createSprintRepository(),
      this.authzService,
      this.auditService
    );
  }

  createCommentService(): CommentService {
    return new CommentService(
      this.repoFactory.createCommentRepository(),
      this.repoFactory.createTaskRepository(),
      this.authzService,
      this.auditService
    );
  }

  createAuditLoggerService(): AuditLoggerService {
    return this.auditService;
  }

  createWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  getJWTService(): IJWTService {
    return this.jwtService;
  }
}
