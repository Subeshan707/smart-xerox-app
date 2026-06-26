import api from './axios';

export const getShops = () =>
  api.get('/customer/shops');

export const getSlots = (date, shopId) =>
  api.get(`/customer/slots`, { params: { date, shopId } });

export const getPricing = (shopId) =>
  api.get('/customer/pricing', { params: { shopId } });

export const createBooking = (data) =>
  api.post('/customer/bookings', data);

export const createRazorpayOrder = (bookingId, idempotencyKey) =>
  api.post(`/payments/bookings/${bookingId}/razorpay/order`, {}, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const verifyRazorpayPayment = (data) =>
  api.post('/payments/razorpay/verify', data);

export const createStripeCheckoutSession = (bookingId, idempotencyKey) =>
  api.post(`/payments/bookings/${bookingId}/stripe/session`, {}, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });

export const getPaymentStatus = (bookingId) =>
  api.get(`/payments/bookings/${bookingId}/status`);

export const getInvoiceUrl = (bookingId) =>
  `${api.defaults.baseURL}/payments/bookings/${bookingId}/invoice`;

export const downloadBookingInvoice = (bookingId) =>
  api.get(`/payments/bookings/${bookingId}/invoice`, { responseType: 'blob' });

export const getBooking = (id) =>
  api.get(`/customer/bookings/${id}`);

export const getQueuePosition = (id) =>
  api.get(`/customer/bookings/${id}/queue`);

export const getHistory = (params = {}) =>
  api.get('/customer/history', { params });

export const cancelBooking = (id, reason) =>
  api.patch(`/customer/bookings/${id}/cancel`, { reason });

export const uploadFile = (formData, onUploadProgress) =>
  api.post('/customer/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });

export const getProfile = () =>
  api.get('/customer/profile');

export const updateProfile = (data) =>
  api.patch('/customer/profile', data);

// Wallet API
export const getWallet = () =>
  api.get('/wallet');

export const createWalletTopUpOrder = (amount) =>
  api.post('/wallet/topup', { amount });

export const verifyWalletTopUp = (data) =>
  api.post('/wallet/verify', data);

// Pay Booking from Wallet
export const payBookingWithWallet = (bookingId, idempotencyKey) =>
  api.post(`/payments/bookings/${bookingId}/wallet`, {}, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
