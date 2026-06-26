const Slot = require('../models/Slot');
const Booking = require('../models/Booking');
const Shop = require('../models/Shop');
const User = require('../models/User');
const PricingConfig = require('../models/PricingConfig');
const { emitQueueUpdated, emitQueuePosition } = require('../socket/socket');
const fs = require('fs/promises');
const path = require('path');

const DEFAULT_PRICING = {
  bwPricePerPage: 200,
  colourPricePerPage: 500,
  a3Surchargeperpage: 300,
  minimumOrderAmount: 500,
  allowPayAtCounter: true,
};

const parsePageRange = (rangeStr, maxPages) => {
  if (!rangeStr || rangeStr.trim() === 'all') return maxPages;
  const parts = rangeStr.split(',');
  const pages = new Set();
  
  parts.forEach(part => {
    part = part.trim();
    if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
          pages.add(i);
        }
      }
    } else {
      const p = parseInt(part, 10);
      if (!isNaN(p) && p >= 1 && p <= maxPages) {
        pages.add(p);
      }
    }
  });

  return pages.size > 0 ? pages.size : maxPages;
};

const calculateServerPrice = (files = [], pricing = DEFAULT_PRICING) => {
  let basePrice = 0;
  let sizeSurcharge = 0;

  (files || []).forEach((file) => {
    const config = file.jobConfig || {};
    const copies = Math.max(1, Number(config.copies) || 1);
    const rawPageCount = file.pageCount || 1;
    const pageCount = parsePageRange(config.pageRange || 'all', rawPageCount);
    
    const pricePerPage = config.isColour
      ? Number(pricing.colourPricePerPage ?? DEFAULT_PRICING.colourPricePerPage)
      : Number(pricing.bwPricePerPage ?? DEFAULT_PRICING.bwPricePerPage);
      
    const a3Surcharge = config.paperSize === 'A3'
      ? Number(pricing.a3Surchargeperpage ?? DEFAULT_PRICING.a3Surchargeperpage) * pageCount * copies
      : 0;

    basePrice += pricePerPage * pageCount * copies;
    sizeSurcharge += a3Surcharge;
  });

  const minimumOrderAmount = Number(pricing.minimumOrderAmount ?? DEFAULT_PRICING.minimumOrderAmount);
  return Math.max(basePrice + sizeSurcharge, minimumOrderAmount);
};

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

// Get all available shops
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find().select('-__v').lean();
    
    const pricings = await PricingConfig.find({ 
      shopId: { $in: shops.map(s => s._id) } 
    }).lean();

    const shopsWithPricing = shops.map(shop => {
      const pricing = pricings.find(p => p.shopId.toString() === shop._id.toString()) || DEFAULT_PRICING;
      return {
        ...shop,
        pricing: {
          bwPricePerPage: pricing.bwPricePerPage,
          colourPricePerPage: pricing.colourPricePerPage
        }
      };
    });

    res.json(shopsWithPricing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get available slots for a given date
exports.getSlots = async (req, res) => {
  try {
    const { date, shopId } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });
    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });
    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(date);
    end.setHours(23,59,59,999);

    const slots = await Slot.find({
      shopId,
      date: { $gte: start, $lte: end },
      isBlocked: false
    }).sort('startTime');

    const availableSlots = slots.map(s => ({
      _id: s._id,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      bookedCount: s.bookedCount,
      available: s.capacity - s.bookedCount
    }));
    res.json(availableSlots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      shopId,
      printDate,
      files,
    } = req.body;
    const customerId = req.user._id;

    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const requestedPrintDate = printDate ? new Date(printDate) : new Date();
    requestedPrintDate.setHours(0, 0, 0, 0);

    if (Number.isNaN(requestedPrintDate.getTime())) {
      return res.status(400).json({ error: 'Valid print date is required' });
    }

    const printDayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][requestedPrintDate.getDay()];
    const todayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

    const shopOperatingHours = shop.operatingHours || [];
    const printDayHours = shopOperatingHours.find(h => h.day === printDayStr);
    
    if (printDayHours && !printDayHours.isOpen) {
      return res.status(400).json({ error: `Shop is closed on ${printDayStr}s` });
    }

    if (printDayStr === todayStr && printDayHours && printDayHours.isOpen) {
      // Fix Timezone: Server is UTC, but shop hours are IST (+5:30)
      const now = new Date();
      now.setMinutes(now.getMinutes() + 330); // Convert UTC to IST
      const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
      
      if (printDayHours.open && currentTime < printDayHours.open) {
        return res.status(400).json({ error: `Shop opens at ${printDayHours.open} today` });
      }
      if (printDayHours.close && currentTime > printDayHours.close) {
        return res.status(400).json({ error: `Shop closed at ${printDayHours.close} today` });
      }
    }

    const printDateEnd = new Date(requestedPrintDate);
    printDateEnd.setDate(printDateEnd.getDate() + 1);

    // Token number: first-come-first-served per print date
    const count = await Booking.countDocuments({
      shopId: shop._id,
      printDate: { $gte: requestedPrintDate, $lt: printDateEnd },
    });
    const tokenNumber = count + 1;

    const pricing = await PricingConfig.findOne({ shopId: shop._id }).lean();
    const finalPrice = calculateServerPrice(files, pricing || DEFAULT_PRICING);

    const booking = new Booking({
      customerId,
      shopId: shop._id,
      printDate: requestedPrintDate,
      tokenNumber,
      totalPrice: finalPrice,
      paymentStatus: 'pending',
      status: 'queued',
      files: Array.isArray(files) ? files : [],
    });
    await booking.save();

    // Notify operator via socket
    try {
      emitQueueUpdated(shop._id.toString(), {
        bookingId: booking._id,
        tokenNumber,
        customerName: req.user.name,
      });
    } catch { /* Socket might not be initialized in tests */ }

    await refreshQueuePositions(shop._id);

    res.status(201).json({
      bookingId: booking._id,
      tokenNumber: booking.tokenNumber,
      estimatedWaitMinutes: tokenNumber * 5,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get booking details
exports.getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slotId')
      .populate('customerId', 'name email');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get queue position
exports.getQueuePosition = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const position = await Booking.countDocuments({
      shopId: booking.shopId,
      createdAt: { $lt: booking.createdAt },
      status: { $nin: ['completed','cancelled'] }
    }) + 1;
    res.json({ position, estimatedWaitMinutes: position * 5 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get customer's booking history
exports.getHistory = async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user._id })
      .populate('slotId')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get active shop pricing for customers
exports.getPricing = async (req, res) => {
  try {
    const { shopId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'Shop ID is required' });

    const shop = await Shop.findById(shopId);
    if (!shop) return res.json(DEFAULT_PRICING);

    const pricing = await PricingConfig.findOne({ shopId: shop._id }).lean();
    res.json(pricing || { ...DEFAULT_PRICING, shopId: shop._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (['completed', 'cancelled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.cancelReason = req.body.reason || 'Cancelled by customer';
    await booking.save();

    await refreshQueuePositions(booking.shopId);

    try {
      emitQueueUpdated(booking.shopId.toString(), {
        bookingId: booking._id,
        status: 'cancelled',
      });
    } catch { /* Socket might not be initialized */ }

    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Upload file
exports.uploadFile = async (req, res) => {
  try {
    const uploadedFiles = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files || {}).flat();
    if (req.file) uploadedFiles.push(req.file);
    if (!uploadedFiles.length) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const processedFiles = await Promise.all(
      uploadedFiles.map(async (uploadedFile) => {
        let cloudinaryPublicId = null;
        let thumbnailUrl = null;
        let fileUrl = null;
        let storedFileName = null;

        try {
          const cloudinary = require('../config/cloudinary');
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                folder: 'xerox-uploads',
                allowed_formats: ['pdf'],
              },
              (err, result) => {
                if (err) reject(err);
                else resolve(result);
              }
            ).end(uploadedFile.buffer);
          });
          cloudinaryPublicId = result.public_id;
          fileUrl = result.secure_url;
          thumbnailUrl = result.secure_url;
        } catch {
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          await fs.mkdir(uploadsDir, { recursive: true });

          const safeOriginalName = uploadedFile.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          storedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeOriginalName}`;
          await fs.writeFile(path.join(uploadsDir, storedFileName), uploadedFile.buffer);

          cloudinaryPublicId = `local_${storedFileName}`;
          fileUrl = `${req.protocol}://${req.get('host')}/uploads/${encodeURIComponent(storedFileName)}`;
          thumbnailUrl = null;
        }

        let pageCount = 1;
        if (uploadedFile.mimetype === 'application/pdf') {
          const text = uploadedFile.buffer.toString('utf-8', 0, Math.min(uploadedFile.buffer.length, 50000));
          const pages = (text.match(/\/Type\s*\/Page[^s]/g) || []).length;
          pageCount = Math.max(pages, 1);
        }

        return {
          cloudinaryPublicId,
          fileUrl,
          thumbnailUrl,
          pageCount,
          fileName: uploadedFile.originalname,
          fileSize: uploadedFile.size,
          mimeType: uploadedFile.mimetype,
          storedFileName,
        };
      })
    );

    const totalPages = processedFiles.reduce((sum, file) => sum + (file.pageCount || 1), 0);
    const primaryFile = processedFiles[0];

    res.json({
      ...primaryFile,
      files: processedFiles,
      pageCount: totalPages,
      fileName: processedFiles.map(file => file.fileName).join(', '),
      fileSize: processedFiles.reduce((sum, file) => sum + (file.fileSize || 0), 0),
      fileCount: processedFiles.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

