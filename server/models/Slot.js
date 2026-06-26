const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },   // "10:00"
  endTime: { type: String, required: true },     // "10:30"
  capacity: { type: Number, default: 5 },
  bookedCount: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Slot', slotSchema);