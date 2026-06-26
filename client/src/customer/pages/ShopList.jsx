import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/notificationSlice';
import * as customerAPI from '../../api/customer';
import useSocket from '../../hooks/useSocket';
import useGeolocation from '../../hooks/useGeolocation';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';

// Helper for Haversine distance
function getDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

// Removed RecenterMap as GoogleMap handles it naturally via center prop

import { 
  Box, Typography, Grid, Paper, CircularProgress, Avatar, Chip, Stack,
  ToggleButton, ToggleButtonGroup, Button
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Storefront';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoIcon from '@mui/icons-material/Info';
import ViewListIcon from '@mui/icons-material/ViewList';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';

import Card, { CardContent } from '../../shared/Card';

export default function ShopList() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [rawShops, setRawShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [selectedShop, setSelectedShop] = useState(null);
  
  const location = useGeolocation();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await customerAPI.getShops();
        setRawShops(res.data || []);
      } catch (err) {
        dispatch(addToast({ type: 'error', message: 'Failed to load shops' }));
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [dispatch]);

  const { isConnected, joinRoom, leaveRoom } = useSocket({
    shopProfileUpdated: (updatedShop) => {
      setRawShops((prevShops) => {
        const exists = prevShops.find(s => s._id === updatedShop._id);
        if (exists) {
          return prevShops.map(s => s._id === updatedShop._id ? { ...s, lat: updatedShop.lat, lng: updatedShop.lng } : s);
        } else {
          return [...prevShops, updatedShop];
        }
      });
    },
  });

  useEffect(() => {
    if (isConnected) {
      joinRoom('global');
      return () => leaveRoom('global');
    }
  }, [isConnected, joinRoom, leaveRoom]);

  // Calculate distances and sort shops based on user location
  const shops = useMemo(() => {
    if (!location.loaded || location.error) {
      return rawShops.map(s => ({ ...s, distance: null }));
    }
    
    const userLat = location.coordinates.lat;
    const userLng = location.coordinates.lng;

    const shopsWithDistance = rawShops.map(shop => {
      if (!shop.lat || !shop.lng) {
        return { ...shop, distance: Infinity };
      }
      const dist = getDistance(userLat, userLng, shop.lat, shop.lng);
      return { ...shop, distance: dist };
    });

    // Sort by closest distance
    return shopsWithDistance.sort((a, b) => a.distance - b.distance);
  }, [rawShops, location]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const getShopStatus = (shop) => {
    const todayStr = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const todayHours = (shop.operatingHours || []).find(h => h.day === todayStr);
    
    if (!todayHours || !todayHours.isOpen) {
      return { label: 'Closed', color: 'error' };
    }
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    if (todayHours.open && currentTime < todayHours.open) {
      return { label: `Opens at ${todayHours.open}`, color: 'warning' };
    }
    if (todayHours.close && currentTime > todayHours.close) {
      return { label: `Closed at ${todayHours.close}`, color: 'error' };
    }
    return { label: `Open till ${todayHours.close || 'Late'}`, color: 'success' };
  };

  const defaultCenter = [12.9716, 77.5946];
  const userLat = location.coordinates.lat;
  const userLng = location.coordinates.lng;

  return (
    <Box sx={{ animation: 'fadeIn 0.5s ease-in-out', maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>Select a Shop</Typography>
          <Typography variant="body1" color="text.secondary">
            Choose a nearby print shop to get started with your booking.
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(e, newMode) => newMode && setViewMode(newMode)}
          size="small"
          sx={{ bgcolor: 'surfaceContainer.main', borderRadius: 2 }}
        >
          <ToggleButton value="list" sx={{ px: 2 }}><ViewListIcon sx={{ mr: 1 }} /> List</ToggleButton>
          <ToggleButton value="map" sx={{ px: 2 }}><MapIcon sx={{ mr: 1 }} /> Map</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {shops.length === 0 ? (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', bgcolor: 'surfaceContainer.main', borderRadius: 4, border: '2px dashed', borderColor: 'divider' }}>
          <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight="medium" color="text.secondary">
            No nearby shops found.
          </Typography>
        </Paper>
      ) : viewMode === 'map' ? (
        <Paper elevation={0} sx={{ height: 600, width: '100%', borderRadius: 4, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
          {!isLoaded ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress /></Box>
          ) : (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={userLat && userLng ? { lat: userLat, lng: userLng } : { lat: 11.9139, lng: 79.8145 }}
              zoom={13}
              options={{ disableDefaultUI: true, zoomControl: true }}
            >
              {userLat && userLng && (
                <MarkerF 
                  position={{ lat: userLat, lng: userLng }} 
                  icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                  title="You are here"
                />
              )}

              {shops.map(shop => {
                if (!shop.lat || !shop.lng) return null;
                const status = getShopStatus(shop);
                return (
                  <MarkerF 
                    key={shop._id} 
                    position={{ lat: shop.lat, lng: shop.lng }}
                    icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' }}
                    onClick={() => setSelectedShop(shop)}
                  />
                );
              })}

              {selectedShop && (
                <InfoWindowF
                  position={{ lat: selectedShop.lat, lng: selectedShop.lng }}
                  onCloseClick={() => setSelectedShop(null)}
                >
                  <Box sx={{ p: 1, minWidth: 200 }}>
                    <Typography variant="subtitle1" fontWeight="bold">{selectedShop.name}</Typography>
                    {selectedShop.distance !== null && selectedShop.distance !== Infinity && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 14 }} /> {selectedShop.distance < 1 ? `${Math.round(selectedShop.distance * 1000)}m away` : `${selectedShop.distance.toFixed(1)}km away`}
                      </Typography>
                    )}
                    <Chip label={getShopStatus(selectedShop).label} color={getShopStatus(selectedShop).color} size="small" sx={{ my: 1, height: 20, fontSize: '0.7rem' }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      {selectedShop.address || 'Address not provided'}
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="small" 
                      fullWidth 
                      onClick={() => navigate(`/app/shops/${selectedShop._id}/book`)}
                    >
                      Order Here
                    </Button>
                  </Box>
                </InfoWindowF>
              )}
            </GoogleMap>
          )}
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {shops.map((shop) => {
            const status = getShopStatus(shop);
            return (
              <Card 
                key={shop._id}
                hover 
                onClick={() => navigate(`/app/shops/${shop._id}/book`)}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              >
                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primaryContainer.main', color: 'primary.main', width: 48, height: 48 }} variant="rounded">
                      <StoreIcon />
                    </Avatar>
                    <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 'bold' }} />
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{shop.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {shop.address || 'Address not provided'}
                  </Typography>

                  {(shop.phone || (shop.distance !== null && shop.distance !== Infinity)) && (
                    <Stack direction="column" spacing={1} sx={{ color: 'text.secondary', mb: 2 }}>
                      {shop.distance !== null && shop.distance !== Infinity && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOnIcon fontSize="small" />
                          <Typography variant="caption" fontWeight="bold">
                            {shop.distance < 1 ? `${Math.round(shop.distance * 1000)}m away` : `${shop.distance.toFixed(1)}km away`}
                          </Typography>
                        </Box>
                      )}
                      {shop.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="small" />
                          <Typography variant="caption">{shop.phone}</Typography>
                        </Box>
                      )}
                    </Stack>
                  )}

                  {shop.pricing && (
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      <Chip 
                        label={`B&W: ₹${(shop.pricing.bwPricePerPage / 100).toFixed(2)}`} 
                        size="small" 
                        variant="outlined" 
                        color="primary"
                        sx={{ borderRadius: 2, fontWeight: 'medium', bgcolor: 'primaryContainer.main', borderWidth: 0 }}
                      />
                      <Chip 
                        label={`Color: ₹${(shop.pricing.colourPricePerPage / 100).toFixed(2)}`} 
                        size="small" 
                        variant="outlined"
                        color="secondary"
                        sx={{ borderRadius: 2, fontWeight: 'medium', bgcolor: 'secondaryContainer.main', borderWidth: 0 }}
                      />
                    </Stack>
                  )}

                  <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="button" color="primary" fontWeight="bold">Start Booking</Typography>
                    <ChevronRightIcon color="primary" />
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
