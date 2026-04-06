'use client';

import { AttendanceRecord } from '@/lib/types';
import { exportAttendance } from '@/lib/api';

interface ExportButtonProps {
  records: AttendanceRecord[];
  selectedDate?: string;
  selectedCategory?: 'labor' | 'staff' | '';
}

export default function ExportButton({
  records,
  selectedDate,
  selectedCategory,
}: ExportButtonProps) {
  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Unauthorized: please login again');
      }

      const blob = await exportAttendance(token, selectedDate, selectedCategory || undefined);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const categoryLabel = selectedCategory ? `_${selectedCategory}` : '';
      link.download = `attendance_export${categoryLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export attendance');
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={records.length === 0}
      className="neon-button disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Export to Excel
    </button>
  );
}
