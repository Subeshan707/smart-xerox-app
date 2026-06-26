import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMyBookings } from '../../store/bookingSlice';
import { getGreeting } from '../../utils/formatters';
import { requestBrowserNotifications } from '../../utils/browserNotifications';
import { setPushPermission, addToast } from '../../store/notificationSlice';
import * as customerAPI from '../../api/customer';

import { 
  Box, Typography, Grid, Paper, IconButton, Button, CardActionArea, 
  Stack, Avatar, CircularProgress, Alert
} from '@mui/material';
import NotificationIcon from '@mui/icons-material/NotificationsActive';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/AddCircleOutlined';
import QrIcon from '@mui/icons-material/QrCodeScanner';
import PriceIcon from '@mui/icons-material/Calculate';
import SupportIcon from '@mui/icons-material/SupportAgent';
import StoreIcon from '@mui/icons-material/Storefront';
import PrintIcon from '@mui/icons-material/Print';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

import Card, { CardContent, CardHeader } from '../../shared/Card';
import Badge from '../../shared/Badge';
import BookingCard from '../components/BookingCard';
import PriceEstimatorModal from '../components/PriceEstimatorModal';

export default function Dashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { bookings, loading } = useSelector((state) => state.booking);
  const { pushPermission } = useSelector((state) => state.notification);

  const [shops, setShops] = useState([]);
  const [estimatorOpen, setEstimatorOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchMyBookings());
    
    const fetchShops = async () => {
      try {
        const res = await customerAPI.getShops();
        setShops(res.data || []);
      } catch (err) {
        console.error("Failed to load shops", err);
      }
    };
    fetchShops();
  }, [dispatch]);

  const greeting = getGreeting();
  const firstName = user?.name?.split(' ')[0] || 'there';

  const activeBooking = bookings.find((b) =>
    ['queued', 'printing', 'printed', 'ready'].includes(b.status)
  );

  const recentBookings = bookings.slice(0, 5);

  const enableNotifications = async () => {
    const permission = await requestBrowserNotifications();
    dispatch(setPushPermission(permission));
    dispatch(addToast({
      type: permission === 'granted' ? 'success' : 'warning',
      message: permission === 'granted' ? 'Queue popups enabled' : 'Browser popups were not enabled',
    }));
  };

  if (loading && bookings.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      <PriceEstimatorModal open={estimatorOpen} onClose={() => setEstimatorOpen(false)} />

      {/* Header & Greeting */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {greeting.text}, {firstName}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Book, track, and collect without waiting.
          </Typography>
        </Box>
        {pushPermission !== 'granted' && (
          <Button variant="outlined" size="small" onClick={enableNotifications} startIcon={<NotificationIcon />}>
            Enable Alerts
          </Button>
        )}
      </Box>

      {/* Wallet Summary Card */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'primaryContainer.main', borderRadius: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <WalletIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" color="onPrimaryContainer.main" fontWeight="medium">
              Wallet Balance
            </Typography>
            <Typography variant="h4" color="onPrimaryContainer.main" fontWeight="bold">
              ₹{user?.walletBalance || 0}
            </Typography>
          </Box>
          <Button variant="contained" color="primary" sx={{ borderRadius: 8 }} onClick={() => navigate('/app/profile')}>
            Top Up
          </Button>
        </Box>
      </Paper>

      {/* Active Queue Status */}
      {activeBooking && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} />
            Active Print Job
          </Typography>
          <Card hover onClick={() => navigate(`/app/queue/${activeBooking._id}`)} sx={{ bgcolor: 'surfaceContainer.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Token #{activeBooking.tokenNumber}
                    </Typography>
                    <Badge status={activeBooking.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {activeBooking.jobConfig?.fileName || 'Document'} • {activeBooking.jobConfig?.pageCount || 0} pages
                  </Typography>
                </Box>
                <ChevronRightIcon color="primary" />
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Quick Actions (2x2 Grid) */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }, gap: 2 }}>
          {[
            { label: 'New Print', icon: <AddIcon fontSize="large" />, action: () => navigate('/app/shops'), color: 'primary.main' },
            { label: 'Scan QR', icon: <QrIcon fontSize="large" />, action: () => {}, color: 'secondary.main' },
            { label: 'Price Calc', icon: <PriceIcon fontSize="large" />, action: () => setEstimatorOpen(true), color: 'success.main' },
            { label: 'Support', icon: <SupportIcon fontSize="large" />, action: () => {}, color: 'info.main' },
          ].map((action, index) => (
            <Card key={index} hover onClick={action.action} padding="sm" sx={{ textAlign: 'center', height: '100%' }}>
              <CardContent sx={{ py: 3 }}>
                <Box sx={{ color: action.color, mb: 1 }}>{action.icon}</Box>
                <Typography variant="body2" fontWeight="bold">{action.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* Nearby Shops (Horizontal Scroll) */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Nearby Shops</Typography>
          <Button component={Link} to="/app/shops" size="small">View all</Button>
        </Box>
        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, mx: -2, px: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
          {shops.slice(0, 3).map((shop) => (
            <Card key={shop._id} hover sx={{ minWidth: 260, flexShrink: 0 }} onClick={() => navigate(`/app/shops/${shop._id}/book`)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'surfaceContainer.main', color: 'primary.main', width: 48, height: 48 }} variant="rounded">
                    <StoreIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: 160 }}>
                      {shop.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
                      {shop.address || 'Address not provided'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
                      <Typography variant="caption" fontWeight="medium">
                        {shop.phone ? shop.phone : 'Available'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      {/* Recent Bookings */}
      <Box sx={{ pb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Recent Orders</Typography>
          {bookings.length > 5 && (
            <Button component={Link} to="/app/history" size="small">View all</Button>
          )}
        </Box>

        {recentBookings.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'surfaceContainer.main', borderRadius: 4 }}>
            <PrintIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>No bookings yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first print booking to get started.
            </Typography>
            <Button variant="contained" component={Link} to="/app/shops">
              Find a Shop
            </Button>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {recentBookings.map((booking) => (
              <BookingCard key={booking._id} booking={booking} />
            ))}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
