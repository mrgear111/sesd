/**
 * Interface for password hashing strategies
 * Implements Strategy pattern for different hashing algorithms
 */
export interface IPasswordHasher {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  hash(password: string): Promise<string>;

  /**
   * Verify a password against a hash
   * @param password - Plain text password
   * @param hash - Hashed password
   * @returns True if password matches hash
   */
  verify(password: string, hash: string): Promise<boolean>;
}
