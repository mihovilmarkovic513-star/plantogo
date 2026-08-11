/**
 * Firebase Admin SDK
 * Server-side only - for privileged operations
 * Used in API routes and server components
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

/**
 * Initialize Firebase Admin SDK
 * Only call on server-side
 */
export function initializeFirebaseAdmin(): App {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin SDK cannot be used on client-side');
  }

  if (!getApps().length) {
    // For now, use application default credentials or service account
    // In production, use service account key from environment variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'plantogo-1e015';
    
    // Check if we have service account credentials
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;

    if (privateKey && clientEmail) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    } else {
      // Use application default credentials (for development)
      adminApp = initializeApp({
        projectId,
        storageBucket: `${projectId}.firebasestorage.app`,
      });
    }

    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  } else {
    adminApp = getApps()[0];
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
    adminStorage = getStorage(adminApp);
  }

  return adminApp;
}

/**
 * Get Firebase Admin Auth instance
 */
export function getAdminAuth(): Auth {
  if (!adminAuth) {
    initializeFirebaseAdmin();
  }
  return adminAuth;
}

/**
 * Get Firebase Admin Firestore instance
 */
export function getAdminFirestore(): Firestore {
  if (!adminDb) {
    initializeFirebaseAdmin();
  }
  return adminDb;
}

/**
 * Get Firebase Admin Storage instance
 */
export function getAdminStorage(): Storage {
  if (!adminStorage) {
    initializeFirebaseAdmin();
  }
  return adminStorage;
}
