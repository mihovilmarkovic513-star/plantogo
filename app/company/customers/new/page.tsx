'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/lib/firebase/client';
import { CustomerType, CreateCustomerInput } from '@/lib/types/customer';

export default function NewCustomerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateCustomerInput>({
    customerType: CustomerType.PRIVATE,
    firstName: '',
    lastName: '',
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: {
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      country: '',
    },
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const functions = getFirebaseFunctions();
      const createCustomerFn = httpsCallable(functions, 'createCustomer');
      const result = await createCustomerFn(formData);
      router.push(`/company/customers/${(result.data as any).customerId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create customer');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Customer Type *</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={loading}
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              placeholder="+43 123 456789"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              placeholder="customer@example.com"
            />
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street *</label>
                <input
                  type="text"
                  required
                  value={formData.address.street}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">House Number *</label>
                <input
                  type="text"
                  required
                  value={formData.address.houseNumber}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, houseNumber: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={formData.address.postalCode}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, postalCode: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={formData.address.city}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  required
                  value={formData.address.country}
                  onChange={e => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                  placeholder="Austria"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
            placeholder="Additional notes about this customer..."
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
