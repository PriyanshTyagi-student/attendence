'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import AttendanceTable from '@/components/AttendanceTable';
import { getAttendance, getEmployees, markAttendance } from '@/lib/api';
import { AttendanceRecord, Employee, SubmissionStatus } from '@/lib/types';

interface AttendanceEntry {
  status: 'Present' | 'Absent' | 'Leave';
  overtimeHours?: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [token, setToken] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceEntry>>({});
  const [submissionStatus, setSubmissionStatus] = useState<SubmissionStatus>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role === 'manager' && storedToken) {
        setUser(parsedUser);
        setToken(storedToken);
        void initialize(storedToken);
      } else {
        router.push('/');
      }
    } else {
      router.push('/');
    }
  }, [router]);

  const initialize = async (authToken: string) => {
    try {
      setLoading(true);
      const employeeList = await getEmployees(authToken);
      setEmployees(employeeList);
      await loadAttendanceData(authToken, selectedDate, employeeList);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async (authToken: string, date: string, employeeList: Employee[] = employees) => {
    const data: Record<string, AttendanceEntry> = {};
    employeeList.forEach((emp) => {
      data[emp.id] = {
        status: 'Present',
      };
    });

    try {
      const records: AttendanceRecord[] = await getAttendance(authToken, { date });

      records.forEach((record) => {
        data[record.employeeId] = {
          status: record.status,
          overtimeHours: record.overtimeHours,
        };
      });

      setSubmissionStatus((prev) => ({
        ...prev,
        [date]: records.length > 0,
      }));
    } catch {
      setSubmissionStatus((prev) => ({
        ...prev,
        [date]: false,
      }));
    }

    setAttendanceData(data);
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    if (token) {
      await loadAttendanceData(token, newDate);
    }
  };

  const handleStatusChange = (employeeId: string, status: 'Present' | 'Absent' | 'Leave') => {
    if (submissionStatus[selectedDate]) return; // Don't allow changes if locked
    setAttendanceData((prev) => ({
      ...prev,
      [employeeId]: {
        status,
        overtimeHours: status === 'Present' ? prev[employeeId]?.overtimeHours : undefined,
      },
    }));
  };

  const handleOvertimeChange = (employeeId: string, overtimeValue: string) => {
    if (submissionStatus[selectedDate]) return;
    const parsed = Number.parseInt(overtimeValue, 10);

    setAttendanceData((prev) => ({
      ...prev,
      [employeeId]: {
        status: prev[employeeId]?.status || 'Present',
        overtimeHours: Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const payload = {
        date: selectedDate,
        records: employees.map((emp) => ({
          employeeId: emp.id,
          status: attendanceData[emp.id]?.status || 'Present',
          overtimeHours:
            emp.category === 'labor' && attendanceData[emp.id]?.status === 'Present'
              ? attendanceData[emp.id]?.overtimeHours || 0
              : 0,
        })),
      };

      await markAttendance(token, payload);

      setSubmissionStatus((prev) => ({
        ...prev,
        [selectedDate]: true,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit attendance';
      if (message.includes('already exists')) {
        setSubmissionStatus((prev) => ({
          ...prev,
          [selectedDate]: true,
        }));
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  const isLocked = submissionStatus[selectedDate] || false;
  const activeEmployees = employees;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userName={user.name} />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-white text-3xl font-bold mb-4">Attendance Management</h2>

          <div className="card-dark mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  disabled={isLocked}
                  className="bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {isLocked && (
                <div className="text-red-500 font-semibold text-center">
                  <p className="text-sm">Attendance Locked</p>
                  <p className="text-xs text-gray-400">for {selectedDate}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <AttendanceTable
                records={activeEmployees.map((emp) => ({
                  id: `${emp.id}-${selectedDate}`,
                  employeeId: emp.id,
                  employeeName: emp.name,
                  employeeCategory: emp.category || 'staff',
                  date: selectedDate,
                  status: attendanceData[emp.id]?.status || 'Present',
                  overtimeHours:
                    (emp.category === 'labor' && attendanceData[emp.id]?.status === 'Present')
                      ? attendanceData[emp.id]?.overtimeHours
                      : undefined,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }))}
                showActions={false}
              />
            </div>

            <div className="space-y-4">
              {!isLocked && (
                <div className="grid grid-cols-1 gap-4">
                  {activeEmployees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between bg-[#1a1a1a] p-4 rounded-lg border border-[#333333]">
                      <div>
                        <p className="text-white font-medium">{emp.name}</p>
                        <p className="text-gray-400 text-sm">{emp.id} | {(emp.category || 'staff').toUpperCase()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {['Present', 'Absent', 'Leave'].map((status) => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${emp.id}`}
                              value={status}
                              checked={attendanceData[emp.id]?.status === status}
                              onChange={(e) => handleStatusChange(emp.id, e.target.value as 'Present' | 'Absent' | 'Leave')}
                              className="w-4 h-4"
                              disabled={isLocked}
                            />
                            <span className="text-white text-sm">{status}</span>
                          </label>
                        ))}
                        {emp.category === 'labor' && attendanceData[emp.id]?.status === 'Present' && (
                          <input
                            type="number"
                            min={1}
                            max={24}
                            value={attendanceData[emp.id]?.overtimeHours ? String(attendanceData[emp.id]?.overtimeHours) : ''}
                            onChange={(e) => handleOvertimeChange(emp.id, e.target.value)}
                            placeholder="OT"
                            className="w-20 bg-[#0f0f0f] border border-[#333333] text-white px-2 py-1 rounded-lg focus:outline-none focus:border-red-600"
                            disabled={isLocked}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isLocked && (
                <div className="bg-[#1a1a1a] border border-[#333333] p-4 rounded-lg">
                  <p className="text-gray-400 text-center">
                    Attendance for {selectedDate} has been submitted and locked.
                  </p>
                </div>
              )}

              {!isLocked && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="neon-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit Attendance'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
