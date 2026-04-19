import * as bcrypt from 'bcrypt';
import { IPasswordHasher } from './IPasswordHasher';

/**
 * Bcrypt implementation of password hashing
 * Uses bcrypt with configurable salt rounds
 */
export class BcryptHasher implements IPasswordHasher {
  private saltRounds: number;

  constructor(saltRounds: number = 10) {
    this.saltRounds = saltRounds;
  }

  /**
   * Hash a password using bcrypt
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify a password against a bcrypt hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
