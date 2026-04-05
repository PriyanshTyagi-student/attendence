'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { getEmployees } from '@/lib/api';
import { Employee } from '@/lib/types';

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

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
        const data = await getEmployees(storedToken);
        setEmployees(data);
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
        <Sidebar activeTab="employees" />
        <main className="flex-1 p-6">
          <h2 className="text-white text-3xl font-bold mb-6">Employee Management</h2>

          <div className="card-dark">
            <div className="overflow-x-auto">
              <table className="table-dark">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td>{employee.name}</td>
                      <td>{employee.id}</td>
                      <td>{employee.department}</td>
                      <td className="uppercase">{employee.category || 'staff'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
