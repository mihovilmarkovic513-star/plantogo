/**
 * Customer Types
 * Phase 2A: Customer Management
 */

export enum CustomerType {
  PRIVATE = 'PRIVATE',
  BUSINESS = 'BUSINESS',
}

export interface CustomerAddress {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Customer {
  customerId: string;
  companyId: string;
  
  customerType: CustomerType;
  
  // For PRIVATE customers
  firstName?: string;
  lastName?: string;
  
  // For BUSINESS customers
  companyName?: string;
  contactPerson?: string;
  
  phone: string;
  email: string;
  
  address: CustomerAddress;
  
  notes?: string;
  
  active: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateCustomerInput {
  customerType: CustomerType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: CustomerAddress;
  notes?: string;
}

export interface UpdateCustomerInput extends CreateCustomerInput {
  customerId: string;
}
