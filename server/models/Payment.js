const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  providerRefundId: String,
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
  },
  reason: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  processedAt: Date,
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
  provider: { type: String, enum: ['razorpay', 'stripe'], required: true },
  providerOrderId: String,
  providerPaymentId: String,
  providerSessionId: String,
  providerPaymentIntentId: String,
  amount: { type: Number, required: true },
  amountRefunded: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['created', 'requires_action', 'authorized', 'paid', 'failed', 'refund_pending', 'partially_refunded', 'refunded'],
    default: 'created',
    index: true,
  },
  idempotencyKey: { type: String, unique: true, sparse: true },
  invoiceNumber: { type: String, unique: true, sparse: true },
  invoiceIssuedAt: Date,
  receiptEmailSentAt: Date,
  failureReason: String,
  reconciledAt: Date,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  refunds: [refundSchema],
}, { timestamps: true });

paymentSchema.index({ provider: 1, providerOrderId: 1 });
paymentSchema.index({ provider: 1, providerPaymentId: 1 });
paymentSchema.index({ bookingId: 1, provider: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
