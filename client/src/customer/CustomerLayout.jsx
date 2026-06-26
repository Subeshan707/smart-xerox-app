import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import useOfflineQueue from '../hooks/useOfflineQueue';
import {
  AppBar, Toolbar, IconButton, Typography, Box, BottomNavigation, BottomNavigationAction,
  Fab, Avatar, Tooltip, Badge, useTheme, useMediaQuery, Stack
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Storefront';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import SyncIcon from '@mui/icons-material/Sync';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import ThemeToggle from '../shared/ThemeToggle';

const navItems = [
  { path: '/app/dashboard', label: 'Home', icon: <HomeIcon /> },
  { path: '/app/shops', label: 'Book', icon: <StoreIcon /> },
  { path: '/app/history', label: 'History', icon: <HistoryIcon /> },
  { path: '/app/profile', label: 'Profile', icon: <PersonIcon /> },
];

export default function CustomerLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { pendingCount, syncing } = useOfflineQueue();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ pb: { xs: 7, sm: 0 }, pt: { xs: 0, sm: 8 } }}>
      {/* Desktop App Bar */}
      {!isMobile && (
        <AppBar 
          position="fixed" 
          elevation={0} 
          sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            backdropFilter: 'blur(16px)',
            backgroundColor: alpha(theme.palette.background.default, 0.8),
            color: theme.palette.text.primary
          }}
        >
          <Toolbar>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }} variant="rounded">
              <StoreIcon />
            </Avatar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Smart<Box component="span" sx={{ color: 'primary.main' }}>Xerox</Box>
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mr: 4 }}>
              {navItems.map((item) => (
                <IconButton
                  key={item.path}
                  color={location.pathname.startsWith(item.path) ? 'primary' : 'default'}
                  onClick={() => navigate(item.path)}
                  sx={{ borderRadius: 3 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                    {item.icon}
                    <Typography variant="button">{item.label}</Typography>
                  </Box>
                </IconButton>
              ))}
            </Box>

            <Stack direction="row" alignItems="center" spacing={2}>
              <ThemeToggle />
              {(pendingCount > 0 || syncing) && (
                <Tooltip title={`${pendingCount} items waiting to sync`}>
                  <Badge badgeContent={pendingCount} color="warning">
                    {syncing ? <SyncIcon color="warning" sx={{ animation: 'spin 2s linear infinite' }} /> : <CloudDoneIcon color="warning" />}
                  </Badge>
                </Tooltip>
              )}
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                  {user?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Customer
                </Typography>
              </Box>
              <Tooltip title="Logout">
                <IconButton onClick={handleLogout} color="default">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Toolbar>
        </AppBar>
      )}

      {/* Main Content */}
      <Box component="main" sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Outlet />
      </Box>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <>
          <Fab 
            color="primary" 
            aria-label="add" 
            sx={{ position: 'fixed', bottom: 72, right: 16, zIndex: 1000 }}
            onClick={() => navigate('/app/shops')}
          >
            <AddIcon />
          </Fab>
          <BottomNavigation
            value={navItems.findIndex(i => location.pathname.startsWith(i.path))}
            showLabels
            sx={{
              position: 'fixed', bottom: 0, left: 0, right: 0, 
              borderTop: `1px solid ${theme.palette.divider}`,
              backdropFilter: 'blur(16px)',
              backgroundColor: alpha(theme.palette.background.default, 0.8),
              zIndex: 1000,
              height: 64
            }}
          >
            {navItems.map((item, index) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                onClick={() => navigate(item.path)}
              />
            ))}
          </BottomNavigation>
        </>
      )}
    </Box>
  );
}
