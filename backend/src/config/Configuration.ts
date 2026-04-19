export interface Configuration {
  database: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    minConnections: number;
    maxConnections: number;
    idleTimeoutMs: number;
    connectionTimeoutMs: number;
  };
  jwt: {
    secret: string;
    expirationHours: number;
  };
  server: {
    port: number;
    corsOrigins: string[];
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
}
