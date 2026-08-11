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

export interface CustomClaims {
  role: UserRole;
  companyId: string | null;
  active: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  companyId: string | null;
  active: boolean;
}

export interface User {
  userId: string;
  companyId: string | null;
  role: UserRole;
  username?: string;
  email?: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phone: string;
  active: boolean;
  forcePasswordChange?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCompanyAdminInput {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  temporaryPassword: string;
}

export interface CreateDriverInput {
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface CreateSupervisorInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UpdateUserStatusInput {
  userId: string;
  active: boolean;
}

export interface ResetDriverPasswordInput {
  userId: string;
}

export interface CreateDriverResponse {
  userId: string;
  username: string;
  temporaryPassword: string;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}
