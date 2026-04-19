import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConnection } from '../config/database';
import 'dotenv/config';

/**
 * Migration runner that executes SQL migration files in order
 * Tracks applied migrations to avoid re-running them
 */
class MigrationRunner {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Create migrations_history table if it doesn't exist
   * This table tracks which migrations have been applied
   */
  private async createMigrationsTable(): Promise<void> {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations_history (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT NOW()
      );
    `;
    await this.pool.query(query);
  }

  /**
   * Get list of already applied migrations
   * @returns Array of migration names that have been applied
   */
  private async getAppliedMigrations(): Promise<string[]> {
    const result = await this.pool.query(
      'SELECT migration_name FROM migrations_history ORDER BY migration_name'
    );
    return result.rows.map(row => row.migration_name);
  }

  /**
   * Get all migration files from the migrations directory
   * @returns Sorted array of migration file names
   */
  private getMigrationFiles(): string[] {
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir);
    
    // Filter for .sql files and sort them
    return files
      .filter(file => file.endsWith('.sql'))
      .sort();
  }

  /**
   * Execute a single migration file within a transaction
   * @param migrationFile - Name of the migration file
   */
  private async executeMigration(migrationFile: string): Promise<void> {
    const filePath = path.join(__dirname, migrationFile);
    const sql = fs.readFileSync(filePath, 'utf-8');

    const client = await this.pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Execute migration SQL
      await client.query(sql);
      
      // Record migration in history
      await client.query(
        'INSERT INTO migrations_history (migration_name) VALUES ($1)',
        [migrationFile]
      );
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log(`✓ Applied migration: ${migrationFile}`);
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error(`✗ Failed to apply migration: ${migrationFile}`);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('Starting database migrations...\n');

      // Create migrations history table
      await this.createMigrationsTable();

      // Get applied migrations
      const appliedMigrations = await this.getAppliedMigrations();
      console.log(`Found ${appliedMigrations.length} previously applied migrations`);

      // Get all migration files
      const migrationFiles = this.getMigrationFiles();
      console.log(`Found ${migrationFiles.length} total migration files\n`);

      // Filter out already applied migrations
      const pendingMigrations = migrationFiles.filter(
        file => !appliedMigrations.includes(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations to apply');
        return;
      }

      console.log(`Applying ${pendingMigrations.length} pending migrations:\n`);

      // Execute each pending migration
      for (const migrationFile of pendingMigrations) {
        await this.executeMigration(migrationFile);
      }

      console.log('\n✓ All migrations completed successfully');
    } catch (error) {
      console.error('\n✗ Migration failed:', error);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  // Load database configuration from environment variables
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'agile_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true'
  };

  console.log('Database configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}\n`);

  const pool = DatabaseConnection.getInstance(config);
  const runner = new MigrationRunner(pool);

  try {
    await runner.runMigrations();
  } catch (error) {
    console.error('Migration process failed:', error);
    process.exit(1);
  } finally {
    await DatabaseConnection.close();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  main();
}

export { MigrationRunner };
