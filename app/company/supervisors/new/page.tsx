'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupervisor } from '@/lib/api/functions';
import { CreateSupervisorInput } from '@/lib/types/auth';

export default function NewSupervisorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [formData, setFormData] = useState<CreateSupervisorInput>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await createSupervisor(formData);
      setTempPassword(result.temporaryPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to create supervisor');
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
        <h2 className="text-2xl font-bold mb-6">Supervisor Created Successfully</h2>
        
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Supervisor Account Created
            </h3>
            <p className="text-sm text-green-700">
              The supervisor account has been created successfully. Please provide the following credentials.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <div className="mt-1">
                <code className="bg-gray-100 px-3 py-2 rounded text-lg">
                  {formData.email}
                </code>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Temporary Password</label>
              <div className="mt-1">
                <code className="bg-yellow-100 px-3 py-2 rounded text-lg font-mono border-2 border-yellow-400">
                  {tempPassword}
                </code>
              </div>
              <p className="mt-2 text-sm text-red-600 font-medium">
                ⚠️ Save this password now! It will not be shown again.
              </p>
            </div>
          </div>

          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => router.push('/company/supervisors')}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Done
            </button>
            <button
              onClick={() => {
                setTempPassword('');
                setFormData({
                  email: '',
                  firstName: '',
                  lastName: '',
                  phone: '',
                });
              }}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Add Another Supervisor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Add New Supervisor</h2>

      <div className="bg-white shadow sm:rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

            <div className="sm:col-span-2">
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
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
