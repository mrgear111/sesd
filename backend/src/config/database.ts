import { Pool, PoolConfig } from 'pg';

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

/**
 * Singleton class for managing database connection pool
 * Ensures only one connection pool instance exists throughout the application
 */
export class DatabaseConnection {
  private static instance: Pool | null = null;

  /**
   * Private constructor to prevent direct instantiation
   */
  private constructor() {}

  /**
   * Get the singleton database connection pool instance
   * Creates a new pool if one doesn't exist, otherwise returns the existing instance
   * 
   * @param config - Database configuration object
   * @returns Pool instance configured with connection settings
   */
  static getInstance(config: DatabaseConfig): Pool {
    if (!DatabaseConnection.instance) {
      const poolConfig: PoolConfig = {
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        min: 2,                      // Minimum number of connections in pool
        max: 10,                     // Maximum number of connections in pool
        idleTimeoutMillis: 30000,    // Close idle connections after 30 seconds
        connectionTimeoutMillis: 5000, // Timeout after 5 seconds if no connection available
        // SSL configuration for cloud databases (Neon, AWS RDS, etc.)
        ssl: config.ssl ? {
          rejectUnauthorized: false
        } : false
      };

      DatabaseConnection.instance = new Pool(poolConfig);

      // Log pool errors
      DatabaseConnection.instance.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
      });
    }

    return DatabaseConnection.instance;
  }

  /**
   * Close the database connection pool
   * Useful for graceful shutdown
   */
  static async close(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.end();
      DatabaseConnection.instance = null;
    }
  }
}
