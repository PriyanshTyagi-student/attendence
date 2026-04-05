const Employee = require('../models/Employee');

async function getEmployees(req, res) {
  try {
    const employees = await Employee.find().sort({ employeeId: 1 }).lean();
    return res.json(employees);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch employees', error: error.message });
  }
}

module.exports = {
  getEmployees,
};
