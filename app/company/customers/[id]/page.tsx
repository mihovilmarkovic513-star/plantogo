'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFirestore, getFirebaseFunctions } from '@/lib/firebase/client';
import { Customer, CustomerType, UpdateCustomerInput } from '@/lib/types/customer';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const customerId = params.id as string;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<UpdateCustomerInput | null>(null);

  useEffect(() => {
    loadCustomer();
  }, [customerId, user]);

  async function loadCustomer() {
    if (!user?.companyId) return;

    try {
      const db = getFirebaseFirestore();
      const customerDoc = await getDoc(doc(db, 'customers', customerId));
      
      if (!customerDoc.exists()) {
        setError('Customer not found');
        setLoading(false);
        return;
      }

      const customerData = {
        ...customerDoc.data(),
        createdAt: customerDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: customerDoc.data().updatedAt?.toDate() || new Date(),
      } as Customer;

      if (customerData.companyId !== user.companyId) {
        setError('Access denied');
        setLoading(false);
        return;
      }

      setCustomer(customerData);
      setFormData({
        customerId: customerData.customerId,
        customerType: customerData.customerType,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        companyName: customerData.companyName,
        contactPerson: customerData.contactPerson,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
      });
    } catch (error) {
      console.error('Error loading customer:', error);
      setError('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!formData) return;
    
    setSaving(true);
    setError('');

    try {
      const functions = getFirebaseFunctions();
      const updateCustomerFn = httpsCallable(functions, 'updateCustomer');
      await updateCustomerFn(formData);
      await loadCustomer();
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!customer) return;

    try {
      const functions = getFirebaseFunctions();
      const updateStatusFn = httpsCallable(functions, 'updateCustomerStatus');
      await updateStatusFn({ customerId: customer.customerId, active: !customer.active });
      await loadCustomer();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  }

  function getCustomerName(c: Customer): string {
    if (c.customerType === CustomerType.BUSINESS) {
      return c.companyName || 'N/A';
    }
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'N/A';
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error && !customer) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/company/customers" className="text-blue-600 hover:text-blue-800">
          ← Back to Customers
        </Link>
      </div>
    );
  }

  if (!customer || !formData) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/company/customers" className="text-blue-600 hover:text-blue-800">
          ← Back to Customers
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {getCustomerName(customer)}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Customer details and information
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
              customer.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {customer.active ? 'Active' : 'Inactive'}
            </span>
            {!editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={handleToggleStatus}
                  className={`px-4 py-2 rounded-md text-sm ${
                    customer.active
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {customer.active ? 'Deactivate' : 'Activate'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border-t border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {editing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={CustomerType.PRIVATE}
                      checked={formData.customerType === CustomerType.PRIVATE}
                      onChange={e => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                      className="mr-2"
                    />
                    Private
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value={CustomerType.BUSINESS}
                      checked={formData.customerType === CustomerType.BUSINESS}
                      onChange={e => setFormData({ ...formData, customerType: e.target.value as CustomerType })}
                      className="mr-2"
                    />
                    Business
                  </label>
                </div>
              </div>

              {formData.customerType === CustomerType.PRIVATE ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={formData.companyName || ''}
                      onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contactPerson || ''}
                      onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                      <input
                        type="text"
                        value={formData.address.street}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">House Number</label>
                      <input
                        type="text"
                        value={formData.address.houseNumber}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, houseNumber: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={formData.address.postalCode}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={formData.address.city}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={formData.address.country}
                        onChange={e => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditing(false);
                    setError('');
                    loadCustomer();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {customer.customerType === CustomerType.PRIVATE ? 'Private' : 'Business'}
                </dd>
              </div>
              {customer.customerType === CustomerType.BUSINESS && customer.contactPerson && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Contact Person</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.contactPerson}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {customer.address.street} {customer.address.houseNumber}<br />
                  {customer.address.postalCode} {customer.address.city}<br />
                  {customer.address.country}
                </dd>
              </div>
              {customer.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.notes}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.createdAt.toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.updatedAt.toLocaleDateString()}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Delivery History</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <p className="text-sm text-gray-500">No delivery orders yet.</p>
        </div>
      </div>
    </div>
  );
}
