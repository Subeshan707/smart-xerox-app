const mongoose = require('mongoose');

const pricingConfigSchema = new mongoose.Schema({
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true },
  bwPricePerPage: { type: Number, default: 200 },           // in paise (₹2.00)
  colourPricePerPage: { type: Number, default: 500 },       // in paise (₹5.00)
  a3Surchargeperpage: { type: Number, default: 300 },       // in paise (₹3.00)
  minimumOrderAmount: { type: Number, default: 500 },       // in paise (₹5.00)
  allowPayAtCounter: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PricingConfig', pricingConfigSchema);
