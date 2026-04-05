export const API_URL = "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed with status ${response.status}`);
  }

  return payload;
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function loginUser(userId, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, password }),
  });
}

export async function getEmployees(token) {
  const data = await request('/employees', {
    headers: authHeaders(token),
  });

  return data.map((employee) => ({
    id: employee.employeeId,
    name: employee.name,
    department: employee.department,
    role: 'employee',
    category: employee.category || 'staff',
  }));
}

export async function getAttendance(token, query = {}) {
  const params = new URLSearchParams();
  if (query.date) params.set('date', query.date);
  if (query.employeeId) params.set('employeeId', query.employeeId);

  const qs = params.toString();
  const data = await request(`/attendance${qs ? `?${qs}` : ''}`, {
    headers: authHeaders(token),
  });

  return data.map((record) => ({
    id: record._id,
    employeeId: record.employeeId,
    employeeName: record.employeeName,
    employeeCategory: record.employeeCategory || 'staff',
    date: record.date,
    status: record.status,
    overtimeHours: record.overtimeHours || undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

export async function markAttendance(token, payload) {
  return request('/attendance/mark', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}
