/**
 * Interface for JWT token operations
 */
export interface IJWTService {
  /**
   * Generate a JWT token
   * @param payload - Token payload data
   * @returns Signed JWT token
   */
  generateToken(payload: { userId: string; email: string }): string;

  /**
   * Verify and decode a JWT token
   * @param token - JWT token to verify
   * @returns Decoded token payload
   */
  verify(token: string): { userId: string; email: string };
}
