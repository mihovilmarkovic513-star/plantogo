/**
 * Cloud Functions API Client
 */

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/client';
import { initializeFirebase } from '@/lib/firebase/client';
import type {
  CreateCompanyAdminInput,
  CreateDriverInput,
  CreateDriverResponse,
  CreateSupervisorInput,
  UpdateUserStatusInput,
  ResetDriverPasswordInput,
  ResetPasswordResponse,
} from '@/lib/types/auth';
import type { CreateCompanyInput } from '@/lib/types/company';

// Initialize Firebase
initializeFirebase();
const functions = getFirebaseFunctions();

/**
 * Create Company (SUPER_ADMIN only)
 */
export async function createCompany(data: CreateCompanyInput): Promise<{ companyId: string }> {
  const callable = httpsCallable<CreateCompanyInput, { companyId: string }>(functions, 'createCompany');
  const result = await callable(data);
  return result.data;
}

/**
 * Create Company Admin (SUPER_ADMIN only)
 */
export async function createCompanyAdmin(data: CreateCompanyAdminInput): Promise<{ userId: string }> {
  const callable = httpsCallable<CreateCompanyAdminInput, { userId: string }>(functions, 'createCompanyAdmin');
  const result = await callable(data);
  return result.data;
}

/**
 * Create Driver (COMPANY_ADMIN only)
 */
export async function createDriver(data: CreateDriverInput): Promise<CreateDriverResponse> {
  const callable = httpsCallable<CreateDriverInput, CreateDriverResponse>(functions, 'createDriver');
  const result = await callable(data);
  return result.data;
}

/**
 * Create Supervisor (COMPANY_ADMIN only)
 */
export async function createSupervisor(data: CreateSupervisorInput): Promise<ResetPasswordResponse> {
  const callable = httpsCallable<CreateSupervisorInput, ResetPasswordResponse>(functions, 'createSupervisor');
  const result = await callable(data);
  return result.data;
}

/**
 * Update User Status (SUPER_ADMIN or COMPANY_ADMIN)
 */
export async function updateUserStatus(data: UpdateUserStatusInput): Promise<{ success: boolean }> {
  const callable = httpsCallable<UpdateUserStatusInput, { success: boolean }>(functions, 'updateUserStatus');
  const result = await callable(data);
  return result.data;
}

/**
 * Reset Driver Password (COMPANY_ADMIN only)
 */
export async function resetDriverPassword(data: ResetDriverPasswordInput): Promise<ResetPasswordResponse> {
  const callable = httpsCallable<ResetDriverPasswordInput, ResetPasswordResponse>(functions, 'resetDriverPassword');
  const result = await callable(data);
  return result.data;
}
