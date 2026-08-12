/**
 * Phase 2A Cloud Functions
 * Customers & Delivery Orders
 */

import * as functions from 'firebase-functions';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const db = getFirestore();
const region = 'europe-west1';

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  DRIVER = 'DRIVER',
}

enum CustomerType {
  PRIVATE = 'PRIVATE',
  BUSINESS = 'BUSINESS',
}

enum DeliveryOrderStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Create Customer
 * Auth: COMPANY_ADMIN only
 */
export const createCustomer = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can create customers');
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company Admin must have a companyId');
  }

  const { customerType, firstName, lastName, companyName, contactPerson, phone, email, address, notes } = data;

  if (!customerType || !phone || !email || !address) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (customerType === CustomerType.PRIVATE && (!firstName || !lastName)) {
    throw new functions.https.HttpsError('invalid-argument', 'Private customers require firstName and lastName');
  }

  if (customerType === CustomerType.BUSINESS && !companyName) {
    throw new functions.https.HttpsError('invalid-argument', 'Business customers require companyName');
  }

  try {
    const customerRef = db.collection('customers').doc();
    
    await customerRef.set({
      customerId: customerRef.id,
      companyId,
      customerType,
      firstName: firstName || null,
      lastName: lastName || null,
      companyName: companyName || null,
      contactPerson: contactPerson || null,
      phone,
      email,
      address,
      notes: notes || null,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    return { customerId: customerRef.id };
  } catch (error) {
    functions.logger.error('Error creating customer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create customer');
  }
});

/**
 * Update Customer
 * Auth: COMPANY_ADMIN only
 */
export const updateCustomer = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can update customers');
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company Admin must have a companyId');
  }

  const { customerId, customerType, firstName, lastName, companyName, contactPerson, phone, email, address, notes } = data;

  if (!customerId) {
    throw new functions.https.HttpsError('invalid-argument', 'customerId is required');
  }

  try {
    const customerRef = db.collection('customers').doc(customerId);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Customer not found');
    }

    if (customerDoc.data()?.companyId !== companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot update customer from another company');
    }

    await customerRef.update({
      customerType,
      firstName: firstName || null,
      lastName: lastName || null,
      companyName: companyName || null,
      contactPerson: contactPerson || null,
      phone,
      email,
      address,
      notes: notes || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating customer:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update customer');
  }
});

/**
 * Update Customer Status (Activate/Deactivate)
 * Auth: COMPANY_ADMIN only
 */
export const updateCustomerStatus = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can update customer status');
  }

  const companyId = context.auth.token.companyId;
  const { customerId, active } = data;

  if (!customerId || typeof active !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const customerRef = db.collection('customers').doc(customerId);
    const customerDoc = await customerRef.get();

    if (!customerDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Customer not found');
    }

    if (customerDoc.data()?.companyId !== companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot update customer from another company');
    }

    await customerRef.update({
      active,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating customer status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update customer status');
  }
});

/**
 * Create Delivery Order (with inline customer creation)
 * Auth: COMPANY_ADMIN only
 */
export const createDeliveryOrder = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can create delivery orders');
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company Admin must have a companyId');
  }

  const { 
    customerType, customerFirstName, customerLastName, customerCompanyName, customerContactPerson,
    customerPhone, customerEmail, customerAddress, customerNotes,
    serviceLevel, plannedDeliveryDate, notes, items 
  } = data;

  if (!customerType || !customerPhone || !customerEmail || !customerAddress || !serviceLevel || !plannedDeliveryDate) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  if (customerType === CustomerType.PRIVATE && (!customerFirstName || !customerLastName)) {
    throw new functions.https.HttpsError('invalid-argument', 'Private customers require firstName and lastName');
  }

  if (customerType === CustomerType.BUSINESS && !customerCompanyName) {
    throw new functions.https.HttpsError('invalid-argument', 'Business customers require companyName');
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'At least one delivery item is required');
  }

  try {
    // Create customer inline
    const customerRef = db.collection('customers').doc();
    await customerRef.set({
      customerId: customerRef.id,
      companyId,
      customerType,
      firstName: customerFirstName || null,
      lastName: customerLastName || null,
      companyName: customerCompanyName || null,
      contactPerson: customerContactPerson || null,
      phone: customerPhone,
      email: customerEmail,
      address: customerAddress,
      notes: customerNotes || null,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    const orderRef = db.collection('deliveryOrders').doc();
    
    // Create order
    await orderRef.set({
      orderId: orderRef.id,
      companyId,
      customerId: customerRef.id,
      status: DeliveryOrderStatus.DRAFT,
      serviceLevel,
      plannedDeliveryDate: Timestamp.fromDate(new Date(plannedDeliveryDate)),
      notes: notes || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    // Create delivery items
    const batch = db.batch();
    items.forEach((item: any) => {
      const itemRef = orderRef.collection('items').doc();
      batch.set(itemRef, {
        itemId: itemRef.id,
        orderId: orderRef.id,
        companyId,
        manufacturer: item.manufacturer,
        model: item.model,
        productName: item.productName,
        serialNumber: item.serialNumber || null,
        articleNumber: item.articleNumber || null,
        quantity: item.quantity || 1,
        notes: item.notes || null,
      });
    });
    await batch.commit();

    return { orderId: orderRef.id };
  } catch (error) {
    functions.logger.error('Error creating delivery order:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create delivery order');
  }
});

/**
 * Update Delivery Order Status
 * Auth: COMPANY_ADMIN only
 */
export const updateDeliveryOrderStatus = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can update order status');
  }

  const companyId = context.auth.token.companyId;
  const { orderId, status } = data;

  if (!orderId || !status) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    const orderRef = db.collection('deliveryOrders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Order not found');
    }

    if (orderDoc.data()?.companyId !== companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Cannot update order from another company');
    }

    await orderRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating order status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update order status');
  }
});
