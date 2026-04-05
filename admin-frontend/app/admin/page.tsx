'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AttendanceTable from '@/components/AttendanceTable';
import AttendanceModal from '@/components/AttendanceModal';
import ExportButton from '@/components/ExportButton';
import { createAttendance, deleteAttendance, getAttendance, getEmployees, updateAttendance } from '@/lib/api';
import { AttendanceRecord, Employee } from '@/lib/types';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [token, setToken] = useState<string>('');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | undefined>();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'admin') {
        router.push('/');
        return;
      }
      setUser(parsedUser);
      setToken(storedToken);
      void loadData(storedToken);
    } else {
      router.push('/');
    }
  }, [router]);

  const loadData = async (authToken: string) => {
    try {
      const [attendance, employeeList] = await Promise.all([
        getAttendance(authToken),
        getEmployees(authToken),
      ]);
      setRecords(attendance);
      setEmployees(employeeList);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    }
  };

  const filteredRecords = records.filter((record) => {
    const date = new Date(record.date);
    return date.getMonth() + 1 === selectedMonth && date.getFullYear() === selectedYear;
  });

  const handleSaveRecord = async (record: AttendanceRecord) => {
    if (!token) return;

    try {
      if (record.id) {
        await updateAttendance(token, record.id, {
          employeeId: record.employeeId,
          date: record.date,
          status: record.status,
          overtimeHours: record.overtimeHours || 0,
        });
      } else {
        await createAttendance(token, {
          employeeId: record.employeeId,
          date: record.date,
          status: record.status,
          overtimeHours: record.overtimeHours || 0,
        });
      }

      await loadData(token);
      setIsModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save attendance record');
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!token) return;
    if (!confirm('Are you sure you want to delete this record?')) return;

    try {
      await deleteAttendance(token, id);
      await loadData(token);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete attendance record');
    }
  };

  if (!user) return null;

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userName={user.name} />

      <div className="flex">
        <Sidebar activeTab="dashboard" />

        <main className="flex-1 p-6">
          <h2 className="text-white text-3xl font-bold mb-6">Admin Dashboard</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="card-dark">
              <p className="text-gray-400 text-sm mb-2">Total Records</p>
              <p className="text-white text-3xl font-bold">{filteredRecords.length}</p>
            </div>
            <div className="card-dark">
              <p className="text-gray-400 text-sm mb-2">Present</p>
              <p className="text-green-400 text-3xl font-bold">
                {filteredRecords.filter((r) => r.status === 'Present').length}
              </p>
            </div>
            <div className="card-dark">
              <p className="text-gray-400 text-sm mb-2">Absent</p>
              <p className="text-red-400 text-3xl font-bold">
                {filteredRecords.filter((r) => r.status === 'Absent').length}
              </p>
            </div>
          </div>

          <div className="card-dark mb-6">
            <div className="flex items-end gap-4 mb-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number.parseInt(e.target.value, 10))}
                  className="bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index + 1}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number.parseInt(e.target.value, 10))}
                  className="bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => { setSelectedRecord(undefined); setIsModalOpen(true); }} className="neon-button">
                + Add Record
              </button>

              <ExportButton records={filteredRecords} />
            </div>

            <AttendanceTable
              records={filteredRecords}
              showActions={true}
              onEdit={(record) => { setSelectedRecord(record); setIsModalOpen(true); }}
              onDelete={handleDeleteRecord}
            />
          </div>
        </main>
      </div>

      <AttendanceModal
        isOpen={isModalOpen}
        record={selectedRecord}
        employees={employees}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveRecord}
      />
    </div>
  );
}
