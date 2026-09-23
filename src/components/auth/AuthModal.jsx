import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Gamepad2,
  KeyRound,
  RefreshCw,
  Clock,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { authService } from '../../services/authService';
import { maskEmail, maskRobloxUsername } from '../../utils/privacyMask';
import SecurityCaptcha from '../common/SecurityCaptcha';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register, registerRequestOTP, registerVerifyOTP } = useAuth();
  const { triggerAudio, setRobloxUsername } = useStore();

  // Mode: 'login' | 'register' | 'register_otp' | 'forgot_email' | 'forgot_otp' | 'forgot_new_pass'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [robloxUsernameInput, setRobloxUsernameInput] = useState('');

  // OTP State
  const [otpInput, setOtpInput] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [timerSeconds, setTimerSeconds] = useState(600);

  // Security Captcha State
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);

  // Status & Error
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Reset state and attach Escape key listener when modal opens
  useEffect(() => {
    if (isAuthModalOpen) {
      setMode('login');
      setErrorMsg(null);
      setSuccessMsg(null);
      setCaptchaVerified(false);
      setOtpInput('');
      const onKey = (e) => {
        if (e.key === 'Escape') closeAuthModal();
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [isAuthModalOpen, closeAuthModal]);

  // Mode Switch Helper
  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCaptchaVerified(false);
    setCaptchaToken(null);
    setOtpInput('');
  };

  // Countdown timer for OTP
  useEffect(() => {
    let interval = null;
    if ((mode === 'forgot_otp' || mode === 'register_otp') && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [mode, timerSeconds]);

  if (!isAuthModalOpen) return null;

  // Handle Login / Register Submit
  const handleSubmitAuth = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!captchaVerified) {
      setErrorMsg('Please solve the Anti-Spam Security Captcha first.');
      triggerAudio?.('error');
      return;
    }

    setIsLoading(true);
    triggerAudio?.('click');

    try {
      if (mode === 'login') {
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address');
        if (password.length < 5 || password.length > 16) throw new Error('Password must be between 5 and 16 characters long');

        const res = await login(email, password);
        triggerAudio?.('success');
        if (res.user?.robloxUsername) {
          setRobloxUsername(res.user.robloxUsername);
        }
        closeAuthModal();
      } else if (mode === 'register') {
        if (!name.trim()) throw new Error('Please enter your full name');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address');
        if (password.length < 5 || password.length > 16) throw new Error('Password must be between 5 and 16 characters long');

        const res = await registerRequestOTP({
          name: name.trim(),
          email: email.trim(),
          password,
          robloxUsername: robloxUsernameInput.trim() || name.trim()
        });

        if (res.success) {
          setSuccessMsg(`A 6-digit verification code has been dispatched to ${email}`);
          setTimerSeconds(res.expiresInSeconds || 600);
          setOtpInput('');
          setMode('register_otp');
          triggerAudio?.('success');
        } else {
          throw new Error(res.error || 'Failed to dispatch verification code');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2 for Registration: Verify 6-digit OTP
  const handleVerifyRegisterOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpInput.trim().length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      triggerAudio?.('error');
      return;
    }

    setIsLoading(true);
    triggerAudio?.('click');

    try {
      const res = await registerVerifyOTP({
        email: email.trim(),
        otpCode: otpInput.trim()
      });

      if (res.success) {
        triggerAudio?.('success');
        if (robloxUsernameInput) {
          setRobloxUsername(robloxUsernameInput);
        }
        closeAuthModal();
      } else {
        throw new Error(res.error || 'Registration failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid or expired verification code');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP for Registration
  const handleResendRegisterOTP = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await registerRequestOTP({
        name: name.trim(),
        email: email.trim(),
        password,
        robloxUsername: robloxUsernameInput.trim() || name.trim()
      });
      if (res.success) {
        setSuccessMsg(`A new code was dispatched to ${email}`);
        setTimerSeconds(res.expiresInSeconds || 600);
        triggerAudio?.('success');
      } else {
        throw new Error(res.error || 'Failed to resend code');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to resend code');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Request OTP for Forgot Password
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!captchaVerified) {
      setErrorMsg('Please solve the security challenge first.');
      triggerAudio?.('error');
      return;
    }

    setIsLoading(true);
    triggerAudio?.('click');

    try {
      const res = await authService.requestForgotPasswordOTP(email.trim());
      setSuccessMsg(`6-digit code dispatched to ${res.email || email}`);
      setTimerSeconds(res.expiresInSeconds || 600);

      setMode('forgot_otp');
      triggerAudio?.('success');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to dispatch verification code');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (otpInput.trim().length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      triggerAudio?.('error');
      return;
    }

    setIsLoading(true);
    triggerAudio?.('click');

    try {
      const res = await authService.verifyResetOTP(email.trim(), otpInput.trim());
      setResetToken(res.resetToken);
      setSuccessMsg('Code verified! Enter your new password.');
      setMode('forgot_new_pass');
      triggerAudio?.('success');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid verification code');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleResetNewPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 5 || password.length > 16) {
      setErrorMsg('Password must be between 5 and 16 characters.');
      triggerAudio?.('error');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      triggerAudio?.('error');
      return;
    }

    setIsLoading(true);
    triggerAudio?.('click');

    try {
      const res = await authService.resetPassword(email.trim(), otpInput.trim(), resetToken, password);
      setSuccessMsg(res.message || 'Password successfully updated! You can now log in.');
      triggerAudio?.('success');
      setTimeout(() => {
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password');
      triggerAudio?.('error');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeAuthModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto overscroll-contain z-10 p-4 sm:p-7 flex flex-col justify-between"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-gs-border">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                {mode.startsWith('forgot') || mode === 'register_otp' ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="font-heading font-black text-lg text-white uppercase flex items-center gap-1.5">
                  <span>
                    {mode === 'login' && 'Sign In to GrandStock'}
                    {mode === 'register' && 'Create Buyer Account'}
                    {mode === 'register_otp' && 'Verify Your Email'}
                    {mode === 'forgot_email' && 'Reset Account Password'}
                    {mode === 'forgot_otp' && 'Enter 6-Digit OTP'}
                    {mode === 'forgot_new_pass' && 'Set New Password'}
                  </span>
                </h2>
                <p className="text-[11px] text-gs-muted">
                  {mode === 'login' && 'Access live manual delivery tickets & orders'}
                  {mode === 'register' && 'Instant registration with email verification'}
                  {mode === 'register_otp' && `6-digit OTP code sent to ${maskEmail(email)}`}
                  {mode === 'forgot_email' && 'Receive a secure verification code to your Gmail'}
                  {mode === 'forgot_otp' && `Code sent to ${maskEmail(email)}`}
                  {mode === 'forgot_new_pass' && 'Secured with PBKDF2-SHA512 cryptographic encryption'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeAuthModal}
              className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>


          {/* Error & Success Messages */}
          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1 & 2: SIGN IN & REGISTER FORMS                     */}
          {/* ======================================================== */}
          {(mode === 'login' || mode === 'register') && (
            <form onSubmit={handleSubmitAuth} className="py-4 space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                      Full Name:
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Trader"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                      Roblox In-Game Username:
                    </label>
                    <div className="relative">
                      <Gamepad2 className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={robloxUsernameInput}
                        onChange={(e) => setRobloxUsernameInput(e.target.value)}
                        placeholder="e.g. ShadowNinja99"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Gmail / Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light">
                    Password:
                  </label>
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot_email')}
                      className="text-[10px] font-heading font-bold text-gs-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  ) : (
                    <span className={`text-[10px] font-mono ${password.length >= 5 && password.length <= 16 ? 'text-emerald-400' : 'text-gs-muted'}`}>
                      {password.length}/16 chars (min 5)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={5}
                    maxLength={16}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="5–16 characters"
                    className="w-full pl-9 pr-14 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                  />
                  {mode === 'login' && (
                    <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono ${password.length >= 5 && password.length <= 16 ? 'text-emerald-400' : 'text-gs-muted'}`}>
                      {password.length}/16
                    </span>
                  )}
                </div>
              </div>

              {/* Anti-Spam Captcha on Login & Registration */}
              <div className="pt-1">
                <SecurityCaptcha
                  key={mode}
                  onVerify={(token) => { setCaptchaVerified(true); setCaptchaToken(token); }}
                  onVerified={(token) => { setCaptchaVerified(true); setCaptchaToken(token); }}
                  isVerified={captchaVerified}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !captchaVerified}
                className="w-full py-3 rounded-xl btn-primary font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all mt-2 disabled:opacity-50"
              >
                <span>{isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Register Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {/* Mode Switch */}
              <div className="pt-2 text-center text-xs text-gs-muted">
                {mode === 'login' ? (
                  <span>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('register')}
                      className="text-white font-bold hover:underline"
                    >
                      Create Account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="text-white font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW: VERIFY REGISTRATION OTP                            */}
          {/* ======================================================== */}
          {mode === 'register_otp' && (
            <form onSubmit={handleVerifyRegisterOTP} className="py-4 space-y-4">
              <div className="p-3 rounded-xl bg-gs-raised/60 border border-gs-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-gs-muted">Code expires in:</span>
                </div>
                <span className="text-amber-400 font-bold">{formatTimer(timerSeconds)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1 text-center">
                  Enter 6-Digit Email Verification Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full py-3 px-4 rounded-xl bg-gs-raised border-2 border-gs-primary focus:outline-none text-white text-center text-2xl font-mono font-black tracking-[8px]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpInput.length !== 6}
                className="w-full py-3 rounded-xl btn-primary font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify & Create Account'}</span>
                <Check className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('register')}
                  className="text-gs-muted hover:text-white"
                >
                  &larr; Back to Form
                </button>

                <button
                  type="button"
                  onClick={handleResendRegisterOTP}
                  disabled={timerSeconds > 540 || isLoading}
                  className="text-gs-primary font-bold hover:underline disabled:opacity-40"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: FORGOT PASSWORD (ENTER GMAIL)                    */}
          {/* ======================================================== */}
          {mode === 'forgot_email' && (
            <form onSubmit={handleRequestOTP} className="py-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Registered Gmail / Email Address:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
                  />
                </div>
              </div>

              {/* Security Captcha to prevent OTP spamming */}
              <div className="pt-1">
                <SecurityCaptcha
                  key="forgot_email"
                  onVerify={(token) => { setCaptchaVerified(true); setCaptchaToken(token); }}
                  onVerified={(token) => { setCaptchaVerified(true); setCaptchaToken(token); }}
                  isVerified={captchaVerified}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !captchaVerified}
                className="w-full py-3 rounded-xl btn-primary font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Dispatching OTP...' : 'Send 6-Digit OTP to Gmail'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="pt-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="text-gs-muted hover:text-white font-heading font-bold"
                >
                  &larr; Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 4: VERIFY 6-DIGIT OTP                               */}
          {/* ======================================================== */}
          {mode === 'forgot_otp' && (
            <form onSubmit={handleVerifyOTP} className="py-4 space-y-4">
              <div className="p-3 rounded-xl bg-gs-raised/60 border border-gs-border flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-gs-muted">Code expires in:</span>
                </div>
                <span className="text-amber-400 font-bold">{formatTimer(timerSeconds)}</span>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1 text-center">
                  Enter 6-Digit OTP Code:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="849201"
                  className="w-full py-3 px-4 rounded-xl bg-gs-raised border-2 border-gs-primary focus:outline-none text-white text-center text-2xl font-mono font-black tracking-[8px]"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpInput.length !== 6}
                className="w-full py-3 rounded-xl btn-primary font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all disabled:opacity-50"
              >
                <span>{isLoading ? 'Verifying...' : 'Verify Code & Proceed'}</span>
                <Check className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => switchMode('forgot_email')}
                  className="text-gs-muted hover:text-white"
                >
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleRequestOTP}
                  disabled={timerSeconds > 540}
                  className="text-gs-primary font-bold hover:underline disabled:opacity-40"
                >
                  Resend Code
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* VIEW 5: SET NEW SECURE PASSWORD                          */}
          {/* ======================================================== */}
          {mode === 'forgot_new_pass' && (
            <form onSubmit={handleResetNewPassword} className="py-4 space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light">
                    New Password:
                  </label>
                  <span className={`text-[10px] font-mono ${password.length >= 5 && password.length <= 16 ? 'text-emerald-400' : 'text-gs-muted'}`}>
                    {password.length}/16 chars (min 5)
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={5}
                    maxLength={16}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="5–16 characters"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Confirm New Password:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={5}
                    maxLength={16}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your new password (5–16 characters)"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-success transition-all"
              >
                <span>{isLoading ? 'Updating Password...' : 'Save New Password & Log In'}</span>
                <Check className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Security Notice */}
          <div className="p-2.5 rounded-xl bg-gs-raised/60 border border-gs-border/60 text-center text-[10px] text-gs-muted flex items-center justify-center gap-1.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-Bit SSL Encrypted Escrow Account Protection</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
