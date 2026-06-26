import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookingReducer from './bookingSlice';
import queueReducer from './queueSlice';
import notificationReducer from './notificationSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    booking: bookingReducer,
    queue: queueReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in actions related to socket/file
        ignoredActions: ['queue/setSocket'],
        ignoredPaths: ['queue.socket'],
      },
    }),
  devTools: import.meta.env.DEV,
});

export default store;
