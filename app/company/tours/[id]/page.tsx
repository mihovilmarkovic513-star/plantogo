'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Tour, TourStatus, TourStatusLabels } from '@/lib/types/tour';
import { TourStop, TourStopType, TourStopStatusLabels } from '@/lib/types/tour-stop';
import { DeliveryOrder, ServiceLevelLabels } from '@/lib/types/order';
import Link from 'next/link';

interface Driver {
  userId: string;
  displayName: string;
  email: string;
}

export default function TourDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tour, setTour] = useState<Tour | null>(null);
  const [stops, setStops] = useState<TourStop[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadTourData();
    loadDrivers();
  }, [params.id, user]);

  async function loadTourData() {
    if (!params.id || !user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      const tourDoc = await getDoc(doc(db, 'tours', params.id as string));
      
      if (!tourDoc.exists()) {
        router.push('/company/tours');
        return;
      }

      const tourData = {
        ...tourDoc.data(),
        plannedDate: tourDoc.data().plannedDate?.toDate() || new Date(),
        createdAt: tourDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: tourDoc.data().updatedAt?.toDate() || new Date(),
      } as Tour;

      setTour(tourData);
      setSelectedDriverId(tourData.driverId || '');

      // Load tour stops
      const stopsQuery = query(
        collection(db, 'tours', params.id as string, 'stops'),
        orderBy('sequence', 'asc')
      );
      const stopsSnapshot = await getDocs(stopsQuery);
      const stopsData = stopsSnapshot.docs.map(doc => ({
        ...doc.data(),
        plannedArrivalTime: doc.data().plannedArrivalTime?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as TourStop[];
      setStops(stopsData);
    } catch (error) {
      console.error('Error loading tour:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadDrivers() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', user.companyId),
        where('role', '==', 'DRIVER'),
        where('active', '==', true)
      );

      const snapshot = await getDocs(q);
      const driversData = snapshot.docs.map(doc => ({
        userId: doc.id,
        displayName: doc.data().displayName || `${doc.data().firstName} ${doc.data().lastName}`,
        email: doc.data().email,
      }));
      setDrivers(driversData);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  }

  async function assignToDriver() {
    if (!tour || !selectedDriverId) return;
    
    setAssigning(true);
    try {
      const db = getFirebaseFirestore();
      const driver = drivers.find(d => d.userId === selectedDriverId);
      
      await updateDoc(doc(db, 'tours', tour.tourId), {
        driverId: selectedDriverId,
        driverName: driver?.displayName,
        status: TourStatus.ASSIGNED,
        updatedAt: new Date(),
      });

      alert('Tour assigned to driver successfully!');
      loadTourData();
    } catch (error: any) {
      alert('Failed to assign tour: ' + error.message);
    } finally {
      setAssigning(false);
    }
  }

  async function markAsReady() {
    if (!tour) return;
    
    try {
      const db = getFirebaseFirestore();
      await updateDoc(doc(db, 'tours', tour.tourId), {
        status: TourStatus.READY,
        updatedAt: new Date(),
      });
      loadTourData();
    } catch (error: any) {
      alert('Failed to update status: ' + error.message);
    }
  }

  async function reorderStop(stopId: string, direction: 'up' | 'down') {
    if (!tour || reordering) return;
    
    setReordering(true);
    try {
      const db = getFirebaseFirestore();
      const stopIndex = stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) return;
      
      const targetIndex = direction === 'up' ? stopIndex - 1 : stopIndex + 1;
      if (targetIndex < 0 || targetIndex >= stops.length) {
        setReordering(false);
        return;
      }
      
      const currentStop = stops[stopIndex];
      const targetStop = stops[targetIndex];
      
      // Swap sequences
      await updateDoc(doc(db, 'tours', tour.tourId, 'stops', currentStop.stopId), {
        sequence: targetStop.sequence,
        updatedAt: Timestamp.now(),
      });
      
      await updateDoc(doc(db, 'tours', tour.tourId, 'stops', targetStop.stopId), {
        sequence: currentStop.sequence,
        updatedAt: Timestamp.now(),
      });
      
      await loadTourData();
    } catch (error: any) {
      alert('Failed to reorder stop: ' + error.message);
    } finally {
      setReordering(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading tour...</div>;
  }

  if (!tour) {
    return <div className="p-6">Tour not found</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/company/tours" className="text-blue-600 hover:text-blue-800">
          ← Back to Tours
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">{tour.name}</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tour Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tour ID</label>
                <p className="text-gray-900">{tour.tourId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <p className="text-gray-900">{TourStatusLabels[tour.status]}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Planned Date</label>
                <p className="text-gray-900">{tour.plannedDate.toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Stops</label>
                <p className="text-gray-900">{stops.length} stop(s)</p>
              </div>
              {tour.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-gray-900">{tour.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Route / Stops ({stops.length})</h2>
            {stops.length === 0 ? (
              <p className="text-gray-500">No stops in this tour</p>
            ) : (
              <div className="space-y-3">
                {stops.map((stop, index) => (
                  <div
                    key={stop.stopId}
                    className="p-4 border border-gray-200 rounded-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl font-bold text-gray-400">{stop.sequence}</span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${
                            stop.type === TourStopType.PICKUP 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {stop.type}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800">
                            {TourStopStatusLabels[stop.status]}
                          </span>
                        </div>
                        <div className="ml-12">
                          <div className="font-medium text-gray-900">{stop.location.name}</div>
                          <div className="text-sm text-gray-600">
                            {stop.location.street} {stop.location.houseNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {stop.location.postalCode} {stop.location.city}
                          </div>
                          {stop.type === TourStopType.PICKUP && stop.orderIds && (
                            <div className="text-sm text-gray-500 mt-1">
                              {stop.orderIds.length} order(s)
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => reorderStop(stop.stopId, 'up')}
                          disabled={index === 0 || reordering}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↑ Up
                        </button>
                        <button
                          onClick={() => reorderStop(stop.stopId, 'down')}
                          disabled={index === stops.length - 1 || reordering}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ↓ Down
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Assignment</h2>
            
            {tour.status === TourStatus.DRAFT && (
              <div className="mb-4">
                <button
                  onClick={markAsReady}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Mark as Ready
                </button>
                <p className="text-xs text-gray-500 mt-2">Tour must be marked as ready before assigning to a driver</p>
              </div>
            )}

            {tour.status === TourStatus.READY && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
                  <select
                    value={selectedDriverId}
                    onChange={e => setSelectedDriverId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={assigning}
                  >
                    <option value="">Choose a driver...</option>
                    {drivers.map(driver => (
                      <option key={driver.userId} value={driver.userId}>
                        {driver.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={assignToDriver}
                  disabled={!selectedDriverId || assigning}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {assigning ? 'Assigning...' : 'Assign to Driver'}
                </button>
              </>
            )}

            {tour.status === TourStatus.ASSIGNED && tour.driverName && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm font-medium text-green-800">Assigned to:</p>
                <p className="text-lg font-semibold text-green-900">{tour.driverName}</p>
              </div>
            )}

            {(tour.status === TourStatus.IN_PROGRESS || tour.status === TourStatus.COMPLETED) && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm font-medium text-blue-800">Driver:</p>
                <p className="text-lg font-semibold text-blue-900">{tour.driverName}</p>
                <p className="text-sm text-blue-600 mt-2">Status: {TourStatusLabels[tour.status]}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
