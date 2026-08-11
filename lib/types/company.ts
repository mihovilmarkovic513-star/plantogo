/**
 * Company and Multi-tenant Types
 */

export interface Company {
  id: string;
  name: string;
  address: string;
  contactPerson: string;
  email: string;
  phone: string;
  identifier: string;
  logoUrl?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CompanySettings {
  timezone: string;
  language: string;
  currency: string;
}
