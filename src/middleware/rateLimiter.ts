import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * Tracks login attempts per email address
 */
class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if request should be rate limited
   */
  isRateLimited(key: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(key);

    if (!record) {
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (now > record.resetTime) {
      // Reset window
      this.attempts.set(key, { count: 1, resetTime: now + this.windowMs });
      return false;
    }

    if (record.count >= this.maxAttempts) {
      return true;
    }

    record.count++;
    return false;
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key);
      }
    }
  }
}

// Create rate limiter instance
const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000);

// Cleanup expired entries every minute
setInterval(() => loginRateLimiter.cleanup(), 60 * 1000);

/**
 * Rate limiting middleware for login endpoint
 */
export const loginRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  const email = req.body.email;

  if (!email) {
    return next();
  }

  if (loginRateLimiter.isRateLimited(email)) {
    res.status(429).json({
      error: {
        message: 'Too many login attempts. Please try again later.',
        statusCode: 429,
      },
    });
    return;
  }

  next();
};
