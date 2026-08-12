'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { User } from '@/lib/types/auth';
import { updateUserStatus } from '@/lib/api/functions';
import Link from 'next/link';

export default function SupervisorsPage() {
  const { user } = useAuth();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadSupervisors = async () => {
    if (!user?.companyId) return;

    try {
      const db = getFirebaseFirestore();
      const q = query(
        collection(db, 'users'),
        where('companyId', '==', user.companyId),
        where('role', '==', 'SUPERVISOR'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const supervisorsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as User[];
      
      setSupervisors(supervisorsData);
    } catch (error) {
      console.error('Error loading supervisors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupervisors();
  }, [user]);

  const handleToggleStatus = async (supervisorId: string, currentStatus: boolean) => {
    setActionLoading(supervisorId);
    try {
      await updateUserStatus({ userId: supervisorId, active: !currentStatus });
      await loadSupervisors();
    } catch (error: any) {
      alert(error.message || 'Failed to update supervisor status');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading supervisors...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-bold">Supervisors</h2>
        <Link
          href="/company/supervisors/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Supervisor
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {supervisors.map((supervisor) => (
            <li key={supervisor.userId} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {supervisor.displayName}
                    </p>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      supervisor.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supervisor.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>{supervisor.email}</span>
                    <span className="mx-2">•</span>
                    <span>{supervisor.phone}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Created {supervisor.createdAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => handleToggleStatus(supervisor.userId, supervisor.active)}
                    disabled={actionLoading === supervisor.userId}
                    className={`px-3 py-1 text-xs font-medium rounded ${
                      supervisor.active
                        ? 'text-red-600 hover:text-red-800'
                        : 'text-green-600 hover:text-green-800'
                    } disabled:opacity-50`}
                  >
                    {supervisor.active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {supervisors.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No supervisors yet. Add your first supervisor to get started.</p>
        </div>
      )}
    </div>
  );
}
