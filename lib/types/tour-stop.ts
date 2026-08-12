/**
 * Tour Stop Types
 * Represents ordered stops in a tour (PICKUP or DELIVERY)
 */

export enum TourStopType {
  PICKUP = 'PICKUP',
  DELIVERY = 'DELIVERY',
}

export enum TourStopStatus {
  PENDING = 'PENDING',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
}

export const TourStopStatusLabels: Record<TourStopStatus, string> = {
  [TourStopStatus.PENDING]: 'Pending',
  [TourStopStatus.EN_ROUTE]: 'En Route',
  [TourStopStatus.ARRIVED]: 'Arrived',
  [TourStopStatus.COMPLETED]: 'Completed',
  [TourStopStatus.SKIPPED]: 'Skipped',
};

export interface TourStopLocation {
  name: string;
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface TourStop {
  stopId: string;
  tourId: string;
  companyId: string;
  
  sequence: number;
  type: TourStopType;
  status: TourStopStatus;
  
  // For DELIVERY stops
  orderId?: string;
  customerId?: string;
  
  // For PICKUP stops - can contain multiple orders
  orderIds?: string[];
  
  location: TourStopLocation;
  
  plannedArrivalTime?: Date;
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTourStopInput {
  tourId: string;
  sequence: number;
  type: TourStopType;
  
  // For DELIVERY
  orderId?: string;
  customerId?: string;
  
  // For PICKUP
  orderIds?: string[];
  
  location: TourStopLocation;
  plannedArrivalTime?: Date;
  notes?: string;
}

export interface UpdateTourStopInput {
  stopId: string;
  sequence?: number;
  status?: TourStopStatus;
  plannedArrivalTime?: Date;
  notes?: string;
}

export interface ReorderStopInput {
  tourId: string;
  stopId: string;
  direction: 'up' | 'down';
}
