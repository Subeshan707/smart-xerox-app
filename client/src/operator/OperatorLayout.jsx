import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { 
  Box, Drawer, AppBar, Toolbar, IconButton, Typography, List, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Divider, Avatar, useMediaQuery,
  CssBaseline, Badge, Paper
} from '@mui/material';
import { Experimental_CssVarsProvider as CssVarsProvider, useTheme } from '@mui/material/styles';
import { operatorTheme } from '../theme';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SlotsIcon from '@mui/icons-material/EventAvailable';
import PricingIcon from '@mui/icons-material/LocalOffer';
import BookingsIcon from '@mui/icons-material/ReceiptLong';
import AnalyticsIcon from '@mui/icons-material/Assessment';
import ProfileIcon from '@mui/icons-material/Storefront';
import AlertsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import ThemeToggle from '../shared/ThemeToggle';

const drawerWidth = 260;

const navItems = [
  { path: '/operator/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { path: '/operator/slots', label: 'Slots', icon: <SlotsIcon /> },
  { path: '/operator/pricing', label: 'Pricing', icon: <PricingIcon /> },
  { path: '/operator/bookings', label: 'Bookings', icon: <BookingsIcon /> },
  { path: '/operator/analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
  { path: '/operator/profile', label: 'Shop Profile', icon: <ProfileIcon /> },
  { path: '/operator/notifications', label: 'Alerts', icon: <AlertsIcon /> },
];

function OperatorLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications] = useState([
    { id: 1, title: 'New Print Job', message: 'Token #1024 just placed an order.', time: '2 mins ago', unread: true },
    { id: 2, title: 'Payment Failed', message: 'Token #1023 payment was declined.', time: '15 mins ago', unread: true },
    { id: 3, title: 'Job Cancelled', message: 'Customer cancelled Token #1020.', time: '1 hour ago', unread: false },
  ]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'surfaceContainer.main' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }} variant="rounded">
          <ProfileIcon fontSize="small" />
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" fontWeight="bold" lineHeight={1.2}>Smart Xerox</Typography>
          <Typography variant="caption" color="text.secondary">Shop Owner Panel</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {navItems.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{ borderRadius: 3 }}
              >
                <ListItemIcon sx={{ color: selected ? 'primary.main' : 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label} 
                  primaryTypographyProps={{ fontWeight: selected ? 'bold' : 'medium' }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.dark' }}>
            {user?.name?.charAt(0) || 'O'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="subtitle2" noWrap>{user?.name || 'Shop Owner'}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{user?.email || ''}</Typography>
          </Box>
        </Box>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 3, color: 'error.main' }}>
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Sign Out" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar (Mobile & Desktop) */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${drawerWidth}px)` },
          ml: { lg: `${drawerWidth}px` },
          bgcolor: 'surfaceContainerHighest.main',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: 'text.primary',
          backdropFilter: 'blur(16px)',
          zIndex: theme.zIndex.drawer - 1
        }}
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { lg: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', display: { lg: 'none' } }}>
            Smart Xerox
          </Typography>
          <Box sx={{ flexGrow: { lg: 1 } }} />
          <ThemeToggle />
          
          <IconButton color="inherit" onClick={() => setNotifOpen(true)} sx={{ ml: 1 }}>
            <Badge badgeContent={notifications.filter(n => n.unread).length} color="error">
              <AlertsIcon />
            </Badge>
          </IconButton>

          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, fontSize: 14, ml: 2, display: { xs: 'flex', lg: 'none' } }}>
            {user?.name?.charAt(0) || 'O'}
          </Avatar>
        </Toolbar>
      </AppBar>

      {/* Main Drawer */}
      <Box component="nav" sx={{ width: { lg: drawerWidth }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', lg: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, border: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', lg: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: `1px solid ${theme.palette.divider}` },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Notifications Drawer */}
      <Drawer
        anchor="right"
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        sx={{ zIndex: theme.zIndex.drawer + 2 }}
        PaperProps={{ sx: { width: { xs: '100%', sm: 350 }, p: 2, bgcolor: 'background.default' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">Notifications</Typography>
          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>Mark all read</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          {notifications.map((notif) => (
            <ListItem key={notif.id} disablePadding sx={{ mb: 1 }}>
              <Paper elevation={0} sx={{ p: 2, width: '100%', bgcolor: notif.unread ? 'primaryContainer.main' : 'surfaceContainer.main', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color={notif.unread ? 'primary.main' : 'text.primary'}>
                    {notif.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{notif.time}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">{notif.message}</Typography>
              </Paper>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { lg: `calc(100% - ${drawerWidth}px)` }, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default function OperatorLayout() {
  return (
    <CssVarsProvider theme={operatorTheme}>
      <OperatorLayoutInner />
    </CssVarsProvider>
  );
}
