const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/payment.controller');

router.post('/webhooks/razorpay', paymentController.handleRazorpayWebhook);
router.post('/webhooks/stripe', paymentController.handleStripeWebhook);

router.use(requireAuth);

router.post('/bookings/:bookingId/razorpay/order', paymentController.createRazorpayOrder);
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);
router.post('/bookings/:bookingId/stripe/session', paymentController.createStripeCheckoutSession);
router.post('/bookings/:bookingId/wallet', paymentController.payWithWallet);
router.get('/bookings/:bookingId/status', paymentController.getPaymentStatus);
router.get('/bookings/:bookingId/invoice', paymentController.downloadInvoice);
router.post('/bookings/:bookingId/refund', paymentController.refundPayment);
router.post('/reconcile', paymentController.reconcilePayments);

module.exports = router;
