'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { User } from '@/lib/types/auth';

export default function SupervisorDriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDrivers() {
      if (!user?.companyId) return;

      try {
        const db = getFirebaseFirestore();
        const q = query(
          collection(db, 'users'),
          where('companyId', '==', user.companyId),
          where('role', '==', 'DRIVER'),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        const driversData = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as User[];
        
        setDrivers(driversData);
      } catch (error) {
        console.error('Error loading drivers:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDrivers();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12">Loading drivers...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Drivers (Read-Only)</h2>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {drivers.map((driver) => (
            <li key={driver.userId} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {driver.displayName}
                    </p>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      driver.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {driver.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>@{driver.username}</span>
                    <span className="mx-2">•</span>
                    <span>{driver.phone}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Created {driver.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No drivers in your company yet.</p>
        </div>
      )}
    </div>
  );
}
