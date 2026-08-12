'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFirestore, getFirebaseFunctions } from '@/lib/firebase/client';
import { ServiceLevel, ServiceLevelLabels, CreateDeliveryItemInput } from '@/lib/types/order';
import { Customer, CustomerType } from '@/lib/types/customer';
import Link from 'next/link';

export default function NewOrderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>(ServiceLevel.STANDARD);
  const [plannedDate, setPlannedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<CreateDeliveryItemInput[]>([{
    manufacturer: '',
    model: '',
    productName: '',
    serialNumber: '',
    articleNumber: '',
    quantity: 1,
    notes: '',
  }]);

  useEffect(() => {
    loadCustomers();
  }, [user]);

  async function loadCustomers() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      const q = query(
        collection(db, 'customers'),
        where('companyId', '==', user.companyId),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const customersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Customer[];

      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  }

  function getCustomerName(customer: Customer): string {
    if (customer.customerType === CustomerType.BUSINESS) {
      return customer.companyName || 'N/A';
    }
    return `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A';
  }

  function addItem() {
    setItems([...items, {
      manufacturer: '',
      model: '',
      productName: '',
      serialNumber: '',
      articleNumber: '',
      quantity: 1,
      notes: '',
    }]);
  }

  function removeItem(index: number) {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  }

  function updateItem(index: number, field: keyof CreateDeliveryItemInput, value: string | number) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer');
      setLoading(false);
      return;
    }

    if (items.length === 0 || !items[0].manufacturer) {
      setError('Please add at least one delivery item');
      setLoading(false);
      return;
    }

    try {
      const functions = getFirebaseFunctions();
      const createOrderFn = httpsCallable(functions, 'createDeliveryOrder');
      const result = await createOrderFn({
        customerId: selectedCustomerId,
        serviceLevel,
        plannedDeliveryDate: new Date(plannedDate),
        notes,
        items: items.filter(item => item.manufacturer && item.model && item.productName),
      });
      router.push(`/company/orders/${(result.data as any).orderId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Delivery Order</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Customer *</label>
            <Link href="/company/customers/new" className="text-sm text-blue-600 hover:text-blue-800">
              + Create Customer
            </Link>
          </div>
          <select
            required
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
          >
            <option value="">Select a customer</option>
            {customers.map(customer => (
              <option key={customer.customerId} value={customer.customerId}>
                {getCustomerName(customer)} - {customer.address.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planned Delivery Date *</label>
            <input
              type="date"
              required
              value={plannedDate}
              onChange={e => setPlannedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Level *</label>
            <select
              required
              value={serviceLevel}
              onChange={e => setServiceLevel(e.target.value as ServiceLevel)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              disabled={loading}
            >
              {Object.entries(ServiceLevelLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            disabled={loading}
            placeholder="Additional notes about this order..."
          />
        </div>

        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Delivery Items</h3>
            <button
              type="button"
              onClick={addItem}
              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
              disabled={loading}
            >
              + Add Device
            </button>
          </div>

          <div className="space-y-6">
            {items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                <div className="absolute top-2 right-2">
                  <span className="text-sm font-medium text-gray-500">Device #{index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-3 text-red-600 hover:text-red-800 text-sm"
                      disabled={loading}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
                    <input
                      type="text"
                      required
                      value={item.manufacturer}
                      onChange={e => updateItem(index, 'manufacturer', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="e.g., Bosch"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      value={item.model}
                      onChange={e => updateItem(index, 'model', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="e.g., WGG244F40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={item.productName}
                      onChange={e => updateItem(index, 'productName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="e.g., Washing Machine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                    <input
                      type="text"
                      value={item.serialNumber}
                      onChange={e => updateItem(index, 'serialNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Article Number</label>
                    <input
                      type="text"
                      value={item.articleNumber}
                      onChange={e => updateItem(index, 'articleNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Notes</label>
                    <textarea
                      value={item.notes}
                      onChange={e => updateItem(index, 'notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={loading}
                      placeholder="Notes about this specific item..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
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
            {loading ? 'Creating...' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
