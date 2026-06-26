const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const operatorController = require('../controllers/operator.controller');

// All operator routes require auth
router.use(requireAuth);

// Middleware to verify shopOperator role
router.use((req, res, next) => {
  if (req.user.role !== 'shopOperator') {
    return res.status(403).json({ error: 'Operator access required' });
  }
  next();
});

// Dashboard
router.get('/dashboard', operatorController.getDashboard);

// Bookings
router.get('/bookings', operatorController.getAllBookings);
router.patch('/bookings/:id/status', operatorController.updateStatus);
router.get('/bookings/:id/file', operatorController.getSignedFileUrl);
router.get('/bookings/export', operatorController.exportCSV);

// Slots
router.get('/slots', operatorController.getSlots);
router.post('/slots', operatorController.createSlot);
router.patch('/slots/:id', operatorController.updateSlot);
router.delete('/slots/:id', operatorController.deleteSlot);

// Pricing
router.get('/pricing', operatorController.getPricing);
router.patch('/pricing', operatorController.updatePricing);

// Analytics
router.get('/analytics', operatorController.getAnalytics);

// Shop Profile
router.get('/shop', operatorController.getShopProfile);
router.patch('/shop', operatorController.updateShopProfile);

// Notifications
router.post('/notify', operatorController.broadcastNotification);

module.exports = router;