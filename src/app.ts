import express, { Application, Request, Response } from 'express';

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
  }

  /**
   * Initialize Express middleware
   */
  private initializeMiddleware(): void {
    // Parse JSON request bodies
    this.app.use(express.json());

    // Parse URL-encoded request bodies
    this.app.use(express.urlencoded({ extended: true }));
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
  }

  /**
   * Start the Express server
   */
  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

// Initialize and start the server
const server = new App(3000);
server.listen();

export default App;
