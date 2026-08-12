/**
 * Tour Types
 * Tours group multiple delivery orders for a driver
 */

export enum TourStatus {
  DRAFT = 'DRAFT',           // Being planned
  READY = 'READY',           // Ready to assign
  ASSIGNED = 'ASSIGNED',     // Assigned to driver
  IN_PROGRESS = 'IN_PROGRESS', // Driver started
  COMPLETED = 'COMPLETED',   // All deliveries done
  CANCELLED = 'CANCELLED',
}

export const TourStatusLabels: Record<TourStatus, string> = {
  [TourStatus.DRAFT]: 'Draft',
  [TourStatus.READY]: 'Ready',
  [TourStatus.ASSIGNED]: 'Assigned',
  [TourStatus.IN_PROGRESS]: 'In Progress',
  [TourStatus.COMPLETED]: 'Completed',
  [TourStatus.CANCELLED]: 'Cancelled',
};

export interface Tour {
  tourId: string;
  companyId: string;
  
  name: string;
  plannedDate: Date;
  status: TourStatus;
  
  // Orders in this tour
  orderIds: string[];
  
  // Driver assignment
  driverId?: string;
  driverName?: string;
  
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CreateTourInput {
  name: string;
  plannedDate: Date;
  orderIds: string[];
  notes?: string;
}

export interface UpdateTourInput {
  tourId: string;
  name?: string;
  plannedDate?: Date;
  orderIds?: string[];
  notes?: string;
}

export interface AssignTourToDriverInput {
  tourId: string;
  driverId: string;
}
