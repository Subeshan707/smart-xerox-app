const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimit');
const customerController = require('../controllers/customer.controller');

// All customer routes require authentication
router.use(requireAuth);

// Shops
router.get('/shops', customerController.getShops);

// Slots
router.get('/slots', customerController.getSlots);

// Pricing
router.get('/pricing', customerController.getPricing);

// Bookings
router.post('/bookings', customerController.createBooking);
router.get('/bookings/:id', customerController.getBooking);
router.get('/bookings/:id/queue', customerController.getQueuePosition);
router.patch('/bookings/:id/cancel', customerController.cancelBooking);

// History
router.get('/history', customerController.getHistory);

// Profile
router.get('/profile', customerController.getProfile);
router.patch('/profile', customerController.updateProfile);

// File upload
router.post('/upload', uploadLimiter, upload.fields([
  { name: 'files', maxCount: 10 },
  { name: 'file', maxCount: 1 },
]), customerController.uploadFile);

module.exports = router;
