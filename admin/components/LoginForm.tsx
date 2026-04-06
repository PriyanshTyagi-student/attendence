'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api';

const adminDemoUser = process.env.NEXT_PUBLIC_ADMIN_DEMO_USER || 'admin';
const adminDemoPassword = process.env.NEXT_PUBLIC_ADMIN_DEMO_PASSWORD || 'admin123';

export default function LoginForm() {
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await loginUser(userId, password);
      if (data.user.role !== 'admin') {
        setError('Admin access only');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'user',
        JSON.stringify({
          userId: data.user.userId,
          name: data.user.name,
          role: data.user.role,
        })
      );

      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="card-dark w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">ASTRA ERP</h1>
          <p className="text-gray-400">Admin Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="userId" className="block text-white text-sm font-medium mb-2">
              User ID
            </label>
            <input
              id="userId"
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              placeholder="Enter your User ID"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button type="submit" disabled={loading} className="neon-button w-full disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#333333]">
          <p className="text-gray-400 text-sm text-center mb-2">Admin Demo Credentials:</p>
          <p className="text-xs text-gray-500 text-center">
            {adminDemoUser} / {adminDemoPassword}
          </p>
        </div>
      </div>
    </div>
  );
}
