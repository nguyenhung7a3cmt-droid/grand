import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, getStoredToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'
  const [isAdminStaffModalOpen, setIsAdminStaffModalOpen] = useState(false);
  const [adminModalInitialTab, setAdminModalInitialTab] = useState('coupons');
  const [isStaffPortalOpen, setIsStaffPortalOpen] = useState(false);
  const [selectedStaffTicketId, setSelectedStaffTicketId] = useState(null);

  // Global event listener to open auth modal anywhere
  useEffect(() => {
    const handleOpenAuth = (e) => {
      setAuthModalMode(e?.detail?.mode || 'login');
      setIsAuthModalOpen(true);
    };
    window.addEventListener('grandstock:open-auth', handleOpenAuth);
    return () => window.removeEventListener('grandstock:open-auth', handleOpenAuth);
  }, []);

  // Initialize session on load from backend
  useEffect(() => {
    async function checkSession() {
      try {
        // Clean out any legacy mock demo session from localStorage
        const savedSession = localStorage.getItem('grandstock_active_session');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed?.email === 'customer@gmail.com' || parsed?.id === 'usr-customer-01') {
              localStorage.removeItem('grandstock_active_session');
            }
          } catch (e) {
            localStorage.removeItem('grandstock_active_session');
          }
        }

        const user = await authService.getMe();

        if (user) {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('grandstock_active_session');
        }
      } catch (e) {
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    checkSession();
  }, []);

  // Fetch users when admin modal opens
  const fetchAllUsers = useCallback(async () => {
    try {
      const all = await authService.getAllUsers();
      if (Array.isArray(all) && all.length > 0) {
        setUsers(all);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (isAdminStaffModalOpen && (currentUser?.role === 'admin' || currentUser?.isOwner)) {
      fetchAllUsers();
    }
  }, [isAdminStaffModalOpen, currentUser, fetchAllUsers]);

  // Sync session to localStorage for client-side persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('grandstock_active_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('grandstock_active_session');
    }
  }, [currentUser]);

  // Step 1: Request Registration OTP
  const registerRequestOTP = useCallback(async ({ name, email, password, robloxUsername }) => {
    try {
      const data = await authService.requestRegisterOTP({ name, email, password, robloxUsername });
      return { success: true, message: data.message, email: data.email, expiresInSeconds: data.expiresInSeconds };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to dispatch verification code' };
    }
  }, []);

  // Step 2: Verify Registration OTP & Complete Account Setup
  const registerVerifyOTP = useCallback(async ({ email, otpCode }) => {
    try {
      const data = await authService.verifyRegisterOTP({ email, otpCode });
      if (data.user) {
        setCurrentUser(data.user);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid or expired verification code' };
    }
  }, []);

  // Direct Backend Public Registration Fallback
  const register = useCallback(async ({ name, email, password, robloxUsername }) => {
    try {
      const data = await authService.register(name, email, password, robloxUsername);
      if (data.user) {
        setCurrentUser(data.user);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Registration failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    }
  }, []);

  // Real Backend Login (Verifies password hash on server)
  const login = useCallback(async (email, password) => {
    try {
      const data = await authService.login(email, password);
      if (data.user) {
        setCurrentUser(data.user);
        setIsAuthModalOpen(false);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Login failed' };
    } catch (err) {
      return { success: false, error: err.message || 'Invalid credentials' };
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    localStorage.removeItem('grandstock_active_session');
    setCurrentUser(null);
  }, []);



  // Real Owner Staff Creation Action
  const createStaffAccount = useCallback(async ({ name, email, password, robloxUsername, assignedGames }) => {
    try {
      const data = await authService.createStaffAccount({ name, email, password, robloxUsername, assignedGames });
      await fetchAllUsers();
      return { success: true, staff: data.staff, message: data.message };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [fetchAllUsers]);

  // Promote / Demote Action
  const updateUserRole = useCallback(async (userId, newRole, robloxUsername) => {
    try {
      const data = await authService.updateUserRole(userId, newRole, robloxUsername);
      if (data.users) setUsers(data.users);
      if (currentUser?.id === userId && data.user) setCurrentUser(data.user);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [currentUser]);

  // Delete User Action
  const deleteUser = useCallback(async (userId) => {
    try {
      const data = await authService.deleteUser(userId);
      if (data.users) setUsers(data.users);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  const openAuthModal = useCallback((mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  const openAdminStaffModal = useCallback((tab = 'coupons') => {
    setAdminModalInitialTab(tab);
    setIsAdminStaffModalOpen(true);
  }, []);
  const closeAdminStaffModal = useCallback(() => setIsAdminStaffModalOpen(false), []);

  const openStaffPortal = useCallback((ticketId = null) => {
    if (ticketId) setSelectedStaffTicketId(ticketId);
    setIsStaffPortalOpen(true);
  }, []);
  const closeStaffPortal = useCallback(() => setIsStaffPortalOpen(false), []);

  const isStaff = currentUser?.role === 'staff' || currentUser?.role === 'admin';
  const isAdmin = currentUser?.role === 'admin' || currentUser?.isOwner === true;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        fetchAllUsers,
        isLoadingAuth,
        isStaff,
        isAdmin,
        register,
        registerRequestOTP,
        registerVerifyOTP,
        login,
        logout,
        createStaffAccount,
        updateUserRole,
        deleteUser,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        isAdminStaffModalOpen,
        adminModalInitialTab,
        openAdminStaffModal,
        closeAdminStaffModal,
        isStaffPortalOpen,
        selectedStaffTicketId,
        openStaffPortal,
        closeStaffPortal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
