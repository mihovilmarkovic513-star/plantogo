/**
 * PlanToGo Cloud Functions
 * Trusted server-side operations for authentication, authorization, and audit logging
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Phase 1: Company and User Management Functions
export {
  createCompany,
  createCompanyAdmin,
  createDriver,
  createSupervisor,
  updateUserStatus,
  resetDriverPassword,
} from './phase1-functions';

/**
 * User Roles
 */
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  DRIVER = 'DRIVER',
}

/**
 * Set custom claims when a user is created
 * This ensures role-based access control is enforced
 */
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Get user document from Firestore
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Set custom claims
      await admin.auth().setCustomUserClaims(user.uid, {
        role: userData?.role || UserRole.DRIVER,
        companyId: userData?.companyId || null,
        active: userData?.active !== false,
      });
      
      functions.logger.info(`Custom claims set for user ${user.uid}`, {
        role: userData?.role,
        companyId: userData?.companyId,
      });
    }
  } catch (error) {
    functions.logger.error('Error setting custom claims:', error);
  }
});

/**
 * Create a new user (Company Admin or Driver)
 * Callable function - requires authentication
 */
export const createUser = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  // Verify caller has permission to create users
  const callerRole = context.auth.token.role;
  if (callerRole !== UserRole.SUPER_ADMIN && callerRole !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { email, password, role, companyId, firstName, lastName, phone, employeeId, username } = data;

  // Validate required fields
  if (!email || !password || !role || !firstName || !lastName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Validate role permissions
  if (callerRole === UserRole.COMPANY_ADMIN) {
    // Company Admin can only create DRIVER or SUPERVISOR
    if (role !== UserRole.DRIVER && role !== UserRole.SUPERVISOR) {
      throw new functions.https.HttpsError('permission-denied', 'Can only create drivers or supervisors');
    }
    
    // Must be for their own company
    if (companyId !== context.auth.token.companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Can only create users for your company');
    }
  }

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: false,
      disabled: false,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
      companyId: companyId || null,
      active: true,
    });

    // Create Firestore user document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      role,
      companyId: companyId || null,
      firstName,
      lastName,
      phone: phone || '',
      employeeId: employeeId || '',
      username: username || '',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    // Create audit log
    await admin.firestore().collection('auditLogs').add({
      eventType: 'USER_CREATED',
      userId: context.auth.uid,
      userName: `${context.auth.token.email}`,
      userRole: callerRole,
      companyId: companyId || null,
      resourceType: 'USER',
      resourceId: userRecord.uid,
      action: 'CREATED',
      metadata: {
        newUserRole: role,
        newUserEmail: email,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User created: ${userRecord.uid}`, {
      role,
      companyId,
      createdBy: context.auth.uid,
    });

    return {
      success: true,
      uid: userRecord.uid,
      email,
      temporaryPassword: password, // Return to admin for communication to user
    };
  } catch (error: any) {
    functions.logger.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Update user role and custom claims
 * Callable function - requires Super Admin or Company Admin
 */
export const updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerRole = context.auth.token.role;
  if (callerRole !== UserRole.SUPER_ADMIN && callerRole !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permissions');
  }

  const { userId, role, active } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }

  try {
    // Get user document
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data();

    // Verify permissions
    if (callerRole === UserRole.COMPANY_ADMIN && userData?.companyId !== context.auth.token.companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Can only manage users in your company');
    }

    // Update custom claims
    const claims: any = {
      role: role || userData?.role,
      companyId: userData?.companyId,
      active: active !== undefined ? active : userData?.active,
    };

    await admin.auth().setCustomUserClaims(userId, claims);

    // Update Firestore document
    const updates: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (role) updates.role = role;
    if (active !== undefined) updates.active = active;

    await admin.firestore().collection('users').doc(userId).update(updates);

    // Create audit log
    await admin.firestore().collection('auditLogs').add({
      eventType: 'USER_ROLE_UPDATED',
      userId: context.auth.uid,
      userName: `${context.auth.token.email}`,
      userRole: callerRole,
      companyId: userData?.companyId || null,
      resourceType: 'USER',
      resourceId: userId,
      action: 'UPDATED',
      metadata: {
        oldRole: userData?.role,
        newRole: role,
        oldActive: userData?.active,
        newActive: active,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`User role updated: ${userId}`, { role, active });

    return { success: true };
  } catch (error: any) {
    functions.logger.error('Error updating user role:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Create audit log entry
 * Callable function - for critical events that must be logged server-side
 */
export const createAuditLog = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventType, resourceType, resourceId, action, metadata } = data;

  if (!eventType || !resourceType || !action) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    await admin.firestore().collection('auditLogs').add({
      eventType,
      userId: context.auth.uid,
      userName: context.auth.token.email || '',
      userRole: context.auth.token.role,
      companyId: context.auth.token.companyId || null,
      resourceType,
      resourceId: resourceId || null,
      action,
      metadata: metadata || {},
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    functions.logger.error('Error creating audit log:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Send notification when tour is published
 */
export const onTourPublished = functions.firestore
  .document('tours/{tourId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to PUBLISHED
    if (before.status !== 'PUBLISHED' && after.status === 'PUBLISHED') {
      const driverId = after.driverId;
      const tourId = context.params.tourId;

      try {
        // Create notification for driver
        await admin.firestore().collection('notifications').add({
          userId: driverId,
          companyId: after.companyId,
          type: 'TOUR_ASSIGNED',
          title: 'New Tour Assigned',
          message: `Tour ${after.tourNumber} has been assigned to you for ${new Date(after.date).toLocaleDateString()}`,
          data: {
            tourId,
            tourNumber: after.tourNumber,
            date: after.date,
          },
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        functions.logger.info(`Notification created for driver ${driverId} - Tour ${tourId}`);
      } catch (error) {
        functions.logger.error('Error creating notification:', error);
      }
    }
  });
