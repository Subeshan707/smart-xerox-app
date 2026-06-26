const User = require('../models/User');
const Shop = require('../models/Shop');
const PricingConfig = require('../models/PricingConfig');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role, shopId: user.shopId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, role, shopName, shopAddress, shopPhone } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const normalizedRole = ['shopOperator', 'shopOwner'].includes(role) ? 'shopOperator' : 'customer';
    let shopId;

    if (normalizedRole === 'shopOperator') {
      const shop = await Shop.create({
        name: shopName || `${name}'s Xerox Shop`,
        address: shopAddress || '',
        phone: shopPhone || phone || '',
        operatingHours: [
          { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
          { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
          { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
          { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
          { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
          { day: 'Saturday', open: '10:00', close: '16:00', isOpen: true },
          { day: 'Sunday', open: '00:00', close: '00:00', isOpen: false },
        ],
      });
      shopId = shop._id;

      await PricingConfig.create({
        shopId,
        bwPricePerPage: 200,
        colourPricePerPage: 500,
        a3Surchargeperpage: 300,
        minimumOrderAmount: 500,
        allowPayAtCounter: true,
      });
    }

    const user = new User({ name, email, password, phone, role: normalizedRole, shopId });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name,
        email,
        phone,
        role: normalizedRole,
        shopId,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({ token, user: { id: user._id, name: user.name, email, role: user.role, shopId: user.shopId, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get current user profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      shopId: user.shopId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Forgot password (stub — sends success regardless for privacy)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    // In production: generate reset token, send email
    console.log(`📧 Password reset requested for: ${email}`);
    res.json({ message: 'If an account exists for this email, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
