import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('skillswap_token') || null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Show Toast
  const showToast = (message, type = 'info') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch current user details
  const fetchCurrentUser = async () => {
    try {
      if (!localStorage.getItem('skillswap_token')) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
      // Fetch unread count
      try {
        const notifData = await api.getNotifications();
        setUnreadCount(notifData.unreadCount || 0);
      } catch (e) {
        // ignore notif error
      }
    } catch (err) {
      console.warn('Session verification failed:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  // Periodic check for notifications
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const data = await api.getNotifications();
        setUnreadCount(data.unreadCount || 0);
      } catch (e) {}
    }, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('skillswap_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showToast(`Welcome back, ${data.user.name}!`, 'success');
    return data.user;
  };

  const register = async (userData) => {
    const data = await api.register(userData);
    localStorage.setItem('skillswap_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showToast('Account created! Welcome to SkillSwap.', 'success');
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('skillswap_token');
    setToken(null);
    setUser(null);
    setUnreadCount(0);
    showToast('You have been logged out.', 'info');
  };

  const updateUserProfile = (newUserData) => {
    setUser((prev) => ({ ...prev, ...newUserData }));
  };

  const refreshUser = () => {
    return fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        refreshUser,
        showToast,
        unreadCount,
        setUnreadCount
      }}
    >
      {children}
      {toastMessage && (
        <div className="toast-container">
          <div className={`toast ${toastMessage.type}`}>
            <span>{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '1rem', color: '#9CA3AF' }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
