import React, { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

let notificationCounter = 0;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addNotification = useCallback(
    ({ type = 'info', message, duration = 4000 }) => {
      const id = ++notificationCounter;
      const newNotification = { id, type, message, duration };

      setNotifications((prev) => [...prev, newNotification]);

      if (duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, duration);
      }

      return id;
    },
    [removeNotification]
  );

  const showSuccess = useCallback(
    (message, duration) => addNotification({ type: 'success', message, duration }),
    [addNotification]
  );

  const showError = useCallback(
    (message, duration) => addNotification({ type: 'error', message, duration }),
    [addNotification]
  );

  const showWarning = useCallback(
    (message, duration) => addNotification({ type: 'warning', message, duration }),
    [addNotification]
  );

  const showInfo = useCallback(
    (message, duration) => addNotification({ type: 'info', message, duration }),
    [addNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
