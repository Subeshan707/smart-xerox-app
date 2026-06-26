import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout, loadUser } from '../../store/authSlice';
import { addToast } from '../../store/notificationSlice';
import { useNavigate } from 'react-router-dom';
import * as customerAPI from '../../api/customer';

import { 
  Box, Typography, Button, TextField, Avatar, Grid, 
  Switch, FormControlLabel, Select, MenuItem, InputLabel, 
  FormControl, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
  List, ListItem, ListItemIcon, ListItemText, ListItemButton, Paper
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import DeleteIcon from '@mui/icons-material/DeleteForever';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AddIcon from '@mui/icons-material/Add';
import Card, { CardContent } from '../../shared/Card';

export default function Profile() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [preferences, setPreferences] = useState({
    pushNotifications: true,
    smsNotifications: true,
    emailNotifications: true,
    defaultPaperSize: 'A4',
    defaultMode: 'bw',
  });

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // API call would go here
      dispatch(addToast({ type: 'success', message: 'Profile updated!' }));
    } catch {
      dispatch(addToast({ type: 'error', message: 'Failed to update profile' }));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleTopUp = async (amount) => {
    if (!amount || amount < 100) return dispatch(addToast({ type: 'warning', message: 'Minimum ₹1 required' }));
    
    try {
      const { data: order } = await customerAPI.createWalletTopUpOrder(amount * 100);
      
      const scriptReady = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptReady) throw new Error('Razorpay SDK failed to load');

      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Smart Xerox Wallet',
        description: `Wallet Top Up ₹${amount}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        handler: async (response) => {
          try {
            await customerAPI.verifyWalletTopUp(response);
            dispatch(addToast({ type: 'success', message: `Added ₹${amount} to wallet!` }));
            dispatch(loadUser());
          } catch (err) {
            dispatch(addToast({ type: 'error', message: 'Failed to verify top-up' }));
          } finally {
            setTimeout(() => {
              const rzp = document.querySelector('.razorpay-container');
              if (rzp) rzp.remove();
            }, 500);
          }
        },
        modal: {
          ondismiss: function() {
            setTimeout(() => {
              const rzp = document.querySelector('.razorpay-container');
              if (rzp) rzp.remove();
            }, 500);
          }
        }
      });

      checkout.open();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.response?.data?.error || 'Failed to initiate top-up' }));
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', animation: 'fadeIn 0.5s ease', pb: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">Profile</Typography>
        <Typography variant="body2" color="text.secondary">Manage your account and preferences.</Typography>
      </Box>

      {/* Profile info */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
            <Avatar 
              sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 'bold' }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">{user?.name || 'User'}</Typography>
              <Typography variant="body2" color="text.secondary">{user?.email || 'No email'}</Typography>
            </Box>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Full Name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                variant="outlined" 
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                label="Phone Number" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                variant="outlined" 
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, textAlign: 'right' }}>
            <Button variant="contained" onClick={handleSaveProfile} disabled={saving} disableElevation>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Wallet section */}
      <Card sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #1d4ed8 0%, #0891b2 100%)', 
        color: 'white', 
        border: 'none', 
        position: 'relative', 
        overflow: 'hidden',
        boxShadow: '0 10px 30px -10px rgba(29, 78, 216, 0.5)'
      }}>
        {/* Decorative background elements */}
        <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: -50, width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)' }} />
        
        <CardContent sx={{ position: 'relative', zIndex: 1, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WalletIcon sx={{ color: 'rgba(255,255,255,0.9)' }} />
              <Typography variant="h6" fontWeight="bold" sx={{ color: 'rgba(255,255,255,0.9)' }}>My Wallet</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', px: 2, py: 0.5, borderRadius: 4, border: '1px solid rgba(255,255,255,0.3)' }}>
              <Typography variant="h5" fontWeight="900">₹{user?.walletBalance || 0}</Typography>
            </Box>
          </Box>
          <Typography variant="body2" sx={{ opacity: 0.8, mb: 4 }}>
            Add money to your wallet for quick 1-click payments at the shop.
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[100, 200, 500].map(amount => (
              <Grid item xs={4} key={amount}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => handleTopUp(amount)}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(10px)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)', borderColor: 'white', transform: 'translateY(-2px)' },
                    transition: 'all 0.2s ease'
                  }}
                >
                  + ₹{amount}
                </Button>
              </Grid>
            ))}
          </Grid>
          <Button 
            fullWidth 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => {
              const amt = prompt('Enter amount to add (₹):');
              if (amt && !isNaN(amt) && parseInt(amt) > 0) handleTopUp(parseInt(amt));
            }}
            sx={{ 
              bgcolor: 'white', 
              color: '#1d4ed8', 
              fontWeight: 'bold',
              borderRadius: 3,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }
            }}
          >
            Add Custom Amount
          </Button>
        </CardContent>
      </Card>

      {/* Notification preferences */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Notifications</Typography>
          <List disablePadding>
            {[
              { key: 'pushNotifications', label: 'Push Notifications', desc: 'Get notified when your print is ready' },
              { key: 'smsNotifications', label: 'SMS Alerts', desc: 'Receive SMS for booking updates' },
              { key: 'emailNotifications', label: 'Email Notifications', desc: 'Get booking receipts via email' },
            ].map((pref, i, arr) => (
              <ListItem 
                key={pref.key} 
                disableGutters 
                sx={{ borderBottom: i < arr.length - 1 ? 1 : 0, borderColor: 'divider', py: 1.5 }}
              >
                <ListItemText 
                  primary={<Typography variant="subtitle2" fontWeight="bold">{pref.label}</Typography>} 
                  secondary={<Typography variant="caption" color="text.secondary">{pref.desc}</Typography>}
                />
                <Switch 
                  edge="end" 
                  checked={preferences[pref.key]} 
                  onChange={(e) => setPreferences(prev => ({ ...prev, [pref.key]: e.target.checked }))} 
                  color="primary" 
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Print preferences */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Default Print Settings</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Paper Size</InputLabel>
                <Select
                  value={preferences.defaultPaperSize}
                  label="Default Paper Size"
                  onChange={(e) => setPreferences(prev => ({ ...prev, defaultPaperSize: e.target.value }))}
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="A3">A3</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Default Mode</InputLabel>
                <Select
                  value={preferences.defaultMode}
                  label="Default Mode"
                  onChange={(e) => setPreferences(prev => ({ ...prev, defaultMode: e.target.value }))}
                >
                  <MenuItem value="bw">Black & White</MenuItem>
                  <MenuItem value="colour">Colour</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }} variant="outlined">
        <List disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ py: 2 }}>
            <ListItemIcon><LogoutIcon color="action" /></ListItemIcon>
            <ListItemText primary={<Typography fontWeight="medium" color="text.primary">Sign Out</Typography>} />
          </ListItemButton>
          <ListItemButton onClick={() => setShowDeleteModal(true)} sx={{ py: 2, bgcolor: 'errorContainer.main', '&:hover': { bgcolor: 'errorContainer.dark' } }}>
            <ListItemIcon><DeleteIcon color="error" /></ListItemIcon>
            <ListItemText primary={<Typography fontWeight="bold" color="error.main">Delete Account</Typography>} />
          </ListItemButton>
        </List>
      </Paper>

      {/* Delete confirmation modal */}
      <Dialog open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <DialogTitle fontWeight="bold">Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete your account? This action cannot be undone. All your booking history and data will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShowDeleteModal(false)} color="inherit" variant="text">Cancel</Button>
          <Button onClick={() => setShowDeleteModal(false)} color="error" variant="contained">Delete My Account</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
