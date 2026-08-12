'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { DeliveryOrder, DeliveryOrderStatus, ServiceLevelLabels, DeliveryItem } from '@/lib/types/order';
import { Customer, CustomerType } from '@/lib/types/customer';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const orderId = params.id as string;
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [items, setItems] = useState<DeliveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrder();
  }, [orderId, user]);

  async function loadOrder() {
    if (!user?.companyId) return;

    try {
      const db = getFirebaseFirestore();
      const orderDoc = await getDoc(doc(db, 'deliveryOrders', orderId));
      
      if (!orderDoc.exists()) {
        setError('Order not found');
        setLoading(false);
        return;
      }

      const orderData = {
        ...orderDoc.data(),
        plannedDeliveryDate: orderDoc.data().plannedDeliveryDate?.toDate() || new Date(),
        createdAt: orderDoc.data().createdAt?.toDate() || new Date(),
        updatedAt: orderDoc.data().updatedAt?.toDate() || new Date(),
      } as DeliveryOrder;

      if (orderData.companyId !== user.companyId) {
        setError('Access denied');
        setLoading(false);
        return;
      }

      setOrder(orderData);

      const customerDoc = await getDoc(doc(db, 'customers', orderData.customerId));
      if (customerDoc.exists()) {
        setCustomer({
          ...customerDoc.data(),
          createdAt: customerDoc.data().createdAt?.toDate() || new Date(),
          updatedAt: customerDoc.data().updatedAt?.toDate() || new Date(),
        } as Customer);
      }

      const itemsQuery = query(
        collection(db, 'deliveryOrders', orderId, 'items')
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      const itemsData = itemsSnapshot.docs.map(doc => doc.data()) as DeliveryItem[];
      setItems(itemsData);

    } catch (error) {
      console.error('Error loading order:', error);
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }

  function getCustomerName(c: Customer): string {
    if (c.customerType === CustomerType.BUSINESS) {
      return c.companyName || 'N/A';
    }
    return `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'N/A';
  }

  function getStatusColor(status: DeliveryOrderStatus): string {
    switch (status) {
      case DeliveryOrderStatus.DRAFT: return 'bg-gray-100 text-gray-800';
      case DeliveryOrderStatus.PLANNED: return 'bg-blue-100 text-blue-800';
      case DeliveryOrderStatus.ASSIGNED: return 'bg-purple-100 text-purple-800';
      case DeliveryOrderStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
      case DeliveryOrderStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case DeliveryOrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
        <Link href="/company/orders" className="text-blue-600 hover:text-blue-800">
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/company/orders" className="text-blue-600 hover:text-blue-800">
          ← Back to Orders
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Order #{order.orderId.slice(-8)}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Delivery order details
            </p>
          </div>
          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Order ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.orderId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Service Level</dt>
              <dd className="mt-1 text-sm text-gray-900">{ServiceLevelLabels[order.serviceLevel]}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Planned Delivery Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.plannedDeliveryDate.toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.createdAt.toLocaleDateString()}</dd>
            </div>
            {order.notes && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Notes</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.notes}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {customer && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Customer Information</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{getCustomerName(customer)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{customer.email}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Delivery Address</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {customer.address.street} {customer.address.houseNumber}<br />
                  {customer.address.postalCode} {customer.address.city}<br />
                  {customer.address.country}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Delivery Items ({items.length})</h3>
        </div>
        <div className="border-t border-gray-200">
          {items.length === 0 ? (
            <div className="px-4 py-5 sm:px-6">
              <p className="text-sm text-gray-500">No items in this order.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {items.map((item, index) => (
                <li key={item.itemId} className="px-4 py-5 sm:px-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-sm font-medium text-gray-500 mr-3">#{index + 1}</span>
                        <h4 className="text-sm font-medium text-gray-900">{item.productName}</h4>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Manufacturer:</dt>
                          <dd className="text-gray-900">{item.manufacturer}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Model:</dt>
                          <dd className="text-gray-900">{item.model}</dd>
                        </div>
                        {item.serialNumber && (
                          <div>
                            <dt className="text-gray-500">Serial Number:</dt>
                            <dd className="text-gray-900">{item.serialNumber}</dd>
                          </div>
                        )}
                        {item.articleNumber && (
                          <div>
                            <dt className="text-gray-500">Article Number:</dt>
                            <dd className="text-gray-900">{item.articleNumber}</dd>
                          </div>
                        )}
                        <div>
                          <dt className="text-gray-500">Quantity:</dt>
                          <dd className="text-gray-900">{item.quantity}</dd>
                        </div>
                        {item.notes && (
                          <div className="col-span-2">
                            <dt className="text-gray-500">Notes:</dt>
                            <dd className="text-gray-900">{item.notes}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Tour Assignment</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <p className="text-sm text-gray-500">Not assigned to a tour yet.</p>
        </div>
      </div>
    </div>
  );
}
