import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import * as operatorAPI from '../../api/operator';
import { addToast } from '../../store/notificationSlice';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { PageSpinner } from '../../shared/Spinner';
import Badge from '../../shared/Badge';
import KanbanBoard from '../components/KanbanBoard';

import { 
  Box, Typography, Button, Grid, Paper, TextField, MenuItem, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  InputAdornment, IconButton, useMediaQuery, useTheme,
  ToggleButton, ToggleButtonGroup
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';
import Card, { CardContent } from '../../shared/Card';

export default function BookingManagement() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', date: '', search: '' });
  const [viewMode, setViewMode] = useState('kanban');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await operatorAPI.getAllBookings(filters);
      setBookings(res.data || []);
    } catch { 
      dispatch(addToast({ type: 'error', message: 'Failed to load bookings' })); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchBookings(); }, [filters.status, filters.date]);

  const handleExportCSV = async () => {
    try {
      const res = await operatorAPI.exportBookingsCSV(filters);
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      dispatch(addToast({ type: 'success', message: 'CSV exported!' }));
    } catch { 
      dispatch(addToast({ type: 'error', message: 'Export failed' })); 
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    // Optimistic UI update
    setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
    try {
      await operatorAPI.updateBookingStatus(bookingId, newStatus);
      dispatch(addToast({ type: 'success', message: `Status updated to ${newStatus}` }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to update status' }));
      fetchBookings(); // revert on failure
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        b.customerId?.name?.toLowerCase().includes(q) ||
        b.customerId?.phone?.includes(q) ||
        b.tokenNumber?.toString().includes(q)
      );
    }
    return true;
  });

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, p: 3, mb: 4, bgcolor: 'surfaceContainer.main', borderRadius: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Job Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage active print jobs and audit history.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, newMode) => newMode && setViewMode(newMode)}
            size="small"
            sx={{ bgcolor: 'background.paper' }}
          >
            <ToggleButton value="kanban"><ViewKanbanIcon sx={{ mr: 1 }} /> KDS</ToggleButton>
            <ToggleButton value="list"><ViewListIcon sx={{ mr: 1 }} /> List</ToggleButton>
          </ToggleButtonGroup>
          <Button 
            variant="contained" 
            color="secondary" 
            onClick={handleExportCSV}
            startIcon={<FileDownloadIcon />}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters (only fully relevant in list mode, but keep available) */}
      <Card sx={{ mb: 4, display: viewMode === 'list' ? 'block' : 'none' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search"
                placeholder="Name, phone, or token..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
                  endAdornment: filters.search && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setFilters(prev => ({ ...prev, search: '' }))}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Status"
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="queued">Queued</MenuItem>
                <MenuItem value="printing">Printing</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={filters.date}
                onChange={(e) => setFilters(prev => ({ ...prev, date: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading ? <PageSpinner /> : (
        <>
          {viewMode === 'kanban' ? (
            <KanbanBoard bookings={filteredBookings} onStatusChange={handleStatusChange} />
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {filteredBookings.length} bookings found
              </Typography>

              {!isMobile ? (
                /* Desktop table */
                <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'surfaceContainer.main' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Token</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>File</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Config</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Price</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Payment</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredBookings.map(b => (
                        <TableRow key={b._id} hover>
                          <TableCell sx={{ fontWeight: 'bold' }}>#{b.tokenNumber}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">{b.customerId?.name || 'N/A'}</Typography>
                            <Typography variant="caption" color="text.secondary">{b.customerId?.phone || ''}</Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 120 }}>
                            <Typography variant="body2" noWrap>{b.jobConfig?.fileName || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {b.jobConfig?.pageCount}pg × {b.jobConfig?.copies} · {b.jobConfig?.isColour ? 'C' : 'BW'} · {b.jobConfig?.paperSize}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>{formatCurrency(b.totalPrice)}</TableCell>
                          <TableCell><Badge status={b.status} /></TableCell>
                          <TableCell><Badge status={b.paymentStatus} /></TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(b.createdAt, 'date-only')}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                /* Mobile cards */
                <Grid container spacing={2}>
                  {filteredBookings.map(b => (
                    <Grid item xs={12} key={b._id}>
                      <Card>
                        <CardContent sx={{ pb: '16px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold" component="span" mr={1}>
                                #{b.tokenNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span">
                                {b.customerId?.name}
                              </Typography>
                            </Box>
                            <Badge status={b.status} />
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              {b.jobConfig?.fileName} · {b.jobConfig?.pageCount}pg × {b.jobConfig?.copies}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(b.createdAt, 'date-only')}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {formatCurrency(b.totalPrice)}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
