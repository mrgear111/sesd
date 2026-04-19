import { User } from '../models/User';

/**
 * Interface for User repository
 * Defines contract for user data access operations
 */
export interface IUserRepository {
  /**
   * Find user by ID
   * @param id - User ID
   * @returns User object or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email address
   * @param email - User email
   * @returns User object or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user
   * @param data - User creation data
   * @returns Created user object
   */
  create(data: {
    username: string;
    email: string;
    passwordHash: string;
  }): Promise<User>;

  /**
   * Check if user exists by ID
   * @param id - User ID
   * @returns True if user exists, false otherwise
   */
  exists(id: string): Promise<boolean>;
}
