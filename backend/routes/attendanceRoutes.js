const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  markAttendance,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  exportAttendance,
} = require('../controllers/attendanceController');

const router = express.Router();

router.use(authMiddleware);

router.post('/mark', roleMiddleware('manager'), markAttendance);

router.get('/export', roleMiddleware('admin'), exportAttendance);
router.get('/', roleMiddleware('admin', 'manager'), getAttendance);
router.post('/', roleMiddleware('admin'), createAttendance);
router.put('/:id', roleMiddleware('admin'), updateAttendance);
router.delete('/:id', roleMiddleware('admin'), deleteAttendance);

module.exports = router;
