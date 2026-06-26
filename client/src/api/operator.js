import api from './axios';

export const getDashboard = () =>
  api.get('/operator/dashboard');

export const updateBookingStatus = (id, status) =>
  api.patch(`/operator/bookings/${id}/status`, { status });

export const getSignedFileUrl = (id) =>
  api.get(`/operator/bookings/${id}/file`);

export const getAllBookings = (params = {}) =>
  api.get('/operator/bookings', { params });

export const createSlots = (data) =>
  api.post('/operator/slots', data);

export const updateSlot = (id, data) =>
  api.patch(`/operator/slots/${id}`, data);

export const deleteSlot = (id) =>
  api.delete(`/operator/slots/${id}`);

export const getSlots = (params = {}) =>
  api.get('/operator/slots', { params });

export const getPricing = () =>
  api.get('/operator/pricing');

export const updatePricing = (data) =>
  api.patch('/operator/pricing', data);

export const getAnalytics = (params = {}) =>
  api.get('/operator/analytics', { params });

export const exportBookingsCSV = (params = {}) =>
  api.get('/operator/bookings/export', { params, responseType: 'blob' });

export const broadcastNotification = (data) =>
  api.post('/operator/notify', data);

export const refundBookingPayment = (bookingId, data = {}, idempotencyKey) =>
  api.post(`/payments/bookings/${bookingId}/refund`, data, {
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
  });

export const reconcilePayments = () =>
  api.post('/payments/reconcile');

export const getBookingPaymentStatus = (bookingId) =>
  api.get(`/payments/bookings/${bookingId}/status`);

export const downloadBookingInvoice = (bookingId) =>
  api.get(`/payments/bookings/${bookingId}/invoice`, { responseType: 'blob' });

export const getShopProfile = () =>
  api.get('/operator/shop');

export const updateShopProfile = (data) =>
  api.patch('/operator/shop', data);
