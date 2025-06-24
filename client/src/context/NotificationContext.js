import { useSnackbar } from 'notistack';
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import Notiflix from "notiflix";
import { PulseLoader } from 'react-spinners';
import '../styles/CustomNotifications.css';
import { 
  FiX, 
  FiCheck, 
  FiAlertTriangle, 
  FiInfo, 
  FiLoader,
  FiHelpCircle
} from 'react-icons/fi';

const NotifyContext = createContext();

export const useNotify = () => {
  const context = useContext(NotifyContext);
  if (!context) {
    throw new Error('useNotify must be used within a NotifyProvider');
  }
  return context;
};

export const NotifyProvider = ({ children }) => {
  // Safely try to use snackbar hooks
  let enqueueSnackbar, closeSnackbar;
  
  try {
    const snackbarHooks = useSnackbar();
    enqueueSnackbar = snackbarHooks.enqueueSnackbar;
    closeSnackbar = snackbarHooks.closeSnackbar;
  } catch (error) {
    console.warn('SnackbarProvider not available, using fallbacks');
    enqueueSnackbar = (message, options) => console.log('Snackbar:', message, options);
    closeSnackbar = (key) => console.log('Close snackbar:', key);
  }

  const [connected, setConnected] = useState(true);
  const [customNotifications, setCustomNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const notificationIdCounter = useRef(0);
  const [notificationMode, setNotificationMode] = useState('custom'); // 'notistack', 'notiflix', or 'custom'

  // Function to create a timeout for removing a notification
  const createNotificationTimeout = (id, duration) => {
    return setTimeout(() => {
      removeCustomNotification(id);
    }, duration || 3000);
  };
  
  // Track all notification timeouts
  const timeoutsRef = useRef({});

  // Update ref when state changes
  useEffect(() => {
    notificationsRef.current = customNotifications;
  }, [customNotifications]);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      // Clear all timeouts when component unmounts
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const addCustomNotification = (notification) => {
    const id = notificationIdCounter.current++;
    const newNotification = { ...notification, id };
    
    setCustomNotifications(prev => [newNotification, ...prev]);
    
    // Create a timeout to remove this notification if it's not persistent
    if (!notification.persist) {
      // Clear any existing timeout for this ID (shouldn't happen, but just in case)
      if (timeoutsRef.current[id]) {
        clearTimeout(timeoutsRef.current[id]);
      }
      
      // Create new timeout
      const timeout = createNotificationTimeout(id, notification.duration);
      timeoutsRef.current[id] = timeout;
    }
    
    return id;
  };

  const removeCustomNotification = (id) => {
    // Clear the timeout for this notification
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
    
    setCustomNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const notiflixOptions = {
    success: Notiflix.Notify.success,
    failure: Notiflix.Notify.failure,
    info: Notiflix.Notify.info
  };

  const notistackOptions = {
    success: (message, ...args) => enqueueSnackbar(message, { variant: 'success', ...args }),
    failure: (message, ...args) => enqueueSnackbar(message, { variant: 'error', ...args }),
    info: (message, ...args) => enqueueSnackbar(message, { variant: 'info', ...args }),
  };

  const customOptions = {
    success: (message, ...args) => {
      return addCustomNotification({
        type: 'success',
        message,
        icon: <FiCheck />,
        ...args
      });
    },
    failure: (message, ...args) => {
      return addCustomNotification({
        type: 'error',
        message,
        icon: <FiAlertTriangle />,
        ...args
      });
    },
    info: (message, ...args) => {
      return addCustomNotification({
        type: 'info',
        message,
        icon: <FiInfo />,
        ...args
      });
    },
  };

  const getSelectedLib = () => {
    switch (notificationMode) {
      case 'notiflix':
        return notiflixOptions;
      case 'notistack':
        return notistackOptions;
      case 'custom':
      default:
        return customOptions;
    }
  };

  const selectedLib = getSelectedLib();

  if (notificationMode === 'notiflix') {
    // Init Notify Module
    Notiflix.Notify.init({});
    // Init Report Module
    Notiflix.Report.init({});
    // Init Confirm Module
    Notiflix.Confirm.init({});
    // Init Loading Module
    Notiflix.Loading.init({});
  }

  const extractMessage = (response) => {
    window.fff = (response)
    const findMessage = (data, _resolve) => {
      if (data.message){
        if(data.message === "Failed to fetch") _resolve('Server disconnected')
        else _resolve(data.message);
      }
      else if (data.error) _resolve(Array.isArray(data.error) ? data.error[0] : data.error);
      else if (data.msg) data.msg === 'Token has expired' ? _resolve(data.msg + ' please refresh') : _resolve(data.msg)
      else if (data.success) _resolve(data.success);
      else _resolve('An unexpected error has occurred');
    };

    return new Promise((resolve) => {
      if (response && response.json) {
        response.json().then((data) => {
          findMessage(data, resolve);
        });
      } else {
        if (response.statusText) resolve(response.statusText);
        else if (response.status) resolve(`Error ${response.status}`);
        else findMessage(response, resolve);
      }
    });
  };

  const handleMessage = (response, messageType, prefix) => {
    extractMessage(response).then((successMessage) => {
      messageType(successMessage, prefix);
    });
  };

  const error = (message, prefix) => {
    if (notificationMode !== 'custom') {
      closeSnackbar();
    }

    console.error('An error has occured:', message);

    if (message && typeof message === 'object') {
      // If message is an object, treat it as a response object
      handleMessage(message, error, prefix);
    } else {
      // Treat message as a string
      selectedLib.failure(`${prefix || 'Error'}: ${message || 'An unexpected error has occurred'}`);
    }
  };

  const success = (message, prefix) => {
    if (message && typeof message === 'object') {
      // If message is an object, treat it as a response object
      handleMessage(message, success, prefix);
    } else {
      // Treat message as a string
      selectedLib.success(`${prefix || ''} ${message || 'Success!'}`);
    }
  };

  const spinner = (message = 'Loading, please wait...', options = {}) => {
    if (notificationMode === 'custom') {
      const id = addCustomNotification({
        type: 'loading',
        message,
        icon: <FiLoader className="spinning-icon" />,
        persist: true,
        ...options
      });

      return {
        complete: (success = true, completionMessage, bypass) => {
          removeCustomNotification(id);
          if (bypass) {
            return;
          }
          if (success) {
            selectedLib.success(completionMessage || 'Completed successfully');
          } else if (completionMessage) {
            selectedLib.failure(completionMessage);
          }
        }
      };
    } else if (notificationMode === 'notistack') {
      const key = enqueueSnackbar(
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <PulseLoader size={6} color="#fff" />
          <span>{message}</span>
        </div>,
        {
          variant: 'info',
          persist: true, // Keeps the notification open until manually closed
          ...options
        }
      );

      return {
        complete: (success = true, completionMessage, bypass) => {
          closeSnackbar(key);
          if (bypass) {
            return;
          }
          if (success) {
            selectedLib.success(completionMessage || 'Completed successfully');
          } else if (completionMessage) {
            selectedLib.failure(completionMessage);
          }
        }
      };
    } else {
      Notiflix.Loading.circle(message);
      
      return {
        complete: (success = true, completionMessage, bypass) => {
          Notiflix.Loading.remove();
          if (bypass) {
            return;
          }
          if (success) {
            selectedLib.success(completionMessage || 'Completed successfully');
          } else if (completionMessage) {
            selectedLib.failure(completionMessage);
          }
        }
      };
    }
  };

  const info = (message, prefix) => {
    if (message && typeof message === 'object') {
      // If message is an object, treat it as a response object
      handleMessage(message, info, prefix);
    } else {
      // Treat message as a string
      selectedLib.info(`${prefix || ''}: ${message || 'Information'}`);
    }
  };

  const choice = (messageOrOptions, _success, _cancel) => {
    let message, options;
    
    // Handle both the old and new format
    if (typeof messageOrOptions === 'string') {
      message = messageOrOptions;
      options = { 
        title: 'Confirmation',
        message, 
        confirmText: 'Yes', 
        cancelText: 'No' 
      };
    } else {
      options = messageOrOptions;
      message = options.message;
    }

    const defaultOptions = {
      title: 'Confirmation',
      confirmText: 'Yes',
      cancelText: 'No',
      onConfirm: _success,
      onCancel: _cancel
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (notificationMode === 'custom') {
      const id = addCustomNotification({
        type: 'choice',
        title: mergedOptions.title,
        message: mergedOptions.message,
        icon: <FiHelpCircle />,
        persist: true,
        confirmText: mergedOptions.confirmText,
        cancelText: mergedOptions.cancelText,
        onConfirm: () => {
          removeCustomNotification(id);
          if (mergedOptions.onConfirm) {
            mergedOptions.onConfirm();
          }
        },
        onCancel: () => {
          removeCustomNotification(id);
          if (mergedOptions.onCancel) {
            mergedOptions.onCancel();
          }
        }
      });
    } else if (notificationMode === 'notistack') {
      const choicePrompt = (
        <div className="alert alert-info element-to-hide">
          <p className="mb-0" style={mergedOptions.messageStyle}>
            {message}
          </p>
          <div className="mt-2">
            <button className="btn btn-danger mr-2" type='button' onClick={() => {
              closeSnackbar();
              if (mergedOptions.onConfirm) {
                mergedOptions.onConfirm();
              }
            }}>
              {mergedOptions.confirmText}
            </button>
            <button className="btn btn-secondary" type='button' onClick={() => {
              closeSnackbar();
              if (mergedOptions.onCancel) {
                mergedOptions.onCancel();
              }
            }}>
              {mergedOptions.cancelText}
            </button>
          </div>
        </div>
      );

      enqueueSnackbar(choicePrompt, {
        variant: 'info',
        persist: true,
      });
    } else {
      Notiflix.Confirm.show(
        mergedOptions.title,
        mergedOptions.message,
        mergedOptions.confirmText,
        mergedOptions.cancelText,
        mergedOptions.onConfirm,
        mergedOptions.onCancel
      );
    }
  };

  const serverDisconnect = () => {
    // Server disconnect functionality is commented out in original code
    return;
  };

  // Helper to switch notification modes
  const setNotificationSystem = (mode) => {
    if (['notistack', 'notiflix', 'custom'].includes(mode)) {
      setNotificationMode(mode);
    } else {
      console.error(`Invalid notification mode: ${mode}. Must be 'notistack', 'notiflix', or 'custom'`);
    }
  };

  // Custom notifications container component
  const CustomNotificationsContainer = () => {
    if (notificationMode !== 'custom' || customNotifications.length === 0) {
      return null;
    }

    return (
      <div className="custom-notifications-container print">
        {customNotifications.map(notification => (
          <div 
            key={notification.id} 
            className={`custom-notification ${notification.type} ${notification.important ? 'important' : ''}`}
          >
            <div className="notification-icon">
              {notification.icon}
            </div>
            <div className="notification-content">
              {notification.title && (
                <div className="notification-title">{notification.title}</div>
              )}
              <div className="notification-message">{notification.message}</div>
            </div>
            {notification.type === 'choice' ? (
              <div className="notification-actions">
                <button 
                  className="action-button confirm" 
                  onClick={notification.onConfirm}
                >
                  {notification.confirmText}
                </button>
                <button 
                  className="action-button cancel" 
                  onClick={notification.onCancel}
                >
                  {notification.cancelText}
                </button>
              </div>
            ) : !notification.persist && (
              <button 
                className="notification-close" 
                onClick={() => removeCustomNotification(notification.id)}
              >
                <FiX />
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Override fetch if needed
  const originalFetch = window.fetch;

  window.fetch = async (input, init, spinnerOptions = {}) => {
    // Show the loading spinner before request starts
    if (spinnerOptions.active) {
      const loader = spinner(spinnerOptions.spinnerMessage || 'Loading, please wait...');
      let loaded = false;

      return originalFetch(input, init)
      .then(response => {
        if(!response.ok){
          if(spinnerOptions.bypass){
            loader.complete(false, '', false);
          }else{
            loader.complete(false);
          }
          
        }else{
          loader.complete(true, spinnerOptions.spinnerSuccess || 'Request completed successfully');
          loaded = true;
        }
        return response; // Always return the response, even if it's an error response
      }).finally(()=>{
        if(!loaded){
          loader.complete(false);
        }
      })
    }
    return originalFetch(input, init);
  };

  return (
    <NotifyContext.Provider 
      value={{ 
        error, 
        success, 
        spinner, 
        choice, 
        info, 
        serverDisconnect,
        setNotificationSystem
      }}
    >
      {children}
      <CustomNotificationsContainer />
    </NotifyContext.Provider>
  );
};