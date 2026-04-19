import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '../services/AuthenticationService';
import { IUserRepository } from '../repositories/IUserRepository';

/**
 * User controller
 * Handles HTTP requests for user registration, login, and profile
 */
export class UserController {
  constructor(
    private authService: AuthenticationService,
    private userRepo: IUserRepository
  ) {}

  /**
   * POST /api/auth/register
   * Registers a new user account
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, email, password } = req.body;
      const user = await this.authService.register({ username, email, password });
      res.status(201).json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Authenticates user and returns JWT token
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json({
        token: result.token,
        user: {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/me
   * Returns current user profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.userRepo.findById(req.user.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
}
