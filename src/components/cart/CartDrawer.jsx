import { useAuth } from '../../context/AuthContext';
import { maskRobloxUsername } from '../../utils/privacyMask';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Zap,
  Check,
  AlertCircle,
  User,
  CheckCircle2,
  Info,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function CartDrawer() {
  const { isAdmin, openAdminStaffModal } = useAuth();
  const {
    isCartOpen,
    closeCart,
    cart,
    cartCount,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
    formatPrice,
    updateQuantity,
    removeFromCart,
    clearCart,
    openCheckout,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    robloxUser,
    setRobloxUsername,
    clearRobloxUser,
    triggerAudio
  } = useStore();

  const [couponInput, setCouponInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [usernameInput, setUsernameInput] = useState(robloxUser?.username || '');
  const [usernameError, setUsernameError] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  // Sync initial username when drawer opens
  useEffect(() => {
    if (isCartOpen) {
      setUsernameInput(robloxUser?.username || '');
    }
  }, [isCartOpen]);

  // Handle ESC key close & body scroll lock
  useEffect(() => {
    if (!isCartOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (couponInput.trim()) {
      setIsApplyingCoupon(true);
      setCouponFeedback(null);
      const res = await applyCoupon(couponInput.trim());
      setIsApplyingCoupon(false);
      setCouponFeedback(res);
      if (res.success) {
        setCouponInput('');
      }
    }
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsernameInput(val);
    setUsernameError(false);
    setRobloxUsername(val);
  };

  const handleProceedCheckout = () => {
    const currentName = (usernameInput || robloxUser?.username || '').trim();
    if (!currentName) {
      setUsernameError(true);
      triggerAudio('error');
      return;
    }
    setRobloxUsername(currentName);
    triggerAudio('click');
    closeCart();
    openCheckout();
  };

  const getRarityBorder = (rarity) => {
    switch ((rarity || '').toLowerCase()) {
      case 'mythical':
        return 'border-red-500/60 shadow-[0_0_12px_rgba(238,29,54,0.3)]';
      case 'godly':
        return 'border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.3)]';
      case 'legendary':
        return 'border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]';
      case 'rare':
      default:
        return 'border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)]';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden select-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeCart}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Drawer Container */}
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
          <motion.div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="w-screen max-w-full sm:max-w-md bg-gs-card border-l border-gs-border shadow-2xl flex flex-col justify-between"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-gs-border flex items-center justify-between bg-gs-card/90 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                    <span>Your Order Cart</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-gs-primary text-white">
                      {cartCount}
                    </span>
                  </h2>
                  <p className="text-[11px] text-gs-muted">GrandStock High-Speed Delivery Queue</p>
                </div>
              </div>

              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white hover:bg-gs-border transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Middle Body */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="p-4 sm:p-5 overflow-y-auto overscroll-contain flex-1 space-y-4" data-lenis-prevent="true"
            >
              {/* Roblox Avatar Verification Box */}
              <div className="p-3.5 rounded-2xl bg-gs-raised border border-gs-border relative space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-bold uppercase tracking-wider text-gs-light flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gs-primary" />
                    <span>Target Roblox Username</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      onClick={() => setShowTooltip(prev => !prev)}
                      className="text-gs-muted hover:text-white transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                    {showTooltip && (
                      <div className="absolute right-0 bottom-6 w-56 p-2 rounded-xl bg-[#1c1f2b] border border-gs-border text-[11px] text-gs-light font-sans z-30 shadow-xl leading-snug">
                        Please verify this is your exact Roblox character before ordering. Bots match this avatar for in-game trade delivery!
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter exact Roblox Username..."
                    value={usernameInput}
                    onChange={handleUsernameChange}
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-gs-card border text-xs text-white font-mono placeholder:text-gs-muted focus:outline-none transition-all ${
                      usernameError
                        ? 'border-red-500 ring-2 ring-red-500/30'
                        : robloxUser?.isValid
                        ? 'border-emerald-500/70'
                        : 'border-gs-border focus:border-gs-primary'
                    }`}
                  />
                  {robloxUser?.isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-gs-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {usernameError && (
                  <p className="text-[11px] text-red-400 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Please enter your Roblox username to continue!</span>
                  </p>
                )}

                {robloxUser?.notFound && (
                  <p className="text-[11px] text-amber-400 font-sans flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Roblox player not found. Please check spelling.</span>
                  </p>
                )}

                {/* Avatar Preview Card */}
                {robloxUser?.username && robloxUser?.isValid && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={robloxUser.avatarUrl}
                        alt={robloxUser.username}
                        className="w-11 h-11 rounded-xl bg-gs-card border border-emerald-500/40 p-0.5 object-cover shrink-0 shadow-md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs text-white truncate">
                            {robloxUser.displayName || robloxUser.username}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            VERIFIED
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-400/80 font-mono truncate">
                          @{robloxUser.username} {robloxUser.id ? `• ID: ${robloxUser.id}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUsernameInput('');
                        clearRobloxUser();
                      }}
                      className="px-2 py-1 rounded bg-red-950/40 border border-red-500/30 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/60 font-mono font-bold transition-all shrink-0 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-gs-muted flex items-center justify-between">
                  <span>Selected Items ({cartCount})</span>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-[10px] text-gs-muted hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {cart.length > 0 ? (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-gs-raised/70 border border-gs-border hover:border-gs-border/90 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-14 h-14 rounded-xl object-cover bg-gs-card border-2 ${getRarityBorder(
                            item.rarity
                          )}`}
                        />
                        {item.instantDelivery && (
                          <span className="absolute -bottom-1 -right-1 px-1 rounded bg-black/90 text-emerald-400 font-mono text-[9px] font-bold border border-emerald-500/40">
                            ⚡
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-xs sm:text-sm text-white truncate">
                          {item.name}
                        </h4>
                        <div className="text-[11px] text-gs-muted flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{item.gameName}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-mono text-[10px] shrink-0">
                            Fast Bot
                          </span>
                        </div>
                        <div className="font-heading font-black text-xs sm:text-sm text-white mt-1">
                          {formatPrice(item.price * (item.quantity || 1))}
                        </div>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 text-gs-muted hover:text-red-400 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center bg-gs-card border border-gs-border rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                            className="p-1 rounded text-gs-muted hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-mono text-xs font-bold text-white">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                            className="p-1 rounded text-gs-muted hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gs-raised flex items-center justify-center text-gs-muted mb-4 border border-gs-border">
                      <ShoppingBag className="w-8 h-8 opacity-40" />
                    </div>
                    <h3 className="font-heading font-bold text-base text-white">Your Cart is Empty</h3>
                    <p className="text-xs text-gs-muted mt-1 max-w-xs font-sans">
                      Add rare Blox Fruits, MM2 Godlies, or Fisch items from our catalog to begin.
                    </p>
                    <button
                      onClick={closeCart}
                      className="btn-primary mt-4 px-5 py-2 rounded-xl text-xs font-heading font-bold"
                    >
                      Browse Marketplace
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer (Summary & Checkout CTA) */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 bg-gs-raised/90 border-t border-gs-border space-y-3.5 backdrop-blur-md">
                {/* Coupon Code Field */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} (-{Math.round((appliedCoupon.discount || appliedCoupon.discountPct || 0) * (appliedCoupon.discount ? 100 : 1))}%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-400 hover:underline font-mono cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Promo Code..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-mono uppercase placeholder:normal-case placeholder:text-gs-muted focus:outline-none focus:border-gs-primary"
                    />
                    <button
                      type="submit"
                      className="btn-secondary px-4 py-2 rounded-xl text-xs font-heading font-bold shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>
                )}

                {couponFeedback && !appliedCoupon && (
                  <div className="text-[11px] text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{couponFeedback.message}</span>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="space-y-1.5 text-xs text-gs-muted font-sans pt-1">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartCount} items)</span>
                    <span className="font-mono text-white">{formatPrice(cartSubtotal)}</span>
                  </div>

                  {cartDiscountAmount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Promo Discount ({appliedCoupon.code})</span>
                      <span className="font-mono">-{formatPrice(cartDiscountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-heading font-black text-white pt-2 border-t border-gs-border/60">
                    <span>Total Due</span>
                    <span className="text-base sm:text-lg text-gs-primary-glow font-mono">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={handleProceedCheckout}
                  className="btn-primary w-full py-3.5 rounded-xl text-xs sm:text-sm font-heading font-black flex items-center justify-center gap-2 shadow-glow-primary uppercase tracking-wider"
                >
                  <Zap className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-[10px] text-center text-gs-muted flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Guaranteed delivery in &lt;60s or 100% automatic refund</span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
