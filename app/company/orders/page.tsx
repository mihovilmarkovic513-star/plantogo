'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase/client';
import { DeliveryOrder, DeliveryOrderStatus, ServiceLevel, ServiceLevelLabels } from '@/lib/types/order';
import { Customer } from '@/lib/types/customer';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<(DeliveryOrder & { customerName: string; city: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', serviceLevel: '' });

  useEffect(() => {
    loadOrders();
  }, [user, filter]);

  async function loadOrders() {
    if (!user?.companyId) return;
    
    try {
      const db = getFirebaseFirestore();
      let q = query(
        collection(db, 'deliveryOrders'),
        where('companyId', '==', user.companyId),
        orderBy('plannedDeliveryDate', 'desc')
      );

      const snapshot = await getDocs(q);
      const ordersData = await Promise.all(
        snapshot.docs.map(async (orderDoc) => {
          const orderData = {
            ...orderDoc.data(),
            plannedDeliveryDate: orderDoc.data().plannedDeliveryDate?.toDate() || new Date(),
            createdAt: orderDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: orderDoc.data().updatedAt?.toDate() || new Date(),
          } as DeliveryOrder;

          const customerDoc = await getDoc(doc(db, 'customers', orderData.customerId));
          const customer = customerDoc.data() as Customer;
          const customerName = customer?.companyName || `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Unknown';
          const city = customer?.address?.city || 'N/A';

          return { ...orderData, customerName, city };
        })
      );

      let filtered = ordersData;
      
      if (filter.status) {
        filtered = filtered.filter(o => o.status === filter.status);
      }
      
      if (filter.serviceLevel) {
        filtered = filtered.filter(o => o.serviceLevel === filter.serviceLevel);
      }

      setOrders(filtered);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
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
    return <div className="text-center py-12">Loading orders...</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Delivery Orders</h1>
        <Link
          href="/company/orders/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Order
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
              <option value={DeliveryOrderStatus.DRAFT}>Draft</option>
              <option value={DeliveryOrderStatus.PLANNED}>Planned</option>
              <option value={DeliveryOrderStatus.CANCELLED}>Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Level</label>
            <select
              value={filter.serviceLevel}
              onChange={e => setFilter({ ...filter, serviceLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All</option>
              {Object.entries(ServiceLevelLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Planned Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No orders found. Create your first order to get started.
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order.orderId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.orderId.slice(-6)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ServiceLevelLabels[order.serviceLevel]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.plannedDeliveryDate.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/company/orders/${order.orderId}`} className="text-blue-600 hover:text-blue-900">
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
