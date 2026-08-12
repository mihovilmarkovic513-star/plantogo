'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Company } from '@/lib/types/company';
import { User } from '@/lib/types/auth';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    totalSupervisors: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user?.companyId) return;

      try {
        const db = getFirebaseFirestore();
        
        // Load company
        const companyDoc = await getDoc(doc(db, 'companies', user.companyId));
        if (companyDoc.exists()) {
          setCompany({
            ...companyDoc.data(),
            createdAt: companyDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: companyDoc.data().updatedAt?.toDate() || new Date(),
          } as Company);
        }

        // Load users
        const usersQuery = query(collection(db, 'users'), where('companyId', '==', user.companyId));
        const usersSnapshot = await getDocs(usersQuery);
        const users = usersSnapshot.docs.map(doc => doc.data()) as User[];

        setStats({
          totalDrivers: users.filter(u => u.role === 'DRIVER').length,
          activeDrivers: users.filter(u => u.role === 'DRIVER' && u.active).length,
          totalSupervisors: users.filter(u => u.role === 'SUPERVISOR').length,
        });
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Company Dashboard</h2>

      {company && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {company.companyName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {company.city}, {company.country}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-gray-900">{stats.totalDrivers}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Drivers</dt>
                  <dd className="text-sm text-gray-900">{stats.activeDrivers} active</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-3xl font-bold text-gray-900">{stats.totalSupervisors}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Supervisors</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-x-4">
        <a
          href="/company/drivers"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Manage Drivers
        </a>
        <a
          href="/company/supervisors"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
        >
          Manage Supervisors
        </a>
      </div>
    </div>
  );
}
