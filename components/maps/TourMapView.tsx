'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { TourStop, TourStopType } from '@/lib/types/tour-stop';

interface TourMapViewProps {
  stops: TourStop[];
  onStopReorder?: (stopId: string, newSequence: number) => void;
  editable?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
};

const defaultCenter = {
  lat: 53.0793,
  lng: 8.8017, // Bremen, Germany
};

export default function TourMapView({ stops, onStopReorder, editable = false }: TourMapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedStop, setSelectedStop] = useState<TourStop | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  useEffect(() => {
    if (map && stops.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      stops.forEach(stop => {
        if (stop.location.latitude && stop.location.longitude) {
          bounds.extend({
            lat: stop.location.latitude,
            lng: stop.location.longitude,
          });
        }
      });
      map.fitBounds(bounds);
    }
  }, [map, stops]);

  useEffect(() => {
    if (stops.length > 1) {
      calculateRoute();
    }
  }, [stops]);

  const calculateRoute = async () => {
    if (!window.google || stops.length < 2) return;

    const validStops = stops.filter(s => s.location.latitude && s.location.longitude);
    if (validStops.length < 2) return;

    const directionsService = new google.maps.DirectionsService();
    
    const origin = {
      lat: validStops[0].location.latitude!,
      lng: validStops[0].location.longitude!,
    };

    const destination = {
      lat: validStops[validStops.length - 1].location.latitude!,
      lng: validStops[validStops.length - 1].location.longitude!,
    };

    const waypoints = validStops.slice(1, -1).map(stop => ({
      location: {
        lat: stop.location.latitude!,
        lng: stop.location.longitude!,
      },
      stopover: true,
    }));

    try {
      const result = await directionsService.route({
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      });

      if (result.routes[0]) {
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        route.legs.forEach(leg => {
          totalDistance += leg.distance?.value || 0;
          totalDuration += leg.duration?.value || 0;
        });

        setRouteInfo({
          distance: `${(totalDistance / 1000).toFixed(1)} km`,
          duration: `${Math.round(totalDuration / 60)} min`,
        });
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  const getMarkerIcon = (stop: TourStop) => {
    const color = stop.type === TourStopType.PICKUP ? '#9333ea' : '#3b82f6';
    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10,
    };
  };

  const getMarkerLabel = (stop: TourStop) => {
    return {
      text: stop.sequence.toString(),
      color: '#ffffff',
      fontSize: '14px',
      fontWeight: 'bold',
    };
  };

  const pathCoordinates = stops
    .filter(stop => stop.location.latitude && stop.location.longitude)
    .map(stop => ({
      lat: stop.location.latitude!,
      lng: stop.location.longitude!,
    }));

  if (!apiKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Google Maps API key not configured. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {routeInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-around">
          <div className="text-center">
            <div className="text-sm text-blue-600 font-medium">Total Distance</div>
            <div className="text-2xl font-bold text-blue-900">{routeInfo.distance}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-blue-600 font-medium">Estimated Time</div>
            <div className="text-2xl font-bold text-blue-900">{routeInfo.duration}</div>
          </div>
        </div>
      )}

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={defaultCenter}
          zoom={10}
          onLoad={onLoad}
        >
          {pathCoordinates.length > 1 && (
            <Polyline
              path={pathCoordinates}
              options={{
                strokeColor: '#3b82f6',
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}

          {stops.map((stop) => {
            if (!stop.location.latitude || !stop.location.longitude) return null;

            return (
              <Marker
                key={stop.stopId}
                position={{
                  lat: stop.location.latitude,
                  lng: stop.location.longitude,
                }}
                icon={getMarkerIcon(stop)}
                label={getMarkerLabel(stop)}
                onClick={() => setSelectedStop(stop)}
              />
            );
          })}

          {selectedStop && selectedStop.location.latitude && selectedStop.location.longitude && (
            <InfoWindow
              position={{
                lat: selectedStop.location.latitude,
                lng: selectedStop.location.longitude,
              }}
              onCloseClick={() => setSelectedStop(null)}
            >
              <div className="p-2">
                <div className="font-semibold text-gray-900">{selectedStop.location.name}</div>
                <div className="text-sm text-gray-600">
                  {selectedStop.location.street} {selectedStop.location.houseNumber}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedStop.location.postalCode} {selectedStop.location.city}
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    selectedStop.type === TourStopType.PICKUP 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedStop.type}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>
    </div>
  );
}
