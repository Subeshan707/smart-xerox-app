const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, default: 'Demo Xerox Shop' },
  address: String,
  lat: Number,
  lng: Number,
  phone: String,
  logoUrl: String,
  operatingHours: [{
    day: String,
    open: String,
    close: String,
    isOpen: Boolean
  }],
  maxConcurrentJobs: { type: Number, default: 10 }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);