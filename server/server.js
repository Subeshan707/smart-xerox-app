require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { initSocket } = require('./socket/socket');
const { configurePassport } = require('./config/passport');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');

// Import routes
const authRoutes = require('./routes/auth.routes');
const customerRoutes = require('./routes/customer.routes');
const operatorRoutes = require('./routes/operator.routes');
const paymentRoutes = require('./routes/payment.routes');
const walletRoutes = require('./routes/wallet.routes');
const pushRoutes = require('./routes/push.routes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors({ 
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173'],
  credentials: true 
}));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting on API
app.use('/api', apiLimiter);

// Configure Google OAuth (graceful skip if not configured)
configurePassport(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Smart Xerox Backend is running 🚀' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/operator', operatorRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/push', pushRoutes);

// Global error handler
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');

    // Seed dummy data for development
    if (process.env.NODE_ENV !== 'production') {
      await seedDummyData();
    }

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔌 Socket.io ready`);
      console.log(`📋 API: http://localhost:${PORT}/api/health`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Seed function
const seedDummyData = async () => {
  const Shop = require('./models/Shop');
  const Slot = require('./models/Slot');
  const User = require('./models/User');
  const PricingConfig = require('./models/PricingConfig');
  const bcrypt = require('bcryptjs');

  // Create a demo shop if none exists
  let shop = await Shop.findOne();
  if (!shop) {
    shop = await Shop.create({
      name: 'Demo Xerox Shop',
      address: '123 MG Road, Bangalore',
      phone: '9876543210',
      operatingHours: [
        { day: 'Monday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Tuesday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Wednesday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Thursday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Friday', open: '09:00', close: '17:00', isOpen: true },
        { day: 'Saturday', open: '10:00', close: '14:00', isOpen: true },
        { day: 'Sunday', open: '00:00', close: '00:00', isOpen: false },
      ],
    });
    console.log('✅ Created demo shop');
  }

  // Create default pricing
  const existingPricing = await PricingConfig.findOne({ shopId: shop._id });
  if (!existingPricing) {
    await PricingConfig.create({
      shopId: shop._id,
      bwPricePerPage: 200,
      colourPricePerPage: 500,
      a3Surchargeperpage: 300,
      minimumOrderAmount: 500,
      allowPayAtCounter: true,
    });
    console.log('✅ Created default pricing config');
  }

  // Create an operator user if not exists
  const operatorExists = await User.findOne({ email: 'operator@demo.com' });
  if (!operatorExists) {
    await User.create({
      name: 'Demo Operator',
      email: 'operator@demo.com',
      password: 'Password1',
      phone: '9876543210',
      role: 'shopOperator',
      shopId: shop._id,
    });
    console.log('✅ Created operator user (operator@demo.com / Password1)');
  }

  // Create a demo customer user
  const customerExists = await User.findOne({ email: 'customer@demo.com' });
  if (!customerExists) {
    await User.create({
      name: 'John Doe',
      email: 'customer@demo.com',
      password: 'Password1',
      phone: '9123456789',
      role: 'customer',
    });
    console.log('✅ Created customer user (customer@demo.com / Password1)');
  }

  // Create dummy slots for today and tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    const existingSlots = await Slot.countDocuments({
      shopId: shop._id,
      date: { $gte: date, $lt: new Date(date.getTime() + 86400000) },
    });

    if (existingSlots === 0) {
      const times = [
        { start: '09:00', end: '09:30' },
        { start: '09:30', end: '10:00' },
        { start: '10:00', end: '10:30' },
        { start: '10:30', end: '11:00' },
        { start: '11:00', end: '11:30' },
        { start: '11:30', end: '12:00' },
        { start: '12:00', end: '12:30' },
        { start: '12:30', end: '13:00' },
        { start: '14:00', end: '14:30' },
        { start: '14:30', end: '15:00' },
        { start: '15:00', end: '15:30' },
        { start: '15:30', end: '16:00' },
        { start: '16:00', end: '16:30' },
        { start: '16:30', end: '17:00' },
      ];
      const slots = times.map(t => ({
        shopId: shop._id,
        date,
        startTime: t.start,
        endTime: t.end,
        capacity: 5,
        bookedCount: 0,
      }));
      await Slot.insertMany(slots);
      const label = dayOffset === 0 ? 'today' : 'tomorrow';
      console.log(`✅ Created ${slots.length} slots for ${label}`);
    }
  }
};
