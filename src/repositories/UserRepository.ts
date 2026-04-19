import { Pool } from 'pg';
import { User } from '../models/User';
import { IUserRepository } from './IUserRepository';

/**
 * User repository implementation
 * Handles all database operations for users
 */
export class UserRepository implements IUserRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, username, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ? this.mapToUser(result.rows[0]) : null;
  }

  /**
   * Create a new user
   */
  async create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<User> {
    const result = await this.pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, username, email, password_hash, created_at`,
      [data.username, data.email, data.passwordHash]
    );
    return this.mapToUser(result.rows[0]);
  }

  /**
   * Check if user exists by ID
   */
  async exists(id: string): Promise<boolean> {
    const result = await this.pool.query('SELECT 1 FROM users WHERE id = $1', [id]);
    return result.rows.length > 0;
  }

  /**
   * Map database row to User domain object
   * Converts snake_case to camelCase
   */
  private mapToUser(row: any): User {
    return {
      id: row.id.toString(),
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      createdAt: row.created_at,
    };
  }
}
