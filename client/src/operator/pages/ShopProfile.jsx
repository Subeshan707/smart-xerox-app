import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/notificationSlice';
import * as operatorAPI from '../../api/operator';

import { 
  Box, Typography, Button, TextField, Checkbox, 
  FormControlLabel, Grid, Paper, CircularProgress, Alert
} from '@mui/material';
import Card, { CardContent } from '../../shared/Card';

import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

export default function ShopProfile() {
  const dispatch = useDispatch();
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });
  const [shop, setShop] = useState({
    name: '',
    address: '',
    phone: '',
    lat: null,
    lng: null,
    operatingHours: [
      { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
      { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
      { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
      { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
      { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
      { day: 'Saturday', open: '09:00', close: '13:00', isOpen: true },
      { day: 'Sunday', open: '00:00', close: '00:00', isOpen: false },
    ],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await operatorAPI.getShopProfile();
        if (res.data) {
          if (!res.data.operatingHours || res.data.operatingHours.length === 0) {
            res.data.operatingHours = shop.operatingHours; // Use default if empty
          }
          setShop(res.data);
        }
      } catch (err) {
        dispatch(addToast({ type: 'error', message: 'Failed to load shop profile' }));
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShop((prev) => ({ ...prev, [name]: value }));
  };

  const handleHoursChange = (index, field, value) => {
    setShop((prev) => {
      const newHours = [...prev.operatingHours];
      newHours[index] = { ...newHours[index], [field]: value };
      return { ...prev, operatingHours: newHours };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!shop.lat || !shop.lng) {
      dispatch(addToast({ type: 'error', message: 'Please drop a pin on the map for your shop location.' }));
      return;
    }
    setSaving(true);
    try {
      await operatorAPI.updateShopProfile(shop);
      dispatch(addToast({ type: 'success', message: 'Shop profile updated successfully' }));
    } catch (err) {
      dispatch(addToast({ type: 'error', message: 'Failed to update shop profile' }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={12}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const defaultCenter = [12.9716, 77.5946]; // Default to Bangalore if no location

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Shop Profile</Typography>
        <Typography variant="body2" color="text.secondary">Manage your public shop details that customers will see.</Typography>
      </Box>

      <Card>
        <form onSubmit={handleSave}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Box>
              <TextField
                fullWidth
                label="Shop Name"
                name="name"
                value={shop.name || ''}
                onChange={handleChange}
                required
                placeholder="e.g. Smart Xerox Center"
                variant="outlined"
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Shop Address"
                name="address"
                value={shop.address || ''}
                onChange={handleChange}
                required
                multiline
                rows={3}
                placeholder="Enter your complete shop address"
                variant="outlined"
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Pin Location</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>Click on the map to drop a pin exactly where your shop is located.</Alert>
              <Paper sx={{ height: 300, overflow: 'hidden', borderRadius: 2, border: 1, borderColor: 'divider' }}>
                {!isLoaded ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    center={shop.lat ? { lat: shop.lat, lng: shop.lng } : defaultCenter}
                    zoom={13}
                    options={{ disableDefaultUI: true, zoomControl: true }}
                    onClick={(e) => setShop(prev => ({ ...prev, lat: e.latLng.lat(), lng: e.latLng.lng() }))}
                  >
                    {shop.lat && shop.lng && (
                      <MarkerF position={{ lat: shop.lat, lng: shop.lng }} />
                    )}
                  </GoogleMap>
                )}
              </Paper>
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Contact Phone"
                name="phone"
                type="tel"
                value={shop.phone || ''}
                onChange={handleChange}
                placeholder="e.g. +91 9876543210"
                variant="outlined"
              />
            </Box>

            <Box sx={{ pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Operating Hours</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                {(shop.operatingHours || []).map((hour, index) => (
                  <Grid container spacing={2} alignItems="center" key={hour.day}>
                    <Grid item xs={12} sm={4}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={hour.isOpen}
                            onChange={(e) => handleHoursChange(index, 'isOpen', e.target.checked)}
                            color="primary"
                          />
                        }
                        label={<Typography variant="body2" fontWeight="medium">{hour.day}</Typography>}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      {hour.isOpen ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <TextField
                            type="time"
                            size="small"
                            value={hour.open}
                            onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
                            fullWidth
                          />
                          <Typography variant="body2" color="text.secondary">to</Typography>
                          <TextField
                            type="time"
                            size="small"
                            value={hour.close}
                            onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
                            fullWidth
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic" py={1}>
                          Closed
                        </Typography>
                      )}
                    </Grid>
                  </Grid>
                ))}
              </Box>
            </Box>

            <Box sx={{ pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary" 
                size="large" 
                fullWidth 
                disabled={saving}
                sx={{ fontWeight: 'bold' }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </Box>
          </CardContent>
        </form>
      </Card>
    </Box>
  );
}
