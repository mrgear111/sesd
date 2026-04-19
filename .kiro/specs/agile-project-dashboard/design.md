# Design Document: Agile Project Management Dashboard

## Overview

The Agile Project Management Dashboard is a full-stack web application built with a three-tier architecture emphasizing object-oriented design principles and design patterns. The system provides comprehensive project management capabilities including user authentication, role-based access control, project and sprint management, task tracking with customizable workflows, and detailed audit logging.

### Architecture Philosophy

The application follows a strict separation of concerns with three distinct layers:

1. **Presentation Layer (Controllers)**: HTTP request handling, input validation, response formatting
2. **Business Logic Layer (Services)**: Core business rules, orchestration, authorization
3. **Data Access Layer (Repositories)**: Database operations, query construction, data mapping

This architecture ensures:
- **Testability**: Each layer can be tested independently with mocked dependencies
- **Maintainability**: Changes to one layer have minimal impact on others
- **Scalability**: Business logic can be reused across different interfaces (REST API, GraphQL, CLI)
- **Type Safety**: TypeScript provides compile-time guarantees across all layers

### Technology Stack

**Backend (75% weightage)**:
- **Runtime**: Node.js 18+ with TypeScript 5.0+
- **Framework**: Express.js 4.18+ for HTTP server
- **Database**: PostgreSQL 15+ with pg driver and connection pooling
- **Authentication**: JWT (jsonwebtoken) with bcrypt for password hashing
- **Validation**: Joi or Zod for request validation
- **ORM Alternative**: Raw SQL with typed query builders for performance and control

**Frontend (25% weightage)**:
- **Framework**: Next.js 14+ (React 18+) with App Router
- **Styling**: Tailwind CSS 3.3+ for utility-first styling
- **State Management**: React Context API with useReducer for complex state
- **Drag-and-Drop**: @dnd-kit/core for Kanban board interactions
- **HTTP Client**: Fetch API with custom wrapper for error handling

**Development Tools**:
- **Testing**: Jest for unit tests, Supertest for API integration tests
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Database Migrations**: node-pg-migrate or custom migration system
- **API Documentation**: OpenAPI/Swagger specification

## Architecture

### High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        NextJS[Next.js Frontend]
    end
    
    subgraph "API Layer"
        Express[Express.js Server]
        AuthMiddleware[Auth Middleware]
        ValidationMiddleware[Validation Middleware]
        ErrorHandler[Error Handler]
    end
    
    subgraph "Controller Layer"
        UserController[UserController]
        ProjectController[ProjectController]
        TaskController[TaskController]
        SprintController[SprintController]
        CommentController[CommentController]
    end
    
    subgraph "Service Layer"
        AuthService[AuthenticationService]
        AuthzService[AuthorizationService]
        UserService[UserService]
        ProjectService[ProjectService]
        TaskService[TaskService]
        SprintService[SprintService]
        CommentService[CommentService]
        AuditService[AuditLoggerService]
        WorkflowEngine[WorkflowEngine]
    end
    
    subgraph "Repository Layer"
        UserRepo[UserRepository]
        ProjectRepo[ProjectRepository]
        TaskRepo[TaskRepository]
        SprintRepo[SprintRepository]
        CommentRepo[CommentRepository]
        AuditRepo[AuditLogRepository]
        WorkflowRepo[WorkflowRepository]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        ConnectionPool[Connection Pool]
    end
    
    Browser --> NextJS
    NextJS --> Express
    Express --> AuthMiddleware
    AuthMiddleware --> ValidationMiddleware
    ValidationMiddleware --> UserController
    ValidationMiddleware --> ProjectController
    ValidationMiddleware --> TaskController
    ValidationMiddleware --> SprintController
    ValidationMiddleware --> CommentController
    
    UserController --> AuthService
    UserController --> UserService
    ProjectController --> ProjectService
    ProjectController --> AuthzService
    TaskController --> TaskService
    TaskController --> AuthzService
    SprintController --> SprintService
    CommentController --> CommentService
    
    AuthService --> UserRepo
    UserService --> UserRepo
    ProjectService --> ProjectRepo
    ProjectService --> AuditService
    TaskService --> TaskRepo
    TaskService --> WorkflowEngine
    TaskService --> AuditService
    SprintService --> SprintRepo
    CommentService --> CommentRepo
    WorkflowEngine --> WorkflowRepo
    AuditService --> AuditRepo
    
    UserRepo --> ConnectionPool
    ProjectRepo --> ConnectionPool
    TaskRepo --> ConnectionPool
    SprintRepo --> ConnectionPool
    CommentRepo --> ConnectionPool
    AuditRepo --> ConnectionPool
    WorkflowRepo --> ConnectionPool
    
    ConnectionPool --> PostgreSQL
    
    ErrorHandler -.-> Express
```

### Request Flow

1. **Client Request**: Browser sends HTTP request to Next.js frontend
2. **API Call**: Frontend makes authenticated API call to Express backend
3. **Authentication**: AuthMiddleware validates JWT token and extracts user context
4. **Validation**: ValidationMiddleware validates request body/params against schema
5. **Controller**: Routes request to appropriate controller method
6. **Service**: Controller delegates business logic to service layer
7. **Authorization**: Service checks user permissions via AuthorizationService
8. **Repository**: Service calls repository methods for data operations
9. **Database**: Repository executes SQL queries via connection pool
10. **Audit**: Service logs action via AuditLoggerService (if applicable)
11. **Response**: Data flows back up through layers to client

### Design Patterns

The application implements several design patterns to ensure maintainability and extensibility:

#### 1. Repository Pattern
**Purpose**: Abstracts data access logic from business logic

**Implementation**:
- Each entity (User, Project, Task, etc.) has a dedicated repository class
- Repositories encapsulate all SQL queries and database operations
- Services depend on repository interfaces, not concrete implementations
- Enables easy testing with mock repositories

**Example**:
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserDTO): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

class UserRepository implements IUserRepository {
  constructor(private pool: Pool) {}
  
  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }
  // ... other methods
}
```

#### 2. Service Layer Pattern
**Purpose**: Encapsulates business logic and orchestrates operations

**Implementation**:
- Services contain all business rules and validation logic
- Services coordinate between multiple repositories
- Services enforce authorization rules
- Services trigger audit logging

**Example**:
```typescript
class TaskService {
  constructor(
    private taskRepo: ITaskRepository,
    private projectRepo: IProjectRepository,
    private authzService: AuthorizationService,
    private auditService: AuditLoggerService,
    private workflowEngine: WorkflowEngine
  ) {}
  
  async createTask(
    projectId: string,
    taskData: CreateTaskDTO,
    userId: string
  ): Promise<Task> {
    // Authorization check
    await this.authzService.requireProjectMember(userId, projectId);
    await this.authzService.requireRole(userId, projectId, ['Dev', 'QA', 'PM', 'Admin']);
    
    // Business logic
    const project = await this.projectRepo.findById(projectId);
    if (!project) throw new NotFoundError('Project not found');
    
    const defaultWorkflow = await this.workflowEngine.getDefaultWorkflow(projectId);
    
    // Data operation
    const task = await this.taskRepo.create({
      ...taskData,
      projectId,
      workflowId: defaultWorkflow.id,
      reporterId: userId
    });
    
    // Audit logging
    await this.auditService.log({
      userId,
      actionType: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      details: { title: task.title }
    });
    
    return task;
  }
}
```

#### 3. Factory Pattern
**Purpose**: Creates objects without exposing instantiation logic

**Implementation**:
- RepositoryFactory creates repository instances with shared connection pool
- ServiceFactory creates service instances with proper dependency injection
- Ensures consistent object creation across the application

**Example**:
```typescript
class RepositoryFactory {
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
}

class ServiceFactory {
  constructor(private repoFactory: RepositoryFactory) {}
  
  createTaskService(): TaskService {
    return new TaskService(
      this.repoFactory.createTaskRepository(),
      this.repoFactory.createProjectRepository(),
      this.createAuthorizationService(),
      this.createAuditService(),
      this.createWorkflowEngine()
    );
  }
}
```

#### 4. Singleton Pattern
**Purpose**: Ensures single instance of shared resources

**Implementation**:
- Database connection pool (single pool for entire application)
- Configuration manager (single source of truth for config)
- Logger instance (centralized logging)

**Example**:
```typescript
class DatabaseConnection {
  private static instance: Pool;
  
  private constructor() {}
  
  static getInstance(config: DatabaseConfig): Pool {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new Pool({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        min: 2,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    }
    return DatabaseConnection.instance;
  }
}
```

#### 5. Strategy Pattern
**Purpose**: Defines family of algorithms and makes them interchangeable

**Implementation**:
- Password hashing strategies (bcrypt, argon2, etc.)
- Token generation strategies (JWT, session tokens)
- Validation strategies (different rules for different entities)

**Example**:
```typescript
interface IPasswordHasher {
  hash(password: string): Promise<string>;
  verify(password: string, hash: string): Promise<boolean>;
}

class BcryptHasher implements IPasswordHasher {
  constructor(private saltRounds: number = 10) {}
  
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }
  
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

class AuthenticationService {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,  // Strategy injected
    private tokenService: ITokenService
  ) {}
}
```

#### 6. Middleware Pattern
**Purpose**: Processes requests in a pipeline

**Implementation**:
- Authentication middleware (validates JWT)
- Authorization middleware (checks permissions)
- Validation middleware (validates request data)
- Error handling middleware (catches and formats errors)
- Logging middleware (logs requests/responses)

**Example**:
```typescript
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedError('No token provided');
    
    const payload = await jwtService.verify(token);
    req.user = { id: payload.userId };
    next();
  } catch (error) {
    next(error);
  }
};
```

#### 7. Dependency Injection Pattern
**Purpose**: Inverts control of dependency creation

**Implementation**:
- Controllers receive services via constructor
- Services receive repositories via constructor
- Enables easy testing with mocks
- Promotes loose coupling

**Example**:
```typescript
class TaskController {
  constructor(
    private taskService: TaskService,
    private authzService: AuthorizationService
  ) {}
  
  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await this.taskService.createTask(
        req.params.projectId,
        req.body,
        req.user.id
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
}
```

## Components and Interfaces

### Backend Component Structure


```
backend/
├── src/
│   ├── controllers/          # HTTP request handlers
│   │   ├── UserController.ts
│   │   ├── ProjectController.ts
│   │   ├── TaskController.ts
│   │   ├── SprintController.ts
│   │   └── CommentController.ts
│   ├── services/             # Business logic layer
│   │   ├── AuthenticationService.ts
│   │   ├── AuthorizationService.ts
│   │   ├── UserService.ts
│   │   ├── ProjectService.ts
│   │   ├── TaskService.ts
│   │   ├── SprintService.ts
│   │   ├── CommentService.ts
│   │   ├── AuditLoggerService.ts
│   │   ├── WorkflowEngine.ts
│   │   └── JWTService.ts
│   ├── repositories/         # Data access layer
│   │   ├── UserRepository.ts
│   │   ├── ProjectRepository.ts
│   │   ├── TaskRepository.ts
│   │   ├── SprintRepository.ts
│   │   ├── CommentRepository.ts
│   │   ├── AuditLogRepository.ts
│   │   └── WorkflowRepository.ts
│   ├── models/               # Domain entities
│   │   ├── User.ts
│   │   ├── Project.ts
│   │   ├── Task.ts
│   │   ├── Sprint.ts
│   │   ├── Comment.ts
│   │   ├── Workflow.ts
│   │   ├── ProjectMember.ts
│   │   └── AuditLog.ts
│   ├── dto/                  # Data transfer objects
│   │   ├── CreateUserDTO.ts
│   │   ├── CreateProjectDTO.ts
│   │   ├── CreateTaskDTO.ts
│   │   └── ...
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   ├── errorHandler.ts
│   │   └── rateLimiter.ts
│   ├── validators/           # Request validation schemas
│   │   ├── userValidators.ts
│   │   ├── projectValidators.ts
│   │   └── taskValidators.ts
│   ├── config/               # Configuration management
│   │   ├── Configuration.ts
│   │   ├── ConfigurationParser.ts
│   │   ├── ConfigurationPrinter.ts
│   │   └── database.ts
│   ├── utils/                # Utility functions
│   │   ├── errors.ts
│   │   ├── logger.ts
│   │   └── validators.ts
│   ├── factories/            # Object creation factories
│   │   ├── RepositoryFactory.ts
│   │   └── ServiceFactory.ts
│   ├── routes/               # API route definitions
│   │   ├── userRoutes.ts
│   │   ├── projectRoutes.ts
│   │   ├── taskRoutes.ts
│   │   └── index.ts
│   ├── migrations/           # Database migrations
│   │   ├── 001_create_users.sql
│   │   ├── 002_create_projects.sql
│   │   └── ...
│   └── app.ts                # Express app setup
└── tests/
    ├── unit/
    ├── integration/
    └── property/             # Property-based tests
```

### Controller Layer

Controllers handle HTTP requests, validate input, and delegate to services. They should be thin and contain no business logic.

#### UserController

```typescript
export class UserController {
  constructor(
    private authService: AuthenticationService,
    private userService: UserService
  ) {}

  /**
   * POST /api/auth/register
   * Registers a new user account
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;
      const user = await this.authService.register({ username, email, password });
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json({
        token: result.token,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me
   * Returns current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userService.getUserById(req.user.id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
```

#### ProjectController

```typescript
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private authzService: AuthorizationService
  ) {}

  /**
   * POST /api/projects
   * Creates a new project
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await this.projectService.createProject(
        { name, description },
        req.user.id
      );
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId
   * Retrieves project details
   */
  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      await this.authzService.requireProjectMember(req.user.id, projectId);
      const project = await this.projectService.getProjectById(projectId);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects
   * Lists all projects for current user
   */
  async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await this.projectService.getProjectsByUserId(req.user.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/members
   * Adds a member to the project
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const { userId, role } = req.body;
      await this.authzService.requireRole(req.user.id, projectId, ['Admin']);
      await this.projectService.addMember(projectId, userId, role);
      res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:projectId
   * Deletes a project
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      await this.authzService.requireRole(req.user.id, projectId, ['Admin']);
      await this.projectService.deleteProject(projectId, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
```

#### TaskController

```typescript
export class TaskController {
  constructor(
    private taskService: TaskService,
    private authzService: AuthorizationService
  ) {}

  /**
   * POST /api/projects/:projectId/tasks
   * Creates a new task
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const taskData = req.body;
      const task = await this.taskService.createTask(projectId, taskData, req.user.id);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/tasks
   * Lists tasks with optional filters
   */
  async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const filters = {
        workflowId: req.query.workflowId as string,
        assigneeId: req.query.assigneeId as string,
        priority: req.query.priority as string,
        search: req.query.search as string
      };
      await this.authzService.requireProjectMember(req.user.id, projectId);
      const tasks = await this.taskService.getTasksByProject(projectId, filters);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId/status
   * Updates task workflow status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { workflowId } = req.body;
      const task = await this.taskService.changeTaskStatus(taskId, workflowId, req.user.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId/assign
   * Assigns task to a user
   */
  async assignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { taskId } = req.params;
      const { assigneeId } = req.body;
      const task = await this.taskService.assignTask(taskId, assigneeId, req.user.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
}
```

### Service Layer

Services contain business logic, orchestrate operations, and enforce business rules.

#### AuthenticationService

```typescript
export class AuthenticationService {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJWTService
  ) {}

  async register(dto: CreateUserDTO): Promise<User> {
    // Validate email format (RFC 5322)
    if (!this.isValidEmail(dto.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password strength
    if (dto.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Validate username length
    if (dto.username.length < 3 || dto.username.length > 50) {
      throw new ValidationError('Username must be between 3 and 50 characters');
    }

    // Check email uniqueness
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // Create user
    const user = await this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash
    });

    return user;
  }

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const token = await this.jwtService.generateToken({
      userId: user.id,
      email: user.email
    });

    return { token, user };
  }

  private isValidEmail(email: string): boolean {
    // RFC 5322 simplified regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

#### ProjectService

```typescript
export class ProjectService {
  constructor(
    private projectRepo: IProjectRepository,
    private workflowRepo: IWorkflowRepository,
    private authzService: AuthorizationService,
    private auditService: AuditLoggerService
  ) {}

  async createProject(dto: CreateProjectDTO, ownerId: string): Promise<Project> {
    // Validate project name length
    if (dto.name.length < 1 || dto.name.length > 200) {
      throw new ValidationError('Project name must be between 1 and 200 characters');
    }

    // Create project
    const project = await this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      ownerId
    });

    // Create default workflows
    const defaultWorkflows = [
      { name: 'To Do', sequenceOrder: 1 },
      { name: 'In Progress', sequenceOrder: 2 },
      { name: 'Done', sequenceOrder: 3 }
    ];

    for (const workflow of defaultWorkflows) {
      await this.workflowRepo.create({
        projectId: project.id,
        name: workflow.name,
        sequenceOrder: workflow.sequenceOrder
      });
    }

    // Add creator as project admin
    await this.projectRepo.addMember(project.id, ownerId, 'Admin');

    // Log audit event
    await this.auditService.log({
      userId: ownerId,
      actionType: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project.id,
      details: { name: project.name }
    });

    return project;
  }

  async addMember(projectId: string, userId: string, role: string): Promise<void> {
    // Validate role
    const validRoles = ['Admin', 'PM', 'Dev', 'QA', 'Viewer'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user exists
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User not found');
    }

    // Check if already a member
    const isMember = await this.projectRepo.isMember(projectId, userId);
    if (isMember) {
      throw new ConflictError('User is already a project member');
    }

    // Add member
    await this.projectRepo.addMember(projectId, userId, role);

    // Log audit event
    await this.auditService.log({
      userId,
      actionType: 'MEMBER_ADDED',
      entityType: 'PROJECT',
      entityId: projectId,
      details: { userId, role }
    });
  }

  async getProjectById(projectId: string): Promise<Project> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return this.projectRepo.findByUserId(userId);
  }

  async deleteProject(projectId: string, userId: string): Promise<void> {
    await this.projectRepo.delete(projectId);
    
    await this.auditService.log({
      userId,
      actionType: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: projectId,
      details: {}
    });
  }
}
```

#### TaskService

```typescript
export class TaskService {
  constructor(
    private taskRepo: ITaskRepository,
    private projectRepo: IProjectRepository,
    private userRepo: IUserRepository,
    private workflowEngine: WorkflowEngine,
    private authzService: AuthorizationService,
    private auditService: AuditLoggerService
  ) {}

  async createTask(
    projectId: string,
    dto: CreateTaskDTO,
    reporterId: string
  ): Promise<Task> {
    // Authorization checks
    await this.authzService.requireProjectMember(reporterId, projectId);
    await this.authzService.requireRole(reporterId, projectId, ['Dev', 'QA', 'PM', 'Admin']);

    // Validate title length
    if (dto.title.length < 1 || dto.title.length > 200) {
      throw new ValidationError('Title must be between 1 and 200 characters');
    }

    // Validate priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(dto.priority)) {
      throw new ValidationError(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Verify project exists
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get default workflow
    const defaultWorkflow = await this.workflowEngine.getDefaultWorkflow(projectId);

    // Create task
    const task = await this.taskRepo.create({
      projectId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      workflowId: defaultWorkflow.id,
      reporterId,
      assigneeId: dto.assigneeId || null,
      dueDate: dto.dueDate || null
    });

    // Log audit event
    await this.auditService.log({
      userId: reporterId,
      actionType: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task.id,
      details: { title: task.title, projectId }
    });

    return task;
  }

  async changeTaskStatus(
    taskId: string,
    targetWorkflowId: string,
    userId: string
  ): Promise<Task> {
    // Get current task
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization checks
    await this.authzService.requireProjectMember(userId, task.projectId);
    await this.authzService.requireRole(userId, task.projectId, ['Dev', 'QA', 'PM', 'Admin']);

    // Validate workflow belongs to same project
    const isValid = await this.workflowEngine.validateWorkflowTransition(
      task.projectId,
      targetWorkflowId
    );
    if (!isValid) {
      throw new ValidationError('Invalid workflow for this project');
    }

    // Get workflow names for audit log
    const previousWorkflow = await this.workflowEngine.getWorkflowById(task.workflowId);
    const newWorkflow = await this.workflowEngine.getWorkflowById(targetWorkflowId);

    // Update task status
    const updatedTask = await this.taskRepo.updateStatus(taskId, targetWorkflowId);

    // Log audit event
    await this.auditService.log({
      userId,
      actionType: 'TASK_MOVED',
      entityType: 'TASK',
      entityId: taskId,
      details: {
        previousWorkflow: previousWorkflow.name,
        newWorkflow: newWorkflow.name
      }
    });

    return updatedTask;
  }

  async assignTask(
    taskId: string,
    assigneeId: string | null,
    userId: string
  ): Promise<Task> {
    // Get current task
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization checks
    await this.authzService.requireRole(userId, task.projectId, ['PM', 'Admin']);

    // If assigning to someone, verify they exist and are project member
    if (assigneeId) {
      const userExists = await this.userRepo.exists(assigneeId);
      if (!userExists) {
        throw new NotFoundError('Assignee user not found');
      }

      const isMember = await this.projectRepo.isMember(task.projectId, assigneeId);
      if (!isMember) {
        throw new ValidationError('Assignee is not a project member');
      }
    }

    // Update assignment
    const updatedTask = await this.taskRepo.updateAssignee(taskId, assigneeId);

    // Log audit event
    await this.auditService.log({
      userId,
      actionType: 'TASK_ASSIGNED',
      entityType: 'TASK',
      entityId: taskId,
      details: {
        previousAssignee: task.assigneeId,
        newAssignee: assigneeId
      }
    });

    return updatedTask;
  }

  async getTasksByProject(
    projectId: string,
    filters: TaskFilters
  ): Promise<Task[]> {
    return this.taskRepo.findByProjectId(projectId, filters);
  }
}
```

#### WorkflowEngine

```typescript
export class WorkflowEngine {
  constructor(private workflowRepo: IWorkflowRepository) {}

  async getDefaultWorkflow(projectId: string): Promise<Workflow> {
    const workflows = await this.workflowRepo.findByProjectId(projectId);
    if (workflows.length === 0) {
      throw new Error('No workflows found for project');
    }
    // Return workflow with lowest sequence order
    return workflows.sort((a, b) => a.sequenceOrder - b.sequenceOrder)[0];
  }

  async validateWorkflowTransition(
    projectId: string,
    targetWorkflowId: string
  ): Promise<boolean> {
    const workflow = await this.workflowRepo.findById(targetWorkflowId);
    if (!workflow) {
      return false;
    }
    return workflow.projectId === projectId;
  }

  async getWorkflowById(workflowId: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }
    return workflow;
  }
}
```

#### AuditLoggerService

```typescript
export class AuditLoggerService {
  constructor(private auditRepo: IAuditLogRepository) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.auditRepo.create({
      userId: entry.userId,
      actionType: entry.actionType,
      entityType: entry.entityType,
      entityId: entry.entityId,
      details: entry.details,
      createdAt: new Date()
    });
  }

  async getLogsByProject(projectId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditRepo.findByProject(projectId, limit);
  }
}
```

### Repository Layer

Repositories handle all database operations and return domain entities.

#### UserRepository

```typescript
export class UserRepository implements IUserRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  async create(data: CreateUserData): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, username, email, password_hash, created_at`,
      [data.username, data.email, data.passwordHash]
    );
    return this.mapToUser(result.rows[0]);
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM users WHERE id = $1',
      [id]
    );
    return result.rows.length > 0;
  }

  private mapToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at
    };
  }
}
```

#### TaskRepository

```typescript
export class TaskRepository implements ITaskRepository {
  constructor(private pool: Pool) {}

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query(
      `SELECT id, project_id, workflow_id, title, description, assignee_id,
              reporter_id, due_date, priority, created_at, updated_at
       FROM tasks WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapToTask(result.rows[0]) : null;
  }

  async findByProjectId(projectId: string, filters: TaskFilters): Promise<Task[]> {
    let query = `
      SELECT id, project_id, workflow_id, title, description, assignee_id,
             reporter_id, due_date, priority, created_at, updated_at
      FROM tasks
      WHERE project_id = $1
    `;
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (filters.workflowId) {
      query += ` AND workflow_id = $${paramIndex}`;
      params.push(filters.workflowId);
      paramIndex++;
    }

    if (filters.assigneeId) {
      query += ` AND assignee_id = $${paramIndex}`;
      params.push(filters.assigneeId);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapToTask(row));
  }

  async create(data: CreateTaskData): Promise<Task> {
    const result = await this.pool.query(
      `INSERT INTO tasks (project_id, workflow_id, title, description, assignee_id,
                          reporter_id, due_date, priority, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [
        data.projectId,
        data.workflowId,
        data.title,
        data.description,
        data.assigneeId,
        data.reporterId,
        data.dueDate,
        data.priority
      ]
    );
    return this.mapToTask(result.rows[0]);
  }

  async updateStatus(taskId: string, workflowId: string): Promise<Task> {
    const result = await this.pool.query(
      `UPDATE tasks SET workflow_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [workflowId, taskId]
    );
    return this.mapToTask(result.rows[0]);
  }

  async updateAssignee(taskId: string, assigneeId: string | null): Promise<Task> {
    const result = await this.pool.query(
      `UPDATE tasks SET assignee_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [assigneeId, taskId]
    );
    return this.mapToTask(result.rows[0]);
  }

  private mapToTask(row: any): Task {
    return {
      id: row.id,
      projectId: row.project_id,
      workflowId: row.workflow_id,
      title: row.title,
      description: row.description,
      assigneeId: row.assignee_id,
      reporterId: row.reporter_id,
      dueDate: row.due_date,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}
```

## Data Models

### Database Schema

The application uses PostgreSQL with the following schema:


```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- Projects table
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

-- Project members table
CREATE TABLE project_members (
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'PM', 'Dev', 'QA', 'Viewer')),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user ON project_members(user_id);

-- Workflows table
CREATE TABLE workflows (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  sequence_order INTEGER NOT NULL,
  UNIQUE (project_id, sequence_order)
);

CREATE INDEX idx_workflows_project ON workflows(project_id);

-- Tasks table
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workflow_id INTEGER NOT NULL REFERENCES workflows(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  due_date TIMESTAMP,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_workflow ON tasks(workflow_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_reporter ON tasks(reporter_id);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 5000),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_user ON comments(user_id);

-- Sprints table
CREATE TABLE sprints (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  state VARCHAR(20) NOT NULL CHECK (state IN ('Planned', 'Active', 'Completed')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (start_date < end_date)
);

CREATE INDEX idx_sprints_project ON sprints(project_id);

-- Audit logs table
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

### Domain Models

#### User Model

```typescript
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface CreateUserDTO {
  username: string;
  email: string;
  password: string;
}
```

#### Project Model

```typescript
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: Date;
}

export interface CreateProjectDTO {
  name: string;
  description: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: 'Admin' | 'PM' | 'Dev' | 'QA' | 'Viewer';
}
```

#### Task Model

```typescript
export interface Task {
  id: string;
  projectId: string;
  workflowId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  reporterId: string;
  dueDate: Date | null;
  priority: 'Low' | 'Medium' | 'High';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  assigneeId?: string;
  dueDate?: Date;
}

export interface TaskFilters {
  workflowId?: string;
  assigneeId?: string;
  priority?: string;
  search?: string;
}
```

#### Workflow Model

```typescript
export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  sequenceOrder: number;
}
```

#### Sprint Model

```typescript
export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  state: 'Planned' | 'Active' | 'Completed';
  createdAt: Date;
}

export interface CreateSprintDTO {
  name: string;
  startDate: Date;
  endDate: Date;
}
```

#### AuditLog Model

```typescript
export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  createdAt: Date;
}

export interface AuditLogEntry {
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
}
```

### Configuration Model

```typescript
export interface Configuration {
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    minConnections: number;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  jwt: {
    secret: string;
    expirationHours: number;
  };
  server: {
    port: number;
    corsOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
```

## API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login and get JWT token | No |
| GET | `/api/users/me` | Get current user profile | Yes |

### Project Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/projects` | Create new project | Yes | PM or Admin |
| GET | `/api/projects` | List user's projects | Yes | Any |
| GET | `/api/projects/:projectId` | Get project details | Yes | Project member |
| PATCH | `/api/projects/:projectId` | Update project | Yes | Admin |
| DELETE | `/api/projects/:projectId` | Delete project | Yes | Admin |
| POST | `/api/projects/:projectId/members` | Add project member | Yes | Admin |
| DELETE | `/api/projects/:projectId/members/:userId` | Remove member | Yes | Admin |

### Task Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/projects/:projectId/tasks` | Create task | Yes | Dev, QA, PM, Admin |
| GET | `/api/projects/:projectId/tasks` | List tasks with filters | Yes | Project member |
| GET | `/api/tasks/:taskId` | Get task details | Yes | Project member |
| PATCH | `/api/tasks/:taskId` | Update task | Yes | Dev, QA, PM, Admin |
| DELETE | `/api/tasks/:taskId` | Delete task | Yes | PM, Admin |
| PATCH | `/api/tasks/:taskId/status` | Change task status | Yes | Dev, QA, PM, Admin |
| PATCH | `/api/tasks/:taskId/assign` | Assign task | Yes | PM, Admin |

### Sprint Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/projects/:projectId/sprints` | Create sprint | Yes | PM, Admin |
| GET | `/api/projects/:projectId/sprints` | List sprints | Yes | Project member |
| GET | `/api/sprints/:sprintId` | Get sprint details | Yes | Project member |
| PATCH | `/api/sprints/:sprintId` | Update sprint | Yes | PM, Admin |
| DELETE | `/api/sprints/:sprintId` | Delete sprint | Yes | Admin |

### Comment Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| POST | `/api/tasks/:taskId/comments` | Add comment | Yes | Project member |
| GET | `/api/tasks/:taskId/comments` | List comments | Yes | Project member |
| DELETE | `/api/comments/:commentId` | Delete comment | Yes | Comment author or Admin |

### Audit Log Endpoints

| Method | Endpoint | Description | Auth Required | Permissions |
|--------|----------|-------------|---------------|-------------|
| GET | `/api/projects/:projectId/audit-logs` | Get project audit logs | Yes | Project member |

### Request/Response Examples

#### POST /api/auth/register

**Request:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (201):**
```json
{
  "id": "1",
  "username": "johndoe",
  "email": "john@example.com",
  "createdAt": "2024-04-18T10:00:00Z"
}
```

#### POST /api/auth/login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "1",
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

#### POST /api/projects

**Request:**
```json
{
  "name": "Mobile App Redesign",
  "description": "Complete redesign of the mobile application"
}
```

**Response (201):**
```json
{
  "id": "1",
  "name": "Mobile App Redesign",
  "description": "Complete redesign of the mobile application",
  "ownerId": "1",
  "createdAt": "2024-04-18T10:00:00Z"
}
```

#### POST /api/projects/1/tasks

**Request:**
```json
{
  "title": "Design login screen",
  "description": "Create mockups for the new login screen",
  "priority": "High",
  "assigneeId": "2",
  "dueDate": "2024-04-25T00:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "1",
  "projectId": "1",
  "workflowId": "1",
  "title": "Design login screen",
  "description": "Create mockups for the new login screen",
  "assigneeId": "2",
  "reporterId": "1",
  "dueDate": "2024-04-25T00:00:00Z",
  "priority": "High",
  "createdAt": "2024-04-18T10:00:00Z",
  "updatedAt": "2024-04-18T10:00:00Z"
}
```

## Frontend Architecture

### Component Structure

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [projectId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── board/
│   │   │   │       │   └── page.tsx
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── kanban/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── KanbanColumn.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskDetailModal.tsx
│   │   ├── project/
│   │   │   ├── ProjectList.tsx
│   │   │   ├── ProjectCard.tsx
│   │   │   ├── CreateProjectModal.tsx
│   │   │   └── ProjectDashboard.tsx
│   │   ├── task/
│   │   │   ├── CreateTaskForm.tsx
│   │   │   ├── TaskFilters.tsx
│   │   │   └── TaskList.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   └── layout/
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       └── Footer.tsx
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── ProjectContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   └── useDebounce.ts
│   ├── lib/
│   │   ├── api.ts              # API client wrapper
│   │   ├── auth.ts             # Auth utilities
│   │   └── constants.ts
│   ├── types/
│   │   ├── user.ts
│   │   ├── project.ts
│   │   ├── task.ts
│   │   └── api.ts
│   └── utils/
│       ├── formatters.ts
│       └── validators.ts
└── public/
    └── assets/
```

### Key Frontend Components

#### KanbanBoard Component

```typescript
'use client';

import { useState, useEffect } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { KanbanColumn } from './KanbanColumn';
import { TaskDetailModal } from './TaskDetailModal';
import { useTasks } from '@/hooks/useTasks';
import { Task, Workflow } from '@/types';

interface KanbanBoardProps {
  projectId: string;
}

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const { tasks, workflows, updateTaskStatus, loading } = useTasks(projectId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const taskId = active.id as string;
    const newWorkflowId = over.id as string;

    try {
      await updateTaskStatus(taskId, newWorkflowId);
    } catch (error) {
      console.error('Failed to update task status:', error);
      // Revert UI change handled by useTasks hook
    }
  };

  const groupedTasks = workflows.reduce((acc, workflow) => {
    acc[workflow.id] = tasks.filter(task => task.workflowId === workflow.id);
    return acc;
  }, {} as Record<string, Task[]>);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto p-4">
          {workflows.map(workflow => (
            <KanbanColumn
              key={workflow.id}
              workflow={workflow}
              tasks={groupedTasks[workflow.id] || []}
              onTaskClick={setSelectedTask}
            />
          ))}
        </div>
      </DndContext>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  );
}
```

#### API Client

```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new ApiError(
        error.message || 'Request failed',
        response.status,
        error
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

#### useTasks Hook

```typescript
// hooks/useTasks.ts
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Task, Workflow } from '@/types';

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, workflowsData] = await Promise.all([
        api.get<Task[]>(`/projects/${projectId}/tasks`),
        api.get<Workflow[]>(`/projects/${projectId}/workflows`)
      ]);
      setTasks(tasksData);
      setWorkflows(workflowsData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, workflowId: string) => {
    // Optimistic update
    const previousTasks = [...tasks];
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, workflowId } : task
    ));

    try {
      await api.patch(`/tasks/${taskId}/status`, { workflowId });
    } catch (error) {
      // Revert on error
      setTasks(previousTasks);
      throw error;
    }
  };

  const createTask = async (taskData: CreateTaskDTO) => {
    const newTask = await api.post<Task>(`/projects/${projectId}/tasks`, taskData);
    setTasks([...tasks, newTask]);
    return newTask;
  };

  return {
    tasks,
    workflows,
    loading,
    error,
    updateTaskStatus,
    createTask,
    refetch: fetchData
  };
}
```

## Error Handling

### Error Class Hierarchy

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}
```

### Error Handler Middleware

```typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle known operational errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        message: error.message,
        statusCode: error.statusCode
      }
    });
  }

  // Handle database constraint violations
  if (error.name === 'QueryFailedError') {
    return res.status(409).json({
      error: {
        message: 'Database constraint violation',
        statusCode: 409
      }
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        message: 'Invalid token',
        statusCode: 401
      }
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        message: 'Token expired',
        statusCode: 401
      }
    });
  }

  // Handle unknown errors
  res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  });
};
```

### Service Layer Error Handling Pattern

```typescript
// Services throw domain-specific errors
async createTask(projectId: string, dto: CreateTaskDTO, userId: string): Promise<Task> {
  // Validation errors
  if (dto.title.length < 1 || dto.title.length > 200) {
    throw new ValidationError('Title must be between 1 and 200 characters');
  }

  // Authorization errors
  const isMember = await this.projectRepo.isMember(projectId, userId);
  if (!isMember) {
    throw new ForbiddenError('User is not a project member');
  }

  // Not found errors
  const project = await this.projectRepo.findById(projectId);
  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Business logic continues...
}
```

## Testing Strategy

The application requires comprehensive testing at multiple levels to ensure correctness and reliability.

### Unit Testing

**Purpose**: Test individual components in isolation

**Scope**:
- Service layer business logic
- Repository query construction
- Utility functions
- Validation logic
- Error handling

**Tools**: Jest with TypeScript

**Example Unit Tests**:
- AuthenticationService.register validates email format
- AuthenticationService.register rejects passwords under 8 characters
- TaskService.createTask throws ForbiddenError for non-members
- TaskService.assignTask throws NotFoundError for invalid assignee
- WorkflowEngine.getDefaultWorkflow returns lowest sequence order
- Configuration validation rejects missing required fields

### Integration Testing

**Purpose**: Test interactions between layers and external systems

**Scope**:
- API endpoints with database
- Repository operations with PostgreSQL
- Authentication flow end-to-end
- Authorization checks across layers
- Audit logging within transactions

**Tools**: Jest + Supertest + Test database

**Example Integration Tests**:
- POST /api/auth/register creates user in database
- POST /api/auth/login returns valid JWT token
- POST /api/projects creates project with default workflows
- POST /api/projects/:id/tasks creates task and audit log in same transaction
- PATCH /api/tasks/:id/status validates workflow belongs to project
- GET /api/projects/:id/tasks filters by workflow, assignee, priority

### Property-Based Testing

**Purpose**: Verify universal properties hold across all valid inputs

**Applicability Assessment**:
- ✅ **Configuration parsing/printing** (Requirement 16): Round-trip property
- ✅ **Input validation logic**: Email format, password strength, field lengths
- ✅ **Workflow validation**: State transition rules
- ❌ **Database CRUD operations**: Integration tests more appropriate
- ❌ **Authentication flows**: Integration with bcrypt/JWT, not pure functions
- ❌ **API endpoints**: Integration tests more appropriate
- ❌ **UI components**: Snapshot/visual tests more appropriate
- ❌ **Audit logging**: Side-effect operations, not testable as properties

**Tools**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

Since property-based testing applies to a limited subset of this application (primarily configuration management and validation logic), I will include a focused Correctness Properties section covering only those areas.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The following properties define universal behaviors that must hold across all valid inputs for the validation and configuration management components of the system. These properties will be verified using property-based testing with a minimum of 100 iterations per test.

### Property 1: String Length Validation

*For any* string field with defined length constraints (username, password, project name, sprint name, task title), the validation logic SHALL reject strings outside the specified bounds and accept strings within the bounds.

**Validates: Requirements 1.7, 1.8, 4.8, 6.9, 7.9**

**Test Strategy**: Generate random strings of varying lengths (0 to 300 characters). For each field type with its specific bounds:
- Username: 3-50 characters
- Password: 8+ characters
- Project name: 1-200 characters
- Sprint name: 1-100 characters
- Task title: 1-200 characters

Verify that strings within bounds pass validation and strings outside bounds are rejected with appropriate error messages.

### Property 2: Enum Validation

*For any* enum field (role, priority), the validation logic SHALL reject values not in the defined set and accept only valid enum values.

**Validates: Requirements 5.9, 7.10**

**Test Strategy**: Generate random strings including valid and invalid enum values. For each enum type:
- Role: Valid values are ['Admin', 'PM', 'Dev', 'QA', 'Viewer']
- Priority: Valid values are ['Low', 'Medium', 'High']

Verify that only valid enum values pass validation and invalid values are rejected with appropriate error messages listing valid options.

### Property 3: Email Format Validation

*For any* string, the email validation logic SHALL accept strings matching RFC 5322 format and reject strings that do not match the format.

**Validates: Requirements 1.6**

**Test Strategy**: Generate random strings including:
- Valid emails: user@domain.com, user.name@sub.domain.co.uk, user+tag@domain.com
- Invalid emails: missing @, missing domain, spaces, special characters in wrong positions

Verify that valid email formats pass validation and invalid formats are rejected.

### Property 4: Configuration Field Validation

*For any* Configuration object with missing required fields, the validation logic SHALL return an error listing all missing fields.

**Validates: Requirements 16.3**

**Test Strategy**: Generate random Configuration objects with various combinations of missing required fields (database.host, database.port, jwt.secret, etc.). Verify that:
- All missing fields are identified in the error message
- No false positives (fields that are present are not reported as missing)
- The error message format is consistent

### Property 5: Configuration Round-Trip

*For any* valid Configuration object, serializing it with Configuration_Printer then parsing it with Configuration_Parser SHALL produce an equivalent Configuration object.

**Validates: Requirements 16.8**

**Test Strategy**: Generate random valid Configuration objects with varying values for all fields (database settings, JWT settings, server settings, rate limit settings). For each object:
1. Print the configuration to a string using Configuration_Printer
2. Parse the string back using Configuration_Parser
3. Verify the resulting object is equivalent to the original (all fields match)

This is a classic round-trip property that ensures the printer and parser are inverses of each other.

### Property 6: Case-Insensitive Search

*For any* search term and any task title or description, the search logic SHALL match the term regardless of case differences between the search term and the text.

**Validates: Requirements 18.8**

**Test Strategy**: Generate random search terms and task titles/descriptions with varying case combinations:
- Search term: "login", Task title: "LOGIN screen"
- Search term: "LOGIN", Task title: "login screen"
- Search term: "LoGiN", Task title: "lOgIn screen"

Verify that all case variations of the same term match correctly, and that non-matching terms (regardless of case) do not match.

---

**Property-Based Testing Implementation Notes**:

1. **Library**: Use fast-check for JavaScript/TypeScript property-based testing
2. **Iterations**: Configure each property test to run minimum 100 iterations
3. **Tagging**: Each property test must include a comment tag referencing the design property:
   ```typescript
   // Feature: agile-project-dashboard, Property 1: String Length Validation
   ```
4. **Generators**: Create custom generators for:
   - Random strings of varying lengths
   - Random enum values (valid and invalid)
   - Random email addresses (valid and invalid)
   - Random Configuration objects
   - Random search terms with case variations

5. **Example Property Test**:
   ```typescript
   import fc from 'fast-check';
   
   // Feature: agile-project-dashboard, Property 5: Configuration Round-Trip
   describe('Configuration Round-Trip Property', () => {
     it('should preserve configuration through print-parse cycle', () => {
       fc.assert(
         fc.property(
           configurationArbitrary(),
           (config) => {
             const printed = configPrinter.print(config);
             const parsed = configParser.parse(printed);
             expect(parsed).toEqual(config);
           }
         ),
         { numRuns: 100 }
       );
     });
   });
   ```


## Testing Strategy

The application employs a comprehensive three-tier testing strategy combining unit tests, integration tests, and property-based tests to ensure correctness and reliability.

### Testing Pyramid

```
         /\
        /  \  Property-Based Tests (6 properties, 100+ iterations each)
       /____\
      /      \  Integration Tests (~30 tests)
     /        \
    /__________\ Unit Tests (~50 tests)
```

### Unit Testing Strategy

**Scope**: Test individual components in isolation with mocked dependencies

**Coverage Areas**:
- Service layer business logic (validation, orchestration, error handling)
- Utility functions (formatters, validators, helpers)
- Error class behavior
- Middleware logic (with mocked req/res/next)
- Repository query construction (without database)

**Tools**: Jest 29+ with TypeScript, ts-jest

**Mocking Strategy**:
- Mock repositories when testing services
- Mock services when testing controllers
- Use jest.fn() for function mocks
- Use jest.spyOn() for method spies

**Example Unit Tests**:
```typescript
describe('AuthenticationService', () => {
  let authService: AuthenticationService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockPasswordHasher: jest.Mocked<IPasswordHasher>;
  let mockJwtService: jest.Mocked<IJWTService>;

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
    } as any;
    
    mockPasswordHasher = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as any;
    
    mockJwtService = {
      generateToken: jest.fn(),
      verify: jest.fn(),
    } as any;
    
    authService = new AuthenticationService(
      mockUserRepo,
      mockPasswordHasher,
      mockJwtService
    );
  });

  describe('register', () => {
    it('should reject email that is already registered', async () => {
      mockUserRepo.findByEmail.mockResolvedValue({
        id: '1',
        email: 'existing@example.com',
      } as User);

      await expect(
        authService.register({
          username: 'test',
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should reject password shorter than 8 characters', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.register({
          username: 'test',
          email: 'new@example.com',
          password: 'short',
        })
      ).rejects.toThrow(ValidationError);
    });

    it('should hash password and create user on valid input', async () => {
      mockUserRepo.findByEmail.mockResolvedValue(null);
      mockPasswordHasher.hash.mockResolvedValue('hashed_password');
      mockUserRepo.create.mockResolvedValue({
        id: '1',
        username: 'test',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      });

      const result = await authService.register({
        username: 'test',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123');
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        username: 'test',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
      });
      expect(result.id).toBe('1');
    });
  });
});
```

### Integration Testing Strategy

**Scope**: Test interactions between layers and with external systems

**Coverage Areas**:
- API endpoints (controllers → services → repositories → database)
- Database operations (repositories with real PostgreSQL)
- Authentication flow (JWT generation and verification)
- Authorization checks (role-based access control)
- Audit logging (within database transactions)
- Error handling (end-to-end error propagation)

**Tools**: Jest + Supertest + Docker PostgreSQL test container

**Test Database Setup**:
```typescript
// tests/setup.ts
import { Pool } from 'pg';
import { migrate } from '../src/migrations';

let testPool: Pool;

beforeAll(async () => {
  testPool = new Pool({
    host: 'localhost',
    port: 5433, // Test database port
    database: 'test_db',
    user: 'test_user',
    password: 'test_password',
  });
  
  await migrate(testPool); // Run migrations
});

afterAll(async () => {
  await testPool.end();
});

beforeEach(async () => {
  // Clean all tables before each test
  await testPool.query('TRUNCATE users, projects, tasks, workflows, comments, sprints, audit_logs CASCADE');
});

export { testPool };
```

**Example Integration Tests**:
```typescript
describe('POST /api/auth/register', () => {
  it('should create user in database and return user data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'SecurePass123',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      username: 'johndoe',
      email: 'john@example.com',
      createdAt: expect.any(String),
    });

    // Verify user exists in database
    const result = await testPool.query(
      'SELECT * FROM users WHERE email = $1',
      ['john@example.com']
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].username).toBe('johndoe');
  });

  it('should reject duplicate email', async () => {
    // Create first user
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    // Attempt to create second user with same email
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password456',
      })
      .expect(409);

    expect(response.body.error.message).toContain('Email already registered');
  });
});

describe('POST /api/projects/:projectId/tasks', () => {
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeEach(async () => {
    // Create and login user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });
    userId = registerRes.body.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    authToken = loginRes.body.token;

    // Create project
    const projectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test description',
      });
    projectId = projectRes.body.id;
  });

  it('should create task and audit log in same transaction', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Task',
        description: 'Test description',
        priority: 'High',
      })
      .expect(201);

    const taskId = response.body.id;

    // Verify task exists
    const taskResult = await testPool.query(
      'SELECT * FROM tasks WHERE id = $1',
      [taskId]
    );
    expect(taskResult.rows).toHaveLength(1);

    // Verify audit log exists
    const auditResult = await testPool.query(
      'SELECT * FROM audit_logs WHERE entity_type = $1 AND entity_id = $2',
      ['TASK', taskId]
    );
    expect(auditResult.rows).toHaveLength(1);
    expect(auditResult.rows[0].action_type).toBe('TASK_CREATED');
  });

  it('should reject task creation for non-member', async () => {
    // Create another user
    const otherUserRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
      });

    const otherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'other@example.com',
        password: 'password123',
      });
    const otherToken = otherLoginRes.body.token;

    // Attempt to create task in project they're not a member of
    await request(app)
      .post(`/api/projects/${projectId}/tasks`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({
        title: 'Test Task',
        description: 'Test description',
        priority: 'High',
      })
      .expect(403);
  });
});
```

### Property-Based Testing Strategy

**Scope**: Verify universal properties across all valid inputs

**Coverage Areas** (as defined in Correctness Properties section):
1. String length validation (username, password, project name, sprint name, task title)
2. Enum validation (role, priority)
3. Email format validation
4. Configuration field validation
5. Configuration round-trip (parse → print → parse)
6. Case-insensitive search

**Tools**: fast-check 3.0+ for property-based testing

**Configuration**: Each property test runs minimum 100 iterations

**Test Organization**:
```
tests/
├── property/
│   ├── validation.property.test.ts    # Properties 1, 2, 3
│   ├── configuration.property.test.ts # Properties 4, 5
│   └── search.property.test.ts        # Property 6
```

**Custom Generators**:
```typescript
// tests/property/generators.ts
import fc from 'fast-check';

export const stringOfLength = (min: number, max: number) =>
  fc.string({ minLength: min, maxLength: max });

export const validEmail = () =>
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'), { minLength: 1, maxLength: 20 }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'example.com', 'test.co.uk')
  ).map(([local, domain]) => `${local}@${domain}`);

export const invalidEmail = () =>
  fc.oneof(
    fc.string().filter(s => !s.includes('@')),
    fc.string().map(s => `${s}@`),
    fc.string().map(s => `@${s}`),
    fc.string().map(s => `${s} ${s}@domain.com`)
  );

export const roleEnum = () =>
  fc.constantFrom('Admin', 'PM', 'Dev', 'QA', 'Viewer');

export const invalidRole = () =>
  fc.string().filter(s => !['Admin', 'PM', 'Dev', 'QA', 'Viewer'].includes(s));

export const configurationArbitrary = () =>
  fc.record({
    database: fc.record({
      host: fc.string({ minLength: 1 }),
      port: fc.integer({ min: 1, max: 65535 }),
      database: fc.string({ minLength: 1 }),
      user: fc.string({ minLength: 1 }),
      password: fc.string({ minLength: 1 }),
      minConnections: fc.integer({ min: 1, max: 5 }),
      maxConnections: fc.integer({ min: 5, max: 20 }),
      idleTimeoutMs: fc.integer({ min: 1000, max: 60000 }),
      connectionTimeoutMs: fc.integer({ min: 1000, max: 10000 }),
    }),
    jwt: fc.record({
      secret: fc.string({ minLength: 32 }),
      expirationHours: fc.integer({ min: 1, max: 168 }),
    }),
    server: fc.record({
      port: fc.integer({ min: 1024, max: 65535 }),
      corsOrigins: fc.array(fc.webUrl(), { minLength: 1, maxLength: 5 }),
    }),
    rateLimit: fc.record({
      windowMs: fc.integer({ min: 60000, max: 900000 }),
      maxRequests: fc.integer({ min: 1, max: 100 }),
    }),
  });
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage for service and utility layers
- **Integration Tests**: 100% coverage of API endpoints
- **Property Tests**: 100% coverage of defined correctness properties
- **Overall**: 75%+ total code coverage

### Continuous Integration

Tests run automatically on:
- Every commit (unit tests only for speed)
- Every pull request (all tests including integration)
- Nightly builds (all tests + extended property test iterations)

**CI Pipeline**:
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/test_db

  property-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:property
```

## Implementation Roadmap

The implementation will be divided into 10-15 meaningful commits following a logical build-up sequence:

### Phase 1: Foundation (Commits 1-3)

**Commit 1: Project Setup and Configuration**
- Initialize Node.js/TypeScript project with tsconfig.json
- Set up Express.js server structure
- Configure ESLint, Prettier, Jest
- Create basic folder structure
- Add package.json with dependencies

**Commit 2: Database Schema and Migrations**
- Create PostgreSQL migration files for all tables
- Implement database connection pool (Singleton pattern)
- Create migration runner script
- Add seed data for development

**Commit 3: Domain Models and DTOs**
- Define all TypeScript interfaces for domain models
- Create DTO classes for request/response
- Define error class hierarchy
- Create type definitions file

### Phase 2: Core Infrastructure (Commits 4-6)

**Commit 4: Repository Layer**
- Implement UserRepository with CRUD operations
- Implement ProjectRepository with CRUD operations
- Implement TaskRepository with CRUD and filtering
- Implement WorkflowRepository
- Add repository interfaces for dependency injection

**Commit 5: Authentication and Authorization**
- Implement BcryptHasher (Strategy pattern)
- Implement JWTService for token generation/verification
- Implement AuthenticationService (register, login)
- Implement AuthorizationService (role checks, membership checks)
- Add authentication middleware

**Commit 6: Configuration Management**
- Implement Configuration model
- Implement ConfigurationParser with validation
- Implement ConfigurationPrinter
- Add configuration loading on app startup
- Create sample config files

### Phase 3: Business Logic (Commits 7-9)

**Commit 7: Project Management Services**
- Implement ProjectService (create, get, delete, addMember)
- Implement WorkflowEngine (default workflow, validation)
- Add project-related validation logic
- Implement project member management

**Commit 8: Task Management Services**
- Implement TaskService (create, assign, changeStatus)
- Implement task filtering and search logic
- Add task validation logic
- Integrate with WorkflowEngine

**Commit 9: Sprint and Comment Services**
- Implement SprintService (create, update, state transitions)
- Implement CommentService (create, list)
- Implement AuditLoggerService
- Add audit logging to all services

### Phase 4: API Layer (Commits 10-12)

**Commit 10: Controllers and Routes**
- Implement UserController (register, login, profile)
- Implement ProjectController (CRUD, members)
- Implement TaskController (CRUD, status, assign)
- Implement SprintController and CommentController
- Set up Express routes with middleware

**Commit 11: Validation and Error Handling**
- Implement request validation middleware (Joi/Zod schemas)
- Implement error handler middleware
- Add rate limiting middleware
- Add request logging middleware
- Create validation schemas for all endpoints

**Commit 12: Dependency Injection and Factories**
- Implement RepositoryFactory
- Implement ServiceFactory
- Wire up dependency injection in app.ts
- Create application bootstrap logic

### Phase 5: Frontend (Commits 13-14)

**Commit 13: Frontend Foundation**
- Set up Next.js project with TypeScript
- Configure Tailwind CSS
- Implement API client wrapper
- Create AuthContext and useAuth hook
- Implement login and register pages

**Commit 14: Kanban Board and Task Management**
- Implement KanbanBoard component with @dnd-kit
- Implement TaskCard and KanbanColumn components
- Implement TaskDetailModal
- Create useTasks hook
- Add project list and dashboard pages

### Phase 6: Testing and Documentation (Commit 15)

**Commit 15: Comprehensive Test Suite**
- Add unit tests for services (50+ tests)
- Add integration tests for API endpoints (30+ tests)
- Add property-based tests for validation and configuration (6 properties)
- Add API documentation (OpenAPI/Swagger)
- Update README with setup instructions

### Commit Messages Format

Each commit will follow conventional commits format:
```
<type>(<scope>): <subject>

<body>

<footer>
```

Example:
```
feat(auth): implement JWT authentication service

- Add JWTService with token generation and verification
- Implement BcryptHasher for password hashing
- Add AuthenticationService with register and login methods
- Include unit tests for authentication logic

Implements: Requirements 1, 2
```

## Deployment Considerations

### Environment Variables

```bash
# .env.example
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=agile_dashboard
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key-min-32-characters
JWT_EXPIRATION_HOURS=24

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=5
```

### Docker Deployment

```dockerfile
# Dockerfile (Backend)
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: agile_dashboard
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: agile_dashboard
      DATABASE_USER: postgres
      DATABASE_PASSWORD: postgres
      JWT_SECRET: your-secret-key-min-32-characters
      JWT_EXPIRATION_HOURS: 24
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Production Checklist

- [ ] Environment variables configured securely (no hardcoded secrets)
- [ ] Database connection pool properly sized for load
- [ ] JWT secret is cryptographically secure (32+ characters)
- [ ] CORS origins restricted to production domains
- [ ] Rate limiting enabled and configured appropriately
- [ ] HTTPS enabled with valid SSL certificates
- [ ] Database backups scheduled
- [ ] Logging configured for production (structured logs)
- [ ] Error tracking service integrated (Sentry, etc.)
- [ ] Health check endpoints implemented
- [ ] Database migrations tested in staging
- [ ] Load testing completed
- [ ] Security audit performed

## Security Considerations

### Authentication Security

1. **Password Storage**: Passwords hashed with bcrypt (salt rounds: 10)
2. **JWT Tokens**: 
   - Signed with HS256 algorithm
   - 24-hour expiration
   - Include only necessary claims (userId, email)
   - Stored in httpOnly cookies (frontend) or localStorage with XSS protection
3. **Rate Limiting**: 5 login attempts per email per 15 minutes

### Authorization Security

1. **Role-Based Access Control**: Every endpoint checks user role before allowing operations
2. **Project Membership**: All project-related operations verify user is a project member
3. **Resource Ownership**: Users can only modify resources they own or have permission for

### Input Validation

1. **Request Validation**: All inputs validated before processing (Joi/Zod schemas)
2. **SQL Injection Prevention**: Parameterized queries used throughout
3. **XSS Prevention**: Input sanitization on all string fields
4. **CSRF Protection**: CSRF tokens for state-changing operations

### Data Protection

1. **Sensitive Data**: Passwords never logged or returned in API responses
2. **Audit Logging**: All actions logged with user ID and timestamp
3. **Database Encryption**: Consider encryption at rest for sensitive fields
4. **Transport Security**: HTTPS required in production

## Performance Optimization

### Database Optimization

1. **Indexes**: Created on all foreign keys and frequently queried columns
2. **Connection Pooling**: Min 2, Max 10 connections with 30s idle timeout
3. **Query Optimization**: Use EXPLAIN ANALYZE to optimize slow queries
4. **Pagination**: Implement cursor-based pagination for large result sets

### API Optimization

1. **Response Caching**: Cache frequently accessed, rarely changing data
2. **Compression**: Enable gzip compression for API responses
3. **Lazy Loading**: Load related entities only when needed
4. **Batch Operations**: Support bulk operations where appropriate

### Frontend Optimization

1. **Code Splitting**: Next.js automatic code splitting by route
2. **Image Optimization**: Use Next.js Image component
3. **Debouncing**: Debounce search inputs to reduce API calls
4. **Optimistic Updates**: Update UI immediately, revert on error

## Monitoring and Observability

### Logging Strategy

```typescript
// utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Metrics to Track

1. **API Metrics**:
   - Request rate (requests/second)
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Endpoint-specific metrics

2. **Database Metrics**:
   - Query execution time
   - Connection pool utilization
   - Slow query count
   - Deadlock count

3. **Business Metrics**:
   - Active users
   - Projects created
   - Tasks created/completed
   - Average task completion time

### Health Check Endpoints

```typescript
// GET /health
{
  "status": "healthy",
  "timestamp": "2024-04-18T10:00:00Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0"
}

// GET /health/ready
{
  "ready": true,
  "checks": {
    "database": "ok",
    "migrations": "ok"
  }
}
```

## Conclusion

This design document provides a comprehensive blueprint for implementing the Agile Project Management Dashboard. The architecture emphasizes:

1. **Separation of Concerns**: Three-tier architecture with clear boundaries
2. **Object-Oriented Design**: Extensive use of OOP principles and design patterns
3. **Type Safety**: TypeScript throughout for compile-time guarantees
4. **Testability**: Comprehensive testing strategy with unit, integration, and property-based tests
5. **Security**: Multiple layers of authentication, authorization, and input validation
6. **Maintainability**: Clean code structure, dependency injection, and clear interfaces
7. **Scalability**: Connection pooling, caching, and performance optimizations

The implementation roadmap provides a clear path from foundation to completion, with each commit building logically on the previous work. The 75% backend / 25% frontend weightage is reflected in the detailed backend architecture and design patterns, while the frontend provides a functional and responsive user interface.

All requirements from the requirements document are addressed through the architecture, with explicit traceability from requirements to design components to correctness properties. The property-based testing strategy ensures that universal behaviors are verified across all valid inputs, while integration and unit tests provide comprehensive coverage of the entire system.

