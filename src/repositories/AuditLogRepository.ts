import { Pool } from 'pg';
import { AuditLog } from '../models/AuditLog';
import { AuditLogEntry } from '../dto/AuditLogEntry';
import { IAuditLogRepository } from './IAuditLogRepository';

export class AuditLogRepository implements IAuditLogRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(entry: AuditLogEntry): Promise<AuditLog> {
    const result = await this.pool.query(
      `INSERT INTO audit_logs (user_id, action_type, entity_type, entity_id, details, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, action_type, entity_type, entity_id, details, created_at`,
      [entry.userId, entry.actionType, entry.entityType, entry.entityId, JSON.stringify(entry.details)]
    );
    return this.mapToAuditLog(result.rows[0]);
  }

  async findByProject(projectId: string, limit: number = 50): Promise<AuditLog[]> {
    const result = await this.pool.query(
      `SELECT al.id, al.user_id, al.action_type, al.entity_type, al.entity_id, al.details, al.created_at
       FROM audit_logs al
       WHERE al.entity_type = 'PROJECT' AND al.entity_id = $1
          OR al.entity_type IN ('TASK', 'SPRINT', 'COMMENT') 
             AND al.entity_id IN (
               SELECT id FROM tasks WHERE project_id = $1
               UNION SELECT id FROM sprints WHERE project_id = $1
             )
       ORDER BY al.created_at DESC
       LIMIT $2`,
      [projectId, limit]
    );
    return result.rows.map((row) => this.mapToAuditLog(row));
  }

  private mapToAuditLog(row: any): AuditLog {
    return {
      id: row.id.toString(),
      userId: row.user_id.toString(),
      actionType: row.action_type,
      entityType: row.entity_type,
      entityId: row.entity_id.toString(),
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      createdAt: row.created_at,
    };
  }
}
