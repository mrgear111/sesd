import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import { DatabaseConnection } from './config/database';
import { RepositoryFactory } from './factories/RepositoryFactory';
import { ServiceFactory } from './factories/ServiceFactory';
import { ControllerFactory } from './factories/ControllerFactory';
import { createApiRoutes } from './routes';
import { AppError } from './utils/errors';

/**
 * Express application setup
 * This is the entry point for the Agile Project Management Dashboard backend
 */
class App {
  public app: Application;
  private port: number;

  constructor(port: number = 3000) {
    this.app = express();
    this.port = port;
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Parse JSON request bodies
    this.app.use(express.json());

    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware (allow all origins for development)
    this.app.use((_req: Request, res: Response, next: NextFunction) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      next();
    });
  }

  /**
   * Initialize application routes
   */
  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
      });
    });

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).json({
        message: 'Agile Project Management Dashboard API',
        version: '1.0.0',
      });
    });

    // Initialize database connection and factories
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'agile_dashboard',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    };

    const pool = DatabaseConnection.getInstance(dbConfig);
    const repoFactory = new RepositoryFactory(pool);
    const serviceFactory = new ServiceFactory(
      repoFactory,
      process.env.JWT_SECRET || 'default-secret-key'
    );
    const controllerFactory = new ControllerFactory(serviceFactory, repoFactory);

    // Create controllers
    const userController = controllerFactory.createUserController();
    const projectController = controllerFactory.createProjectController();
    const taskController = controllerFactory.createTaskController();
    const sprintController = controllerFactory.createSprintController();
    const commentController = controllerFactory.createCommentController();

    // Mount API routes
    const apiRoutes = createApiRoutes(
      userController,
      projectController,
      taskController,
      sprintController,
      commentController,
      serviceFactory.getJWTService()
    );
    this.app.use(apiRoutes);
  }

  /**
   * Initialize error handling middleware
   */
  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
      });
    });

    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err);

      // Handle AppError instances
      if (err instanceof AppError) {
        res.status(err.statusCode).json({
          error: err.name,
          message: err.message,
        });
        return;
      }

      // Handle JWT errors
      if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired token',
        });
        return;
      }

      // Handle unknown errors
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      });
    });
  }

  /**
   * Start the Express server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }

  /**
   * Graceful shutdown
   */
  public async shutdown(): Promise<void> {
    console.log('Shutting down gracefully...');
    await DatabaseConnection.close();
    console.log('Database connection closed');
  }
}

// Initialize and start the server
const port = parseInt(process.env.PORT || '3000');
const server = new App(port);
server.listen();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await server.shutdown();
  process.exit(0);
});

export default App;
