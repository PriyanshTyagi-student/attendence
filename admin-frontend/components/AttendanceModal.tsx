'use client';

import { useState, useEffect } from 'react';
import { AttendanceRecord, Employee } from '@/lib/types';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

interface AttendanceModalProps {
  isOpen: boolean;
  record?: AttendanceRecord;
  employees: Employee[];
  onClose: () => void;
  onSave: (record: AttendanceRecord) => void;
}

export default function AttendanceModal({
  isOpen,
  record,
  employees,
  onClose,
  onSave,
}: AttendanceModalProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'Present' as AttendanceStatus,
    overtimeHours: '',
  });

  useEffect(() => {
    if (record) {
      setFormData({
        employeeId: record.employeeId,
        date: record.date,
        status: record.status,
        overtimeHours: record.overtimeHours ? String(record.overtimeHours) : '',
      });
    } else {
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'Present' as AttendanceStatus,
        overtimeHours: '',
      });
    }
  }, [record, isOpen]);

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);
  const isLabor = selectedEmployee?.category === 'labor';
  const shouldShowOvertime = isLabor && formData.status === 'Present';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const employee = employees.find((e) => e.id === formData.employeeId);
    if (!employee) return;

    const parsedOvertime = Number.parseInt(formData.overtimeHours, 10);
    const overtimeHours = shouldShowOvertime && Number.isFinite(parsedOvertime) && parsedOvertime > 0
      ? parsedOvertime
      : undefined;

    const newRecord: AttendanceRecord = {
      id: record?.id || '',
      employeeId: formData.employeeId,
      employeeName: employee.name,
      employeeCategory: employee.category || 'staff',
      date: formData.date,
      status: formData.status as 'Present' | 'Absent' | 'Leave',
      overtimeHours,
      createdAt: record?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="card-dark w-full max-w-md">
        <h2 className="text-white text-xl font-bold mb-6">
          {record ? 'Edit Attendance' : 'Add Attendance Record'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Employee
            </label>
            <select
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
              required
            >
              <option value="">Select an employee</option>
              {employees
                .filter((emp) => emp.role === 'employee')
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.id})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
              required
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any, overtimeHours: e.target.value === 'Present' ? formData.overtimeHours : '' })}
              className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
            </select>
          </div>

          {shouldShowOvertime && (
            <div>
              <label className="block text-white text-sm font-medium mb-2">
                Overtime Hours
              </label>
              <input
                type="number"
                min={1}
                max={24}
                value={formData.overtimeHours}
                onChange={(e) => setFormData({ ...formData, overtimeHours: e.target.value })}
                className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                placeholder="Enter overtime hours"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333333] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 neon-button"
            >
              {record ? 'Update' : 'Add'} Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
