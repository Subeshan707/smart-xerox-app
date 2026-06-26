import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import * as customerAPI from '../../api/customer';
import useSocket from '../../hooks/useSocket';
import { addToast } from '../../store/notificationSlice';
import { PageSpinner } from '../../shared/Spinner';
import { formatDate, formatCurrency } from '../../utils/formatters';
import QueueProgress from '../components/QueueProgress';

import { 
  Box, Typography, Button, Paper, Grid, Divider, Chip, Stack
} from '@mui/material';
import WalletIcon from '@mui/icons-material/Wallet';
import DownloadIcon from '@mui/icons-material/Download';
import PaymentIcon from '@mui/icons-material/Payment';
import CelebrationIcon from '@mui/icons-material/Celebration';
import Card, { CardContent } from '../../shared/Card';
import Badge from '../../shared/Badge';

const loadScript = (src) =>
  new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function QueueTracker() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [booking, setBooking] = useState(null);
  const [position, setPosition] = useState(null);
  const [estimatedWait, setEstimatedWait] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Socket event handlers
  const { isConnected, joinRoom, leaveRoom } = useSocket({
    statusChanged: (data) => {
      if (data.bookingId === id) {
        setBooking(prev => prev ? { ...prev, status: data.newStatus } : prev);
      }
    },
    queuePosition: (data) => {
      setPosition(data.position);
      setEstimatedWait(data.estimatedWaitMinutes);
    },
    paymentUpdated: (data) => {
      if (data.bookingId === id) {
        setBooking(prev => prev ? {
          ...prev,
          paymentStatus: data.paymentStatus,
          paymentProvider: data.paymentProvider,
          paymentId: data.paymentId,
          invoiceNumber: data.invoiceNumber,
          invoiceIssuedAt: data.invoiceIssuedAt,
          paidAt: data.paidAt,
          refundedAt: data.refundedAt,
          amountRefunded: data.amountRefunded,
        } : prev);

        if (data.paymentStatus === 'paid') {
          dispatch(addToast({ type: 'success', message: 'Payment confirmed in realtime.' }));
        } else if (data.paymentStatus === 'failed') {
          dispatch(addToast({ type: 'error', message: 'Payment failed. Please try again.' }));
        }
      }
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, queueRes] = await Promise.all([
          customerAPI.getBooking(id),
          customerAPI.getQueuePosition(id),
        ]);
        setBooking(bookingRes.data);
        setPosition(queueRes.data.position);
        setEstimatedWait(queueRes.data.estimatedWaitMinutes);
      } catch {
        dispatch(addToast({ type: 'error', message: 'Failed to load booking' }));
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (isConnected) {
      joinRoom(`booking:${id}`);
      return () => leaveRoom(`booking:${id}`);
    }
  }, [id, dispatch, isConnected, joinRoom, leaveRoom]);

  // Payment status fallback polling
  useEffect(() => {
    if (!booking || !['pending', 'requires_action'].includes(booking.paymentStatus)) return;

    const interval = setInterval(async () => {
      try {
        const res = await customerAPI.getPaymentStatus(id);
        const { paymentStatus, paymentProvider, invoiceNumber, paidAt, amountRefunded } = res.data;
        if (paymentStatus !== booking.paymentStatus) {
          setBooking(prev => ({
            ...prev,
            paymentStatus,
            paymentProvider,
            invoiceNumber,
            paidAt,
            amountRefunded,
          }));
          if (paymentStatus === 'paid') {
            dispatch(addToast({ type: 'success', message: 'Payment confirmed.' }));
          } else if (paymentStatus === 'failed') {
            dispatch(addToast({ type: 'error', message: 'Payment failed. Please try again.' }));
          }
        }
      } catch (err) {
        // silently ignore polling errors
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [id, booking?.paymentStatus, dispatch]);

  if (loading) return <PageSpinner message="Loading queue status..." />;
  if (!booking) return <Box textAlign="center" py={10} color="text.secondary">Booking not found.</Box>;

  const isReady = booking.status === 'ready';
  const isCompleted = booking.status === 'completed';
  const canDownloadInvoice = ['paid', 'partially_refunded', 'refunded'].includes(booking.paymentStatus);
  const canPayOnline = ['pending', 'failed'].includes(booking.paymentStatus);

  const handleRazorpayPayment = async () => {
    setPaymentLoading(true);
    try {
      const scriptReady = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptReady) throw new Error('Unable to load Razorpay checkout');

      const idempotencyKey = `razorpay-${booking._id}-${booking.totalPrice}`;
      const orderRes = await customerAPI.createRazorpayOrder(booking._id, idempotencyKey);
      const order = orderRes.data;

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Smart Xerox',
        description: `Print booking #${booking.tokenNumber}`,
        order_id: order.orderId,
        method: { upi: true, card: true, netbanking: true },
        prefill: { name: user?.name || '', email: user?.email || '', contact: user?.phone || '' },
        retry: { enabled: true, max_count: 3 },
        notes: { bookingId: booking._id },
        handler: async (response) => {
          try {
            await customerAPI.verifyRazorpayPayment(response);
            dispatch(addToast({ type: 'success', message: 'Payment verified. Receipt is ready.' }));
          } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Payment verification failed' }));
          }
        },
        modal: { ondismiss: () => dispatch(addToast({ type: 'info', message: 'Payment window closed. You can retry anytime.' })) },
        theme: { color: '#2563eb' }
      });
      checkout.open();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || err.message || 'Unable to start payment' }));
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setInvoiceLoading(true);
    try {
      const res = await customerAPI.downloadBookingInvoice(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${booking.invoiceNumber || `invoice-${booking.tokenNumber}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Invoice is not available yet' }));
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', animation: 'fadeIn 0.5s ease', pb: 8 }}>
      {/* Ready banner */}
      {isReady && (
        <Paper elevation={4} sx={{ mb: 4, p: 4, bgcolor: 'success.main', color: 'success.contrastText', textAlign: 'center', borderRadius: 4 }}>
          <CelebrationIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="overline" display="block" fontWeight="bold" sx={{ opacity: 0.9 }}>Ready for pickup</Typography>
          <Typography variant="h5" fontWeight="bold" gutterBottom>Your Print is Ready!</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>Please collect your documents at the counter.</Typography>
        </Paper>
      )}

      {/* Token card */}
      <Card sx={{ textAlign: 'center', mb: 4 }}>
        <CardContent sx={{ py: 4 }}>
          <Typography variant="overline" color="text.secondary" fontWeight="bold" letterSpacing={1}>Token number</Typography>
          <Typography variant="h2" fontWeight="900" color="primary.main" gutterBottom>#{booking.tokenNumber}</Typography>
          <Badge status={booking.status} />
        </CardContent>
      </Card>

      {/* Queue position */}
      {!isCompleted && !isReady && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3} textAlign="center">
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Queue Position</Typography>
                <Typography variant="h3" fontWeight="900">{position !== null ? `#${position}` : '—'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="overline" color="text.secondary" fontWeight="bold">Est. Wait</Typography>
                <Typography variant="h3" fontWeight="900" color="primary.main">{estimatedWait !== null ? `${estimatedWait}m` : '—'}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Progress steps */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ py: 4 }}>
          <QueueProgress status={booking.status} />
        </CardContent>
      </Card>

      {/* Job details */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Job Details</Typography>
          <Stack spacing={2} sx={{ mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">PDFs</Typography>
              <Typography variant="body2" fontWeight="medium">{booking.files?.length || 1} file(s)</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Pages × Copies</Typography>
              <Typography variant="body2" fontWeight="medium">{booking.jobConfig?.pageCount} × {booking.jobConfig?.copies}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Mode</Typography>
              <Typography variant="body2" fontWeight="medium">{booking.jobConfig?.isColour ? 'Colour' : 'B&W'} · {booking.jobConfig?.paperSize}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Needed Date</Typography>
              <Typography variant="body2" fontWeight="medium">{booking.printDate ? formatDate(booking.printDate, 'date-only') : 'N/A'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Binding</Typography>
              <Typography variant="body2" fontWeight="medium" textTransform="capitalize">
                {booking.jobConfig?.binding === 'none' ? 'No binding' : booking.jobConfig?.binding || 'No binding'}
              </Typography>
            </Box>
            {booking.jobConfig?.comments && (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>Comments</Typography>
                <Paper elevation={0} sx={{ p: 2, bgcolor: 'surfaceContainer.main', borderRadius: 2 }}>
                  <Typography variant="body2">{booking.jobConfig.comments}</Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Payment</Typography>
              <Badge status={booking.paymentStatus} />
            </Box>

            {canPayOnline && (
              <Stack spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="warning"
                  fullWidth
                  disabled={paymentLoading}
                  onClick={async () => {
                    setPaymentLoading(true);
                    try {
                      const res = await customerAPI.getPaymentStatus(id);
                      const { paymentStatus, paymentProvider, invoiceNumber, paidAt, amountRefunded } = res.data;
                      if (paymentStatus !== booking.paymentStatus) {
                        setBooking(prev => ({
                          ...prev,
                          paymentStatus,
                          paymentProvider,
                          invoiceNumber,
                          paidAt,
                          amountRefunded,
                        }));
                        if (paymentStatus === 'paid') {
                          dispatch(addToast({ type: 'success', message: 'Payment confirmed.' }));
                        } else if (paymentStatus === 'failed') {
                          dispatch(addToast({ type: 'error', message: 'Payment failed. Please try again.' }));
                        }
                      } else {
                         dispatch(addToast({ type: 'info', message: 'Payment is still pending...' }));
                      }
                    } catch (err) {
                      dispatch(addToast({ type: 'error', message: 'Failed to verify payment status.' }));
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                >
                  {paymentLoading ? 'Verifying...' : 'Verify Payment Status'}
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  fullWidth
                  disabled={paymentLoading || user?.walletBalance < booking.totalPrice}
                  onClick={async () => {
                    setPaymentLoading(true);
                    try {
                      const idempotencyKey = `wallet-${booking._id}-${booking.totalPrice}`;
                      await customerAPI.payBookingWithWallet(booking._id, idempotencyKey);
                      dispatch(addToast({ type: 'success', message: 'Paid via wallet successfully!' }));
                      setBooking(prev => ({ ...prev, paymentStatus: 'paid', paymentProvider: 'wallet' }));
                    } catch (err) {
                      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Failed to pay via wallet' }));
                    } finally {
                      setPaymentLoading(false);
                    }
                  }}
                  startIcon={<WalletIcon />}
                >
                  Pay from Wallet (Bal: {formatCurrency(user?.walletBalance || 0)})
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={paymentLoading}
                  onClick={handleRazorpayPayment}
                  startIcon={<PaymentIcon />}
                >
                  {paymentLoading ? 'Opening...' : 'Pay with UPI / Card'}
                </Button>
              </Stack>
            )}

            {canDownloadInvoice && (
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                disabled={invoiceLoading}
                onClick={handleDownloadInvoice}
                startIcon={<DownloadIcon />}
                sx={{ mt: 2 }}
              >
                {invoiceLoading ? 'Preparing...' : 'Download Invoice'}
              </Button>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
              <Typography variant="h5" fontWeight="bold" color="primary.main">{formatCurrency(booking.totalPrice)}</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
