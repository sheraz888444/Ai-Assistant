import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Base API URL
  const BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

  // Check if user is logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/user/currentUser`, { withCredentials: true });
        setUser(res.data); // Set user state based on response
      } catch (err) {
        console.error('Error checking auth status:', err);
        setUser(null); // Set user to null if there's an error
      }
    };

    checkAuthStatus();
  }, []);

  // Signup function
  const signup = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, userData, { withCredentials: true });
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Login function
  const login = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, userData, { withCredentials: true });
      setUser(response.data);
      setLoading(false);
      return { success: true, data: response.data };
    } catch (err) {
      setLoading(false);
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.get(`${BASE_URL}/auth/logout`, { withCredentials: true });
      setUser(null);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Logout failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user in context
  const updateUser = (newUser) => {
    setUser(newUser);
  };

  // Context value
  const contextValue = {
    user,
    loading,
    error,
    signup,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
