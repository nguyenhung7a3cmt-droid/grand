import { reviewService } from '../../services/reviewService';
import { getCountryForUser } from '../../utils/countryLocation';
import { soundFx } from '../../utils/soundFx';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Flame,
  Minus,
  Plus,
  AlertCircle,
  HelpCircle,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  User
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import CustomEmoji from '../common/CustomEmoji';

export default function ProductModal() {
  const {
    activeProductModal,
    setActiveProductModal,
    closeProductModal,
    formatPrice,
    addToCart,
    buyNow,
    openCheckout,
    robloxUser,
    setRobloxUsername,
    openProductEditor,
    deleteProduct,
    triggerAudio
  } = useStore();

  const { isAdmin } = useAuth();
  const dialog = useDialog();

  const [quantity, setQuantity] = useState(1);
  const [usernameInput, setUsernameInput] = useState('');
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  // Sync username input from context only when modal opens
  useEffect(() => {
    if (activeProductModal) {
      setQuantity(1);
      setIsAddedSuccess(false);
      setUsernameInput(robloxUser?.username || '');
    }
  }, [activeProductModal]);

  // Handle ESC key close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && activeProductModal) {
        handleClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProductModal]);

  if (!activeProductModal) return null;

  const product = activeProductModal;

  const handleClose = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (closeProductModal) {
      closeProductModal();
    } else if (typeof setActiveProductModal === 'function') {
      setActiveProductModal(null);
    }
    soundFx?.modalClose?.();
  };

  const handleQuantityChange = (delta) => {
    const next = quantity + delta;
    if (next >= 1 && next <= (product.stock || 99)) {
      setQuantity(next);
      triggerAudio('click');
    }
  };

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    setUsernameInput(val);
    setRobloxUsername(val);
  };

  const handleAddToCart = () => {
    const name = (usernameInput || robloxUser?.username || '').trim();
    if (name) {
      setRobloxUsername(name);
    }
    soundFx.addToCart();
    addToCart(product, quantity);
    setIsAddedSuccess(true);
    setTimeout(() => setIsAddedSuccess(false), 2000);
  };

  const handleBuyNow = () => {
    const name = (usernameInput || robloxUser?.username || '').trim();
    if (name) {
      setRobloxUsername(name);
    }
    soundFx.instantBuy();
    buyNow(product, quantity);
  };

  const discountPct = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        
        {/* Backdrop click to close */}
        <div
          className="fixed inset-0"
          onClick={handleClose}
        />

        {/* Modal Container */}
        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto overscroll-contain z-10 p-4 sm:p-8" data-lenis-prevent="true"
        >
          {/* High-Priority Top-Right Close Button */}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close product modal"
            className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-2.5 rounded-xl bg-gs-raised hover:bg-gs-card text-gs-muted hover:text-white border border-gs-border hover:border-gs-primary transition-all z-50 cursor-pointer shadow-xl flex items-center justify-center group"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 pointer-events-none transition-transform group-hover:scale-110" />
          </button>

          {/* Modal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
            
            {/* LEFT COLUMN: Image Showcase & Guarantee (5 cols) */}
            <div className="md:col-span-5 flex flex-col gap-4">
              
              {/* Main Item Image Showcase */}
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-b from-[#181a28] via-[#0d0e15] to-[#07080c] border border-white/15 flex items-center justify-center p-6 group shadow-2xl">
                {/* Rarity Radial Ambient Glow */}
                <div className="absolute inset-0 bg-radial-gradient from-gs-primary/30 via-gs-primary/10 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-grid-pattern opacity-30" />

                {/* Holographic Glowing Floating Pedestal */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-44 h-7 pointer-events-none">
                  <div className="w-full h-full rounded-[100%] bg-gradient-to-r from-transparent via-gs-primary/60 to-transparent blur-md opacity-80" />
                  <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-[1.5px] bg-white/50 blur-[0.5px]" />
                </div>

                {/* Floating 3D Item */}
                <div className="relative z-10 w-full h-full flex items-center justify-center transition-transform duration-500 group-hover:scale-108 group-hover:-translate-y-2">
                  <img
                    src={product.image}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="max-h-[85%] max-w-[85%] w-auto h-auto object-contain drop-shadow-[0_16px_28px_rgba(0,0,0,0.9)] filter select-none pointer-events-none"
                  />
                </div>

                {/* Stock & Delivery floating badge */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 shadow-xl z-20">
                  <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>🛡️ 1-on-1 Staff Delivery</span>
                  </span>
                  <span className="text-white font-bold">🟢 {product.stock} in stock</span>
                </div>
              </div>

              {/* GrandStock Guarantee Card */}
              <div className="p-4 rounded-xl bg-gs-raised/70 border border-gs-border text-xs space-y-2 font-sans">
                <div className="flex items-center gap-2 text-white font-heading font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>GrandStock 1-on-1 Escrow Guarantee</span>
                </div>
                <p className="text-gs-muted text-[11px] leading-relaxed">
                  Every trade is fulfilled 1-on-1 by verified GrandStock human staff via private order ticket chat with 100% escrow protection.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-gs-light">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> Zero Ban Risk
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" /> 24/7 Staff
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Product Info, Perks, Username & CTAs (7 cols) */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-6">
              <div>
                {/* Header Badges */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-gs-primary/15 text-gs-primary border border-gs-primary/30">
                    {product.rarity}
                  </span>

                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-heading font-semibold bg-gs-raised text-gs-light border border-gs-border">
                    {product.gameName}
                  </span>

                  {product.badge && (
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-black uppercase tracking-wider bg-gs-primary text-white flex items-center gap-1 shadow-glow-primary">
                      <Flame className="w-3 h-3 fill-current" />
                      <span>{product.badge}</span>
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h2 className="text-2xl sm:text-3xl font-heading font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                  <CustomEmoji src={product.image} size="md" className="rounded-lg shadow" />
                  <span>{product.name}</span>
                </h2>

                {/* Price Section */}
                <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight">
                    {formatPrice(product.price * quantity)}
                  </span>

                  {product.originalPrice && (
                    <span className="text-base text-gs-muted line-through font-mono">
                      {formatPrice(product.originalPrice * quantity)}
                    </span>
                  )}

                  {discountPct > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-gs-primary/20 text-gs-primary border border-gs-primary/40">
                      -{discountPct}% OFF
                    </span>
                  )}
                </div>

                {/* Lore / Description */}
                <div className="mt-4 text-xs sm:text-sm text-gs-muted font-sans leading-relaxed">
                  {product.description}
                </div>

                {/* Perks Checklist */}
                {product.perks && product.perks.length > 0 && (
                  <div className="mt-4 p-3.5 rounded-xl bg-gs-raised/60 border border-gs-border space-y-2">
                    <div className="text-xs font-heading font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-gs-primary" />
                      <span>Item Perks & Features</span>
                    </div>
                    <ul className="space-y-1.5">
                      {product.perks.map((perk, index) => (
                        <li key={index} className="text-xs text-gs-light flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* In-Game Trade Requirements */}
                {product.tradeRequirements && (
                  <div className="mt-3 text-xs text-gs-muted bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl flex items-start gap-2 font-sans">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-300 font-heading">Trade Requirement:</strong>{' '}
                      {product.tradeRequirements}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Actions: Roblox Username + Stepper + Buttons */}
              <div className="space-y-4 pt-4 border-t border-gs-border/70">
                
                {/* Roblox Username Field */}
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gs-light mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gs-primary" />
                      <span>Your Roblox Username (For 1-on-1 Staff Trade)</span>
                    </span>
                    {robloxUser.isValid && (
                      <span className="text-emerald-400 font-sans text-[11px] font-normal flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={handleUsernameChange}
                      placeholder="e.g. RobloxGamer2026"
                      className="w-full px-4 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs sm:text-sm font-mono placeholder:text-gs-muted"
                    />
                  </div>
                </div>

                {/* Quantity Stepper & Price Subtotal */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1 text-xs font-heading font-bold text-gs-light uppercase">
                    <span>Quantity:</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gs-raised border border-gs-border rounded-xl p-1">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-1.5 rounded-lg text-gs-muted hover:text-white hover:bg-gs-card disabled:opacity-30 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="px-3 font-mono font-bold text-sm text-white text-center min-w-[2rem]">
                        {quantity}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= (product.stock || 99)}
                        className="p-1.5 rounded-lg text-gs-muted hover:text-white hover:bg-gs-card disabled:opacity-30 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Add to Cart */}
                  <button
                    onClick={handleAddToCart}
                    className={`py-3.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-bold flex items-center justify-center gap-2 transition-all ${
                      isAddedSuccess
                        ? 'bg-emerald-500 text-white shadow-glow-success'
                        : 'btn-secondary hover:border-gs-primary'
                    }`}
                  >
                    {isAddedSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4 text-gs-primary" />
                        <span>Add {quantity > 1 ? `(${quantity}) ` : ''}to Cart</span>
                      </>
                    )}
                  </button>

                  {/* Buy Now with 1-Click */}
                  <button
                    onClick={handleBuyNow}
                    className="btn-primary py-3.5 px-4 rounded-xl text-xs sm:text-sm font-heading font-bold flex items-center justify-center gap-2 shadow-glow-primary"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Buy Now with 1-Click</span>
                  </button>
                </div>

                {/* Admin Live In-Place Controls */}
                {isAdmin && (
                  <div className="pt-3 border-t border-gs-border/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">
                      👑 Admin Controls:
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const targetProduct = activeProductModal;
                          closeProductModal();
                          openProductEditor(targetProduct);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-heading font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <span>✏️ Edit Item</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await dialog.confirm({
                            title: 'Delete Product',
                            message: `Are you sure you want to delete "${activeProductModal.name}" from the store catalog?`,
                            confirmText: 'Delete Item',
                            variant: 'danger'
                          });
                          if (ok) {
                            deleteProduct(activeProductModal.id);
                            closeProductModal();
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-heading font-bold flex items-center gap-1 shadow-sm"
                      >
                        <span>🗑️ Delete</span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
