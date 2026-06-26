const mongoose = require('mongoose');

const paymentWebhookEventSchema = new mongoose.Schema({
  provider: { type: String, enum: ['razorpay', 'stripe'], required: true },
  eventId: { type: String, required: true },
  eventType: { type: String, required: true },
  signature: String,
  processedAt: Date,
  payload: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

paymentWebhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);
