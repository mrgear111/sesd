import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Rate limiting middleware for login endpoint
 * Limits login attempts to 5 per email address per 15 minutes
 */
export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each email to 5 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many login attempts. Please try again later.',
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use email as the key for rate limiting
  keyGenerator: (req: Request): string => {
    return req.body.email || req.ip || 'unknown';
  },
  // Skip rate limiting if no email is provided
  skip: (req: Request): boolean => {
    return !req.body.email;
  },
});

/**
 * General API rate limiting middleware
 * Limits all API requests to 100 per IP per 15 minutes
 */
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP. Please try again later.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});
