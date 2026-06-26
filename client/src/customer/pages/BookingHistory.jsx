import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyBookings, setFilter } from '../../store/bookingSlice';
import BookingCard from '../components/BookingCard';
import { PageSpinner } from '../../shared/Spinner';

import { Box, Typography, Tabs, Tab, Stack } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingHistory() {
  const dispatch = useDispatch();
  const { bookings, loading, filter } = useSelector((state) => state.booking);

  useEffect(() => {
    dispatch(fetchMyBookings());
  }, [dispatch]);

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['queued', 'printing', 'printed', 'ready'].includes(b.status);
    if (filter === 'completed') return b.status === 'completed';
    if (filter === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  if (loading && bookings.length === 0) {
    return <PageSpinner message="Loading your bookings..." />;
  }

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Booking History</Typography>
        <Typography variant="body2" color="text.secondary">View and manage all your past and active bookings.</Typography>
      </Box>

      {/* Filter tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={filter} 
          onChange={(e, newVal) => dispatch(setFilter(newVal))}
          variant="scrollable"
          scrollButtons="auto"
        >
          {FILTERS.map((f) => (
            <Tab key={f.key} value={f.key} label={f.label} sx={{ fontWeight: 'bold', textTransform: 'none' }} />
          ))}
        </Tabs>
      </Box>

      {/* Bookings list */}
      {filteredBookings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box sx={{ width: 64, height: 64, bgcolor: 'surfaceContainerHighest.main', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
          </Box>
          <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
            No bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try changing the filter or create a new booking.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={2}>
          {filteredBookings.map((booking) => (
            <BookingCard key={booking._id} booking={booking} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
