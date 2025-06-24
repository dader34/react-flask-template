import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './styles/App.css';
import { useNotify } from './context/NotificationContext';
import { useUtils } from './context/UtilContext';

// Constants for timing
const SESSION_CHECK_INTERVAL = 1000 * 60 * 1; // Check session every 1 minute
const WARNING_BEFORE_TIMEOUT = 1000 * 60 * 30; // Show warning 30 minutes before timeout
const COUNTDOWN_DURATION = 60; // 60 seconds countdown
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

// TESTING VARIABLES - set to true to enable testing mode
const TESTING_MODE = {
  enabled: false,                   // Master switch for testing mode
  showTimeoutImmediately: false,   // Show timeout modal immediately on component mount
  simulateTimeout: false,          // Simulate timeout after delay
  timeoutDelay: 3000,              // Delay before showing timeout modal (in ms)
  shortCountdown: true,            // Use a shorter countdown for testing
  testCountdownDuration: 30,       // Test countdown duration in seconds
  shortWarningTime: 1000 * 10      // 10 seconds for testing (instead of 30 minutes)
};

function App() {
  const { refreshUser, user, logout } = useAuth();
  const navigate = useNavigate();
  const {error} = useNotify()
  const location = useLocation();
  
  // Modal states
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(
    TESTING_MODE.shortCountdown ? TESTING_MODE.testCountdownDuration : COUNTDOWN_DURATION
  );

  // Refs to store timer IDs
  const sessionCheckIntervalRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  // Check if we're on the password reset page
  const isPasswordResetPage = location.pathname.startsWith('/reset_password/');

  // Reset the warning timer
  const resetWarningTimer = useCallback(() => {
    // console.log('🔄 Resetting session warning timer');
    
    // Clear existing warning timer
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }

    // Don't set new timer if modal is already open or we're on reset page
    if (isTimeoutModalOpen || isPasswordResetPage || TESTING_MODE.enabled) {
      return;
    }

    // Set new warning timer
    const warningDelay = TESTING_MODE.enabled ? TESTING_MODE.shortWarningTime : WARNING_BEFORE_TIMEOUT;
    warningTimeoutRef.current = setTimeout(() => {
      console.log('⚠️ Session warning timeout reached');
      startCountdown();
    }, warningDelay);
    
    // console.log(`⏰ New session warning timer set for ${warningDelay / 1000} seconds`);
  }, [isTimeoutModalOpen, isPasswordResetPage]);

  // Track user activity
  const handleUserActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Reset warning timer on activity (but only if modal isn't open)
    if (!isTimeoutModalOpen) {
      resetWarningTimer();
    }
  }, [resetWarningTimer, isTimeoutModalOpen]);

  // Timeout modal handlers
  const startCountdown = useCallback(() => {
    console.log('🚨 Starting session timeout countdown');
    setCountdown(
      TESTING_MODE.shortCountdown ? TESTING_MODE.testCountdownDuration : COUNTDOWN_DURATION
    );
    setIsTimeoutModalOpen(true);
    
    // Clear the warning timer since modal is now open
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
  }, []);

  // Testing function to force show the timeout modal
  const testShowTimeoutModal = useCallback(() => {
    startCountdown();
  }, [startCountdown]);

  const handleLogout = () => {
    console.log('👋 Logging out user');
    
    // Clear all timers
    if (sessionCheckIntervalRef.current) {
      clearInterval(sessionCheckIntervalRef.current);
      sessionCheckIntervalRef.current = null;
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    logout().then((data) => {
        navigate("/login");
        if (data && data.hasOwnProperty("error")) {
            error(data);
        }
    });
  };

  const handleStayLoggedIn = useCallback(() => {
    console.log('✅ User chose to stay logged in');
    
    refreshUser().then((loggedIn) => {
      if (loggedIn) {
        console.log('✅ Session refresh successful');
        setIsTimeoutModalOpen(false);
        // Reset the warning timer for another cycle
        resetWarningTimer();
      } else {
        console.log('❌ Session refresh failed - logging out');
        document.cookie = ''
        navigate('/login');
      }
    });
  }, [refreshUser, navigate, resetWarningTimer]);

  // Initial auth check
  useEffect(() => {
    if (!isPasswordResetPage) {
      console.log('🔍 Initial auth check');
      refreshUser().then((loggedIn) => {
        if (!loggedIn) {
          document.cookie = ''
          console.log('❌ Not logged in - redirecting to login')
          navigate('/login');
        } else {
          console.log('✅ Initial auth check passed');
        }
      });
    }
  }, [isPasswordResetPage]);

  // Set up activity listeners
  useEffect(() => {
    if (isPasswordResetPage) return;

    // console.log('👂 Setting up activity listeners');
    
    // Add activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [handleUserActivity, isPasswordResetPage]);

  // Regular session checking and timeout warning
  useEffect(() => {
    if (isPasswordResetPage || TESTING_MODE.enabled) return;

    // console.log('🔄 Setting up session management');

    // Regular session refresh
    sessionCheckIntervalRef.current = setInterval(() => {
      console.log('🔍 Performing regular session check');
      
      refreshUser().then((loggedIn) => {
        if (!loggedIn) {
          console.log('❌ Session check failed - logging out');
          document.cookie = ''
          navigate('/login');
        } else {
          console.log('✅ Session check passed');
          // Don't reset warning timer here - only reset on user activity
        }
      });
    }, SESSION_CHECK_INTERVAL);

    // Set initial warning timer
    resetWarningTimer();

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };
  }, [isPasswordResetPage, navigate, refreshUser, resetWarningTimer]);

  // Countdown timer effect
  useEffect(() => {
    if (isTimeoutModalOpen && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isTimeoutModalOpen && countdown === 0) {
      console.log('⏰ Countdown reached zero - logging out');
      handleLogout();
    }
  }, [isTimeoutModalOpen, countdown]);

  // TESTING: Simulate timeout immediately or after delay
  useEffect(() => {
    if (!TESTING_MODE.enabled) return;
    
    console.log('🧪 Testing mode enabled');
    
    // Show timeout modal immediately or after delay based on testing settings
    if (TESTING_MODE.showTimeoutImmediately) {
      startCountdown();
    } else if (TESTING_MODE.simulateTimeout) {
      const testTimeout = setTimeout(() => {
        startCountdown();
      }, TESTING_MODE.timeoutDelay);
      return () => clearTimeout(testTimeout);
    }
  }, []);

  // Format the countdown time nicely (MM:SS)
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // test button to the UI when in testing mode
  const renderTestingControls = () => {
    if (!TESTING_MODE.enabled) return null;
    
    return (
      <div className="testing-controls">
        <h4>Testing Controls</h4>
        <button 
          onClick={testShowTimeoutModal}
          className="testing-button"
        >
          Show Timeout Modal
        </button>
        <div className="testing-info">
          <p>Last Activity: {new Date(lastActivityRef.current).toLocaleTimeString()}</p>
          <p>Modal Open: {isTimeoutModalOpen ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  };

  if (!user && !isPasswordResetPage) {
    return null; // Don't render anything until authentication is confirmed
  }

  return (
    <div className="App">
      <div className="main-content">
        <Outlet />
      </div>
      
      
      {/* Session Timeout Modal */}
      {isTimeoutModalOpen && (
        <div className="session-timeout-overlay">
          <div className="session-timeout-modal">
            <div className="session-timeout-header">
              <h2 className="session-timeout-title">
                <span className="warning-icon" role="img" aria-label="warning">⚠️</span>
                Session Timeout Warning
              </h2>
            </div>
            <div className="session-timeout-content">
              <div className="session-timeout-message">
                <span className="alert-icon" role="img" aria-label="alert">🔔</span>
                Your session is about to expire due to inactivity.
              </div>
              <p className="session-timeout-description">
                For security reasons, you will be automatically logged out in
                <span 
                  className={`session-timeout-countdown ${countdown < 10 ? 'countdown-warning' : ''}`}
                >
                  {formatCountdown(countdown)}
                </span>
                unless you choose to stay logged in.
              </p>
              <div className="session-timeout-buttons">
                <button 
                  onClick={handleLogout} 
                  className="logout-button"
                >
                  Logout Now
                </button>
                <button 
                  onClick={handleStayLoggedIn} 
                  className="stay-button"
                  autoFocus
                >
                  Stay Logged In
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Testing Controls */}
      {renderTestingControls()}
    </div>

  );
}

export default App;