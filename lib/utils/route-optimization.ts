/**
 * Route optimization utilities
 */

import { TourStop, TourStopType } from '@/lib/types/tour-stop';
import { calculateDistance } from './geocoding';

export interface OptimizedRoute {
  stops: TourStop[];
  totalDistance: number;
  estimatedDuration: number;
}

export async function optimizeRoute(stops: TourStop[]): Promise<OptimizedRoute> {
  if (stops.length <= 2) {
    return {
      stops,
      totalDistance: 0,
      estimatedDuration: 0,
    };
  }

  const pickupStops = stops.filter(s => s.type === TourStopType.PICKUP);
  const deliveryStops = stops.filter(s => s.type === TourStopType.DELIVERY);

  if (pickupStops.length === 0) {
    const optimized = await optimizeDeliveryStops(deliveryStops);
    return optimized;
  }

  const optimizedDeliveries = await optimizeDeliveryStops(deliveryStops);
  
  const allStops = [...pickupStops, ...optimizedDeliveries.stops];
  
  let sequence = 1;
  const resequencedStops = allStops.map(stop => ({
    ...stop,
    sequence: sequence++,
  }));

  const totalDistance = calculateTotalDistance(resequencedStops);
  const estimatedDuration = estimateDuration(totalDistance);

  return {
    stops: resequencedStops,
    totalDistance,
    estimatedDuration,
  };
}

async function optimizeDeliveryStops(stops: TourStop[]): Promise<OptimizedRoute> {
  if (stops.length <= 1) {
    return {
      stops,
      totalDistance: 0,
      estimatedDuration: 0,
    };
  }

  const validStops = stops.filter(
    s => s.location.latitude !== null && s.location.longitude !== null
  );

  if (validStops.length === 0) {
    return {
      stops,
      totalDistance: 0,
      estimatedDuration: 0,
    };
  }

  const optimized = nearestNeighborOptimization(validStops);
  
  return optimized;
}

function nearestNeighborOptimization(stops: TourStop[]): OptimizedRoute {
  if (stops.length <= 1) {
    return {
      stops,
      totalDistance: 0,
      estimatedDuration: 0,
    };
  }

  const unvisited = [...stops];
  const route: TourStop[] = [];
  
  let current = unvisited.shift()!;
  route.push(current);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const distance = calculateDistance(
        current.location.latitude!,
        current.location.longitude!,
        unvisited[i].location.latitude!,
        unvisited[i].location.longitude!
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    current = unvisited.splice(nearestIndex, 1)[0];
    route.push(current);
  }

  let sequence = 1;
  const resequencedRoute = route.map(stop => ({
    ...stop,
    sequence: sequence++,
  }));

  const totalDistance = calculateTotalDistance(resequencedRoute);
  const estimatedDuration = estimateDuration(totalDistance);

  return {
    stops: resequencedRoute,
    totalDistance,
    estimatedDuration,
  };
}

function calculateTotalDistance(stops: TourStop[]): number {
  let total = 0;

  for (let i = 0; i < stops.length - 1; i++) {
    const current = stops[i];
    const next = stops[i + 1];

    if (
      current.location.latitude &&
      current.location.longitude &&
      next.location.latitude &&
      next.location.longitude
    ) {
      total += calculateDistance(
        current.location.latitude,
        current.location.longitude,
        next.location.latitude,
        next.location.longitude
      );
    }
  }

  return total;
}

function estimateDuration(distanceKm: number): number {
  const averageSpeedKmh = 40;
  const durationHours = distanceKm / averageSpeedKmh;
  const durationMinutes = durationHours * 60;
  
  const stopTimeMinutes = 15;
  
  return Math.round(durationMinutes);
}
