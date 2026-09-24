import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, ArrowRight } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { soundFx } from '../../utils/soundFx';

export default function FloatingCartButton() {
  const { cartCount, cartTotal, formatPrice, openCart, isCartOpen, cartBounceKey } = useStore();

  // Hide floating button when cart drawer is already open or cart is empty
  if (isCartOpen || cartCount === 0) return null;

  const handleCartClick = () => {
    soundFx.click();
    openCart();
  };

  return (
    <AnimatePresence>
      <motion.div
        key={cartBounceKey}
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: [1, 1.15, 1], opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20, stiffness: 350 }}
        className="fixed bottom-6 right-5 sm:right-6 z-30 pointer-events-auto hidden sm:block"
      >
        <button
          type="button"
          onClick={handleCartClick}
          onMouseEnter={() => soundFx.hover()}
          aria-label="Open Shopping Cart"
          className="group relative flex items-center gap-3 p-3.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-gs-primary via-[#ff2a4b] to-gs-primary border-2 border-white/30 text-white shadow-[0_0_30px_rgba(238,29,54,0.55)] hover:shadow-[0_0_45px_rgba(238,29,54,0.85)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-md"
        >
          {/* Animated Ambient Ping Ring */}
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
            </span>
          )}

          {/* Cart Icon with Live Badge */}
          <div className="relative flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md transition-transform group-hover:scale-110" />
            
            {cartCount > 0 && (
              <span className="absolute -top-2.5 -right-2.5 px-1.5 py-0.2 min-w-[1.25rem] h-5 rounded-full bg-black text-white text-[10px] font-mono font-black border border-white/40 flex items-center justify-center shadow-lg">
                {cartCount}
              </span>
            )}
          </div>

          {/* Cart Text & Total on Desktop */}
          <div className="hidden sm:flex flex-col items-start text-left leading-none pr-1">
            <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-red-100">
              {cartCount === 0 ? 'Empty Cart' : `${cartCount} ${cartCount === 1 ? 'Item' : 'Items'}`}
            </span>
            <span className="text-xs font-mono font-black text-white tracking-tight mt-0.5">
              {cartCount === 0 ? '$0.00' : formatPrice(cartTotal)}
            </span>
          </div>

          {/* Hover Arrow */}
          <ArrowRight className="hidden sm:block w-4 h-4 text-white/80 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
