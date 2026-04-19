import { AuditLog } from '../models/AuditLog';
import { AuditLogEntry } from '../dto/AuditLogEntry';
import { IAuditLogRepository } from '../repositories/IAuditLogRepository';

/**
 * Audit logger service
 * Handles audit logging for all system actions
 */
export class AuditLoggerService {
  constructor(private auditLogRepo: IAuditLogRepository) {}

  /**
   * Log an audit event
   * Creates an audit log entry with userId, actionType, entityType, entityId, and details
   */
  async log(entry: AuditLogEntry): Promise<AuditLog> {
    return this.auditLogRepo.create(entry);
  }

  /**
   * Get recent audit logs for a project
   * Returns the most recent 50 audit log entries
   */
  async getLogsByProject(projectId: string): Promise<AuditLog[]> {
    return this.auditLogRepo.findByProject(projectId, 50);
  }
}
