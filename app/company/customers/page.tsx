'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { Customer, CustomerType } from '@/lib/types/customer';
import Link from 'next/link';

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', status: 'active' });

  useEffect(() => {
    loadCustomers();
  }, [user, filter]);

  async function loadCustomers() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      let q = query(
        collection(db, 'customers'),
        where('companyId', '==', user.companyId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const customersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Customer[];

      let filtered = customersData;
      
      if (filter.status === 'active') {
        filtered = filtered.filter(c => c.active);
      } else if (filter.status === 'inactive') {
        filtered = filtered.filter(c => !c.active);
      }
      
      if (filter.type) {
        filtered = filtered.filter(c => c.customerType === filter.type);
      }

      setCustomers(filtered);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  }

  function getCustomerName(customer: Customer): string {
    if (customer.customerType === CustomerType.BUSINESS) {
      return customer.companyName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  }

  if (loading) {
    return <div className="text-center py-12">Loading customers...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <Link
          href="/company/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={e => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filter.type}
              onChange={e => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              <option value={CustomerType.PRIVATE}>Private</option>
              <option value={CustomerType.BUSINESS}>Business</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No customers found. Create your first customer to get started.
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.customerId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{getCustomerName(customer)}</div>
                    {customer.customerType === CustomerType.BUSINESS && customer.contactPerson && (
                      <div className="text-sm text-gray-500">Contact: {customer.contactPerson}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {customer.customerType === CustomerType.PRIVATE ? 'Private' : 'Business'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.address.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/company/customers/${customer.customerId}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
