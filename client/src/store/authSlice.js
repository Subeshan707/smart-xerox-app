import { createSlice } from '@reduxjs/toolkit';
import api from '../api/axios';

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action) => { state.loading = action.payload; },
    setError: (state, action) => { state.error = action.payload; },
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token || state.token;
      state.isAuthenticated = true;
      state.isInitialized = true;
      if (action.payload.token) {
        localStorage.setItem('token', action.payload.token);
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isInitialized = true;
      localStorage.removeItem('token');
    },
    setInitialized: (state) => {
      state.isInitialized = true;
    }
  }
});

export const { setLoading, setError, loginSuccess, logout, setInitialized } = authSlice.actions;

export const login = (email, password) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.post('/auth/login', { email, password });
    dispatch(loginSuccess(res.data));
    return res.data;
  } catch (err) {
    dispatch(setError(err.response?.data?.error || 'Login failed'));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const register = (userData) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const res = await api.post('/auth/register', userData);
    dispatch(loginSuccess(res.data));
    return res.data;
  } catch (err) {
    dispatch(setError(err.response?.data?.error || 'Registration failed'));
    throw err;
  } finally {
    dispatch(setLoading(false));
  }
};

export const loadUser = () => async (dispatch, getState) => {
  const { token } = getState().auth;
  if (!token) {
    dispatch(setInitialized());
    return;
  }

  try {
    const res = await api.get('/auth/me');
    dispatch(loginSuccess({ user: res.data }));
  } catch (err) {
    dispatch(logout());
  }
};

export default authSlice.reducer;