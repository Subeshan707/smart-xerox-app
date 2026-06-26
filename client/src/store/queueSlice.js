import { createSlice } from '@reduxjs/toolkit';

const queueSlice = createSlice({
  name: 'queue',
  initialState: {
    socket: null,
    connected: false,
    operatorQueue: [],     // For operator dashboard
    queuePosition: null,   // For customer queue tracker
    estimatedWait: null,
    summary: {
      total: 0,
      queued: 0,
      printing: 0,
      ready: 0,
      completed: 0,
    },
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket = action.payload;
    },
    setConnected: (state, action) => {
      state.connected = action.payload;
    },
    setOperatorQueue: (state, action) => {
      state.operatorQueue = action.payload.bookings || [];
      state.summary = action.payload.summary || state.summary;
    },
    addToQueue: (state, action) => {
      state.operatorQueue.push(action.payload);
      state.summary.total += 1;
      state.summary.queued += 1;
    },
    updateQueueItem: (state, action) => {
      const { bookingId, newStatus } = action.payload;
      const item = state.operatorQueue.find(b => b._id === bookingId);
      if (item) {
        const oldStatus = item.status;
        item.status = newStatus;
        // Update summary counts
        if (state.summary[oldStatus] !== undefined) state.summary[oldStatus] -= 1;
        if (state.summary[newStatus] !== undefined) state.summary[newStatus] += 1;
      }
    },
    setQueuePosition: (state, action) => {
      state.queuePosition = action.payload.position;
      state.estimatedWait = action.payload.estimatedWaitMinutes;
    },
    clearQueue: (state) => {
      state.operatorQueue = [];
      state.queuePosition = null;
      state.estimatedWait = null;
    },
  },
});

export const {
  setSocket,
  setConnected,
  setOperatorQueue,
  addToQueue,
  updateQueueItem,
  setQueuePosition,
  clearQueue,
} = queueSlice.actions;

export default queueSlice.reducer;
