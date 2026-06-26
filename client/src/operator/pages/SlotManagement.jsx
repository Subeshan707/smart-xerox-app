import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/notificationSlice';

import { 
  Box, Typography, Button, Grid, Switch, IconButton, Divider, alpha, useTheme 
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import BlockIcon from '@mui/icons-material/Block';
import Card, { CardContent } from '../../shared/Card';

const initialSchedule = [
  { id: 1, day: 'Monday', isOpen: true, open: '09:00', close: '17:00', capacity: 10 },
  { id: 2, day: 'Tuesday', isOpen: true, open: '09:00', close: '17:00', capacity: 10 },
  { id: 3, day: 'Wednesday', isOpen: true, open: '09:00', close: '17:00', capacity: 10 },
  { id: 4, day: 'Thursday', isOpen: true, open: '09:00', close: '17:00', capacity: 10 },
  { id: 5, day: 'Friday', isOpen: true, open: '09:00', close: '17:00', capacity: 10 },
  { id: 6, day: 'Saturday', isOpen: false, open: '10:00', close: '14:00', capacity: 5 },
  { id: 7, day: 'Sunday', isOpen: false, open: '10:00', close: '14:00', capacity: 5 },
];

export default function SlotManagement() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const [schedule, setSchedule] = useState(initialSchedule);
  const [saving, setSaving] = useState(false);

  const handleToggle = (id) => {
    setSchedule(schedule.map(s => s.id === id ? { ...s, isOpen: !s.isOpen } : s));
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      dispatch(addToast({ type: 'success', message: 'Weekly schedule updated successfully!' }));
    }, 800);
  };

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Weekly Schedule</Typography>
          <Typography variant="body2" color="text.secondary">Set your standard operating hours and capacity.</Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleSave}
          disabled={saving}
          startIcon={<SaveIcon />}
          sx={{ borderRadius: 8, px: 3 }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {schedule.map((dayItem) => {
          const isClosed = !dayItem.isOpen;
          return (
            <Grid item xs={12} md={6} xl={4} key={dayItem.id}>
              <Card 
                sx={{ 
                  transition: 'all 0.3s ease',
                  transform: isClosed ? 'scale(0.98)' : 'scale(1)',
                  opacity: isClosed ? 0.8 : 1,
                  bgcolor: isClosed ? 'surfaceContainerHighest.main' : 'background.paper',
                  border: 2,
                  borderColor: isClosed ? 'transparent' : 'primary.main',
                  boxShadow: isClosed ? 'none' : `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                }}
              >
                <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="900" color={isClosed ? 'text.secondary' : 'text.primary'}>
                      {dayItem.day}
                    </Typography>
                    <Switch 
                      checked={dayItem.isOpen} 
                      onChange={() => handleToggle(dayItem.id)} 
                      color="primary"
                    />
                  </Box>

                  <Divider />

                  {/* Details */}
                  {isClosed ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.disabled', py: 1 }}>
                      <BlockIcon fontSize="small" />
                      <Typography variant="body2" fontWeight="bold">Shop Closed</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight="bold" textTransform="uppercase">
                          Operating Hours
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary.main">
                          {dayItem.open} - {dayItem.close}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5} fontWeight="bold" textTransform="uppercase">
                          Slots / Hour
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="bold">
                            {dayItem.capacity}
                          </Typography>
                          <IconButton size="small" color="primary" sx={{ bgcolor: 'primaryContainer.main' }}>
                            <EditIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
