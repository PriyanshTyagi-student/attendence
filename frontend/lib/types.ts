export interface Employee {
  id: string;
  name: string;
  department: string;
  role: 'employee' | 'manager' | 'admin';
  category?: 'staff' | 'labor';
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCategory: 'staff' | 'labor';
  date: string;
  status: AttendanceStatus;
  overtimeHours?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  name: string;
  role: 'manager' | 'admin';
}

export interface SubmissionStatus {
  [date: string]: boolean; // true if locked
}
