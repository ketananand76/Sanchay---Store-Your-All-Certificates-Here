import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      // 1. Try checking admin session
      const adminRes = await api.get('/api/auth/me');
      if (adminRes.data && adminRes.data.success) {
        setAdmin(adminRes.data.admin);
        setUser(null);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Not admin
    }

    try {
      // 2. Try checking standard user session
      const userRes = await api.get('/api/users/me');
      if (userRes.data && userRes.data.success) {
        setUser(userRes.data.user);
        setAdmin(null);
        setLoading(false);
        return;
      }
    } catch (err) {
      // Not user
    }

    // Reset both if checks failed
    setAdmin(null);
    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data && response.data.success) {
        setAdmin(response.data.admin);
        setUser(null);
        return { success: true };
      }
      return { success: false, message: 'Invalid credentials' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed.';
      return { success: false, message: msg };
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await api.post('/api/users/login', { email, password });
      if (response.data && response.data.success) {
        setUser(response.data.user);
        setAdmin(null);
        return { success: true };
      }
      return { success: false, message: 'Invalid email or password' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (admin) {
        await api.post('/api/auth/logout');
      } else {
        await api.post('/api/users/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAdmin(null);
      setUser(null);
    }
  };

  const updateLocation = async () => {
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            let city = 'Unknown City';
            let country = 'Unknown Country';
            try {
              const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
              const geoData = await geoRes.json();
              city = geoData.city || geoData.locality || city;
              country = geoData.countryName || country;
            } catch (err) {
              console.warn('Reverse geocoding failed, using coordinates only');
            }
            await api.post('/api/users/update-location', {
              latitude,
              longitude,
              city,
              country,
            });
          },
          async (error) => {
            console.warn('Browser geolocation failed, falling back to IP', error.message);
            await fetchIpLocation();
          },
          { timeout: 8000 }
        );
      } else {
        await fetchIpLocation();
      }
    } catch (err) {
      console.error('Failed to update active location tracker:', err);
    }
  };

  const fetchIpLocation = async () => {
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      const ipData = await ipRes.json();
      if (ipData.latitude && ipData.longitude) {
        await api.post('/api/users/update-location', {
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          city: ipData.city || 'Unknown City',
          country: ipData.country_name || 'Unknown Country',
        });
      }
    } catch (err) {
      console.error('IP-based geolocation fallback failed:', err);
    }
  };

  React.useEffect(() => {
    if (user && user._id) {
      updateLocation();
    }
  }, [user?._id]);

  return (
    <AuthContext.Provider value={{ admin, user, loading, login, loginUser, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
