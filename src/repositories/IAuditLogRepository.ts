import { AuditLog } from '../models/AuditLog';
import { AuditLogEntry } from '../dto/AuditLogEntry';

export interface IAuditLogRepository {
  create(entry: AuditLogEntry): Promise<AuditLog>;
  findByProject(projectId: string, limit: number): Promise<AuditLog[]>;
}
