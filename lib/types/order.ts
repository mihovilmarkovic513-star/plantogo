/**
 * Delivery Order Types
 * Phase 2A: Delivery Order Management
 */

export enum DeliveryOrderStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceLevel {
  STANDARD = 'STANDARD',
  STANDARD_PLUS = 'STANDARD_PLUS',
  COMFORT = 'COMFORT',
  PREMIUM = 'PREMIUM',
}

export const ServiceLevelLabels: Record<ServiceLevel, string> = {
  [ServiceLevel.STANDARD]: 'Standard',
  [ServiceLevel.STANDARD_PLUS]: 'Standard Plus',
  [ServiceLevel.COMFORT]: 'Comfort',
  [ServiceLevel.PREMIUM]: 'Premium',
};

export interface DeliveryItem {
  itemId: string;
  orderId: string;
  companyId: string;
  
  manufacturer: string;
  model: string;
  productName: string;
  
  serialNumber?: string;
  articleNumber?: string;
  
  quantity: number;
  
  notes?: string;
}

export interface DeliveryOrder {
  orderId: string;
  companyId: string;
  
  customerId: string;
  
  status: DeliveryOrderStatus;
  serviceLevel: ServiceLevel;
  
  plannedDeliveryDate: Date;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateDeliveryOrderInput {
  // Customer data (inline - no separate customer creation needed)
  customerType: import('./customer').CustomerType;
  customerFirstName?: string;
  customerLastName?: string;
  customerCompanyName?: string;
  customerContactPerson?: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: import('./customer').CustomerAddress;
  customerNotes?: string;
  
  // Order data
  serviceLevel: ServiceLevel;
  plannedDeliveryDate: Date;
  notes?: string;
  items: CreateDeliveryItemInput[];
}

export interface CreateDeliveryItemInput {
  manufacturer: string;
  model: string;
  productName: string;
  serialNumber?: string;
  articleNumber?: string;
  quantity: number;
  notes?: string;
}

export interface UpdateDeliveryOrderInput {
  orderId: string;
  customerId: string;
  serviceLevel: ServiceLevel;
  plannedDeliveryDate: Date;
  notes?: string;
  status: DeliveryOrderStatus;
}
