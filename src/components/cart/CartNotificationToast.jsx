import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { soundFx } from '../../utils/soundFx';

export default function CartNotificationToast() {
  const { cartToast, setCartToast, openCart, formatPrice, cartCount, cartTotal, isCartOpen } = useStore();

  useEffect(() => {
    if (!cartToast) return;
    const timer = setTimeout(() => {
      setCartToast(null);
    }, 4200);
    return () => clearTimeout(timer);
  }, [cartToast, setCartToast]);

  if (!cartToast || isCartOpen) return null;

  const { product, quantity } = cartToast;

  const handleOpenCart = () => {
    soundFx.click();
    setCartToast(null);
    openCart();
  };

  return (
    <AnimatePresence>
      <div className="fixed bottom-24 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[60] pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-gs-card/95 border-2 border-emerald-500/60 rounded-2xl shadow-2xl backdrop-blur-xl p-4 overflow-hidden"
        >
          {/* Neon Ambient Header Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" />
          
          <div className="flex items-start gap-3.5">
            {/* Thumbnail */}
            <div className="relative w-14 h-14 rounded-xl bg-black/60 border border-emerald-500/40 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-contain"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white shadow">
                ✓
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-heading font-black uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Added to Cart!</span>
              </div>
              <h4 className="font-heading font-bold text-white text-xs sm:text-sm truncate mt-0.5">
                {product.name}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono text-gs-muted">
                <span>Qty: <strong className="text-white">{quantity}</strong></span>
                <span>•</span>
                <span className="text-emerald-400 font-bold">{formatPrice(product.price * quantity)}</span>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setCartToast(null)}
              className="p-1 rounded-lg text-gs-muted hover:text-white hover:bg-gs-raised transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action CTA Bar */}
          <div className="mt-3 pt-3 border-t border-gs-border/60 flex items-center justify-between gap-2">
            <span className="text-[11px] text-gs-muted font-sans">
              Cart Total: <strong className="text-white font-mono">{formatPrice(cartTotal)}</strong> ({cartCount} {cartCount === 1 ? 'item' : 'items'})
            </span>

            <button
              type="button"
              onClick={handleOpenCart}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-success transition-all cursor-pointer"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Animated Countdown Progress Bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 4.2, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-0.5 bg-emerald-400"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
