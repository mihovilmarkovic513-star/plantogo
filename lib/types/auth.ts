/**
 * Authentication and User Types
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  DRIVER = 'DRIVER',
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  employeeId?: string;
  username?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
  companyId: string | null;
  active: boolean;
}

export interface CustomClaims {
  role: UserRole;
  companyId: string | null;
  active: boolean;
}
