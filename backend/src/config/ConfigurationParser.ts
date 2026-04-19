import * as fs from 'fs';
import { Configuration } from './Configuration';
import { ValidationError } from '../utils/errors';

/**
 * Configuration parser
 * Parses configuration files and validates required fields
 */
export class ConfigurationParser {
  /**
   * Parse configuration from JSON file
   */
  parse(filePath: string): Configuration {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      return this.validate(data);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new ValidationError(`Invalid JSON syntax in configuration file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Parse configuration from object
   */
  parseObject(data: any): Configuration {
    return this.validate(data);
  }

  /**
   * Validate configuration object
   */
  private validate(data: any): Configuration {
    const missingFields: string[] = [];

    // Validate database configuration
    if (!data.database) missingFields.push('database');
    else {
      if (!data.database.host) missingFields.push('database.host');
      if (!data.database.port) missingFields.push('database.port');
      if (!data.database.database) missingFields.push('database.database');
      if (!data.database.user) missingFields.push('database.user');
      if (!data.database.password) missingFields.push('database.password');
    }

    // Validate JWT configuration
    if (!data.jwt) missingFields.push('jwt');
    else {
      if (!data.jwt.secret) missingFields.push('jwt.secret');
      if (!data.jwt.expirationHours) missingFields.push('jwt.expirationHours');
    }

    // Validate server configuration
    if (!data.server) missingFields.push('server');
    else {
      if (!data.server.port) missingFields.push('server.port');
      if (!data.server.corsOrigins) missingFields.push('server.corsOrigins');
    }

    // Validate rate limit configuration
    if (!data.rateLimit) missingFields.push('rateLimit');
    else {
      if (!data.rateLimit.windowMs) missingFields.push('rateLimit.windowMs');
      if (!data.rateLimit.maxRequests) missingFields.push('rateLimit.maxRequests');
    }

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required configuration fields: ${missingFields.join(', ')}`
      );
    }

    return data as Configuration;
  }
}
