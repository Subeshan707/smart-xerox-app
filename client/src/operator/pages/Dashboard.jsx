import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import * as operatorAPI from '../../api/operator';
import useSocket from '../../hooks/useSocket';
import { addToast } from '../../store/notificationSlice';
import QueueCard from '../components/QueueCard';
import { PageSpinner } from '../../shared/Spinner';
import Modal from '../../shared/Modal';

import { 
  Box, Typography, Button, Grid, Paper, Chip, Avatar
} from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';
import SensorsIcon from '@mui/icons-material/Sensors';
import InfoIcon from '@mui/icons-material/Info';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Card, { CardContent } from '../../shared/Card';

export default function Dashboard() {
  const dispatch = useDispatch();
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, queued: 0, printing: 0, ready: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  
  const [previewBooking, setPreviewBooking] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewMeta, setPreviewMeta] = useState(null);

  const fetchDashboard = async () => {
    try {
      const res = await operatorAPI.getDashboard();
      setBookings(res.data.bookings || []);
      setSummary(res.data.summary || {});
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to load dashboard' }));
    } finally {
      setLoading(false);
    }
  };

  // Socket for real-time updates
  useSocket({
    queueUpdated: () => fetchDashboard(),
    paymentUpdated: (data) => {
      setBookings(prev => prev.map(booking => (
        booking._id === data.bookingId
          ? {
            ...booking,
            paymentStatus: data.paymentStatus,
            paymentProvider: data.paymentProvider,
            paymentId: data.paymentId,
            invoiceNumber: data.invoiceNumber,
            paidAt: data.paidAt,
            amountRefunded: data.amountRefunded,
          }
          : booking
      )));

      if (data.paymentStatus === 'paid') {
        dispatch(addToast({ type: 'success', message: 'Customer payment received.' }));
      }
    },
  });

  useEffect(() => { fetchDashboard(); }, []);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      await operatorAPI.updateBookingStatus(bookingId, newStatus);
      dispatch(addToast({ type: 'success', message: `Status updated to ${newStatus}` }));
      await fetchDashboard();
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update status' }));
    }
  };

  const handleOpenPreview = async (booking) => {
    try {
      dispatch(addToast({ type: 'info', message: 'Loading document...' }));
      setPreviewBooking(booking);
      const res = await operatorAPI.getSignedFileUrl(booking._id);

      try {
        const response = await fetch(res.data.url);
        if (!response.ok) throw new Error('Document could not be loaded');
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const mimeType = res.data.mimeType || blob.type || '';
        const fileName = (res.data.fileName || '').toLowerCase();
        const isPdf = mimeType === 'application/pdf' || fileName.endsWith('.pdf');
        const isImage = mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/.test(fileName);

        setPreviewMeta({
          ...res.data,
          mimeType,
          previewable: isPdf || isImage,
        });
        setPreviewUrl(objectUrl);
      } catch {
        setPreviewMeta({ ...res.data, previewable: false });
        setPreviewUrl(res.data.url);
        dispatch(addToast({ type: 'warning', message: 'Preview blocked by storage. Open the original document to print.' }));
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Failed to load document' }));
      setPreviewBooking(null);
      setPreviewMeta(null);
    }
  };

  const closePreview = () => {
    setPreviewBooking(null);
    setPreviewMeta(null);
    if (previewUrl) {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handlePrintFromPreview = () => {
    if (!previewUrl) return;
    try {
      if (!previewMeta?.previewable) {
        window.open(previewMeta?.url || previewUrl, '_blank', 'noopener,noreferrer');
        dispatch(addToast({ type: 'info', message: 'Document opened. Use that app to print it.' }));
        return;
      }

      const iframe = document.getElementById('preview-iframe');
      iframe.contentWindow.print();
      
      if (['queued', 'printing'].includes(previewBooking.status)) {
        handleStatusUpdate(previewBooking._id, 'printed');
      }
    } catch (e) {
      console.error("Print error:", e);
      dispatch(addToast({ type: 'error', message: 'Failed to open print dialog.' }));
    }
  };

  if (loading) return <PageSpinner message="Loading queue..." />;

  const activeBookings = bookings.filter(b => b.status !== 'completed' && b.status !== 'cancelled');
  const completedToday = bookings.filter(b => b.status === 'completed');

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, p: 3, mb: 4, bgcolor: 'surfaceContainer.main', borderRadius: 2 }}>
        <Box>
          <Typography variant="overline" color="primary.main" fontWeight="bold">Shop Owner Console</Typography>
          <Typography variant="h4" fontWeight="bold">Live Queue</Typography>
          <Typography variant="body2" color="text.secondary">Prioritize, preview, print, and complete today&apos;s jobs.</Typography>
        </Box>
        <Chip 
          icon={<SensorsIcon sx={{ animation: 'pulse 2s infinite' }} />} 
          label="Realtime" 
          color="primary" 
          variant="outlined" 
          sx={{ fontWeight: 'bold' }} 
        />
      </Box>

      {/* Summary bar */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 6 }}>
        {[
          { label: 'Total', value: summary.total, color: 'text.primary', bgcolor: 'surfaceContainer.main' },
          { label: 'Queued', value: summary.queued, color: 'warning.main', bgcolor: 'warningContainer.main' },
          { label: 'Done', value: summary.completed, color: 'success.main', bgcolor: 'successContainer.main' },
        ].map(stat => (
          <Card key={stat.label} sx={{ 
            bgcolor: stat.bgcolor, 
            textAlign: 'center',
            width: { xs: 'calc(50% - 8px)', sm: 130 },
            flexShrink: 0, 
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 1, 
            borderColor: 'divider', 
            boxShadow: 'none',
            borderRadius: 2
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, width: '100%' }}>
              <Typography variant="h3" fontWeight="900" sx={{ color: stat.color }}>{stat.value}</Typography>
              <Typography variant="caption" fontWeight="bold" color="text.secondary" textTransform="uppercase" letterSpacing={1}>{stat.label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Active queue */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <CircleIcon color="success" sx={{ fontSize: 12, animation: 'pulse 2s infinite' }} />
        <Typography variant="h5" fontWeight="bold">Active Jobs ({activeBookings.length})</Typography>
      </Box>

      {activeBookings.length === 0 ? (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'surfaceContainer.main', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
          <CheckIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight="bold" color="text.primary">All clear!</Typography>
          <Typography variant="body2" color="text.secondary">No active jobs in the queue right now.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {activeBookings.map(booking => (
            <Grid item xs={12} md={6} xl={4} key={booking._id}>
              <QueueCard
                booking={booking}
                onStatusUpdate={handleStatusUpdate}
                onViewFile={handleOpenPreview}
                onPrintFile={handleOpenPreview}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Completed today */}
      {completedToday.length > 0 && (
        <Box sx={{ mt: 6, opacity: 0.7 }}>
          <Typography variant="h6" fontWeight="bold" color="text.secondary" gutterBottom>
            Completed Today ({completedToday.length})
          </Typography>
          <Grid container spacing={2}>
            {completedToday.slice(0, 6).map(booking => (
              <Grid item xs={12} md={6} xl={4} key={booking._id}>
                <QueueCard
                  booking={booking}
                  onStatusUpdate={handleStatusUpdate}
                  onViewFile={handleOpenPreview}
                  onPrintFile={handleOpenPreview}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Document Preview Modal */}
      <Modal
        isOpen={!!previewBooking}
        onClose={closePreview}
        title={`Document Preview - #${previewBooking?.tokenNumber}`}
        size="full"
        footer={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', width: '100%' }}>
            {previewMeta?.url && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => window.open(previewMeta.url, '_blank', 'noopener,noreferrer')}
                startIcon={<OpenInNewIcon />}
              >
                Open Original
              </Button>
            )}
            <Button variant="outlined" color="inherit" onClick={closePreview}>Close</Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePrintFromPreview} 
              disabled={!previewUrl}
              startIcon={<PrintIcon />}
            >
              Print Document
            </Button>
          </Box>
        }
      >
        {previewMeta?.files?.length > 1 && (
          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'surfaceContainer.main', borderRadius: 2 }}>
            <Typography variant="overline" fontWeight="bold" color="text.secondary" display="block" gutterBottom>
              Uploaded PDFs ({previewMeta.files.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {previewMeta.files.map((file, index) => (
                <Chip
                  key={file.fileUrl || file.fileName || index}
                  label={`${index + 1}. ${file.fileName || `PDF ${index + 1}`}`}
                  onClick={() => window.open(file.fileUrl, '_blank', 'noopener,noreferrer')}
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Paper>
        )}
        
        {previewUrl && previewMeta?.previewable ? (
          <Box sx={{ w: '100%', height: '70vh', bgcolor: 'surfaceContainerHighest.main', borderRadius: 2, overflow: 'hidden' }}>
            <iframe
              id="preview-iframe"
              src={previewUrl}
              style={{ width: '100%', height: '100%', border: 0 }}
              title="Document Preview"
            />
          </Box>
        ) : previewUrl ? (
          <Paper elevation={0} sx={{ height: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'surfaceContainer.main', borderRadius: 2, textAlign: 'center', p: 4 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'background.paper', mb: 2 }}>
              <InfoIcon color="action" fontSize="large" />
            </Avatar>
            <Typography variant="h6" fontWeight="bold" gutterBottom>{previewMeta?.fileName || 'Uploaded document'}</Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={400} mb={3}>
              This file type cannot be previewed inside the browser. Open the original document and print it from the app that opens it.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.open(previewMeta?.url || previewUrl, '_blank', 'noopener,noreferrer')}
            >
              Open Document
            </Button>
          </Paper>
        ) : (
          <Box sx={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
            <Box sx={{ width: 40, height: 40, border: 4, borderColor: 'primary.main', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', mb: 2 }} />
            <Typography>Loading document securely...</Typography>
          </Box>
        )}
      </Modal>
    </Box>
  );
}
