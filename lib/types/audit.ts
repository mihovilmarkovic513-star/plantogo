/**
 * Audit Log Types
 */

export enum AuditAction {
  COMPANY_CREATED = 'COMPANY_CREATED',
  COMPANY_UPDATED = 'COMPANY_UPDATED',
  COMPANY_ACTIVATED = 'COMPANY_ACTIVATED',
  COMPANY_DEACTIVATED = 'COMPANY_DEACTIVATED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_ACTIVATED = 'USER_ACTIVATED',
  USER_DEACTIVATED = 'USER_DEACTIVATED',
  USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
  DRIVER_PASSWORD_RESET = 'DRIVER_PASSWORD_RESET',
  COMPANY_ADMIN_CREATED = 'COMPANY_ADMIN_CREATED',
  SUPERVISOR_CREATED = 'SUPERVISOR_CREATED',
  DRIVER_CREATED = 'DRIVER_CREATED',
}

export type AuditTargetType = 'company' | 'user';

export interface AuditLog {
  logId: string;
  actorId: string;
  actorCompanyId: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  companyId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
}

export interface CreateAuditLogInput {
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  companyId?: string;
  metadata?: Record<string, any>;
}
