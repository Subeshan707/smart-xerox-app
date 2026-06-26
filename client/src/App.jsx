import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './store/authSlice';
import RequireAuth from './shared/RequireAuth';
import ToastContainer from './shared/Toast';
import InstallPrompt from './shared/InstallPrompt';
import RealtimeNotifications from './shared/RealtimeNotifications';
import usePushNotification from './hooks/usePushNotification';

// Auth pages
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';

// Customer portal
import CustomerLayout from './customer/CustomerLayout';
import CustomerDashboard from './customer/pages/Dashboard';
import ShopList from './customer/pages/ShopList';
import NewBooking from './customer/pages/NewBooking';
import QueueTracker from './customer/pages/QueueTracker';
import BookingHistory from './customer/pages/BookingHistory';
import Profile from './customer/pages/Profile';

// Operator portal
import OperatorLayout from './operator/OperatorLayout';
import OperatorDashboard from './operator/pages/Dashboard';
import SlotManagement from './operator/pages/SlotManagement';
import PricingManagement from './operator/pages/PricingManagement';
import BookingManagement from './operator/pages/BookingManagement';
import Analytics from './operator/pages/Analytics';
import Notifications from './operator/pages/Notifications';
import ShopProfile from './operator/pages/ShopProfile';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  usePushNotification();

  return (
    <BrowserRouter>
      <ToastContainer />
      <InstallPrompt />
      <RealtimeNotifications />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer portal */}
        <Route
          path="/app"
          element={
            <RequireAuth role="customer">
              <CustomerLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<CustomerDashboard />} />
          <Route path="shops" element={<ShopList />} />
          <Route path="shops/:shopId/book" element={<NewBooking />} />
          <Route path="queue/:id" element={<QueueTracker />} />
          <Route path="history" element={<BookingHistory />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Operator portal */}
        <Route
          path="/operator"
          element={
            <RequireAuth role="shopOperator">
              <OperatorLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OperatorDashboard />} />
          <Route path="slots" element={<SlotManagement />} />
          <Route path="pricing" element={<PricingManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ShopProfile />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-surface-50">
            <div className="text-center animate-fade-in-up">
              <div className="text-6xl font-black text-gradient mb-4">404</div>
              <h1 className="text-xl font-bold text-surface-900 mb-2">Page not found</h1>
              <p className="text-surface-400 mb-6">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn-primary">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
