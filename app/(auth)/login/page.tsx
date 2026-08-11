'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '@/lib/firebase/client';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Can be username or email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const db = getFirebaseFirestore();
      
      let emailToUse = identifier;
      
      // Check if identifier is a username (no @ symbol)
      if (!identifier.includes('@')) {
        // Look up username in usernames collection
        const usernameDoc = await getDoc(doc(db, 'usernames', identifier));
        
        if (!usernameDoc.exists()) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }
        
        const userId = usernameDoc.data().userId;
        
        // Get user document to find email
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }
        
        emailToUse = userDoc.data().email;
        
        if (!emailToUse) {
          setError('Invalid username or password');
          setLoading(false);
          return;
        }
      }
      
      // Sign in with email and password
      await signInWithEmailAndPassword(auth, emailToUse, password);
      
      // Get user's custom claims to determine redirect
      const user = auth.currentUser;
      if (user) {
        const idTokenResult = await user.getIdTokenResult();
        const role = idTokenResult.claims.role;
        
        // Redirect based on role
        if (role === 'SUPER_ADMIN') {
          router.push('/admin');
        } else if (role === 'COMPANY_ADMIN') {
          router.push('/company');
        } else if (role === 'SUPERVISOR') {
          router.push('/supervisor');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            PlanToGo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                id="identifier"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your username or email"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
