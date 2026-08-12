'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Tour, TourStatus, TourStatusLabels } from '@/lib/types/tour';
import Link from 'next/link';

export default function ToursPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tours, setTours] = useState<(Tour & { orderCount: number })[]>([]);
  const [filter, setFilter] = useState({ status: '' });

  useEffect(() => {
    loadTours();
  }, [user, filter]);

  async function loadTours() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      let q = query(
        collection(db, 'tours'),
        where('companyId', '==', user.companyId),
        orderBy('plannedDate', 'desc')
      );

      const snapshot = await getDocs(q).catch(err => {
        if (err.code === 'permission-denied') {
          return { docs: [] };
        }
        throw err;
      });
      
      const toursData = snapshot.docs.map(doc => ({
        ...doc.data(),
        plannedDate: doc.data().plannedDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        orderCount: doc.data().orderIds?.length || 0,
      })) as (Tour & { orderCount: number })[];

      let filtered = toursData;
      
      if (filter.status) {
        filtered = filtered.filter(t => t.status === filter.status);
      }

      setTours(filtered);
    } catch (error) {
      console.error('Error loading tours:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: TourStatus): string {
    switch (status) {
      case TourStatus.DRAFT: return 'bg-gray-100 text-gray-800';
      case TourStatus.READY: return 'bg-blue-100 text-blue-800';
      case TourStatus.ASSIGNED: return 'bg-purple-100 text-purple-800';
      case TourStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case TourStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case TourStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return <div className="p-6">Loading tours...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tours</h1>
        <Link
          href="/company/tours/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Tour
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Statuses</option>
              {Object.entries(TourStatusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {tours.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          No tours found. Create your first tour to group delivery orders.
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tour Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Planned Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tours.map((tour) => (
                <tr key={tour.tourId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{tour.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tour.plannedDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tour.orderCount} orders
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tour.driverName || 'Not assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(tour.status)}`}>
                      {TourStatusLabels[tour.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/company/tours/${tour.tourId}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
