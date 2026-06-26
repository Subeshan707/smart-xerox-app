const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot' },
  printDate: { type: Date, default: Date.now },
  tokenNumber: { type: Number, required: true },
  jobConfig: {
    copies: { type: Number, default: 1 },
    paperSize: { type: String, enum: ['A4','A3','Letter'], default: 'A4' },
    isColour: { type: Boolean, default: false },
    isDoubleSided: { type: Boolean, default: false },
    pageCount: { type: Number, default: 1 },
    fileName: { type: String },
    binding: {
      type: String,
      enum: ['none', 'staple', 'spiral', 'comb', 'soft', 'hard'],
      default: 'none',
    },
    comments: { type: String, maxlength: 1000 }
  },
  totalPrice: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending','paid','failed','refund_pending','partially_refunded','refunded'],
    default: 'pending'
  },
  paymentProvider: { type: String, enum: ['razorpay','stripe','counter','wallet', null], default: null },
  paymentId: String,
  paymentOrderId: String,
  paymentSessionId: String,
  paymentIntentId: String,
  paidAt: Date,
  refundedAt: Date,
  amountRefunded: { type: Number, default: 0 },
  invoiceNumber: String,
  invoiceIssuedAt: Date,
  status: { type: String, enum: ['queued','printing','printed','ready','completed','cancelled'], default: 'queued' },
  cancelReason: String,
  fileDeleted: { type: Boolean, default: false },
  fileDeletedAt: Date,
  cloudinaryPublicId: String,
  fileUrl: String,
  thumbnailUrl: String,
  mimeType: String,
  fileSize: Number,
  files: [{
    cloudinaryPublicId: String,
    fileUrl: String,
    thumbnailUrl: String,
    fileName: String,
    mimeType: String,
    fileSize: Number,
    pageCount: Number,
    storedFileName: String,
    jobConfig: {
      copies: { type: Number, default: 1 },
      paperSize: { type: String, enum: ['A4','A3','Letter'], default: 'A4' },
      isColour: { type: Boolean, default: false },
      isDoubleSided: { type: Boolean, default: false },
      pageRange: { type: String, default: 'all' },
      binding: {
        type: String,
        enum: ['none', 'staple', 'spiral', 'comb', 'soft', 'hard'],
        default: 'none',
      },
    }
  }],
}, { timestamps: true });

bookingSchema.index({ shopId: 1, status: 1, createdAt: 1 });
bookingSchema.index({ shopId: 1, printDate: 1, createdAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
