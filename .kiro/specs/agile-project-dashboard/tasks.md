# Implementation Plan: Agile Project Management Dashboard

## Overview

This implementation plan follows a 15-commit roadmap to build a full-stack Agile Project Management Dashboard with Node.js/TypeScript backend (Express), React/Next.js frontend, and PostgreSQL database. The architecture emphasizes three-tier separation (Controllers, Services, Repositories), OOP design patterns, and comprehensive testing including property-based tests for validation and configuration logic.

**Technology Stack:**
- Backend: Node.js 18+, TypeScript 5.0+, Express.js 4.18+, PostgreSQL 15+
- Frontend: Next.js 14+, React 18+, Tailwind CSS 3.3+, @dnd-kit/core
- Testing: Jest 29+, Supertest, fast-check (property-based testing)

**Architecture Patterns:**
- Repository Pattern (data access abstraction)
- Service Layer Pattern (business logic encapsulation)
- Factory Pattern (object creation)
- Singleton Pattern (connection pool, config)
- Strategy Pattern (password hashing, token generation)
- Dependency Injection (loose coupling)

## Tasks

### Phase 1: Foundation

- [x] 1. Project setup and TypeScript configuration
  - Initialize Node.js project with `npm init` and install core dependencies (express, typescript, ts-node, @types/node, @types/express)
  - Create `tsconfig.json` with strict mode, ES2020 target, and module resolution settings
  - Set up folder structure: `src/{controllers,services,repositories,models,dto,middleware,validators,config,utils,factories,routes,migrations}`, `tests/{unit,integration,property}`
  - Configure ESLint with TypeScript rules and Prettier for code formatting
  - Create `package.json` scripts for dev, build, test, lint, and format
  - Add `.gitignore` for node_modules, dist, .env files
  - Create basic `src/app.ts` with Express server initialization
  - _Requirements: 12 (Database Schema Management), 16 (Configuration Management)_

- [x] 2. Database schema, migrations, and connection pool
  - Create PostgreSQL migration files in `src/migrations/`: `001_create_users.sql`, `002_create_projects.sql`, `003_create_project_members.sql`, `004_create_workflows.sql`, `005_create_tasks.sql`, `006_create_comments.sql`, `007_create_sprints.sql`, `008_create_audit_logs.sql`
  - Implement all table schemas with proper data types, constraints (NOT NULL, CHECK, UNIQUE), foreign keys with CASCADE/RESTRICT, and indexes on foreign keys and frequently queried columns
  - Create `src/config/database.ts` with Singleton pattern for connection pool (pg Pool with min: 2, max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000)
  - Implement migration runner script that executes SQL files in order and tracks applied migrations
  - Add seed data script for development (sample users, projects, workflows)
  - _Requirements: 12.1-12.11 (all database schema requirements), 17 (Database Connection Pooling)_

- [x] 3. Domain models, DTOs, and error classes
  - Create TypeScript interfaces in `src/models/` for all domain entities: User, Project, ProjectMember, Task, Workflow, Sprint, Comment, AuditLog
  - Define DTO classes in `src/dto/` for request/response: CreateUserDTO, CreateProjectDTO, CreateTaskDTO, CreateSprintDTO, CreateCommentDTO, TaskFilters
  - Implement error class hierarchy in `src/utils/errors.ts`: AppError (base), ValidationError (400), UnauthorizedError (401), ForbiddenError (403), NotFoundError (404), ConflictError (409), InternalServerError (500)
  - Create Configuration interface in `src/config/Configuration.ts` with nested objects for database, jwt, server, rateLimit settings
  - Add type definitions for Express Request with user context (`req.user`)
  - _Requirements: 1-20 (all requirements reference these models)_

### Phase 2: Core Infrastructure

- [ ] 4. Repository layer implementation
  - [ ] 4.1 Create repository interfaces and UserRepository
    - Define `IUserRepository` interface with methods: findById, findByEmail, create, exists
    - Implement `UserRepository` class with constructor accepting Pool, implement all interface methods using parameterized SQL queries
    - Add private `mapToUser` method to convert database rows to User domain objects
    - _Requirements: 1.4 (create user record), 2.1 (retrieve user by email), 3.1 (verify user), 5.4 (verify user exists), 8.3 (verify assignee exists)_

  - [ ] 4.2 Implement ProjectRepository
    - Define `IProjectRepository` interface with methods: findById, findByUserId, create, delete, addMember, isMember, getMemberRole
    - Implement `ProjectRepository` class with all CRUD operations and member management methods
    - Add methods for checking project membership and retrieving user role in project
    - _Requirements: 4.3 (create project), 5.5 (verify not already member), 5.7 (create member record), 8.5 (verify assignee is member)_

  - [ ] 4.3 Implement TaskRepository with filtering
    - Define `ITaskRepository` interface with methods: findById, findByProjectId (with filters), create, updateStatus, updateAssignee
    - Implement `TaskRepository` class with dynamic query building for filters (workflowId, assigneeId, priority, search)
    - Implement case-insensitive search using ILIKE for title and description fields
    - Add sorting support for created_at, updated_at, priority, due_date
    - _Requirements: 7.6 (create task), 9.8 (update workflow), 8.7 (update assignee), 18 (Task Filtering and Search)_

  - [ ] 4.4 Implement WorkflowRepository, SprintRepository, CommentRepository, AuditLogRepository
    - Implement `WorkflowRepository` with methods: findById, findByProjectId, create
    - Implement `SprintRepository` with methods: findById, findByProjectId, create, updateState
    - Implement `CommentRepository` with methods: findById, findByTaskId, create
    - Implement `AuditLogRepository` with methods: create, findByProject
    - All repositories follow same pattern: constructor with Pool, parameterized queries, domain object mapping
    - _Requirements: 4.4 (create workflows), 6.5 (create sprint), 10.5 (create comment), 11 (Audit Logging)_

- [ ] 5. Authentication and authorization services
  - [ ] 5.1 Implement password hashing and JWT services
    - Create `IPasswordHasher` interface with hash and verify methods
    - Implement `BcryptHasher` class using bcrypt with saltRounds: 10 (Strategy pattern)
    - Create `IJWTService` interface with generateToken and verify methods
    - Implement `JWTService` class using jsonwebtoken with HS256 algorithm, 24-hour expiration
    - _Requirements: 1.3 (hash password with bcrypt), 2.5 (generate JWT token)_

  - [ ] 5.2 Implement AuthenticationService
    - Create `AuthenticationService` class with constructor accepting UserRepository, IPasswordHasher, IJWTService
    - Implement `register` method: validate email format (RFC 5322 regex), validate password length (8+ chars), validate username length (3-50 chars), check email uniqueness, hash password, create user
    - Implement `login` method: find user by email, verify password, generate JWT token, return token and user profile
    - Throw appropriate errors: ValidationError for invalid input, ConflictError for duplicate email, UnauthorizedError for invalid credentials
    - _Requirements: 1 (User Registration), 2 (User Authentication)_

  - [ ] 5.3 Implement AuthorizationService
    - Create `AuthorizationService` class with constructor accepting ProjectRepository
    - Implement `requireProjectMember` method: verify user is a member of the project, throw ForbiddenError if not
    - Implement `requireRole` method: verify user has one of the specified roles in the project, throw ForbiddenError if not
    - Implement `requireOwner` method: verify user is the project owner, throw ForbiddenError if not
    - _Requirements: 3 (Role-Based Access Control), 4.1 (validate user has PM or Admin role), 5.1 (verify requesting user has Admin role), 7.1 (validate user is member)_

  - [ ] 5.4 Implement authentication middleware
    - Create `authMiddleware` function: extract JWT token from Authorization header, verify token using JWTService, attach user context to req.user, call next()
    - Handle errors: throw UnauthorizedError for missing or invalid token
    - Add rate limiting middleware for login endpoint: 5 attempts per email per 15 minutes
    - _Requirements: 2.7 (rate-limit login attempts), 3.1 (verify valid authentication token)_

- [ ] 6. Configuration management with round-trip property
  - [ ] 6.1 Implement Configuration model and parser
    - Create `Configuration` interface with nested objects: database (host, port, database, user, password, minConnections, maxConnections, idleTimeoutMs, connectionTimeoutMs), jwt (secret, expirationHours), server (port, corsOrigins), rateLimit (windowMs, maxRequests)
    - Implement `ConfigurationParser` class with `parse` method: read configuration file, validate required fields, return Configuration object or throw error with missing fields
    - Add validation for field types and constraints (e.g., port must be 1-65535, JWT secret must be 32+ characters)
    - _Requirements: 16.1 (parse configuration file), 16.2 (return error for invalid syntax), 16.3 (return error for missing fields)_

  - [ ] 6.2 Implement ConfigurationPrinter and loading
    - Implement `ConfigurationPrinter` class with `print` method: format Configuration object into valid configuration file format (JSON or YAML)
    - Ensure round-trip property: parse(print(config)) === config for all valid configurations
    - Add configuration loading in `src/app.ts`: parse config file on startup, initialize database pool with config, configure JWT service with config
    - _Requirements: 16.7 (Configuration_Printer formats objects), 16.8 (round-trip property), 16.4-16.6 (load settings from configuration)_

### Phase 3: Business Logic

- [ ] 7. Project management services
  - [ ] 7.1 Implement ProjectService
    - Create `ProjectService` class with constructor accepting ProjectRepository, WorkflowRepository, AuthorizationService, AuditLoggerService
    - Implement `createProject` method: validate project name length (1-200 chars), create project record, create default workflows ("To Do", "In Progress", "Done" with sequence orders 1, 2, 3), add creator as Admin member, log audit event
    - Implement `addMember` method: validate role enum, check user exists, check not already member, add member record, log audit event
    - Implement `getProjectById`, `getProjectsByUserId`, `deleteProject` methods with appropriate authorization checks
    - _Requirements: 4 (Project Creation), 5 (Project Member Management)_

  - [ ] 7.2 Implement WorkflowEngine
    - Create `WorkflowEngine` class with constructor accepting WorkflowRepository
    - Implement `getDefaultWorkflow` method: fetch all workflows for project, return workflow with lowest sequence order
    - Implement `validateWorkflowTransition` method: verify target workflow exists and belongs to same project
    - Implement `getWorkflowById` method: fetch workflow by ID, throw NotFoundError if not found
    - _Requirements: 4.4 (get default workflow), 9.6-9.7 (validate workflow belongs to project)_

- [ ] 8. Task management service with filtering
  - [ ] 8.1 Implement TaskService core methods
    - Create `TaskService` class with constructor accepting TaskRepository, ProjectRepository, UserRepository, WorkflowEngine, AuthorizationService, AuditLoggerService
    - Implement `createTask` method: authorize user (requireProjectMember, requireRole Dev/QA/PM/Admin), validate title length (1-200 chars), validate priority enum (Low/Medium/High), verify project exists, get default workflow, create task, log audit event
    - Implement `getTasksByProject` method with filters: delegate to TaskRepository.findByProjectId with TaskFilters (workflowId, assigneeId, priority, search)
    - _Requirements: 7 (Task Creation), 18 (Task Filtering and Search)_

  - [ ] 8.2 Implement task status and assignment methods
    - Implement `changeTaskStatus` method: get current task, authorize user, validate workflow transition using WorkflowEngine, update task status, log audit event with previous and new workflow names
    - Implement `assignTask` method: get current task, authorize user (requireRole PM/Admin), verify assignee exists and is project member (if not null), update task assignee, log audit event with previous and new assignee IDs
    - Handle null assignee for unassigning tasks
    - _Requirements: 8 (Task Assignment), 9 (Workflow State Transitions)_

- [ ] 9. Sprint, comment, and audit logging services
  - [ ] 9.1 Implement SprintService
    - Create `SprintService` class with constructor accepting SprintRepository, AuthorizationService, AuditLoggerService
    - Implement `createSprint` method: authorize user (requireRole PM/Admin), validate sprint name length (1-100 chars), validate start date < end date, create sprint with state "Planned", log audit event
    - Implement `transitionSprintState` method: update sprint state based on dates (Planned → Active on start date, Active → Completed on end date), log audit event
    - _Requirements: 6 (Sprint Management)_

  - [ ] 9.2 Implement CommentService
    - Create `CommentService` class with constructor accepting CommentRepository, TaskRepository, ProjectRepository, AuthorizationService, AuditLoggerService
    - Implement `createComment` method: authorize user (requireProjectMember for task's project), validate comment content length (1-5000 chars), verify task exists, create comment, log audit event
    - Implement `getCommentsByTask` method: fetch comments for task, return ordered by created_at
    - _Requirements: 10 (Task Comments)_

  - [ ] 9.3 Implement AuditLoggerService
    - Create `AuditLoggerService` class with constructor accepting AuditLogRepository
    - Implement `log` method: create audit log entry with userId, actionType, entityType, entityId, details (JSONB), createdAt
    - Support action types: PROJECT_CREATED, MEMBER_ADDED, TASK_CREATED, TASK_MOVED, TASK_ASSIGNED, COMMENT_ADDED
    - Implement `getLogsByProject` method: fetch recent audit logs for project (limit 50)
    - Ensure audit logging happens within same transaction as the action being logged
    - _Requirements: 11 (Audit Logging)_

### Phase 4: API Layer

- [ ] 10. Controllers and routes
  - [ ] 10.1 Implement UserController
    - Create `UserController` class with constructor accepting AuthenticationService, UserService
    - Implement `register` method (POST /api/auth/register): extract username, email, password from req.body, call authService.register, return 201 with user data (id, username, email, createdAt)
    - Implement `login` method (POST /api/auth/login): extract email, password from req.body, call authService.login, return 200 with token and user profile
    - Implement `getProfile` method (GET /api/users/me): call userService.getUserById with req.user.id, return user profile
    - All methods use try-catch and call next(error) for error handling
    - _Requirements: 1 (User Registration), 2 (User Authentication)_

  - [ ] 10.2 Implement ProjectController
    - Create `ProjectController` class with constructor accepting ProjectService, AuthorizationService
    - Implement `createProject` (POST /api/projects): extract name, description from req.body, call projectService.createProject, return 201 with project
    - Implement `getProject` (GET /api/projects/:projectId): authorize user, call projectService.getProjectById, return project
    - Implement `listProjects` (GET /api/projects): call projectService.getProjectsByUserId, return projects array
    - Implement `addMember` (POST /api/projects/:projectId/members): authorize Admin role, call projectService.addMember, return 201
    - Implement `deleteProject` (DELETE /api/projects/:projectId): authorize Admin role, call projectService.deleteProject, return 204
    - _Requirements: 4 (Project Creation), 5 (Project Member Management)_

  - [ ] 10.3 Implement TaskController
    - Create `TaskController` class with constructor accepting TaskService, AuthorizationService
    - Implement `createTask` (POST /api/projects/:projectId/tasks): extract task data from req.body, call taskService.createTask, return 201 with task
    - Implement `listTasks` (GET /api/projects/:projectId/tasks): extract filters from query params (workflowId, assigneeId, priority, search), authorize user, call taskService.getTasksByProject, return tasks array
    - Implement `updateStatus` (PATCH /api/tasks/:taskId/status): extract workflowId from req.body, call taskService.changeTaskStatus, return task
    - Implement `assignTask` (PATCH /api/tasks/:taskId/assign): extract assigneeId from req.body, call taskService.assignTask, return task
    - _Requirements: 7 (Task Creation), 8 (Task Assignment), 9 (Workflow State Transitions), 18 (Task Filtering and Search)_

  - [ ] 10.4 Implement SprintController and CommentController
    - Create `SprintController` with methods: createSprint (POST /api/projects/:projectId/sprints), listSprints (GET /api/projects/:projectId/sprints), getSprint (GET /api/sprints/:sprintId), updateSprint (PATCH /api/sprints/:sprintId), deleteSprint (DELETE /api/sprints/:sprintId)
    - Create `CommentController` with methods: addComment (POST /api/tasks/:taskId/comments), listComments (GET /api/tasks/:taskId/comments), deleteComment (DELETE /api/comments/:commentId)
    - All methods follow same pattern: extract data, authorize, call service, return response
    - _Requirements: 6 (Sprint Management), 10 (Task Comments)_

  - [ ] 10.5 Set up Express routes
    - Create route files in `src/routes/`: userRoutes.ts, projectRoutes.ts, taskRoutes.ts, sprintRoutes.ts, commentRoutes.ts
    - Wire up controllers to routes with appropriate HTTP methods and paths
    - Apply authMiddleware to all routes except /api/auth/register and /api/auth/login
    - Create `src/routes/index.ts` to aggregate all routes and export router
    - Mount routes in `src/app.ts` with /api prefix
    - _Requirements: All API requirements (1-20)_

- [ ] 11. Validation middleware and error handling
  - [ ] 11.1 Implement request validation middleware
    - Install and configure Joi or Zod for schema validation
    - Create validation schemas in `src/validators/`: userValidators.ts (register, login), projectValidators.ts (createProject, addMember), taskValidators.ts (createTask, updateStatus, assignTask), sprintValidators.ts, commentValidators.ts
    - Implement `validationMiddleware` factory function: accepts schema, returns middleware that validates req.body/params/query, throws ValidationError with details if invalid
    - Apply validation middleware to all routes before controller methods
    - _Requirements: 14 (API Request Validation)_

  - [ ] 11.2 Implement error handler middleware
    - Create `errorHandler` middleware in `src/middleware/errorHandler.ts`: catch all errors, log with logger, return appropriate HTTP status and error message
    - Handle AppError instances: return statusCode and message from error
    - Handle database constraint violations: return 409 Conflict with user-friendly message
    - Handle JWT errors (JsonWebTokenError, TokenExpiredError): return 401 Unauthorized
    - Handle unknown errors: return 500 Internal Server Error without exposing details
    - Register errorHandler as last middleware in Express app
    - _Requirements: 15 (Error Handling and Logging)_

  - [ ] 11.3 Add rate limiting and logging middleware
    - Implement rate limiting middleware using express-rate-limit: 5 requests per 15 minutes for /api/auth/login
    - Create request logging middleware: log all API requests with method, path, user ID, response status, duration
    - Create logger utility using winston: log to files (error.log, combined.log) and console in development
    - Log all errors with severity level, timestamp, request context, stack trace
    - _Requirements: 2.7 (rate-limit login attempts), 15.7-15.8 (logging requirements)_

- [ ] 12. Factories and dependency injection
  - [ ] 12.1 Implement RepositoryFactory
    - Create `RepositoryFactory` class with constructor accepting Pool
    - Implement factory methods: createUserRepository, createProjectRepository, createTaskRepository, createWorkflowRepository, createSprintRepository, createCommentRepository, createAuditLogRepository
    - Each method instantiates the repository with the shared connection pool
    - _Requirements: All repository requirements (1-20)_

  - [ ] 12.2 Implement ServiceFactory
    - Create `ServiceFactory` class with constructor accepting RepositoryFactory
    - Implement factory methods for all services: createAuthenticationService, createAuthorizationService, createProjectService, createTaskService, createSprintService, createCommentService, createAuditLoggerService, createWorkflowEngine
    - Each method instantiates the service with proper dependencies (repositories, other services)
    - Use dependency injection pattern: services depend on interfaces, not concrete implementations
    - _Requirements: All service requirements (1-20)_

  - [ ] 12.3 Wire up dependency injection in app.ts
    - In `src/app.ts`, create application bootstrap logic: load configuration, create database pool, create RepositoryFactory, create ServiceFactory
    - Instantiate all controllers with services from ServiceFactory
    - Create Express app, register middleware (cors, json parser, auth, validation, error handler)
    - Register all routes with controllers
    - Start server on configured port
    - Add graceful shutdown: close database pool on SIGTERM/SIGINT
    - _Requirements: 16 (Configuration Management), 17 (Database Connection Pooling)_

### Phase 5: Frontend

- [ ] 13. Frontend foundation with Next.js and authentication
  - [ ] 13.1 Set up Next.js project
    - Initialize Next.js 14+ project with TypeScript and App Router: `npx create-next-app@latest frontend --typescript --tailwind --app`
    - Configure Tailwind CSS with custom theme colors and responsive breakpoints
    - Create folder structure: `src/app/{(auth),(dashboard)}/`, `src/components/{auth,kanban,project,task,common,layout}/`, `src/contexts/`, `src/hooks/`, `src/lib/`, `src/types/`, `src/utils/`
    - Set up environment variables: NEXT_PUBLIC_API_URL
    - _Requirements: 13 (Kanban Board Interface), 20 (Responsive Design)_

  - [ ] 13.2 Implement API client wrapper
    - Create `src/lib/api.ts` with ApiClient class: implement request method with fetch API, add authentication header from localStorage, handle errors (throw ApiError with status and message)
    - Implement convenience methods: get, post, patch, delete
    - Create ApiError class extending Error with status and data properties
    - Export singleton api instance
    - _Requirements: 14 (API Request Validation), 15 (Error Handling)_

  - [ ] 13.3 Implement authentication context and pages
    - Create `src/contexts/AuthContext.tsx` with AuthProvider: manage auth state (user, token, loading), provide login, logout, register methods
    - Create `src/hooks/useAuth.ts` hook to consume AuthContext
    - Implement `src/app/(auth)/login/page.tsx`: LoginForm component with email and password inputs, call api.post('/auth/login'), store token in localStorage, redirect to /projects
    - Implement `src/app/(auth)/register/page.tsx`: RegisterForm component with username, email, password inputs, call api.post('/auth/register'), redirect to /login
    - Add form validation and error display
    - _Requirements: 1 (User Registration), 2 (User Authentication)_

- [ ] 14. Kanban board with drag-and-drop
  - [ ] 14.1 Implement useTasks hook and task components
    - Create `src/hooks/useTasks.ts`: fetch tasks and workflows for project, provide updateTaskStatus and createTask methods, implement optimistic updates (update UI immediately, revert on error)
    - Create `src/types/` interfaces: User, Project, Task, Workflow, Comment matching backend models
    - Create `src/components/task/TaskCard.tsx`: display task title, description, priority (color-coded: red=High, yellow=Medium, green=Low), assignee, due date
    - Create `src/components/task/TaskDetailModal.tsx`: modal with full task details, comments section, edit/delete buttons
    - _Requirements: 13 (Kanban Board Interface), 7 (Task Creation), 9 (Workflow State Transitions)_

  - [ ] 14.2 Implement Kanban board with drag-and-drop
    - Install @dnd-kit/core for drag-and-drop functionality
    - Create `src/components/kanban/KanbanBoard.tsx`: use DndContext, render KanbanColumn for each workflow, handle onDragEnd event (call updateTaskStatus)
    - Create `src/components/kanban/KanbanColumn.tsx`: render column header with workflow name, render TaskCard components for tasks in that workflow, make droppable
    - Implement drag-and-drop: tasks can be dragged between columns, on drop call api.patch('/tasks/:id/status'), revert on error
    - Add loading states and error handling
    - _Requirements: 13 (Kanban Board Interface), 9 (Workflow State Transitions)_

  - [ ] 14.3 Implement project list and dashboard pages
    - Create `src/app/(dashboard)/projects/page.tsx`: fetch and display list of user's projects, ProjectCard components with project name, description, member count, link to project board
    - Create `src/app/(dashboard)/projects/[projectId]/page.tsx`: project dashboard with statistics (total tasks, tasks by workflow, tasks by priority, overdue tasks), recent audit logs
    - Create `src/app/(dashboard)/projects/[projectId]/board/page.tsx`: render KanbanBoard component for project
    - Add navigation: Navbar with links to projects, profile, logout
    - Implement responsive design: mobile (< 768px) vertical layout, tablet (768-1024px) grid layout, desktop (> 1024px) horizontal layout
    - _Requirements: 19 (Project Dashboard), 20 (Responsive Design)_

### Phase 6: Testing

- [ ] 15. Comprehensive test suite
  - [ ] 15.1 Unit tests for services
    - Create unit tests in `tests/unit/services/`: AuthenticationService.test.ts, ProjectService.test.ts, TaskService.test.ts, SprintService.test.ts, CommentService.test.ts, WorkflowEngine.test.ts
    - Mock all dependencies (repositories, other services) using jest.fn() and jest.spyOn()
    - Test business logic: validation rules, authorization checks, error handling, orchestration logic
    - Test edge cases: null values, empty strings, boundary conditions
    - Aim for 80%+ code coverage for service layer
    - Example tests: register rejects duplicate email, createTask throws ForbiddenError for non-members, assignTask throws NotFoundError for invalid assignee
    - _Requirements: All service requirements (1-20)_

  - [ ]* 15.2 Integration tests for API endpoints
    - Set up test database with Docker PostgreSQL container (port 5433)
    - Create `tests/setup.ts`: initialize test pool, run migrations, clean tables before each test
    - Create integration tests in `tests/integration/`: auth.test.ts, projects.test.ts, tasks.test.ts, sprints.test.ts, comments.test.ts
    - Use Supertest to make HTTP requests to Express app
    - Test end-to-end flows: register → login → create project → create task → move task → add comment
    - Verify database state after operations (query database to confirm records created)
    - Test authorization: verify non-members cannot access project resources, verify role-based access control
    - Test audit logging: verify audit log entries created in same transaction as actions
    - Aim for 100% coverage of API endpoints
    - _Requirements: All API requirements (1-20)_

  - [ ]* 15.3 Property-based tests for validation and configuration
    - Install fast-check library for property-based testing
    - Create custom generators in `tests/property/generators.ts`: stringOfLength, validEmail, invalidEmail, roleEnum, invalidRole, configurationArbitrary
    - Create property tests in `tests/property/`: validation.property.test.ts, configuration.property.test.ts, search.property.test.ts
    - **Property 1: String Length Validation** - Generate random strings (0-300 chars), verify validation accepts strings within bounds (username 3-50, password 8+, project name 1-200, sprint name 1-100, task title 1-200) and rejects strings outside bounds
    - **Property 2: Enum Validation** - Generate random strings including valid/invalid enum values, verify validation accepts only valid values (Role: Admin/PM/Dev/QA/Viewer, Priority: Low/Medium/High) and rejects invalid values
    - **Property 3: Email Format Validation** - Generate random strings including valid/invalid email formats, verify validation accepts RFC 5322 format and rejects invalid formats
    - **Property 4: Configuration Field Validation** - Generate Configuration objects with missing required fields, verify validation identifies all missing fields with no false positives
    - **Property 5: Configuration Round-Trip** - Generate random valid Configuration objects, verify parse(print(config)) === config for all configurations
    - **Property 6: Case-Insensitive Search** - Generate random search terms and task titles with varying case, verify search matches regardless of case differences
    - Configure each property test to run minimum 100 iterations
    - Tag each test with comment: `// Feature: agile-project-dashboard, Property N: [Property Title]`
    - _Requirements: 1.6-1.8 (email, password, username validation), 4.8 (project name validation), 5.9 (role validation), 6.9 (sprint name validation), 7.9-7.10 (task title, priority validation), 16.3, 16.8 (configuration validation and round-trip), 18.8 (case-insensitive search)_

  - [ ]* 15.4 API documentation and README
    - Create OpenAPI/Swagger specification in `docs/api-spec.yaml`: document all endpoints with request/response schemas, authentication requirements, error responses
    - Update README.md with: project overview, technology stack, architecture diagram, setup instructions (prerequisites, database setup, environment variables, running migrations, starting server), API documentation link, testing instructions, deployment guide
    - Add code examples for common operations: register user, create project, create task, move task through workflow
    - Document design patterns used: Repository, Service Layer, Factory, Singleton, Strategy, Dependency Injection
    - _Requirements: All requirements (comprehensive documentation)_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests (15.3) validate universal correctness properties defined in the design document
- Integration tests (15.2) verify end-to-end flows and database transactions
- Unit tests (15.1) verify business logic in isolation with mocked dependencies
- The 15-commit structure follows the implementation roadmap in the design document
- Backend implementation (commits 1-12) represents ~75% of the work, frontend (commits 13-14) represents ~25%
- All code uses TypeScript for type safety and compile-time guarantees
- Architecture emphasizes separation of concerns: Controllers (HTTP), Services (business logic), Repositories (data access)
- Design patterns ensure testability, maintainability, and scalability
