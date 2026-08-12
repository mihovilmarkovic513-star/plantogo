'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFirestore, getFirebaseFunctions } from '@/lib/firebase/client';
import { Company } from '@/lib/types/company';
import { User } from '@/lib/types/auth';
import Link from 'next/link';

export default function CompanyDetailPage() {
  const params = useParams();
  const companyId = params.id as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [adminFormData, setAdminFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  async function loadCompanyData() {
    try {
      const db = getFirebaseFirestore();
      
      const companyDoc = await getDoc(doc(db, 'companies', companyId));
      if (companyDoc.exists()) {
        setCompany({
          ...companyDoc.data(),
          createdAt: companyDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: companyDoc.data().updatedAt?.toDate() || new Date(),
        } as Company);
      }

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
      setLoo ading(false);
    }
  }

  useEffect(() => {
    loadCompanyData();
  }, [companyId]);

  async function handleCreateCompanyAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoading(true);
    setAdminError('');
    setGeneratedPassword('');

    try {
      const functions = getFirebaseFunctions();
      const createCompanyAdminFn = httpsCallable(functions, 'createCompanyAdmin');
      
      const result = await createCompanyAdminFn({
        companyId,
        email: adminFormData.email,
        firstName: adminFormData.firstName,
        lastName: adminFormData.lastName,
        phone: adminFormData.phone,
      });

      setGeneratedPassword((result.data as any).temporaryPassword);
      await loadCompanyData();
      setAdminFormData({ firstName: '', lastName: '', email: '', phone: '' });
    } catch (err: any) {
      setAdminError(err.message || 'Failed to create Company Admin');
      setAdminLoading(false);
    }
  }

  function handleCloseModal() {
    setShowAddAdminModal(false);
    setAdminFormData({ firstName: '', lastName: '', email: '', phone: '' });
    setAdminError('');
    setGeneratedPassword('');
    setAdminLoading(false);
  }

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
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Company Admins ({companyAdmins.length})
              </h4>
              <button
                onClick={() => setShowAddAdminModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                + Add Company Admin
              </button>
            </div>
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

      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Add Company Admin</h2>
            <p className="text-sm text-gray-600 mb-6">
              Company: <strong>{company.companyName}</strong>
            </p>

            {generatedPassword ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Company Admin Created!</h3>
                <div className="bg-yellow-50 border border-yellow-300 rounded p-4 mb-4">
                  <p className="text-sm font-semibold text-yellow-800 mb-2">⚠️ IMPORTANT - Save This Password</p>
                  <p className="text-sm text-yellow-700 mb-3">
                    This temporary password will only be shown ONCE. Please save it securely.
                  </p>
                  <div className="bg-white border border-gray-300 rounded p-3">
                    <p className="text-xs text-gray-600 mb-1">Temporary Password:</p>
                    <p className="text-lg font-mono font-bold text-gray-900 break-all">{generatedPassword}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  The Company Admin can log in using their <strong>email</strong> and this password.
                </p>
                <button
                  onClick={handleCloseModal}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateCompanyAdmin}>
                {adminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {adminError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={adminFormData.firstName}
                      onChange={e => setAdminFormData({...adminFormData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={adminLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={adminFormData.lastName}
                      onChange={e => setAdminFormData({...adminFormData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={adminLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      value={adminFormData.email}
                      onChange={e => setAdminFormData({...adminFormData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={adminLoading}
                      placeholder="admin@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">The Company Admin will use this email to log in.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={adminFormData.phone}
                      onChange={e => setAdminFormData({...adminFormData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={adminLoading}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                    disabled={adminLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={adminLoading}
                  >
                    {adminLoading ? 'Creating...' : 'Create Company Admin'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  * A secure temporary password will be generated automatically.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
