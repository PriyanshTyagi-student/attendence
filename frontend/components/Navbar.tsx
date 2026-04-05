'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  userName: string;
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter();
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setDateTime(`${dateStr} | ${timeStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/');
  };

  return (
    <nav className="bg-[#1a1a1a] border-b border-[#333333] px-6 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-white font-bold text-lg">ASTRA ERP</h1>
          <p className="text-gray-400 text-sm">Welcome, {userName}</p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-white text-sm font-mono">{dateTime || 'Loading...'}</p>
          </div>
          <button onClick={handleLogout} className="neon-button text-sm py-1 px-4">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
