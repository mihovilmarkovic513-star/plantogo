/**
 * Firebase Client Configuration
 * Used for client-side Firebase operations (web browser)
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Validate that all required Firebase config values are present
 * Uses direct static access for Next.js build-time optimization
 */
export function validateFirebaseConfig(): void {
  const missing: string[] = [];

  // Direct static access required for Next.js NEXT_PUBLIC_ variables
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    missing.push('NEXT_PUBLIC_FIREBASE_API_KEY');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
    missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
    missing.push('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  }
  if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
    missing.push('NEXT_PUBLIC_FIREBASE_APP_ID');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}`
    );
  }
}
