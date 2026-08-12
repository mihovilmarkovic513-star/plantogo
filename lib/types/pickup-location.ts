/**
 * Pickup Location Types
 * Represents warehouse/store locations where drivers pick up devices
 */

export interface PickupLocation {
  locationId: string;
  companyId: string;
  
  name: string;
  
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  country: string;
  
  latitude?: number;
  longitude?: number;
  
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  
  notes?: string;
  active: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePickupLocationInput {
  name: string;
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  country: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}
