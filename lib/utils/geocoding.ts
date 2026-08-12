/**
 * Geocoding utilities for converting addresses to coordinates
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export async function geocodeAddress(
  street: string,
  houseNumber: string,
  postalCode: string,
  city: string,
  country: string = 'Germany'
): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key not configured');
    return null;
  }

  const address = `${street} ${houseNumber}, ${postalCode} ${city}, ${country}`;
  const encodedAddress = encodeURIComponent(address);
  
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
      };
    }
    
    console.error('Geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

export async function geocodeMultipleAddresses(
  addresses: Array<{
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country?: string;
  }>
): Promise<Array<GeocodingResult | null>> {
  const results = await Promise.all(
    addresses.map(addr =>
      geocodeAddress(
        addr.street,
        addr.houseNumber,
        addr.postalCode,
        addr.city,
        addr.country
      )
    )
  );
  
  return results;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
