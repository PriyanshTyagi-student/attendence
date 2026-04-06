'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { createEmployee, deleteEmployee, getEmployees, updateEmployee } from '@/lib/api';
import { Employee } from '@/lib/types';

export default function EmployeesPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ userId: string; name: string; role: string } | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    category: 'staff' as 'staff' | 'labor',
  });

  const loadEmployees = async (token: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await getEmployees(token);
      setEmployees(data);
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

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
    void loadEmployees(storedToken);
  }, [router]);

  const resetForm = () => {
    setEditingEmployeeId(null);
    setFormData({
      name: '',
      department: '',
      category: 'staff',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) return;

    setSaving(true);
    setError('');

    try {
      if (editingEmployeeId) {
        await updateEmployee(token, editingEmployeeId, formData);
      } else {
        await createEmployee(token, formData);
      }

      await loadEmployees(token);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployeeId(employee.id);
    setFormData({
      name: employee.name,
      department: employee.department,
      category: employee.category || 'staff',
    });
    setError('');
  };

  const handleDelete = async (employeeId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Delete this employee?')) return;

    setSaving(true);
    setError('');

    try {
      await deleteEmployee(token, employeeId);
      await loadEmployees(token);
      if (editingEmployeeId === employeeId) {
        resetForm();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Navbar userName={user.name} />

      <div className="flex">
        <Sidebar activeTab="employees" />
        <main className="flex-1 p-6">
          <h2 className="text-white text-3xl font-bold mb-6">Employee Management</h2>

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="card-dark">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xl font-semibold">
                  {editingEmployeeId ? 'Edit Employee' : 'Add Employee'}
                </h3>
                {editingEmployeeId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'staff' | 'labor' })}
                    className="w-full bg-[#1a1a1a] border border-[#333333] text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  >
                    <option value="staff">Staff</option>
                    <option value="labor">Labor</option>
                  </select>
                </div>

                <div className="rounded-lg border border-[#333333] bg-black/20 p-3 text-sm text-gray-300">
                  Employee ID is assigned automatically as a unique STF or LAB code.
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={saving}
                  className="neon-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : editingEmployeeId ? 'Update Employee' : 'Create Employee'}
                </button>
              </form>
            </div>

            <div className="card-dark">
              <div className="overflow-x-auto">
                <table className="table-dark">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th>Department</th>
                      <th>Category</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          Loading employees...
                        </td>
                      </tr>
                    ) : employees.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-400">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      employees.map((employee) => (
                        <tr key={employee.id}>
                          <td>{employee.name}</td>
                          <td>{employee.id}</td>
                          <td>{employee.department}</td>
                          <td className="uppercase">{employee.category || 'staff'}</td>
                          <td className="space-x-3">
                            <button
                              type="button"
                              onClick={() => handleEdit(employee)}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(employee.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
