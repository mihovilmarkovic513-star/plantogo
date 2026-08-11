'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDriver } from '@/lib/api/functions';
import { CreateDriverInput } from '@/lib/types/auth';

export default function NewDriverPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [formData, setFormData] = useState<CreateDriverInput>({
    username: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createDriver(formData);
      setTempPassword(result.temporaryPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to create driver');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (tempPassword) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Driver Created Successfully</h2>
        
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Driver Account Created
            </h3>
            <p className="text-sm text-green-700">
              The driver account has been created successfully. Please provide the following credentials to the driver.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1 flex items-center">
                <code className="bg-gray-100 px-3 py-2 rounded text-lg font-mono">
                  {formData.username}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
              <div className="mt-1 flex items-center">
                <code className="bg-yellow-100 px-3 py-2 rounded text-lg font-mono border-2 border-yellow-400">
                  {tempPassword}
                </code>
              </div>
              <p className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Save this password now! It will not be shown again.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Important:</strong> The driver will be required to change this password on first login.
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => router.push('/company/drivers')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Done
            </button>
            <button
              onClick={() => {
                setTempPassword('');
                setFormData({
                  username: '',
                  firstName: '',
                  lastName: '',
                  phone: '',
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Add Another Driver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Add New Driver</h2>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                type="text"
                name="username"
                id="username"
                required
                pattern="[a-zA-Z0-9_]{3,20}"
                title="3-20 characters, letters, numbers, and underscores only"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., john_driver"
              />
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters, numbers, and underscores only
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                type="tel"
                name="phone"
                id="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="+49..."
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                id="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                id="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> A temporary password will be generated and shown once. 
              The driver will be required to change it on first login.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
