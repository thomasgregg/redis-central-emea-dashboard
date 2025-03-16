import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Get the API URL from environment variables or use a default
const API_URL = process.env.REACT_APP_API_URL || '/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Get stored values with safe parsing
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error('Error parsing stored user:', error);
      return null;
    }
  };

  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendReady, setBackendReady] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  
  // Add data cache
  const [dataCache, setDataCache] = useState({
    sales: null,
    pipeline: null,
    events: null,
    territories: null,
    lastUpdated: null
  });
  
  // Cache TTL in milliseconds (2 minutes)
  const CACHE_TTL = 2 * 60 * 1000;
  
  // Set axios default authorization header whenever token changes
  useEffect(() => {
    if (token) {
      console.log('Setting default Authorization header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('No token found, removing Authorization header');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check backend health periodically with exponential backoff
  useEffect(() => {
    let healthCheckInterval;
    const MAX_RETRIES = 10;
    const MAX_BACKOFF = 30000; // Maximum backoff of 30 seconds
    
    const checkBackendHealth = async () => {
      try {
        console.log(`Backend health check attempt ${connectionAttempts + 1}`);
        
        const response = await axios.get(`${API_URL}/health`, { 
          timeout: 2000 // Shorter timeout for health check
        });
        
        if (response.status === 200) {
          if (response.data.redis === 'connected') {
            console.log('Backend is healthy and Redis is connected');
            setBackendReady(true);
            setConnectionAttempts(0);
            return true;
          } else {
            console.error('Redis is not connected');
            handleBackendFailure();
            return false;
          }
        }
      } catch (error) {
        console.error('Backend health check failed:', error);
        handleBackendFailure();
        return false;
      }
    };
    
    const handleBackendFailure = () => {
      setBackendReady(false);
      setConnectionAttempts(prev => {
        const newAttempts = prev + 1;
        if (newAttempts >= MAX_RETRIES) {
          console.error('Max retries reached, stopping health checks');
          clearInterval(healthCheckInterval);
        }
        return newAttempts;
      });
    };
    
    // Start health checks if we have a token
    if (token) {
      const backoff = Math.min(Math.pow(2, connectionAttempts) * 1000, MAX_BACKOFF);
      console.log(`Setting health check interval with ${backoff}ms backoff`);
      
      // Initial check
      checkBackendHealth();
      
      // Set up interval for subsequent checks
      healthCheckInterval = setInterval(checkBackendHealth, backoff);
      
      // Cleanup function
      return () => {
        console.log('Cleaning up health check interval');
        clearInterval(healthCheckInterval);
      };
    }
  }, [token, connectionAttempts]);

  const isCacheValid = (cacheKey) => {
    const cache = dataCache[cacheKey];
    return cache && cache.lastUpdated && (Date.now() - cache.lastUpdated) < CACHE_TTL;
  };

  const fetchDataWithCache = async (endpoint, cacheKey, retryAttempt = 0) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000;

    if (isCacheValid(cacheKey)) {
      console.log(`Using cached data for ${cacheKey}`);
      return dataCache[cacheKey].data;
    }

    try {
      console.log(`Fetching fresh data for ${cacheKey}`);
      const response = await axios.get(`${API_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 200) {
        const newCache = {
          ...dataCache,
          [cacheKey]: {
            data: response.data,
            lastUpdated: Date.now()
          }
        };
        setDataCache(newCache);
        return response.data;
      }
    } catch (error) {
      console.error(`Error fetching ${cacheKey} data:`, error);
      
      if (retryAttempt < MAX_RETRIES) {
        console.log(`Retrying ${cacheKey} fetch attempt ${retryAttempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return fetchDataWithCache(endpoint, cacheKey, retryAttempt + 1);
      }

      if (dataCache[cacheKey]) {
        console.log(`Using stale cache for ${cacheKey} after fetch failure`);
        return dataCache[cacheKey].data;
      }

      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_URL}/login`, {
        email,
        password
      });
      
      if (response.data.token) {
        const userData = { email };
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(response.data.token);
        setUser(userData);
        setLoading(false);
        return true;
      }
      
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.error || 'An error occurred during login');
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setDataCache({
      sales: null,
      pipeline: null,
      events: null,
      territories: null,
      lastUpdated: null
    });
    delete axios.defaults.headers.common['Authorization'];
  };

  // For debugging purposes
  const setDebugToken = (debugToken) => {
    if (debugToken) {
      localStorage.setItem('token', debugToken);
      setToken(debugToken);
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      loading,
      error,
      backendReady,
      login,
      logout,
      setDebugToken,
      fetchDataWithCache,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 