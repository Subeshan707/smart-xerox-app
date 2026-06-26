import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    pushPermission: 'default', // 'default' | 'granted' | 'denied'
    toasts: [],               // { id, type, message, duration }
    fcmToken: null,
  },
  reducers: {
    setPushPermission: (state, action) => {
      state.pushPermission = action.payload;
    },
    setFcmToken: (state, action) => {
      state.fcmToken = action.payload;
    },
    addToast: (state, action) => {
      state.toasts.push({
        id: Date.now() + Math.random(),
        duration: 4000,
        ...action.payload,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    },
    clearToasts: (state) => {
      state.toasts = [];
    },
  },
});

export const {
  setPushPermission,
  setFcmToken,
  addToast,
  removeToast,
  clearToasts,
} = notificationSlice.actions;

export default notificationSlice.reducer;
