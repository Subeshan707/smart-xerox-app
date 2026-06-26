const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'http://localhost:5173'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.shopId = decoded.shopId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id} (${socket.userRole})`);

    // Auto-join role-based room
    if (socket.userRole === 'shopOperator' && socket.shopId) {
      socket.join(`operator:${socket.shopId}`);
      console.log(`   → Joined operator:${socket.shopId}`);
    } else if (socket.userRole === 'customer') {
      socket.join(`customer:${socket.userId}`);
      console.log(`   → Joined customer:${socket.userId}`);
    }

    // Manual room join (for booking-specific tracking)
    socket.on('joinRoom', ({ room }) => {
      if (room && typeof room === 'string') {
        // Security: only allow joining own rooms or public rooms
        const allowed =
          room === 'global' ||
          room.startsWith('shop:') ||
          room.startsWith(`customer:${socket.userId}`) ||
          room.startsWith(`operator:${socket.shopId}`) ||
          room.startsWith('booking:');
        if (allowed) {
          socket.join(room);
          console.log(`   → ${socket.id} joined ${room}`);
        }
      }
    });

    socket.on('leaveRoom', ({ room }) => {
      if (room) {
        socket.leave(room);
      }
    });

    // Operator broadcasts alert to all customers in shop
    socket.on('broadcastAlert', ({ message }) => {
      if (socket.userRole === 'shopOperator' && socket.shopId) {
        io.to(`shop:${socket.shopId}`).emit('broadcastAlert', {
          message,
          shopId: socket.shopId,
          timestamp: new Date(),
        });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket(server) first.');
  }
  return io;
}

// Emit queue update to operator
function emitQueueUpdated(shopId, data) {
  if (io) {
    io.to(`operator:${shopId}`).emit('queueUpdated', data);
  }
}

// Emit broadcast notification to selected customers
function emitBroadcastNotification(customerIds, data) {
  if (io) {
    customerIds.forEach((customerId) => {
      io.to(`customer:${customerId}`).emit('broadcastAlert', data);
    });
  }
}

// Emit status change to customer
function emitStatusChanged(customerId, bookingId, data) {
  if (io) {
    io.to(`customer:${customerId}`).emit('statusChanged', {
      bookingId,
      ...data,
    });
    io.to(`booking:${bookingId}`).emit('statusChanged', {
      bookingId,
      ...data,
    });
  }
}

// Emit queue position update
function emitQueuePosition(customerId, bookingId, data) {
  if (io) {
    io.to(`customer:${customerId}`).emit('queuePosition', data);
    io.to(`booking:${bookingId}`).emit('queuePosition', data);
  }
}

// Emit payment update to customer, booking tracker, and operator dashboard
function emitPaymentUpdated(customerId, shopId, bookingId, data) {
  if (io) {
    const payload = {
      bookingId,
      ...data,
    };
    io.to(`customer:${customerId}`).emit('paymentUpdated', payload);
    io.to(`booking:${bookingId}`).emit('paymentUpdated', payload);
    io.to(`operator:${shopId}`).emit('paymentUpdated', payload);
  }
}

// Emit pricing updates to customers viewing a specific shop
function emitPricingUpdated(shopId, data) {
  if (io) {
    io.to(`shop:${shopId}`).emit('pricingUpdated', data);
  }
}

// Emit shop profile updates globally (for ShopList) and to shop room
function emitGlobalShopUpdate(shopId, data) {
  if (io) {
    io.to('global').emit('shopProfileUpdated', data);
    io.to(`shop:${shopId}`).emit('shopProfileUpdated', data);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdated,
  emitBroadcastNotification,
  emitStatusChanged,
  emitQueuePosition,
  emitPaymentUpdated,
  emitPricingUpdated,
  emitGlobalShopUpdate,
};
