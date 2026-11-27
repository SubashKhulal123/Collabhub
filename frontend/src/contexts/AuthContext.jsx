import React, { createContext, useState, useContext, useEffect } from 'react';
import { login as loginApi, register as registerApi, getMe } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        verifyToken();
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  const verifyToken = async () => {
    try {
      const { data } = await getMe();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await registerApi(userData);
      toast.success(data.message || 'Registration successful! Please check your email to verify your account.');
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // const login = async (credentials) => {
  //   try {
  //     const response = await loginApi(credentials);
  //     const data = response.data;
      
  //     // Check for 2FA requirement
  //     if (data.requiresTwoFactor) {
  //       console.log('2FA required');
  //       return { success: false, requiresTwoFactor: true };
  //     }
      
  //     // Check for email verification requirement
  //     if (data.needsVerification) {
  //       return { success: false, needsVerification: true, message: data.message };
  //     }
      
  //     // Successful login
  //     localStorage.setItem('accessToken', data.accessToken);
  //     localStorage.setItem('refreshToken', data.refreshToken);
  //     localStorage.setItem('user', JSON.stringify(data.user));
  //     setUser(data.user);
  //     toast.success('Login successful!');
  //     return { success: true };
  //   } catch (error) {
  //     console.error('Login API error:', error.response?.data);
  //     const errorMessage = error.response?.data?.message || 'Login failed';
  //     toast.error(errorMessage);
  //     return { success: false, error: errorMessage };
  //   }
  // };


  const login = async (credentials) => {
  try {
    const response = await loginApi(credentials);
    const data = response.data;
    
    // Check for 2FA requirement
    if (data.requiresTwoFactor) {
      return { success: false, requiresTwoFactor: true };
    }
    
    // Check for email verification requirement
    if (data.needsVerification) {
      return { 
        success: false, 
        needsVerification: true, 
        message: data.message || 'Please verify your email before logging in.'
      };
    }
    
    // Check for pending approval (freelancer)
    if (data.needsApproval) {
      return { 
        success: false, 
        needsApproval: true, 
        message: data.message || 'Your account is pending admin approval.'
      };
    }
    
    // Successful login
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return { success: true };
  } catch (error) {
    console.error('Login API error:', error.response?.data);
    const errorMessage = error.response?.data?.message || 'Invalid email or password';
    return { success: false, error: errorMessage };
  }
};

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const { default: api } = await import('../services/api');
        await api.post('/auth/logout', { refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const value = {
    user,
    setUser,
    loading,
    register,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};