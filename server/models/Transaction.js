const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['topup', 'deduction'], required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  referenceId: { type: String }, // Booking ID or Razorpay Order ID
  paymentProvider: { type: String, enum: ['razorpay', 'stripe', null], default: null },
  paymentId: String,
  paymentOrderId: String,
  description: String,
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
