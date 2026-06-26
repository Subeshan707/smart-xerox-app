const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Shop = require('../models/Shop');
const PricingConfig = require('../models/PricingConfig');
const { 
  emitStatusChanged, 
  emitQueuePosition, 
  emitBroadcastNotification,
  emitPricingUpdated,
  emitGlobalShopUpdate
} = require('../socket/socket');

const refreshQueuePositions = async (shopId) => {
  const activeBookings = await Booking.find({
    shopId,
    status: { $nin: ['completed', 'cancelled'] },
  }).sort({ createdAt: 1 });

  activeBookings.forEach((queuedBooking, index) => {
    try {
      emitQueuePosition(
        queuedBooking.customerId.toString(),
        queuedBooking._id.toString(),
        {
          bookingId: queuedBooking._id.toString(),
          position: index + 1,
          estimatedWaitMinutes: (index + 1) * 5,
        }
      );
    } catch { /* Socket might not be initialized */ }
  });
};

// Get live queue ordered by booking timestamp
exports.getDashboard = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      shopId,
      $or: [
        { status: { $nin: ['completed', 'cancelled'] } },
        { createdAt: { $gte: today, $lt: tomorrow } },
      ],
    }).populate('customerId', 'name phone').sort({ createdAt: 1 });

    const summary = {
      total: bookings.length,
      queued: bookings.filter(b => b.status === 'queued').length,
      printing: bookings.filter(b => b.status === 'printing').length,
      ready: bookings.filter(b => b.status === 'ready').length,
      completed: bookings.filter(b => b.status === 'completed').length,
    };

    res.json({ bookings, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update booking status
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['queued','printing','printed','ready','completed','cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.shopId.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Emit socket event to customer
    try {
      emitStatusChanged(
        booking.customerId.toString(),
        booking._id.toString(),
        {
          newStatus: status,
          oldStatus,
          message: `Your print job #${booking.tokenNumber} is now ${status}`,
        }
      );
    } catch { /* Socket might not be initialized */ }

    // Send push notification
    try {
      const pushController = require('./push.controller');
      await pushController.sendNotification(booking.customerId.toString(), {
        title: 'Booking Update',
        body: `Your print job #${booking.tokenNumber} is now ${status}`,
        url: `/app/queue/${booking._id}`,
      });
    } catch (err) {
      console.error('Failed to send push notification', err);
    }

    await refreshQueuePositions(booking.shopId);

    res.json({ message: 'Status updated', booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all bookings (with filters for management)
exports.getAllBookings = async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = { shopId: req.user.shopId };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.printDate = { $gte: d, $lt: next };
    }
    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone')
      .sort({ createdAt: 1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get signed file URL
exports.getSignedFileUrl = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.shopId.toString() !== req.user.shopId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (booking.fileDeleted) {
      return res.status(410).json({ error: 'File has been deleted after printing' });
    }
    if (!booking.fileUrl) {
      return res.status(404).json({ error: 'No uploaded document found for this booking' });
    }
    res.json({
      url: booking.fileUrl,
      files: booking.files || [],
      fileName: booking.jobConfig?.fileName || 'document',
      mimeType: booking.mimeType || '',
      fileSize: booking.fileSize || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Export bookings as CSV
exports.exportCSV = async (req, res) => {
  try {
    const { status, date } = req.query;
    const filter = { shopId: req.user.shopId };
    if (status) filter.status = status;
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.printDate = { $gte: d, $lt: next };
    }

    const bookings = await Booking.find(filter)
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 });

    const header = 'Token,Customer,Phone,File,Pages,Copies,Mode,Paper,Binding,Comments,Needed Date,Status,Payment,Price,Created\n';
    const rows = bookings.map(b => [
      b.tokenNumber,
      b.customerId?.name || 'N/A',
      b.customerId?.phone || 'N/A',
      b.jobConfig?.fileName || 'N/A',
      b.jobConfig?.pageCount || 0,
      b.jobConfig?.copies || 1,
      b.jobConfig?.isColour ? 'Colour' : 'B&W',
      b.jobConfig?.paperSize || 'A4',
      b.jobConfig?.binding || 'none',
      `"${(b.jobConfig?.comments || '').replace(/"/g, '""')}"`,
      b.printDate ? new Date(b.printDate).toLocaleDateString() : 'N/A',
      b.status,
      b.paymentStatus,
      (b.totalPrice / 100).toFixed(2),
      new Date(b.createdAt).toLocaleDateString(),
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=bookings-${Date.now()}.csv`);
    res.send(header + rows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Slots ──

exports.getSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const filter = { shopId: req.user.shopId };
    if (date) {
      const d = new Date(date);
      d.setHours(0,0,0,0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      filter.date = { $gte: d, $lt: next };
    }
    const slots = await Slot.find(filter).sort('startTime');
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, capacity } = req.body;
    const slot = new Slot({
      shopId: req.user.shopId,
      date: new Date(date),
      startTime,
      endTime,
      capacity: capacity || 5,
    });
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const slot = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    res.json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const slot = await Slot.findById(req.params.id);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });
    if (slot.bookedCount > 0) {
      return res.status(400).json({ error: 'Cannot delete a slot with existing bookings' });
    }
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Pricing ──

exports.getPricing = async (req, res) => {
  try {
    let pricing = await PricingConfig.findOne({ shopId: req.user.shopId });
    if (!pricing) {
      // Return defaults
      pricing = {
        bwPricePerPage: 200,
        colourPricePerPage: 500,
        a3Surchargeperpage: 300,
        minimumOrderAmount: 500,
        allowPayAtCounter: true,
      };
    }
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    const { _id, shopId, createdAt, updatedAt, __v, ...updateData } = req.body;
    const pricing = await PricingConfig.findOneAndUpdate(
      { shopId: req.user.shopId },
      { ...updateData, shopId: req.user.shopId },
      { new: true, upsert: true, runValidators: true }
    );
    try {
      emitPricingUpdated(req.user.shopId.toString(), pricing);
    } catch { /* Socket might not be initialized */ }
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Shop Profile ──

exports.getShopProfile = async (req, res) => {
  try {
    const shop = await Shop.findById(req.user.shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateShopProfile = async (req, res) => {
  try {
    const { _id, createdAt, updatedAt, __v, ...updateData } = req.body;
    const shop = await Shop.findByIdAndUpdate(
      req.user.shopId,
      { ...updateData },
      { new: true, runValidators: true }
    );
    try {
      emitGlobalShopUpdate(req.user.shopId.toString(), shop);
    } catch { /* Socket might not be initialized */ }
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Analytics ──

exports.getAnalytics = async (req, res) => {
  try {
    const shopId = req.user.shopId;
    const { period = 'weekly' } = req.query;

    const daysBack = period === 'daily' ? 1 : period === 'monthly' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0,0,0,0);

    const bookings = await Booking.find({
      shopId,
      createdAt: { $gte: startDate },
      status: { $ne: 'cancelled' },
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalJobs = bookings.length;

    // Count completed bookings for no-show rate
    const completed = bookings.filter(b => b.status === 'completed').length;
    const noShowRate = totalJobs > 0
      ? (((totalJobs - completed) / totalJobs) * 100).toFixed(1)
      : 0;

    res.json({
      stats: {
        totalRevenue,
        totalJobs,
        avgJobsPerDay: daysBack > 0 ? Math.round(totalJobs / daysBack) : totalJobs,
        popularSlot: '10:00 AM', // Would need aggregation pipeline in production
        noShowRate: parseFloat(noShowRate),
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Notifications ──

exports.broadcastNotification = async (req, res) => {
  try {
    const { message, title = 'Shop update' } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookings = await Booking.find({
      shopId: req.user.shopId,
      createdAt: { $gte: today, $lt: tomorrow },
      status: { $nin: ['completed', 'cancelled'] },
    }).select('customerId');

    const customerIds = [...new Set(bookings.map(b => b.customerId.toString()))];

    try {
      emitBroadcastNotification(customerIds, {
        title,
        message,
        shopId: req.user.shopId,
        timestamp: new Date(),
      });
    } catch { /* Socket might not be initialized */ }

    res.json({ message: 'Broadcast sent', recipients: customerIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
