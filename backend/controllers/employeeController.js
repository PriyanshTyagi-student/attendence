const Employee = require('../models/Employee');

const VALID_CATEGORIES = ['staff', 'labor'];

function getCategoryPrefix(category) {
  return category === 'labor' ? 'LAB' : 'STF';
}

async function generateEmployeeId(category) {
  const prefix = getCategoryPrefix(category);
  const existingEmployees = await Employee.find(
    { employeeId: new RegExp(`^${prefix}\\d+$`) },
    { employeeId: 1, _id: 0 }
  ).lean();

  const highestNumber = existingEmployees.reduce((max, employee) => {
    const match = employee.employeeId.match(/(\d+)$/);
    const value = match ? Number.parseInt(match[1], 10) : 0;
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return `${prefix}${String(highestNumber + 1).padStart(3, '0')}`;
}

async function getEmployees(req, res) {
  try {
    const employees = await Employee.find().sort({ employeeId: 1 }).lean();
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
}

async function createEmployee(req, res) {
  try {
    const { name, department, category = 'staff' } = req.body;

    if (!name || !department) {
      return res.status(400).json({ message: 'name and department are required' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const employeeId = await generateEmployeeId(category);
    const employee = await Employee.create({
      name: name.trim(),
      department: department.trim(),
      category,
      employeeId,
    });

    return res.status(201).json(employee);
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: 'Employee ID already exists' });
    }

    return res.status(500).json({ message: 'Failed to create employee', error: error.message });
  }
}

async function updateEmployee(req, res) {
  try {
    const { id } = req.params;
    const { name, department, category } = req.body;

    const existing = await Employee.findOne({ employeeId: id });
    if (!existing) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (name !== undefined) existing.name = name.trim();
    if (department !== undefined) existing.department = department.trim();
    if (category !== undefined) existing.category = category;

    const updated = await existing.save();
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update employee', error: error.message });
  }
}

async function deleteEmployee(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Employee.findOneAndDelete({ employeeId: id });

    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete employee', error: error.message });
  }
}

module.exports = {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
