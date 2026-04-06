const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Employee = require('../models/Employee');

const adminSeedUser = {
  userId: process.env.ADMIN_USER_ID || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@erp.local',
  name: process.env.ADMIN_NAME || 'Admin User',
  password: process.env.ADMIN_PASSWORD || 'admin123',
  role: 'admin',
};

const managerSeedUser = {
  userId: process.env.MANAGER_USER_ID || 'manager1',
  email: process.env.MANAGER_EMAIL || 'manager1@erp.local',
  name: process.env.MANAGER_NAME || 'John Manager',
  password: process.env.MANAGER_PASSWORD || 'pass123',
  role: 'manager',
};

const defaultUsers = [
  adminSeedUser,
  managerSeedUser,
];

const defaultEmployees = [
  { name: 'John Smith', employeeId: 'EMP001', department: 'Engineering', category: 'staff' },
  { name: 'Sarah Johnson', employeeId: 'EMP002', department: 'Sales', category: 'staff' },
  { name: 'Mike Brown', employeeId: 'EMP003', department: 'Engineering', category: 'labor' },
  { name: 'Emily Davis', employeeId: 'EMP004', department: 'HR', category: 'staff' },
  { name: 'Robert Wilson', employeeId: 'EMP005', department: 'Finance', category: 'labor' },
  { name: 'Jessica Martinez', employeeId: 'EMP006', department: 'Sales', category: 'staff' },
  { name: 'David Lee', employeeId: 'EMP007', department: 'Engineering', category: 'labor' },
  { name: 'Amanda White', employeeId: 'EMP008', department: 'Marketing', category: 'staff' },
  { name: 'James Anderson', employeeId: 'EMP009', department: 'Engineering', category: 'labor' },
  { name: 'Lisa Taylor', employeeId: 'EMP010', department: 'HR', category: 'staff' },
];

async function seedUsers() {
  for (const user of defaultUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await User.updateOne(
      { userId: user.userId },
      {
        $setOnInsert: {
          ...user,
          password: hashedPassword,
        },
      },
      { upsert: true }
    );
  }
}

async function seedEmployees() {
  for (const employee of defaultEmployees) {
    const existing = await Employee.findOne({ employeeId: employee.employeeId });
    if (!existing) {
      await Employee.create(employee);
    }
  }
}

async function seedData() {
  await seedUsers();
  await seedEmployees();
  console.log('Seed completed (users and employees)');
}

module.exports = seedData;
