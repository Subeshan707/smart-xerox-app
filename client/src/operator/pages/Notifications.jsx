import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import * as operatorAPI from '../../api/operator';
import { addToast, setPushPermission } from '../../store/notificationSlice';
import { requestBrowserNotifications } from '../../utils/browserNotifications';

import { 
  Box, Typography, Button, TextField, Grid
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/NotificationsActive';
import Card, { CardContent } from '../../shared/Card';

export default function Notifications() {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([
    {
      id: 1,
      message: 'Machine maintenance - 30 min delay expected',
      sentAt: new Date().toISOString(),
      recipients: 12,
    },
  ]);

  const enableNotifications = async () => {
    const permission = await requestBrowserNotifications();
    dispatch(setPushPermission(permission));
    dispatch(addToast({
      type: permission === 'granted' ? 'success' : 'warning',
      message: permission === 'granted'
        ? 'Owner popups enabled'
        : 'Browser popups were not enabled',
    }));
  };

  const handleBroadcast = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await operatorAPI.broadcastNotification({ title: 'Shop update', message });
      setHistory(prev => [
        {
          id: Date.now(),
          message,
          sentAt: new Date().toISOString(),
          recipients: res.data.recipients,
        },
        ...prev,
      ]);
      setMessage('');
      dispatch(addToast({
        type: 'success',
        message: `Broadcast sent to ${res.data.recipients} active customers`,
      }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to send broadcast' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">Send alerts to all customers with bookings today.</Typography>
        </Box>
        <Button 
          variant="outlined" 
          color="primary" 
          size="small" 
          onClick={enableNotifications}
          startIcon={<NotificationsIcon />}
        >
          Enable owner popups
        </Button>
      </Box>

      <Card sx={{ mb: 6 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Compose Broadcast</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Type your message... (e.g., Machine maintenance - 30 min delay expected)"
            inputProps={{ maxLength: 160 }}
            sx={{ mt: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {message.length}/160 characters
            </Typography>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBroadcast} 
              disabled={!message.trim() || sending}
              startIcon={<SendIcon />}
            >
              {sending ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="h6" fontWeight="bold" gutterBottom>Notification History</Typography>
        {history.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body2" color="text.secondary">No notifications sent yet.</Typography>
          </Card>
        ) : (
          <Grid container spacing={2}>
            {history.map(notification => (
              <Grid item xs={12} key={notification.id}>
                <Card>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="body1" mb={1}>{notification.message}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.sentAt).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {notification.recipients} recipients
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
