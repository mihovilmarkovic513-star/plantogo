/**
 * Company and Multi-tenant Types
 */

export interface Company {
  companyId: string;
  companyName: string;
  legalName?: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCompanyInput {
  companyName: string;
  legalName?: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  legalName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  active?: boolean;
}

export interface CompanySettings {
  timezone: string;
  language: string;
  currency: string;
}
