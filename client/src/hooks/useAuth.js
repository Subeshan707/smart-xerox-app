import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loginSuccess, logout, setLoading } from '../store/authSlice';
import api from '../api/axios';

export default function useAuth() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  // Restore session from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !auth.isAuthenticated) {
      try {
        // Decode JWT payload (base64)
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Check if token is expired
        if (payload.exp * 1000 > Date.now()) {
          dispatch(
            loginSuccess({
              token,
              user: {
                id: payload.userId,
                role: payload.role,
                shopId: payload.shopId,
              },
            })
          );
          // Fetch full user profile
          api
            .get('/auth/me')
            .then((res) => {
              dispatch(
                loginSuccess({
                  token,
                  user: res.data,
                })
              );
            })
            .catch(() => {
              // Token might be invalid, keep basic info from JWT
            });
        } else {
          localStorage.removeItem('token');
        }
      } catch {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  return {
    ...auth,
    logout: handleLogout,
  };
}
