export interface AuditLogEntry {
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
}
