const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

// Get wallet balance and transactions
exports.getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance');
    const transactions = await Transaction.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.json({
      balance: user.walletBalance || 0,
      transactions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a razorpay order to top up wallet
exports.createTopUpOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum top up amount is ₹1' });

    const order = await razorpay.orders.create({
      amount: amount, // in paise
      currency: 'INR',
      receipt: `tu_${req.user._id.toString().substring(0,8)}_${Date.now()}`,
    });

    const transaction = new Transaction({
      userId: req.user._id,
      amount: amount,
      type: 'topup',
      status: 'pending',
      paymentProvider: 'razorpay',
      paymentOrderId: order.id,
      description: 'Wallet Top Up',
    });
    await transaction.save();

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Verify top up payment
exports.verifyTopUpPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret')
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      const tx = await Transaction.findOne({ paymentOrderId: razorpay_order_id });
      if (tx) {
        tx.status = 'failed';
        await tx.save();
      }
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const transaction = await Transaction.findOne({ paymentOrderId: razorpay_order_id });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
    if (transaction.status === 'completed') return res.json({ success: true, balance: req.user.walletBalance });

    transaction.status = 'completed';
    transaction.paymentId = razorpay_payment_id;
    await transaction.save();

    const user = await User.findById(req.user._id);
    user.walletBalance = (user.walletBalance || 0) + transaction.amount;
    await user.save();

    res.json({ success: true, balance: user.walletBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
