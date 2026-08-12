/**
 * Phase 1 Cloud Functions
 * Company and User Management
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Configure for EU region
const region = 'europe-west1';

const db = admin.firestore();
const auth = admin.auth();

enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPERVISOR = 'SUPERVISOR',
  DRIVER = 'DRIVER',
}

/**
 * Generate secure temporary password
 */
function generateTemporaryPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one of each type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill remaining
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Create audit log entry
 */
async function createAuditLog(
  actorId: string,
  actorCompanyId: string | null,
  action: string,
  targetType: 'company' | 'user',
  targetId: string,
  companyId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await db.collection('auditLogs').add({
    actorId,
    actorCompanyId,
    action,
    targetType,
    targetId,
    companyId: companyId || null,
    metadata: metadata || {},
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Create Company
 * Auth: SUPER_ADMIN only
 */
export const createCompany = functions.region(region).https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify SUPER_ADMIN role
  if (context.auth.token.role !== UserRole.SUPER_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only SUPER_ADMIN can create companies');
  }

  const { companyName, legalName, address, postalCode, city, country, phone, email } = data;

  // Validate required fields
  if (!companyName || !address || !postalCode || !city || !country || !phone || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Create company document
    const companyRef = db.collection('companies').doc();
    const companyData = {
      companyId: companyRef.id,
      companyName,
      legalName: legalName || null,
      address,
      postalCode,
      city,
      country,
      phone,
      email,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    };

    await companyRef.set(companyData);

    // Create audit log
    await createAuditLog(
      context.auth.uid,
      null,
      'COMPANY_CREATED',
      'company',
      companyRef.id,
      companyRef.id,
      { companyName }
    );

    return { companyId: companyRef.id };
  } catch (error) {
    functions.logger.error('Error creating company:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create company');
  }
});

/**
 * Create Company Admin
 * Auth: SUPER_ADMIN only
 */
export const createCompanyAdmin = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.SUPER_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only SUPER_ADMIN can create Company Admins');
  }

  const { companyId, email, firstName, lastName, phone } = data;

  if (!companyId || !email || !firstName || !lastName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const temporaryPassword = generateTemporaryPassword();

  try {
    // Verify company exists
    const companyDoc = await db.collection('companies').doc(companyId).get();
    if (!companyDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Company not found');
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: UserRole.COMPANY_ADMIN,
      companyId,
      active: true,
    });

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      companyId,
      role: UserRole.COMPANY_ADMIN,
      email,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone,
      active: true,
      forcePasswordChange: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    // Create audit log
    await createAuditLog(
      context.auth.uid,
      null,
      'COMPANY_ADMIN_CREATED',
      'user',
      userRecord.uid,
      companyId,
      { email, firstName, lastName }
    );

    return { userId: userRecord.uid, temporaryPassword };
  } catch (error) {
    functions.logger.error('Error creating Company Admin:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create Company Admin');
  }
});

/**
 * Create Driver
 * Auth: COMPANY_ADMIN only
 */
export const createDriver = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can create drivers');
  }

  const { username, firstName, lastName, phone } = data;

  if (!username || !firstName || !lastName || !phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Validate username format
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    throw new functions.https.HttpsError('invalid-argument', 'Username must be 3-20 characters (alphanumeric and underscore only)');
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company Admin must have a companyId');
  }

  try {
    // Check username uniqueness using transaction
    const usernameRef = db.collection('usernames').doc(username);
    
    const result = await db.runTransaction(async (transaction) => {
      const usernameDoc = await transaction.get(usernameRef);
      
      if (usernameDoc.exists) {
        throw new functions.https.HttpsError('already-exists', 'Username already taken');
      }

      // Generate temporary password
      const temporaryPassword = generateTemporaryPassword();

      // Create Firebase Auth user with internal email
      const internalEmail = `${username}@plantogo-driver.internal`;
      const userRecord = await auth.createUser({
        email: internalEmail,
        password: temporaryPassword,
        displayName: `${firstName} ${lastName}`,
      });

      // Set custom claims
      await auth.setCustomUserClaims(userRecord.uid, {
        role: UserRole.DRIVER,
        companyId,
        active: true,
      });

      // Reserve username
      transaction.set(usernameRef, {
        userId: userRecord.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Create user document
      transaction.set(db.collection('users').doc(userRecord.uid), {
        userId: userRecord.uid,
        companyId,
        role: UserRole.DRIVER,
        username,
        displayName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        phone,
        active: true,
        forcePasswordChange: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth!.uid,
      });

      return { userId: userRecord.uid, temporaryPassword };
    });

    // Create audit log (outside transaction)
    await createAuditLog(
      context.auth.uid,
      companyId,
      'DRIVER_CREATED',
      'user',
      result.userId,
      companyId,
      { username, firstName, lastName }
    );

    return {
      userId: result.userId,
      username,
      temporaryPassword: result.temporaryPassword,
    };
  } catch (error) {
    functions.logger.error('Error creating driver:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to create driver');
  }
});

/**
 * Create Supervisor
 * Auth: COMPANY_ADMIN only
 */
export const createSupervisor = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can create supervisors');
  }

  const { email, firstName, lastName, phone } = data;

  if (!email || !firstName || !lastName || !phone) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  const companyId = context.auth.token.companyId;
  if (!companyId) {
    throw new functions.https.HttpsError('failed-precondition', 'Company Admin must have a companyId');
  }

  try {
    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password: temporaryPassword,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: UserRole.SUPERVISOR,
      companyId,
      active: true,
    });

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      companyId,
      role: UserRole.SUPERVISOR,
      email,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone,
      active: true,
      forcePasswordChange: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth!.uid,
    });

    // Create audit log
    await createAuditLog(
      context.auth!.uid,
      companyId,
      'SUPERVISOR_CREATED',
      'user',
      userRecord.uid,
      companyId,
      { email, firstName, lastName }
    );

    return { userId: userRecord.uid, temporaryPassword };
  } catch (error) {
    functions.logger.error('Error creating supervisor:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create supervisor');
  }
});

/**
 * Update User Status (Activate/Deactivate)
 * Auth: SUPER_ADMIN or COMPANY_ADMIN (own company only)
 */
export const updateUserStatus = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, active } = data;

  if (!userId || typeof active !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', 'Missing or invalid fields');
  }

  try {
    // Get target user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;

    // Authorization check
    const isSuperAdmin = context.auth.token.role === UserRole.SUPER_ADMIN;
    const isCompanyAdmin = context.auth.token.role === UserRole.COMPANY_ADMIN &&
                          context.auth.token.companyId === userData.companyId;

    if (!isSuperAdmin && !isCompanyAdmin) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this user');
    }

    // Update user document
    await db.collection('users').doc(userId).update({
      active,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update custom claims
    await auth.setCustomUserClaims(userId, {
      role: userData.role,
      companyId: userData.companyId,
      active,
    });

    // Create audit log
    await createAuditLog(
      context.auth.uid,
      context.auth.token.companyId || null,
      active ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      'user',
      userId,
      userData.companyId,
      { previousStatus: userData.active }
    );

    return { success: true };
  } catch (error) {
    functions.logger.error('Error updating user status:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to update user status');
  }
});

/**
 * Reset Driver Password
 * Auth: COMPANY_ADMIN (own company only)
 */
export const resetDriverPassword = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  if (context.auth.token.role !== UserRole.COMPANY_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only COMPANY_ADMIN can reset driver passwords');
  }

  const { userId } = data;

  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing userId');
  }

  const companyId = context.auth.token.companyId;

  try {
    // Get driver user
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const userData = userDoc.data()!;

    // Verify user is a driver in the same company
    if (userData.role !== UserRole.DRIVER) {
      throw new functions.https.HttpsError('invalid-argument', 'User is not a driver');
    }

    if (userData.companyId !== companyId) {
      throw new functions.https.HttpsError('permission-denied', 'Driver belongs to a different company');
    }

    // Generate new temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Update Firebase Auth password
    await auth.updateUser(userId, {
      password: temporaryPassword,
    });

    // Update user document
    await db.collection('users').doc(userId).update({
      forcePasswordChange: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create audit log
    await createAuditLog(
      context.auth.uid,
      companyId,
      'DRIVER_PASSWORD_RESET',
      'user',
      userId,
      companyId,
      { username: userData.username }
    );

    return { temporaryPassword };
  } catch (error) {
    functions.logger.error('Error resetting driver password:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to reset driver password');
  }
});
