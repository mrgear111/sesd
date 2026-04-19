import * as jwt from 'jsonwebtoken';
import { IJWTService } from './IJWTService';

/**
 * JWT service implementation
 * Handles token generation and verification
 */
export class JWTService implements IJWTService {
  private secret: string;
  private expiresIn: string;

  constructor(secret: string, expiresIn: string = '24h') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  /**
   * Generate a JWT token with user data
   */
  generateToken(payload: { userId: string; email: string }): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  /**
   * Verify and decode a JWT token
   */
  verify(token: string): { userId: string; email: string } {
    const decoded = jwt.verify(token, this.secret, {
      algorithms: ['HS256'],
    }) as { userId: string; email: string };
    return decoded;
  }
}
