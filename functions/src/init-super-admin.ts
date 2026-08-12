/**
 * Secure Super Admin Initialization
 * One-time setup for the first Super Admin account
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

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
 * Initialize First Super Admin
 * This function can only be called ONCE and requires a secret initialization key
 * 
 * SECURITY:
 * - Requires INIT_SECRET environment variable to be set
 * - Can only create Super Admin if no Super Admins exist
 * - Password is provided by caller (not hardcoded)
 * - Username is unique and reserved
 */
export const initializeSuperAdmin = functions.region(region).https.onCall(async (data, context) => {
  const { initSecret, username, password, email, firstName, lastName } = data;

  // Validate required fields
  if (!initSecret || !username || !password || !email || !firstName || !lastName) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields: initSecret, username, password, email, firstName, lastName'
    );
  }

  // Verify initialization secret
  const expectedSecret = process.env.INIT_SECRET;
  if (!expectedSecret) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'Initialization secret not configured. Set INIT_SECRET environment variable.'
    );
  }

  if (initSecret !== expectedSecret) {
    functions.logger.warn('Invalid initialization secret attempt');
    throw new functions.https.HttpsError('permission-denied', 'Invalid initialization secret');
  }

  try {
    // Check if any Super Admin already exists
    const existingSuperAdmins = await db.collection('users')
      .where('role', '==', UserRole.SUPER_ADMIN)
      .limit(1)
      .get();

    if (!existingSuperAdmins.empty) {
      throw new functions.https.HttpsError(
        'already-exists',
        'Super Admin already exists. Use existing Super Admin to create additional Super Admins.'
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username must be 3-20 characters (alphanumeric and underscore only)'
      );
    }

    // Check username uniqueness
    const usernameDoc = await db.collection('usernames').doc(username).get();
    if (usernameDoc.exists) {
      throw new functions.https.HttpsError('already-exists', 'Username already taken');
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: UserRole.SUPER_ADMIN,
      companyId: null,
      active: true,
    });

    // Reserve username
    await db.collection('usernames').doc(username).set({
      userId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      companyId: null,
      role: UserRole.SUPER_ADMIN,
      username,
      email,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone: '',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'SYSTEM_INIT',
    });

    // Create audit log
    await db.collection('auditLogs').add({
      actorId: 'SYSTEM_INIT',
      actorCompanyId: null,
      action: 'SUPER_ADMIN_INITIALIZED',
      targetType: 'user',
      targetId: userRecord.uid,
      companyId: null,
      metadata: {
        username,
        email,
        firstName,
        lastName,
        initialSetup: true,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Super Admin initialized: ${username} (${userRecord.uid})`);

    return {
      success: true,
      userId: userRecord.uid,
      message: 'Super Admin account created successfully. You can now log in with your username and password.',
    };
  } catch (error: any) {
    functions.logger.error('Error initializing Super Admin:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', `Failed to initialize Super Admin: ${error.message}`);
  }
});

/**
 * Create Additional Super Admin
 * Can only be called by existing Super Admin
 */
export const createSuperAdmin = functions.region(region).https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify caller is Super Admin
  if (context.auth.token.role !== UserRole.SUPER_ADMIN) {
    throw new functions.https.HttpsError('permission-denied', 'Only SUPER_ADMIN can create Super Admins');
  }

  const { username, password, email, firstName, lastName } = data;

  if (!username || !password || !email || !firstName || !lastName) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Username must be 3-20 characters (alphanumeric and underscore only)'
      );
    }

    // Check username uniqueness
    const usernameDoc = await db.collection('usernames').doc(username).get();
    if (usernameDoc.exists) {
      throw new functions.https.HttpsError('already-exists', 'Username already taken');
    }

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, {
      role: UserRole.SUPER_ADMIN,
      companyId: null,
      active: true,
    });

    // Reserve username
    await db.collection('usernames').doc(username).set({
      userId: userRecord.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create user document
    await db.collection('users').doc(userRecord.uid).set({
      userId: userRecord.uid,
      companyId: null,
      role: UserRole.SUPER_ADMIN,
      username,
      email,
      displayName: `${firstName} ${lastName}`,
      firstName,
      lastName,
      phone: '',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    // Create audit log
    await db.collection('auditLogs').add({
      actorId: context.auth.uid,
      actorCompanyId: null,
      action: 'SUPER_ADMIN_CREATED',
      targetType: 'user',
      targetId: userRecord.uid,
      companyId: null,
      metadata: {
        username,
        email,
        firstName,
        lastName,
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      userId: userRecord.uid,
    };
  } catch (error: any) {
    functions.logger.error('Error creating Super Admin:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', `Failed to create Super Admin: ${error.message}`);
  }
});
