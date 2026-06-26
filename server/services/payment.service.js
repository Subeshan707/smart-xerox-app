const crypto = require('crypto');
const Razorpay = require('razorpay');
const Stripe = require('stripe');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { emitPaymentUpdated } = require('../socket/socket');

let razorpayClient = null;
let stripeClient = null;

const isConfiguredSecret = (value) =>
  Boolean(value && value.trim() && value.trim() !== '...');

const getRazorpayClient = () => {
  if (!isConfiguredSecret(process.env.RAZORPAY_KEY_ID) || !isConfiguredSecret(process.env.RAZORPAY_KEY_SECRET)) {
    throw new Error('Razorpay is not configured');
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
};

const getStripeClient = () => {
  if (!isConfiguredSecret(process.env.STRIPE_SECRET_KEY)) {
    throw new Error('Stripe is not configured');
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
};

const getClientUrl = (req) =>
  process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';

const toRupees = (paise) => `Rs. ${((paise || 0) / 100).toFixed(2)}`;

const buildInvoiceNumber = (booking) => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `INV-${y}${m}${d}-${booking.tokenNumber}-${String(booking._id).slice(-6).toUpperCase()}`;
};

const issueInvoice = async (booking, payment) => {
  if (!payment.invoiceNumber) {
    payment.invoiceNumber = booking.invoiceNumber || buildInvoiceNumber(booking);
    payment.invoiceIssuedAt = new Date();
  }

  booking.invoiceNumber = payment.invoiceNumber;
  booking.invoiceIssuedAt = payment.invoiceIssuedAt || new Date();
  await Promise.all([booking.save(), payment.save()]);

  return payment.invoiceNumber;
};

const syncBookingPayment = async (booking, payment) => {
  booking.paymentProvider = payment.provider;
  booking.paymentId = payment.providerPaymentId || payment._id.toString();
  booking.paymentOrderId = payment.providerOrderId;
  booking.paymentSessionId = payment.providerSessionId;
  booking.paymentIntentId = payment.providerPaymentIntentId;
  booking.amountRefunded = payment.amountRefunded || 0;

  if (payment.status === 'paid') {
    booking.paymentStatus = 'paid';
    booking.paidAt = booking.paidAt || new Date();
  } else if (payment.status === 'failed') {
    booking.paymentStatus = 'failed';
  } else if (payment.status === 'refund_pending') {
    booking.paymentStatus = 'refund_pending';
  } else if (payment.status === 'partially_refunded') {
    booking.paymentStatus = 'partially_refunded';
  } else if (payment.status === 'refunded') {
    booking.paymentStatus = 'refunded';
    booking.refundedAt = booking.refundedAt || new Date();
  }

  await booking.save();

  try {
    emitPaymentUpdated(
      booking.customerId.toString(),
      booking.shopId.toString(),
      booking._id.toString(),
      {
        paymentStatus: booking.paymentStatus,
        paymentProvider: booking.paymentProvider,
        paymentId: booking.paymentId,
        invoiceNumber: booking.invoiceNumber,
        invoiceIssuedAt: booking.invoiceIssuedAt,
        paidAt: booking.paidAt,
        refundedAt: booking.refundedAt,
        amountRefunded: booking.amountRefunded,
        message: `Payment status updated to ${booking.paymentStatus}`,
      }
    );
  } catch { /* Socket might not be initialized */ }
};

const markPaymentPaid = async (payment, gatewayResponse = {}) => {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) throw new Error('Booking not found for payment');

  payment.status = 'paid';
  payment.providerPaymentId = gatewayResponse.id || payment.providerPaymentId;
  payment.providerPaymentIntentId = gatewayResponse.payment_intent || gatewayResponse.paymentIntentId || payment.providerPaymentIntentId;
  payment.gatewayResponse = gatewayResponse;
  await payment.save();
  await issueInvoice(booking, payment);
  await syncBookingPayment(booking, payment);

  return { booking, payment };
};

const markPaymentFailed = async (payment, reason, gatewayResponse = {}) => {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) throw new Error('Booking not found for payment');

  payment.status = 'failed';
  payment.failureReason = reason || 'Payment failed';
  payment.gatewayResponse = gatewayResponse;
  await payment.save();
  await syncBookingPayment(booking, payment);

  return { booking, payment };
};

const applyRefundState = async (payment, refundRecord = {}) => {
  const booking = await Booking.findById(payment.bookingId);
  if (!booking) throw new Error('Booking not found for payment');

  const processedRefunds = payment.refunds.filter((refund) => refund.status === 'processed');
  payment.amountRefunded = processedRefunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);

  if (payment.amountRefunded >= payment.amount) {
    payment.status = 'refunded';
  } else if (payment.amountRefunded > 0) {
    payment.status = 'partially_refunded';
  } else if (refundRecord.status === 'pending') {
    payment.status = 'refund_pending';
  }

  await payment.save();
  await syncBookingPayment(booking, payment);

  return { booking, payment };
};

const verifyRazorpayCheckoutSignature = ({ orderId, paymentId, signature }) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const receivedSignature = Buffer.from(signature || '');
  const expected = Buffer.from(expectedSignature);
  return receivedSignature.length === expected.length
    && crypto.timingSafeEqual(expected, receivedSignature);
};

const verifyRazorpayWebhookSignature = (rawBody, signature) => {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Razorpay webhook secret is not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const receivedSignature = Buffer.from(signature || '');
  const expected = Buffer.from(expectedSignature);
  return receivedSignature.length === expected.length
    && crypto.timingSafeEqual(expected, receivedSignature);
};

const generateInvoicePdf = async (booking, payment) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const width = page.getWidth();
  let y = 780;

  const drawText = (text, x, size = 11, font = regular, color = rgb(0.1, 0.1, 0.1)) => {
    page.drawText(String(text || ''), { x, y, size, font, color });
    y -= size + 8;
  };

  page.drawRectangle({ x: 0, y: 0, width, height: 841.89, color: rgb(0.98, 0.99, 1) });
  page.drawText('Smart Xerox', { x: 48, y, size: 24, font: bold, color: rgb(0.07, 0.19, 0.42) });
  page.drawText('Payment Receipt / Invoice', { x: 360, y: y + 4, size: 13, font: bold, color: rgb(0.18, 0.25, 0.35) });
  y -= 48;

  drawText(`Invoice: ${payment.invoiceNumber || booking.invoiceNumber || 'Not issued'}`, 48, 12, bold);
  drawText(`Date: ${new Date(payment.invoiceIssuedAt || booking.invoiceIssuedAt || new Date()).toLocaleString('en-IN')}`, 48);
  drawText(`Booking ID: ${booking._id}`, 48);
  drawText(`Token: #${booking.tokenNumber}`, 48);
  drawText(`Payment Provider: ${payment.provider}`, 48);
  drawText(`Payment ID: ${payment.providerPaymentId || payment.providerPaymentIntentId || payment._id}`, 48);
  y -= 16;

  page.drawLine({ start: { x: 48, y }, end: { x: 548, y }, thickness: 1, color: rgb(0.85, 0.88, 0.92) });
  y -= 28;
  drawText('Customer', 48, 13, bold);
  drawText(booking.customerId?.name || 'Customer', 48);
  drawText(booking.customerId?.email || '', 48);
  drawText(booking.customerId?.phone || '', 48);
  y -= 16;

  drawText('Print Job', 48, 13, bold);
  drawText(`File: ${booking.jobConfig?.fileName || 'Document'}`, 48);
  drawText(`Pages: ${booking.jobConfig?.pageCount || 1}`, 48);
  drawText(`Copies: ${booking.jobConfig?.copies || 1}`, 48);
  drawText(`Mode: ${booking.jobConfig?.isColour ? 'Colour' : 'B&W'} / ${booking.jobConfig?.paperSize || 'A4'}`, 48);
  y -= 20;

  page.drawRectangle({ x: 48, y: y - 54, width: 500, height: 74, color: rgb(0.93, 0.96, 1) });
  page.drawText('Total Paid', { x: 68, y: y - 6, size: 13, font: bold, color: rgb(0.07, 0.19, 0.42) });
  page.drawText(toRupees(payment.amount), { x: 420, y: y - 8, size: 18, font: bold, color: rgb(0.02, 0.39, 0.26) });
  page.drawText(`Refunded: ${toRupees(payment.amountRefunded || 0)}`, { x: 68, y: y - 34, size: 10, font: regular, color: rgb(0.32, 0.38, 0.46) });

  page.drawText('Thank you for using Smart Xerox.', { x: 48, y: 72, size: 10, font: regular, color: rgb(0.42, 0.47, 0.55) });

  return Buffer.from(await pdfDoc.save());
};

module.exports = {
  getRazorpayClient,
  getStripeClient,
  getClientUrl,
  issueInvoice,
  markPaymentPaid,
  markPaymentFailed,
  applyRefundState,
  verifyRazorpayCheckoutSignature,
  verifyRazorpayWebhookSignature,
  generateInvoicePdf,
};
