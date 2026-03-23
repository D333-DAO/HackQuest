import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification = { id, message, type };

    setNotifications(prev => [...prev, notification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const notify = {
    success: (message, duration = 4000) => addNotification(message, 'success', duration),
    error: (message, duration = 4000) => addNotification(message, 'error', duration),
    info: (message, duration = 4000) => addNotification(message, 'info', duration),
    warning: (message, duration = 4000) => addNotification(message, 'warning', duration),
    badge: (badgeTitle, duration = 5000) => addNotification(`🎉 Badge Unlocked: ${badgeTitle}`, 'badge', duration),
    roomComplete: (roomTitle, points, duration = 4000) => addNotification(`✅ Completed: ${roomTitle} +${points}pt`, 'success', duration),
    newPath: (pathTitle, duration = 5000) => addNotification(`🚀 New Path Released: ${pathTitle}`, 'info', duration),
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}