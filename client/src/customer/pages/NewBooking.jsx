import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToast } from '../../store/notificationSlice';
import * as customerAPI from '../../api/customer';
import { calculatePrice, DEFAULT_PRICING } from '../../utils/priceCalculator';
import { formatCurrency } from '../../utils/formatters';
import useSocket from '../../hooks/useSocket';
import useOfflineQueue from '../../hooks/useOfflineQueue';

import {
  Box, Typography, Stepper, Step, StepLabel, Button, Paper, Grid,
  CardActionArea, CircularProgress, IconButton, MenuItem, TextField,
  Divider, LinearProgress, Stack, Avatar
} from '@mui/material';
import CalendarIcon from '@mui/icons-material/CalendarMonth';
import UploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import CheckIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import StoreIcon from '@mui/icons-material/Storefront';
import PdfIcon from '@mui/icons-material/PictureAsPdf';

import Card, { CardContent } from '../../shared/Card';

const STEPS = ['Print Date', 'Configure Job', 'Review & Pay'];

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

export default function NewBooking() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { queueBooking } = useOfflineQueue();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  
  const priceResult = calculatePrice(files, pricing);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await customerAPI.getPricing(shopId);
        setPricing({ ...DEFAULT_PRICING, ...res.data });
      } catch {
        dispatch(addToast({ type: 'warning', message: 'Using default pricing until shop rates load.' }));
      }
    };
    fetchPricing();
  }, [dispatch, shopId]);

  const { isConnected, joinRoom, leaveRoom } = useSocket({
    pricingUpdated: (newPricing) => {
      setPricing({ ...DEFAULT_PRICING, ...newPricing });
    },
  });

  useEffect(() => {
    if (isConnected && shopId) {
      joinRoom(`shop:${shopId}`);
      return () => leaveRoom(`shop:${shopId}`);
    }
  }, [isConnected, joinRoom, leaveRoom, shopId]);

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;

    if (selectedFiles.some((f) => f.type !== 'application/pdf')) {
      dispatch(addToast({ type: 'error', message: 'Only PDF files are allowed' }));
      return;
    }
    if (selectedFiles.some((f) => f.size > 10 * 1024 * 1024)) {
      dispatch(addToast({ type: 'error', message: 'Each PDF must be under 10MB' }));
      return;
    }
    if (files.length + selectedFiles.length > 10) {
      dispatch(addToast({ type: 'error', message: 'You can upload up to 10 PDFs at once' }));
      return;
    }

    const newFiles = selectedFiles.map(f => ({
      originalFile: f,
      name: f.name,
      pageCount: 1,
      jobConfig: { copies: 1, paperSize: 'A4', isColour: false, isDoubleSided: false, pageRange: 'all', binding: 'none', comments: '' },
      uploadedData: null,
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    if (isOffline) {
      dispatch(addToast({ type: 'info', message: 'You are offline. Files will upload automatically when reconnected.' }));
      setFiles(prev => prev.map(f => ({ ...f, progress: 100 })));
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((f) => formData.append('files', f));

    try {
      setIsUploading(true);
      setFiles(prev => prev.map(f => f.progress === 0 ? { ...f, progress: 1 } : f));
      
      const res = await customerAPI.uploadFile(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        // We cap it at 99% until the server actually responds with the parsed data
        const safeProgress = Math.min(percentCompleted, 99);
        setFiles(prev => prev.map(f => (f.progress > 0 && f.progress < 100) ? { ...f, progress: safeProgress } : f));
      });
      
      const backendFiles = res.data.files || [];
      
      setFiles(prev => {
        let backendFileIndex = 0;
        return prev.map(f => {
          if (!f.uploadedData && backendFiles[backendFileIndex]) {
            const currentBackendFile = backendFiles[backendFileIndex];
            backendFileIndex++;
            return {
              ...f,
              progress: 100,
              pageCount: currentBackendFile.pageCount || 1,
              uploadedData: currentBackendFile
            };
          }
          return f;
        });
      });

      dispatch(addToast({ type: 'success', message: `Uploaded ${selectedFiles.length} PDF${selectedFiles.length > 1 ? 's' : ''}.` }));
    } catch (err) {
      setFiles(prev => prev.map(f => f.progress < 100 ? { ...f, progress: 0 } : f));
      dispatch(addToast({ type: 'error', message: 'Upload failed. Please try again.' }));
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));
  const updateFileConfig = (index, key, value) => {
    setFiles(prev => prev.map((f, i) => i === index ? { ...f, jobConfig: { ...f.jobConfig, [key]: value } } : f));
  };

  const canProceedStep2 = files.length > 0 && files.every(f => (f.progress === 100 || isOffline) && Number(f.jobConfig.copies) > 0);

  const createPendingBooking = async () => {
    const apiFiles = files.map(f => ({ ...(f.uploadedData || {}), jobConfig: f.jobConfig }));
    const bookingData = { shopId, printDate: selectedDate, paymentStatus: 'pending', files: apiFiles };

    if (isOffline) {
      await queueBooking({ ...bookingData, files: files.map(f => f.originalFile) });
      return { tokenNumber: 'OFFLINE', bookingId: 'offline' };
    }

    const res = await customerAPI.createBooking(bookingData);
    return res.data;
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const booking = await createPendingBooking();
      if (isOffline) {
        dispatch(addToast({ type: 'success', message: 'Booking saved offline! It will upload when reconnected.' }));
        navigate('/app/dashboard');
        return;
      }
      dispatch(addToast({ type: 'success', message: `Booking confirmed! Token #${booking.tokenNumber}` }));
      navigate(`/app/queue/${booking.bookingId}`);
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Booking failed' }));
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const booking = await createPendingBooking();
      const scriptReady = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptReady) throw new Error('Unable to load Razorpay checkout');

      const idempotencyKey = `razorpay-${booking.bookingId}-${Date.now()}`;
      const orderRes = await customerAPI.createRazorpayOrder(booking.bookingId, idempotencyKey);
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
        notes: { bookingId: booking.bookingId },
        handler: async (response) => {
          try {
            await customerAPI.verifyRazorpayPayment(response);
            dispatch(addToast({ type: 'success', message: `Payment received. Token #${booking.tokenNumber}` }));
            navigate(`/app/queue/${booking.bookingId}`);
          } catch (err) {
            dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Payment verification failed' }));
          }
        },
        modal: {
          ondismiss: () => {
            dispatch(addToast({ type: 'info', message: 'Payment cancelled. You can try again.' }));
            setLoading(false);
          },
        },
        theme: { color: '#2563eb' }
      });

      checkout.on('payment.failed', () => {
        dispatch(addToast({ type: 'error', message: 'Payment failed. Please try again.' }));
      });
      checkout.open();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Failed to initiate payment' }));
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (paymentMethod === 'online') {
      handleRazorpayPayment();
    } else {
      handleCreateBooking();
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', pb: 8, animation: 'fadeIn 0.5s ease' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>New Booking</Typography>
        <Typography variant="body1" color="text.secondary">Configure your print job and get it instantly</Typography>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 6 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 1: Print Date */}
      {activeStep === 0 && (
        <Box sx={{ animation: 'fadeInUp 0.4s ease' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>When do you need it?</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card 
                hover
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                sx={{ 
                  border: 2, 
                  borderColor: selectedDate === new Date().toISOString().split('T')[0] ? 'primary.main' : 'transparent',
                  bgcolor: selectedDate === new Date().toISOString().split('T')[0] ? 'primaryContainer.main' : 'background.paper'
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: selectedDate === new Date().toISOString().split('T')[0] ? 'primary.main' : 'surfaceContainer.main', color: selectedDate === new Date().toISOString().split('T')[0] ? 'white' : 'text.secondary' }}>
                      <CalendarIcon />
                    </Box>
                    {selectedDate === new Date().toISOString().split('T')[0] && <CheckIcon color="primary" />}
                  </Box>
                  <Typography variant="h6" fontWeight="bold">Today</Typography>
                  <Typography variant="body2" color="text.secondary">Join the live queue now</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button variant="contained" onClick={handleNext}>Continue</Button>
          </Box>
        </Box>
      )}

      {/* Step 2: Configure Job */}
      {activeStep === 1 && (
        <Box sx={{ animation: 'fadeInUp 0.4s ease' }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Upload PDFs</Typography>
          
          {files.length === 0 && (
            <Paper 
              component="label" 
              elevation={0}
              sx={{ 
                p: 6, mb: 4, display: 'block', textAlign: 'center', cursor: 'pointer',
                border: '2px dashed', borderColor: 'divider', borderRadius: 2,
                bgcolor: 'surfaceContainer.main', '&:hover': { bgcolor: 'surfaceContainerHighest.main', borderColor: 'primary.main' }
              }}
            >
              <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold" color="primary">Upload PDFs</Typography>
              <Typography variant="body2" color="text.secondary">Maximum 10 files, up to 10MB each</Typography>
              <input type="file" hidden accept=".pdf,application/pdf" multiple onChange={handleFileChange} />
            </Paper>
          )}

          {files.map((file, index) => (
            <Card key={index} sx={{ mb: 3, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'errorContainer.main', color: 'error.main' }} variant="rounded">
                      <PdfIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">{file.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{file.pageCount} pages detected</Typography>
                    </Box>
                  </Box>
                  <IconButton color="error" onClick={() => removeFile(index)} size="small">
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                {file.progress > 0 && file.progress < 100 && (
                  <LinearProgress variant="determinate" value={file.progress} sx={{ mb: 3, height: 6, borderRadius: 3 }} />
                )}

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField 
                      label="Copies" type="number" size="small" fullWidth
                      value={file.jobConfig.copies} 
                      onChange={(e) => {
                        const val = e.target.value;
                        updateFileConfig(index, 'copies', val === '' ? '' : Math.max(0, parseInt(val) || 0));
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <TextField 
                      label="Pages (e.g. 1-3, 5)" size="small" fullWidth placeholder="all"
                      value={file.jobConfig.pageRange} 
                      onChange={(e) => updateFileConfig(index, 'pageRange', e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField 
                      select label="Size" size="small" fullWidth
                      value={file.jobConfig.paperSize} 
                      onChange={(e) => updateFileConfig(index, 'paperSize', e.target.value)}
                    >
                      {['A4', 'A3', 'Letter'].map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                    <TextField 
                      select label="Color" size="small" fullWidth
                      value={file.jobConfig.isColour ? 'true' : 'false'} 
                      onChange={(e) => updateFileConfig(index, 'isColour', e.target.value === 'true')}
                    >
                      <MenuItem value="false">B&W</MenuItem>
                      <MenuItem value="true">Color</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4, md: 3 }}>
                    <TextField 
                      select label="Double Sided" size="small" fullWidth
                      value={file.jobConfig.isDoubleSided ? 'true' : 'false'} 
                      onChange={(e) => updateFileConfig(index, 'isDoubleSided', e.target.value === 'true')}
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField 
                      label="Additional Comments / Instructions" size="small" fullWidth
                      placeholder="e.g. Spiral binding, print first page in color..."
                      value={file.jobConfig.comments || ''} 
                      onChange={(e) => updateFileConfig(index, 'comments', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          {files.length > 0 && (
            <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondaryContainer.main', borderRadius: 2, mb: 4 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="onSecondaryContainer.main">
                Estimated Total: {formatCurrency(priceResult.totalPrice)}
              </Typography>
              <Typography variant="body2" color="onSecondaryContainer.main">
                Includes {priceResult.totalCalculatedPages} billable pages
              </Typography>
            </Paper>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button onClick={handleBack} color="inherit">Back</Button>
            <Button variant="contained" disabled={!canProceedStep2} onClick={handleNext}>Continue</Button>
          </Box>
        </Box>
      )}

      {/* Step 3: Review & Pay */}
      {activeStep === 2 && (
        <Box sx={{ animation: 'fadeInUp 0.4s ease' }}>
          <Card sx={{ mb: 4, border: 1, borderColor: 'divider', boxShadow: 'none' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Order Summary</Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Needed Date</Typography>
                  <Typography variant="subtitle2" fontWeight="bold">{selectedDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">PDFs</Typography>
                  <Typography variant="subtitle2" fontWeight="bold">{files.length || 0} file(s)</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1}>
                {priceResult.breakdown.map((item, i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography variant="body2" fontWeight="medium">{formatCurrency(item.amount)}</Typography>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">Total</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">{formatCurrency(priceResult.totalPrice)}</Typography>
              </Box>
            </CardContent>
          </Card>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card 
                onClick={() => setPaymentMethod('online')} 
                sx={{ 
                  height: '100%', 
                  border: 2, 
                  borderColor: paymentMethod === 'online' ? 'primary.main' : 'divider', 
                  bgcolor: paymentMethod === 'online' ? 'primaryContainer.main' : 'surfaceContainer.main',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <PaymentIcon color={paymentMethod === 'online' ? 'primary' : 'action'} sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Pay Now Online</Typography>
                  <Typography variant="caption" color="text.secondary">Razorpay checkout</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card 
                onClick={() => setPaymentMethod('shop')} 
                sx={{ 
                  height: '100%', 
                  border: 2, 
                  borderColor: paymentMethod === 'shop' ? 'primary.main' : 'divider', 
                  bgcolor: paymentMethod === 'shop' ? 'primaryContainer.main' : 'surfaceContainer.main',
                  transition: 'all 0.2s',
                  cursor: 'pointer'
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <StoreIcon color={paymentMethod === 'shop' ? 'primary' : 'action'} sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">Pay at Counter</Typography>
                  <Typography variant="caption" color="text.secondary">Pay when you collect</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4 }}>
            <Button onClick={handleBack} color="inherit" disabled={loading}>
              Back
            </Button>
            <Button 
              variant="contained" 
              size="large"
              disabled={loading} 
              onClick={handleBookNow}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ px: 6, py: 1.5 }}
            >
              {loading ? 'Processing...' : 'Book Now'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
