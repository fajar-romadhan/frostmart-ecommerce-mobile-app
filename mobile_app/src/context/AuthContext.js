import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { ApiService, isAbortError } from '../core/api';
import { StorageService } from '../core/storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check auth status on launch
  useEffect(() => {
    const bootstrapAsync = async () => {
      setIsLoading(true);
      const startTime = Date.now();
      try {
        const token = await StorageService.getToken();
        if (token) {
          const userData = await StorageService.getUserData();
          if (userData) {
            setUser(userData);
            // Silently refresh profile
            try {
              const res = await ApiService.get('/profile');
              const body = await res.json();
              if (res.status === 200 && body.success) {
                setUser(body.data);
                await StorageService.saveUserData(body.data);
              } else if (res.status === 401) {
                // Token expired
                await logout();
              }
            } catch (e) {
              if (!isAbortError(e)) {
                console.log('Failed silent profile refresh:', e?.message);
              }
            }
          }
        }
      } catch (err) {
        console.log('Auth bootstrap error:', err?.message);
      } finally {
        // Ensure splash shows for at least 1.5 seconds for a smooth transition
        const elapsed = Date.now() - startTime;
        if (elapsed < 1500) {
          await new Promise((resolve) => setTimeout(resolve, 1500 - elapsed));
        }
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const isRefreshingRef = useRef(false);

  /**
   * Lightweight point refresh — fetches only total_points from /profile
   * WITHOUT triggering the isLoading spinner. Safe to call in polling loops.
   */
  const refreshPoints = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const res = await ApiService.get('/profile');
      const body = await res.json();
      if (res.status === 200 && body.success && body.data) {
        const freshPoints = body.data.total_points ?? 0;
        setUser((prev) => {
          if (!prev) return prev;
          // Only update when value actually changed to avoid unnecessary re-renders
          if (prev.total_points === freshPoints) return prev;
          const updated = { ...prev, total_points: freshPoints };
          StorageService.saveUserData(updated);
          return updated;
        });
      }
    } catch (e) {
      // Silently ignore abort/network drop during polling
      if (!isAbortError(e)) {
        console.log('[refreshPoints] silent fail:', e?.message);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  const register = async ({ name, email, password, confirmPassword, phone, initial_address, initial_lat, initial_lng }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.post('/register', {
        name,
        email,
        password,
        password_confirmation: confirmPassword,
        phone,
        initial_address,
        initial_lat,
        initial_lng,
      });

      const body = await res.json();
      if (res.status === 201 && body.success) {
        setIsLoading(false);
        return true;
      } else {
        if (body.errors) {
          const errorKeys = Object.keys(body.errors);
          if (errorKeys.length > 0) {
            const firstErrorField = body.errors[errorKeys[0]];
            const detailedMsg = Array.isArray(firstErrorField) ? firstErrorField[0] : String(firstErrorField);
            setErrorMessage(detailedMsg);
          } else {
            setErrorMessage(body.message || 'Registrasi gagal.');
          }
        } else {
          setErrorMessage(body.message || 'Registrasi gagal.');
        }
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
      setIsLoading(false);
      return false;
    }
  };

  const login = async (email, password) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.post('/login', { email, password });
      const body = await res.json();

      if (res.status === 200 && body.success) {
        const { token, user: loggedUser } = body.data;

        setUser(loggedUser);
        await StorageService.saveToken(token);
        await StorageService.saveUserData(loggedUser);
        setIsLoading(false);
        return true;
      } else {
        setErrorMessage(body.message || 'Email atau password salah.');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
      setIsLoading(false);
      return false;
    }
  };

  const getProfile = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.get('/profile');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setUser(body.data);
        await StorageService.saveUserData(body.data);
        setIsLoading(false);
        return true;
      } else {
        await logout();
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setErrorMessage('Gagal memuat profil.');
      setIsLoading(false);
      return false;
    }
  };

  const updateProfile = async ({ name, phone, profilePhoto = null }) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      let res;
      if (profilePhoto) {
        // Multipart upload when photo is provided
        res = await ApiService.putProfileMultipart('/profile', { name, phone }, profilePhoto);
      } else {
        res = await ApiService.put('/profile', { name, phone });
      }
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setUser(body.data);
        await StorageService.saveUserData(body.data);
        setIsLoading(false);
        return true;
      } else {
        setErrorMessage(body.message || 'Gagal memperbarui profil.');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
      setIsLoading(false);
      return false;
    }
  };

  const deleteProfilePhoto = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await ApiService.delete('/profile/photo');
      const body = await res.json();
      if (res.status === 200 && body.success) {
        setUser(body.data);
        await StorageService.saveUserData(body.data);
        setIsLoading(false);
        return true;
      } else {
        setErrorMessage(body.message || 'Gagal menghapus foto profil.');
        setIsLoading(false);
        return false;
      }
    } catch (e) {
      setErrorMessage('Koneksi internet bermasalah.');
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await ApiService.post('/logout', {});
    } catch (e) {
      console.log('Logout API failed or server unreachable:', e);
    }
    setUser(null);
    await StorageService.clearAuth();
    setIsLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        errorMessage,
        isAuthenticated: !!user,
        login,
        register,
        getProfile,
        updateProfile,
        deleteProfilePhoto,
        logout,
        refreshPoints,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
