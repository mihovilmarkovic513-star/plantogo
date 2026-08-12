'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Tour, TourStatus, TourStatusLabels } from '@/lib/types/tour';
import { DeliveryOrder } from '@/lib/types/order';
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
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);

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

      // Load orders
      if (tourData.orderIds && tourData.orderIds.length > 0) {
        const ordersPromises = tourData.orderIds.map(orderId =>
          getDoc(doc(db, 'deliveryOrders', orderId))
        );
        const orderDocs = await Promise.all(ordersPromises);
        const ordersData = orderDocs
          .filter(d => d.exists())
          .map(d => ({
            ...d.data(),
            plannedDeliveryDate: d.data().plannedDeliveryDate?.toDate() || new Date(),
            createdAt: d.data().createdAt?.toDate() || new Date(),
            updatedAt: d.data().updatedAt?.toDate() || new Date(),
          })) as DeliveryOrder[];
        setOrders(ordersData);
      }
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
                <label className="text-sm font-medium text-gray-500">Orders</label>
                <p className="text-gray-900">{orders.length} order(s)</p>
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Orders in Tour ({orders.length})</h2>
            {orders.length === 0 ? (
              <p className="text-gray-500">No orders in this tour</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <Link
                    key={order.orderId}
                    href={`/company/orders/${order.orderId}`}
                    className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium text-gray-900">Order #{order.orderId.slice(-8)}</div>
                        <div className="text-sm text-gray-500">
                          Delivery: {order.plannedDeliveryDate.toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-sm text-blue-600">View →</div>
                    </div>
                  </Link>
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
