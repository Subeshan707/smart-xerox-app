import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

// Async thunks
export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async ({ status, page = 1 } = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      params.append('page', page);
      const res = await api.get(`/customer/history?${params}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch bookings');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const res = await api.post('/customer/bookings', bookingData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create booking');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'booking/fetchById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/customer/bookings/${bookingId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch booking');
    }
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancel',
  async ({ bookingId, reason }, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/customer/bookings/${bookingId}/cancel`, { reason });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to cancel booking');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState: {
    bookings: [],
    currentBooking: null,
    loading: false,
    error: null,
    filter: 'all',
    pagination: { page: 1, totalPages: 1 },
  },
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateBookingStatus: (state, action) => {
      const { bookingId, newStatus } = action.payload;
      const booking = state.bookings.find(b => b._id === bookingId);
      if (booking) booking.status = newStatus;
      if (state.currentBooking?._id === bookingId) {
        state.currentBooking.status = newStatus;
      }
    },
    updateBookingPayment: (state, action) => {
      const { bookingId, paymentStatus, paymentProvider, paymentId, invoiceNumber, paidAt, amountRefunded } = action.payload;
      const updateData = { paymentStatus, paymentProvider, paymentId, invoiceNumber, paidAt, amountRefunded };
      
      const booking = state.bookings.find(b => b._id === bookingId);
      if (booking) Object.assign(booking, updateData);
      
      if (state.currentBooking?._id === bookingId) {
        Object.assign(state.currentBooking, updateData);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch my bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = Array.isArray(action.payload) ? action.payload : action.payload.bookings || [];
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch booking by ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const idx = state.bookings.findIndex(b => b._id === action.payload._id);
        if (idx !== -1) state.bookings[idx] = action.payload;
        if (state.currentBooking?._id === action.payload._id) {
          state.currentBooking = action.payload;
        }
      });
  },
});

export const { setFilter, clearCurrentBooking, clearError, updateBookingStatus, updateBookingPayment } = bookingSlice.actions;
export default bookingSlice.reducer;
