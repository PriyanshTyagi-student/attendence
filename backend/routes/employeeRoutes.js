const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
	getEmployees,
	createEmployee,
	updateEmployee,
	deleteEmployee,
} = require('../controllers/employeeController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', roleMiddleware('admin', 'manager'), getEmployees);
router.post('/', roleMiddleware('admin'), createEmployee);
router.put('/:id', roleMiddleware('admin'), updateEmployee);
router.delete('/:id', roleMiddleware('admin'), deleteEmployee);

module.exports = router;
