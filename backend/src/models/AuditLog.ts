export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  createdAt: Date;
}
