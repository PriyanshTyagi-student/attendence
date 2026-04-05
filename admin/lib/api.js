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

export async function createAttendance(token, payload) {
  const data = await request('/attendance', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  return {
    id: data._id,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    employeeCategory: data.employeeCategory || 'staff',
    date: data.date,
    status: data.status,
    overtimeHours: data.overtimeHours || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function updateAttendance(token, id, payload) {
  const data = await request(`/attendance/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });

  return {
    id: data._id,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    employeeCategory: data.employeeCategory || 'staff',
    date: data.date,
    status: data.status,
    overtimeHours: data.overtimeHours || undefined,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function deleteAttendance(token, id) {
  return request(`/attendance/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function exportAttendance(token, date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await fetch(`${API_URL}/attendance/export${query}`, {
    method: 'GET',
    headers: {
      ...authHeaders(token),
    },
  });

  if (!response.ok) {
    let message = `Export failed with status ${response.status}`;
    try {
      const payload = await response.json();
      message = payload?.message || message;
    } catch {
      // ignore non-json body
    }
    throw new Error(message);
  }

  return response.blob();
}
