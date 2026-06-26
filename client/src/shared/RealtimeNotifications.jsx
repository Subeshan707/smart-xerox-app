import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useSocket from '../hooks/useSocket';
import { addToast, setPushPermission } from '../store/notificationSlice';
import { updateBookingStatus, updateBookingPayment } from '../store/bookingSlice';
import {
  getBrowserNotificationPermission,
  notifyUser,
} from '../utils/browserNotifications';

export default function RealtimeNotifications() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setPushPermission(getBrowserNotificationPermission()));
  }, [dispatch]);

  const pushNotice = ({ title, message, type = 'info' }) => {
    const toast = notifyUser({ title, message, type });
    if (toast) dispatch(addToast(toast));
  };

  useSocket({
    queueUpdated: (data) => {
      if (user?.role !== 'shopOperator') return;
      pushNotice({
        title: 'New print job',
        message: `Token #${data.tokenNumber} from ${data.customerName || 'customer'} joined the queue.`,
        type: 'info',
      });
    },
    statusChanged: (data) => {
      if (data.bookingId && data.newStatus) {
        dispatch(updateBookingStatus({ bookingId: data.bookingId, newStatus: data.newStatus }));
      }
      pushNotice({
        title: 'Print status updated',
        message: data.message || `Your print job is now ${data.newStatus}.`,
        type: data.newStatus === 'ready' ? 'success' : 'info',
      });
    },
    broadcastAlert: (data) => {
      pushNotice({
        title: data.title || 'Shop update',
        message: data.message,
        type: 'warning',
      });
    },
    queuePosition: (data) => {
      if (data.position === 1) {
        pushNotice({
          title: 'You are next',
          message: `Your print job is next. Estimated wait: ${data.estimatedWaitMinutes || 5} minutes.`,
          type: 'success',
        });
      }
    },
    paymentUpdated: (data) => {
      if (data.bookingId) {
        dispatch(updateBookingPayment(data));
      }
    },
  });

  return null;
}
