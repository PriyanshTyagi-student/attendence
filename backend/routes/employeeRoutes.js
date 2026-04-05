const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { getEmployees } = require('../controllers/employeeController');

const router = express.Router();

router.use(authMiddleware);
router.get('/', roleMiddleware('admin', 'manager'), getEmployees);

module.exports = router;
