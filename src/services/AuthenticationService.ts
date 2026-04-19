import { User } from '../models/User';
import { CreateUserDTO } from '../dto/CreateUserDTO';
import { IUserRepository } from '../repositories/IUserRepository';
import { IPasswordHasher } from './IPasswordHasher';
import { IJWTService } from './IJWTService';
import { ValidationError, UnauthorizedError, ConflictError } from '../utils/errors';

/**
 * Authentication service
 * Handles user registration and login
 */
export class AuthenticationService {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private jwtService: IJWTService
  ) {}

  /**
   * Register a new user
   */
  async register(dto: CreateUserDTO): Promise<User> {
    // Validate email format (RFC 5322 simplified)
    if (!this.isValidEmail(dto.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password length
    if (dto.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }

    // Validate username length
    if (dto.username.length < 3 || dto.username.length > 50) {
      throw new ValidationError('Username must be between 3 and 50 characters');
    }

    // Check email uniqueness
    const existingUser = await this.userRepo.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.passwordHasher.hash(dto.password);

    // Create user
    const user = await this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
    });

    return user;
  }

  /**
   * Login user and generate JWT token
   */
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValid = await this.passwordHasher.verify(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
    });

    return { token, user };
  }

  /**
   * Validate email format using RFC 5322 simplified regex
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
