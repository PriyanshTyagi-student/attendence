'use client';

import { AttendanceRecord } from '@/lib/types';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showActions?: boolean;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (id: string) => void;
  isLocked?: boolean;
}

export default function AttendanceTable({
  records,
  showActions = false,
  onEdit,
  onDelete,
  isLocked = false,
}: AttendanceTableProps) {
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Present':
        return 'status-badge status-present';
      case 'Absent':
        return 'status-badge status-absent';
      case 'Leave':
        return 'status-badge status-leave';
      default:
        return 'status-badge bg-gray-600';
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="table-dark">
        <thead>
          <tr>
            <th>Employee Name</th>
            <th>Employee ID</th>
            <th>Category</th>
            <th>Date</th>
            <th>Status</th>
            <th>Overtime</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 7 : 6} className="text-center py-8 text-gray-400">
                No attendance records found
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id}>
                <td className="font-medium">{record.employeeName}</td>
                <td>{record.employeeId}</td>
                <td className="uppercase">{record.employeeCategory}</td>
                <td>{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                <td>
                  <span className={getStatusBadgeClass(record.status)}>
                    {record.status}
                  </span>
                </td>
                <td>
                  {record.employeeCategory === 'labor' && record.status === 'Present' && record.overtimeHours
                    ? `${record.overtimeHours}h`
                    : '-'}
                </td>
                {showActions && (
                  <td className="space-x-2">
                    <button
                      onClick={() => onEdit?.(record)}
                      disabled={isLocked}
                      className="text-blue-400 hover:text-blue-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete?.(record.id)}
                      disabled={isLocked}
                      className="text-red-400 hover:text-red-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
