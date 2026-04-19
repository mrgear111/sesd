import { ServiceFactory } from './ServiceFactory';
import { RepositoryFactory } from './RepositoryFactory';
import { UserController } from '../controllers/UserController';
import { ProjectController } from '../controllers/ProjectController';
import { TaskController } from '../controllers/TaskController';
import { SprintController } from '../controllers/SprintController';
import { CommentController } from '../controllers/CommentController';

/**
 * Controller factory
 * Creates controller instances with proper dependency injection
 */
export class ControllerFactory {
  constructor(
    private serviceFactory: ServiceFactory,
    private repoFactory: RepositoryFactory
  ) {}

  createUserController(): UserController {
    return new UserController(
      this.serviceFactory.createAuthenticationService(),
      this.repoFactory.createUserRepository()
    );
  }

  createProjectController(): ProjectController {
    return new ProjectController(
      this.serviceFactory.createProjectService(),
      this.serviceFactory.createAuthorizationService()
    );
  }

  createTaskController(): TaskController {
    return new TaskController(
      this.serviceFactory.createTaskService(),
      this.serviceFactory.createAuthorizationService()
    );
  }

  createSprintController(): SprintController {
    return new SprintController(
      this.serviceFactory.createSprintService(),
      this.repoFactory.createSprintRepository(),
      this.serviceFactory.createAuthorizationService()
    );
  }

  createCommentController(): CommentController {
    return new CommentController(this.serviceFactory.createCommentService());
  }
}
