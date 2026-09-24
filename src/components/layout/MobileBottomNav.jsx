import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Gamepad2,
  ShieldCheck,
  Activity,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { games } from '../../data/games';

export default function MobileBottomNav() {
  const {
    openProofsModal,
    openStatusModal,
    openCart,
    cartCount,
    selectedGame,
    setSelectedGame,
    setSelectedCategory,
    triggerAudio
  } = useStore();

  const [isGamePickerOpen, setIsGamePickerOpen] = useState(false);

  const handleHomeClick = () => {
    triggerAudio('click');
    setIsGamePickerOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGamesToggle = () => {
    triggerAudio('click');
    setIsGamePickerOpen(!isGamePickerOpen);
  };

  const handleProofsClick = () => {
    triggerAudio('click');
    setIsGamePickerOpen(false);
    openProofsModal();
  };

  const handleStatusClick = () => {
    triggerAudio('click');
    setIsGamePickerOpen(false);
    openStatusModal();
  };

  const handleCartClick = () => {
    triggerAudio('click');
    setIsGamePickerOpen(false);
    openCart();
  };

  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
    setSelectedCategory('all');
    setIsGamePickerOpen(false);
    triggerAudio('click');
    const catalogEl = document.getElementById('product-catalog') || document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Quick Game Switcher Popup Sheet for Mobile */}
      <AnimatePresence>
        {isGamePickerOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/60 backdrop-blur-sm select-none" onClick={() => setIsGamePickerOpen(false)}>
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e1017] border-t border-gs-border/80 rounded-t-3xl p-4 space-y-3 shadow-2xl max-h-[70vh] overflow-y-auto mb-16"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-gs-primary" />
                  <span className="font-heading font-black text-white text-sm uppercase tracking-wider">
                    Select Roblox Game
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsGamePickerOpen(false)}
                  className="p-1 rounded-lg bg-gs-raised text-gs-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectGame('all')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                    selectedGame === 'all'
                      ? 'bg-gs-primary/15 border-gs-primary text-white font-bold shadow-glow-primary'
                      : 'bg-black/40 border-gs-border/50 text-gs-light hover:border-gs-border'
                  }`}
                >
                  <span className="text-xl">🎮</span>
                  <div className="min-w-0">
                    <span className="text-xs font-heading block truncate">All Games</span>
                    <span className="text-[10px] text-gs-muted font-mono block">Complete Shop</span>
                  </div>
                </button>

                {games.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleSelectGame(g.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      selectedGame === g.id
                        ? 'bg-gs-primary/15 border-gs-primary text-white font-bold shadow-glow-primary'
                        : 'bg-black/40 border-gs-border/50 text-gs-light hover:border-gs-border'
                    }`}
                  >
                    <span className="text-xl">{g.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs font-heading block truncate">{g.name}</span>
                      <span className="text-[10px] text-gs-muted font-mono block truncate">{g.itemCount || 'In Stock'}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Dock (Mobile Only) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090b12]/92 backdrop-blur-xl border-t border-gs-border/70 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] select-none safe-area-bottom"
      >
        <div className="max-w-md mx-auto grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Home / Catalog */}
          <button
            type="button"
            onClick={handleHomeClick}
            className="flex flex-col items-center justify-center gap-1 h-full text-gs-muted hover:text-white transition-colors cursor-pointer group"
          >
            <div className="relative">
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-heading font-medium tracking-tight">Shop</span>
          </button>

          {/* 2. Games Picker */}
          <button
            type="button"
            onClick={handleGamesToggle}
            className={`flex flex-col items-center justify-center gap-1 h-full transition-colors cursor-pointer group ${
              isGamePickerOpen ? 'text-gs-primary' : 'text-gs-muted hover:text-white'
            }`}
          >
            <div className="relative">
              <Gamepad2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-heading font-medium tracking-tight">Games</span>
          </button>

          {/* 3. Live Proofs (Highlighted Core Button) */}
          <button
            type="button"
            onClick={handleProofsClick}
            className="flex flex-col items-center justify-center gap-1 h-full text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group relative"
          >
            <div className="relative p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <span className="text-[10px] font-heading font-bold text-emerald-400 tracking-tight">Proofs</span>
          </button>

          {/* 4. System Status */}
          <button
            type="button"
            onClick={handleStatusClick}
            className="flex flex-col items-center justify-center gap-1 h-full text-gs-muted hover:text-white transition-colors cursor-pointer group"
          >
            <div className="relative">
              <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-[10px] font-heading font-medium tracking-tight">Status</span>
          </button>

          {/* 5. Cart Drawer */}
          <button
            type="button"
            onClick={handleCartClick}
            className="flex flex-col items-center justify-center gap-1 h-full text-gs-muted hover:text-white transition-colors cursor-pointer group relative"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-gs-primary text-white font-mono font-black text-[9px] min-w-[15px] text-center shadow">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-heading font-medium tracking-tight">Cart</span>
          </button>
        </div>
      </nav>
    </>
  );
}
