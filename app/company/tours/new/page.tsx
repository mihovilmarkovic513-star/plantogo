'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { DeliveryOrder, DeliveryOrderStatus } from '@/lib/types/order';
import { TourStatus } from '@/lib/types/tour';
import Link from 'next/link';

export default function NewTourPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [notes, setNotes] = useState('');
  
  const [availableOrders, setAvailableOrders] = useState<DeliveryOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    loadAvailableOrders();
  }, [user]);

  async function loadAvailableOrders() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      const q = query(
        collection(db, 'deliveryOrders'),
        where('companyId', '==', user.companyId),
        where('status', '==', DeliveryOrderStatus.PLANNED)
      );

      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({
        ...doc.data(),
        plannedDeliveryDate: doc.data().plannedDeliveryDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as DeliveryOrder[];

      setAvailableOrders(orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  }

  function toggleOrder(orderId: string) {
    if (selectedOrderIds.includes(orderId)) {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== orderId));
    } else {
      setSelectedOrderIds([...selectedOrderIds, orderId]);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (selectedOrderIds.length === 0) {
      setError('Please select at least one order');
      setLoading(false);
      return;
    }

    try {
      const db = getFirebaseFirestore();
      const tourRef = doc(collection(db, 'tours'));
      
      await setDoc(tourRef, {
        tourId: tourRef.id,
        companyId: user?.companyId,
        name,
        plannedDate: Timestamp.fromDate(new Date(plannedDate)),
        status: TourStatus.DRAFT,
        orderIds: selectedOrderIds,
        notes: notes || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: user?.uid,
      });

      router.push(`/company/tours/${tourRef.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create tour');
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/company/tours" className="text-blue-600 hover:text-blue-800">
          ← Back to Tours
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">New Tour</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tour Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              placeholder="e.g., Morning Route - Bremen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planned Date *</label>
            <input
              type="date"
              required
              value={plannedDate}
              onChange={e => setPlannedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
            placeholder="Additional notes about this tour..."
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Orders for Tour</h3>
          
          {availableOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No planned orders available. Orders must be in PLANNED status to add to a tour.
            </div>
          ) : (
            <div className="space-y-2">
              {availableOrders.map(order => (
                <label
                  key={order.orderId}
                  className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(order.orderId)}
                    onChange={() => toggleOrder(order.orderId)}
                    className="mr-3"
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">Order #{order.orderId.slice(-8)}</div>
                    <div className="text-sm text-gray-500">
                      Delivery: {order.plannedDeliveryDate.toLocaleDateString()}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-600">
            Selected: {selectedOrderIds.length} order(s)
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <Link
            href="/company/tours"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Tour'}
          </button>
        </div>
      </form>
    </div>
  );
}
