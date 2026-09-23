// Real Backend Authentication & Gmail OTP Service
const TOKEN_KEY = 'grandstock_jwt_token_v2';
const USER_KEY = 'grandstock_auth_user_v2';

export function getStoredToken() {
  return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
}

export const authService = {
  getStoredToken,

  async getMe() {
    const token = getStoredToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (e) {}
    return null;
  },

  getStoredSession() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = localStorage.getItem(USER_KEY);
      if (token && user) {
        return { token, user: JSON.parse(user) };
      }
    } catch (e) {}
    return { token: null, user: null };
  },

  async requestRegisterOTP({ name, email, password, robloxUsername }) {
    const res = await fetch('/api/auth/register-request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, robloxUsername })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch registration OTP');
    return data;
  },

  async verifyRegisterOTP({ email, otpCode }) {
    const res = await fetch('/api/auth/register-verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration OTP verification failed');
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async register(name, email, password, robloxUsername) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, robloxUsername })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async requestForgotPasswordOTP(email) {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to dispatch OTP code');
    return data;
  },

  async verifyResetOTP(email, otpCode) {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Invalid verification code');
    return data;
  },

  async resetPassword(email, otpCode, resetToken, newPassword) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode, resetToken, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async createStaffAccount(staffData) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch('/api/auth/create-staff', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(staffData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create staff account');
    return data;
  },

  async getAllUsers() {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch('/api/auth/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data.users;
  }
};
