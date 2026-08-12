'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Company } from '@/lib/types/company';
import { User } from '@/lib/types/auth';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCompanyData() {
      try {
        const db = getFirebaseFirestore();
        
        // Load company
        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (companyDoc.exists()) {
          setCompany({
            ...companyDoc.data(),
            createdAt: companyDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: companyDoc.data().updatedAt?.toDate() || new Date(),
          } as Company);
        }

        // Load company users
        const usersQuery = query(collection(db, 'users'), where('companyId', '==', companyId));
        const usersSnapshot = await getDocs(usersQuery);
        const usersData = usersSnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as User[];
        
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(true); // Fix typo here
      }
    }

    loadCompanyData();
  }, [companyId]);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!company) {
    return <div className="text-center py-12">Company not found</div>;
  }

  const companyAdmins = users.filter(u => u.role === 'COMPANY_ADMIN');
  const supervisors = users.filter(u => u.role === 'SUPERVISOR');
  const drivers = users.filter(u => u.role === 'DRIVER');

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/companies" className="text-blue-600 hover:text-blue-800">
          ← Back to Companies
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {company.companyName}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Company details and information
            </p>
          </div>
          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            company.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {company.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Legal Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.legalName || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{company.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.address}<br />
                {company.postalCode} {company.city}<br />
                {company.country}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {company.createdAt.toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Users</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="px-4 py-5 sm:px-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Company Admins ({companyAdmins.length})
            </h4>
            {companyAdmins.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {companyAdmins.map(user => (
                  <li key={user.userId} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No company admins</p>
            )}
          </div>

          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Supervisors ({supervisors.length})
            </h4>
            {supervisors.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {supervisors.map(user => (
                  <li key={user.userId} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No supervisors</p>
            )}
          </div>

          <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Drivers ({drivers.length})
            </h4>
            {drivers.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {drivers.map(user => (
                  <li key={user.userId} className="py-3">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                      </div>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No drivers</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
