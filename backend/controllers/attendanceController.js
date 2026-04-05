const XLSX = require('xlsx');
const Attendance = require('../models/Attendance');
const Employee = require('../models/Employee');

const VALID_STATUS = ['Present', 'Absent', 'Leave'];

function mapStatusCode(status) {
  if (status === 'Present') return 'P';
  if (status === 'Absent') return 'A';
  if (status === 'Leave') return 'L';
  return '';
}

function formatDateHeader(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${day}-${month}-${year}`;
}

function normalizeDate(inputDate) {
  if (!inputDate) return null;
  const parsedDate = new Date(inputDate);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString().split('T')[0];
}

async function markAttendance(req, res) {
  try {
    const { date, records } = req.body;
    const normalizedDate = normalizeDate(date);

    if (!normalizedDate || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'date and records[] are required' });
    }

    const employees = await Employee.find({}, { employeeId: 1, category: 1, _id: 0 }).lean();
    const employeeIds = employees.map((emp) => emp.employeeId);
    const recordIds = records.map((item) => item.employeeId);

    const missingEmployees = employeeIds.filter((id) => !recordIds.includes(id));
    if (missingEmployees.length > 0) {
      return res.status(400).json({
        message: 'Attendance must be marked for all employees',
        missingEmployees,
      });
    }

    const existing = await Attendance.findOne({ date: normalizedDate });
    if (existing) {
      return res.status(409).json({ message: `Attendance already exists for ${normalizedDate}` });
    }

    const employeeCategoryMap = new Map(employees.map((emp) => [emp.employeeId, emp.category]));

    const documents = records.map((item) => {
      const status = item.status;
      if (!VALID_STATUS.includes(status)) {
        throw new Error(`Invalid status for employee ${item.employeeId}`);
      }

      const isLabor = employeeCategoryMap.get(item.employeeId) === 'labor';
      const overtimeHours = isLabor && status === 'Present' && Number.isFinite(Number(item.overtimeHours))
        ? Math.max(0, Number(item.overtimeHours))
        : 0;

      return {
        employeeId: item.employeeId,
        date: normalizedDate,
        status,
        overtimeHours,
        markedBy: req.user.userId,
      };
    });

    await Attendance.insertMany(documents, { ordered: true });
    return res.status(201).json({ message: 'Attendance marked successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to mark attendance', error: error.message });
  }
}

async function getAttendance(req, res) {
  try {
    const { date, employeeId } = req.query;
    const filter = {};

    if (date) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        return res.status(400).json({ message: 'Invalid date query format' });
      }
      filter.date = normalizedDate;
    }

    if (employeeId) {
      filter.employeeId = employeeId;
    }

    const attendance = await Attendance.find(filter).sort({ date: -1, employeeId: 1 }).lean();
    const employeeIds = [...new Set(attendance.map((item) => item.employeeId))];
    const employees = await Employee.find(
      { employeeId: { $in: employeeIds } },
      { employeeId: 1, name: 1, category: 1, _id: 0 }
    ).lean();
    const employeeMap = new Map(employees.map((emp) => [emp.employeeId, emp]));

    const mapped = attendance.map((item) => {
      const employee = employeeMap.get(item.employeeId);

      return {
        ...item,
        employeeName: employee?.name || item.employeeId,
        employeeCategory: employee?.category || 'staff',
      };
    });

    return res.json(mapped);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch attendance', error: error.message });
  }
}

async function createAttendance(req, res) {
  try {
    const { employeeId, date, status, overtimeHours } = req.body;
    const normalizedDate = normalizeDate(date);

    if (!employeeId || !normalizedDate || !VALID_STATUS.includes(status)) {
      return res.status(400).json({ message: 'employeeId, date and valid status are required' });
    }

    const employee = await Employee.findOne({ employeeId }).lean();
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const isLabor = employee.category === 'labor';
    const attendance = await Attendance.create({
      employeeId,
      date: normalizedDate,
      status,
      overtimeHours: isLabor && status === 'Present' ? Number(overtimeHours) || 0 : 0,
      markedBy: req.user.userId,
    });

    return res.status(201).json(attendance);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already exists for employee/date' });
    }

    return res.status(500).json({ message: 'Failed to create attendance', error: error.message });
  }
}

async function updateAttendance(req, res) {
  try {
    const { id } = req.params;
    const payload = { ...req.body };

    if (payload.status && !VALID_STATUS.includes(payload.status)) {
      return res.status(400).json({ message: 'Invalid attendance status' });
    }

    if (payload.date) {
      const normalizedDate = normalizeDate(payload.date);
      if (!normalizedDate) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      payload.date = normalizedDate;
    }

    const existing = await Attendance.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (payload.employeeId || payload.status || payload.overtimeHours !== undefined) {
      const targetEmployeeId = payload.employeeId || existing.employeeId;
      const employee = await Employee.findOne({ employeeId: targetEmployeeId }).lean();
      const targetStatus = payload.status || existing.status;
      const isLabor = employee?.category === 'labor';
      payload.overtimeHours = isLabor && targetStatus === 'Present' ? Number(payload.overtimeHours ?? existing.overtimeHours ?? 0) : 0;
    }

    payload.markedBy = req.user.userId;

    const updated = await Attendance.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    return res.json(updated);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already exists for employee/date' });
    }

    return res.status(500).json({ message: 'Failed to update attendance', error: error.message });
  }
}

async function deleteAttendance(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Attendance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    return res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete attendance', error: error.message });
  }
}

async function exportAttendance(req, res) {
  try {
    const { date } = req.query;
    const filter = {};

    if (date) {
      const normalizedDate = normalizeDate(date);
      if (!normalizedDate) {
        return res.status(400).json({ message: 'Invalid date query format' });
      }
      filter.date = normalizedDate;
    }

    const records = await Attendance.find(filter).sort({ date: 1, employeeId: 1 }).lean();

    const employeeIds = [...new Set(records.map((r) => r.employeeId))];
    const employees = await Employee.find({ employeeId: { $in: employeeIds } }, { employeeId: 1, name: 1, category: 1, _id: 0 }).lean();
    const employeeMap = new Map(employees.map((emp) => [emp.employeeId, emp]));

    const uniqueDates = [...new Set(records.map((record) => record.date))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    const groupedByEmployee = new Map();
    records.forEach((record) => {
      if (!groupedByEmployee.has(record.employeeId)) {
        const employee = employeeMap.get(record.employeeId);
        groupedByEmployee.set(record.employeeId, {
          employeeId: record.employeeId,
          employeeName: employee?.name || record.employeeId,
          category: (employee?.category || 'staff').toUpperCase(),
          byDate: new Map(),
        });
      }

      groupedByEmployee.get(record.employeeId).byDate.set(record.date, record);
    });

    const topHeader = ['Employee ID', 'Employee Name', 'Category'];
    const subHeader = ['', '', ''];

    uniqueDates.forEach((date) => {
      topHeader.push(formatDateHeader(date));
      topHeader.push('');
      subHeader.push('STATUS');
      subHeader.push('OVERTIME');
    });

    const dataRows = Array.from(groupedByEmployee.values()).map((employee) => {
      const row = [employee.employeeId, employee.employeeName, employee.category];

      uniqueDates.forEach((date) => {
        const entry = employee.byDate.get(date);
        const status = entry ? mapStatusCode(entry.status) : '';
        const overtime =
          entry &&
          employee.category === 'LABOR' &&
          entry.status === 'Present' &&
          Number(entry.overtimeHours) > 0
            ? Number(entry.overtimeHours)
            : '';

        row.push(status);
        row.push(overtime);
      });

      return row;
    });

    const worksheetData = [topHeader, subHeader, ...dataRows];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Merge each date header cell across its STATUS/OVERTIME columns.
    worksheet['!merges'] = uniqueDates.map((_, index) => {
      const startCol = 3 + index * 2;
      return {
        s: { r: 0, c: startCol },
        e: { r: 0, c: startCol + 1 },
      };
    });

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename=attendance_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    return res.send(buffer);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to export attendance', error: error.message });
  }
}

module.exports = {
  markAttendance,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
};
