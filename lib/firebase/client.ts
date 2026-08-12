/**
 * Firebase Client SDK
 * Singleton instance for client-side Firebase operations
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, Functions } from 'firebase/functions';
import { firebaseConfig, validateFirebaseConfig } from './config';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

/**
 * Initialize Firebase client SDK
 * Safe to call multiple times - returns existing instance
 */
export function initializeFirebase(): FirebaseApp {
  if (!getApps().length) {
    validateFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west1');
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west1');
  }

  return app;
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase();
  }
  return auth;
}

/**
 * Get Firestore instance
 */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
    initializeFirebase();
  }
  return db;
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    initializeFirebase();
  }
  return storage;
}

/**
 * Get Firebase Functions instance (EU region)
 */
export function getFirebaseFunctions(): Functions {
  if (!functions) {
    initializeFirebase();
  }
  return functions;
}

// Initialize on import
if (typeof window !== 'undefined') {
  initializeFirebase();
}
