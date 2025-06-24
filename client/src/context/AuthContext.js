import { createContext, useContext, useState } from 'react';
import { useNotify } from './NotificationContext';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [userLoading, setUserLoading] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const { error } = useNotify();

    // Environment configuration
    const DEV = process.env.REACT_APP_DEV;
    const APP_URL = 'http://127.0.0.1:5252'

    // Utility function to get cookies
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return '';
    };

    // Enhanced API request helper
    const apiRequest = async (endpoint, options = {}) => {
        let url = `${APP_URL}${endpoint}`;
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        // Add CSRF token for non-GET requests
        if (options.method && options.method !== 'GET') {
            defaultOptions.headers['X-CSRF-TOKEN'] = getCookie('csrf_access_token');
        }

        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            return response;
        } catch (err) {
            console.error('API Request Error:', err);
            throw err;
        }
    };

    // Get user function - always returns fresh data
    const getUser = async (options = {}) => {
        const { 
            cache = true,           // Use cached user if available
            forceRefresh = false,   // Force a fresh API call
            throwOnError = false    // Throw errors instead of returning null
        } = options;

        // Don't fetch user if we're in the middle of logging out
        if (isLoggingOut) {
            if (throwOnError) {
                throw new Error('Currently logging out');
            }
            return null;
        }

        // Return cached user if available and not forcing refresh
        if (cache && user && !forceRefresh) {
            return user;
        }

        // Check if we have a token
        if (!getCookie('csrf_access_token')) {
            if (throwOnError) {
                throw new Error('No authentication token found');
            }
            setUser(null);
            return null;
        }

        setUserLoading(true);

        try {
            const response = await apiRequest('/user');
            
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return userData;
            } 
            
            // If 401, try to refresh token
            if (response.status === 401) {
                response.json().then(async(data) =>{
                    if(data['msg'].startsWith('Missing')){
                        return null
                    }
                    else {
                        const refreshed = await attemptTokenRefresh();
                        if (refreshed && user) {
                        return user;
                    }
                }
                })
                
                
            }
            
            // Other errors
            setUser(null);
            if (throwOnError) {
                throw new Error(`Failed to get user: ${response.status}`);
            }
            return null;
            
        } catch (err) {
            console.error('Error getting user:', err);
            setUser(null);
            if (throwOnError) {
                throw err;
            }
            return null;
        } finally {
            setUserLoading(false);
        }
    };

    // Simplified user refresh function - now just calls getUser
    const refreshUser = async () => {
        try {
            const userData = await getUser({ forceRefresh: true });
            return !!userData;
        } catch (err) {
            return false;
        }
    };

    // Token refresh helper
    const attemptTokenRefresh = async () => {
        try {
            const response = await apiRequest('/refresh', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCookie('csrf_refresh_token')
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
                return true;
            }
            
            setUser(null);
            return false;
        } catch (err) {
            console.error('Token refresh failed:', err);
            setUser(null);
            return false;
        }
    };

    // Simplified login function
    const login = async (username, password) => {
        if (!username || !password) {
            return { error: 'Username and password are required' };
        }

        setIsLoading(true);
        
        try {
            const response = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Check if 2FA is required
                if (data.requires_2fa || data.success) {
                    return { success: true, requires2FA: true, message: data.message };
                }
                
                // Direct login success (no 2FA)
                setUser(data);
                return { success: true, user: data };
            }

            return { error: data.error || 'Login failed' };
            
        } catch (err) {
            console.error('Login error:', err);
            return { error: 'Network error during login' };
        } finally {
            setIsLoading(false);
        }
    };

    // Simplified 2FA submission
    const submit2FA = async (code) => {
        if (!code || code.length !== 8) {
            return { error: 'Please enter a valid 8-digit code' };
        }

        setIsLoading(true);

        try {
            const response = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({ '2fa_code': code })
            });

            const data = await response.json();

            if (response.ok) {
                setUser(data);
                return { success: true, user: data };
            }

            return { error: data.error || 'Invalid verification code' };
            
        } catch (err) {
            console.error('2FA error:', err);
            return { error: 'Network error during verification' };
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function to clear cookies properly
    const clearAuthCookies = () => {
        // Clear cookies with proper expiration for different possible paths and domains
        const cookiesToClear = ['csrf_access_token', 'csrf_refresh_token'];
        const domains = [window.location.hostname, `.${window.location.hostname}`, 'localhost', '.localhost'];
        const paths = ['/', '/login', '/dashboard'];
        
        cookiesToClear.forEach(cookieName => {
            // Clear with different path and domain combinations
            paths.forEach(path => {
                domains.forEach(domain => {
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                });
            });
            // Also clear without specifying domain/path
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        });
    };

    // Simplified logout function
    const logout = async () => {
        setIsLoading(true);
        setIsLoggingOut(true); // Set logout state

        try {
            setUser(null);
            
            const response = await apiRequest('/logout', {
                method: 'DELETE'
            });

            clearAuthCookies();

            if (response.status === 204 || response.ok) {
                return { success: true };
            }

            const data = await response.json();
            return { error: data.error || 'Logout failed' };
            
        } catch (err) {
            console.error('Logout error:', err);
            return { error: 'Network error during logout' };
        } finally {
            setIsLoading(false);
            // Clear logout state after a brief delay to prevent race conditions
            setTimeout(() => setIsLoggingOut(false), 500);
        }
    };

    // Password reset function
    const requestPasswordReset = async (email) => {
        if (!email) {
            return { error: 'Email is required' };
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return { error: 'Invalid email address' };
        }

        setIsLoading(true);

        try {
            const response = await apiRequest('/reset_password/send', {
                method: 'POST',
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                return { success: true, message: 'Password reset email sent' };
            }

            const data = await response.json();
            return { error: data.error || 'Failed to send reset email' };
            
        } catch (err) {
            console.error('Password reset error:', err);
            return { error: 'Network error during password reset' };
        } finally {
            setIsLoading(false);
        }
    };

    // Context value
    const value = {
        // State
        user,                    // Current cached user (can be null)
        isLoading,              // Loading state for auth operations
        userLoading,            // Loading state specifically for user fetches
        isAuthenticated: !!user,
        isLoggingOut,
        
        // Primary user function
        getUser,                // Async function to get user data
        
        // Actions
        login,
        logout,
        submit2FA,
        refreshUser,           // For backward compatibility
        requestPasswordReset,
        
        // API utilities
        apiRequest,            // Enhanced API request helper
        
        // Utilities
        getCookie,
        clearAuthCookies,
        APP_URL,
        DEV,
        
        // For backward compatibility (if needed)
        handle2FASubmit: submit2FA
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};