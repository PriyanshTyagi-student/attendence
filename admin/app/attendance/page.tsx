'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AttendanceTable from '@/components/AttendanceTable';
import { getAttendance } from '@/lib/api';
import { AttendanceRecord } from '@/lib/types';

export default function AttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

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
        const data = await getAttendance(storedToken);
        setRecords(data);
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/');
      }
    })();
  }, [router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userName={user.name} />

      <div className="flex">
        <Sidebar activeTab="attendance" />
        <main className="flex-1 p-6">
          <h2 className="text-white text-3xl font-bold mb-6">Attendance Records</h2>

          <div className="card-dark">
            <AttendanceTable records={records} />
          </div>
        </main>
      </div>
    </div>
  );
}
