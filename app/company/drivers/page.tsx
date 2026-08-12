'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { User } from '@/lib/types/auth';
import { updateUserStatus, resetDriverPassword } from '@/lib/api/functions';
import Link from 'next/link';

export default function DriversPage() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDrivers = async () => {
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
  };

  useEffect(() => {
    loadDrivers();
  }, [user]);

  const handleToggleStatus = async (driverId: string, currentStatus: boolean) => {
    setActionLoading(driverId);
    try {
      await updateUserStatus({ userId: driverId, active: !currentStatus });
      await loadDrivers();
    } catch (error: any) {
      alert(error.message || 'Failed to update driver status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (driverId: string, username: string) => {
    if (!confirm(`Reset password for driver ${username}?`)) return;

    setActionLoading(driverId);
    try {
      const result = await resetDriverPassword({ userId: driverId });
      alert(`New temporary password: ${result.temporaryPassword}\n\nPlease save this password and provide it to the driver. It will not be shown again.`);
    } catch (error: any) {
      alert(error.message || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading drivers...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold">Drivers</h2>
        <Link
          href="/company/drivers/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Driver
        </Link>
      </div>

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
                <div className="ml-4 flex space-x-2">
                  <button
                    onClick={() => handleResetPassword(driver.userId, driver.username!)}
                    disabled={actionLoading === driver.userId}
                    className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    Reset Password
                  </button>
                  <button
                    onClick={() => handleToggleStatus(driver.userId, driver.active)}
                    disabled={actionLoading === driver.userId}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      driver.active
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-green-600 hover:text-green-800'
                    } disabled:opacity-50`}
                  >
                    {driver.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No drivers yet. Add your first driver to get started.</p>
        </div>
      )}
    </div>
  );
}
