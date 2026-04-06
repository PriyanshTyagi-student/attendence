'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AttendanceTable from '@/components/AttendanceTable';
import ExportButton from '@/components/ExportButton';
import { getAttendance } from '@/lib/api';
import { AttendanceRecord } from '@/lib/types';

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'labor' | 'staff' | ''>('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (!storedUser || !storedToken) {
      router.push('/');
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== 'admin') {
      router.push('/');
      return;
    }

    setUser(parsedUser);
    void (async () => {
      try {
        const data = await getAttendance(storedToken, {
          category: selectedCategory || undefined,
        });
        setRecords(data);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
      }
    })();
  }, [router, selectedCategory]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userName={user.name} />

      <div className="flex">
        <Sidebar activeTab="attendance" />
        <main className="flex-1 p-6">
          <h2 className="text-white text-3xl font-bold mb-6">Attendance Records</h2>

          <div className="card-dark mb-6">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-gray-400 mr-3">Filter by Category:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as 'labor' | 'staff' | '')}
                  className="px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded hover:border-blue-400 transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="labor">Labor</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
                <ExportButton records={records} selectedCategory={selectedCategory} />
            </div>
          </div>

          <div className="card-dark">
            <AttendanceTable records={records} />
          </div>
        </main>
      </div>
    </div>
  );
}
