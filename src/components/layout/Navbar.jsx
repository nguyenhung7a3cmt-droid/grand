import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  HelpCircle,
  Headphones,
  Menu,
  X,
  Check,
  User,
  ExternalLink,
  Flame,
  ArrowRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useSmoothScroll } from '../common/SmoothScrollProvider';
import { games } from '../../data/games';
import logoSvg from '../../assets/logo.svg';
import CustomEmoji from '../common/CustomEmoji';

export default function Navbar() {
  const { scrollTo } = useSmoothScroll();
  const {
    currentUser,
    isStaff,
    isAdmin,
    openAuthModal,
    logout,
    openStaffPortal,
    openAdminStaffModal
  } = useAuth();

  const {
    cartCount,
    cartTotal,
    cartBounceKey,
    formatPrice,
    currency,
    setCurrency,
    currencies,
    soundEnabled,
    toggleSound,
    openCart,
    openProofsModal,
    openStatusModal,
    openTutorialModal,
    openSupportModal,
    openAffiliateModal,
    selectedGame,
    setSelectedGame,
    setSelectedCategory,
    robloxUser,
    setRobloxUsername,
    clearRobloxUser,
    ordersHistory,
    ongoingOrders,
    openOrdersModal,
    triggerAudio
  } = useStore();

  // Dropdown states
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [tempUsername, setTempUsername] = useState('');
  const [discordOnlineCount, setDiscordOnlineCount] = useState('226 Online');

  useEffect(() => {
    fetch('/api/discord/stats')
      .then(r => r.json())
      .then(data => {
        if (data.formattedOnline) {
          setDiscordOnlineCount(data.formattedOnline);
        }
      })
      .catch(() => {});
  }, []);

  // Refs for click outside
  const gamesRef = useRef(null);
  const currencyRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (gamesRef.current && !gamesRef.current.contains(event.target)) {
        setIsGamesOpen(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(event.target)) {
        setIsCurrencyOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGameSelect = (gameId) => {
    setSelectedGame(gameId);
    setSelectedCategory('all');
    setIsGamesOpen(false);
    setIsMobileMenuOpen(false);
    triggerAudio('click');

    // Smooth scroll to catalog
    scrollTo('#product-catalog', { offset: -90 });
    const catalogEl = document.getElementById('product-catalog') || document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCurrencySelect = (code) => {
    setCurrency(code);
    setIsCurrencyOpen(false);
  };

  const handleSaveRobloxUser = (e) => {
    e.preventDefault();
    if (tempUsername.trim()) {
      setRobloxUsername(tempUsername.trim());
      setShowUserModal(false);
      setTempUsername('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full select-none">
      {/* ---------------------------------------------------- */}
      {/* Top Announcement & Status Bar                        */}
      {/* ---------------------------------------------------- */}
      <div className="bg-gradient-to-r from-gs-dark via-[#151722] to-gs-dark border-b border-gs-border/60 text-xs py-1 px-2.5 sm:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Status Message */}
          <div className="flex items-center gap-1.5 sm:gap-3 text-gs-muted min-w-0 overflow-hidden whitespace-nowrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[10px] sm:text-[11px] border border-emerald-500/30 shrink-0">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span className="hidden sm:inline">LIVE STAFF ON DUTY</span>
              <span className="sm:hidden text-[10px]">LIVE STAFF</span>
            </span>

            <span className="hidden sm:inline-block text-gs-light/90 font-medium">
              🛡️ 1-on-1 Dedicated Staff Delivery via Live Ticket
            </span>
            <span className="hidden md:inline-block text-gs-border">•</span>
            <span className="hidden md:inline-block text-gs-muted">
              Average Response: <strong className="text-white font-mono">45s</strong>
            </span>
            <span className="hidden lg:inline-block text-gs-border">•</span>
            <span className="hidden lg:inline-block text-gs-muted">
              <strong className="text-emerald-400 font-mono">25,000+</strong> Orders Hand-Delivered
            </span>

            {/* Discreet Admin Master Hub Trigger for Site Owners */}
            {isAdmin && (
              <>
                <span className="hidden sm:inline-block text-gs-border">•</span>
                <button
                  onClick={() => {
                    openAdminStaffModal('coupons');
                    triggerAudio('click');
                  }}
                  className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-purple-500/20 hover:bg-purple-500/35 border border-purple-500/40 text-purple-300 hover:text-white text-[9px] sm:text-[10px] font-mono font-bold transition-all cursor-pointer shrink-0 shadow-xs"
                  title="Open Admin Command Hub (Promo Codes, Anti-Scam Shield & Staff)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse shrink-0"></span>
                  <span>👑 Admin Hub</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Controls: Discord status + Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Live Discord Status Pill with Real API Count */}
            <a
              href="https://discord.gg/tanstock"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => triggerAudio('click')}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-0.5 rounded-md bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 border border-[#5865F2]/30 transition-colors text-[10px] sm:text-[11px] font-medium"
              title="Join official TANN STOCK Discord Community"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a] animate-pulse"></span>
              <span className="hidden sm:inline">Discord:</span>
              <span className="font-semibold text-white">{discordOnlineCount}</span>
            </a>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Sound FX' : 'Enable Sound FX'}
              className={`p-1 rounded-md transition-colors flex items-center gap-1 text-[10px] sm:text-[11px] font-medium ${
                soundEnabled
                  ? 'text-gs-muted hover:text-white hover:bg-gs-raised'
                  : 'text-red-400 bg-red-950/30'
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-gs-primary" />
                  <span className="hidden xl:inline text-[10px]">Audio ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gs-muted" />
                  <span className="hidden xl:inline text-[10px]">Muted</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Main Navigation Bar                                  */}
      {/* ---------------------------------------------------- */}
      <nav className="glass-nav border-b border-gs-border/70 backdrop-blur-md px-2.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 overflow-visible">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
          
          {/* LEFT: Brand Logo & Game Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 shrink-0">
            {/* Brand Logo */}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setSelectedGame('all');
                setSelectedCategory('all');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                triggerAudio('click');
              }}
              className="flex items-center gap-2 sm:gap-3 group focus:outline-none shrink-0"
            >
              <div className="relative shrink-0">
                <img
                  src={logoSvg}
                  alt="GrandStock Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(238,29,54,0.65)]"
                />
                <div className="absolute inset-0 bg-gs-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="font-heading font-black text-base sm:text-xl lg:text-xl tracking-wider text-white">
                    GRAND<span className="text-gs-primary">STOCK</span>
                  </span>
                </div>
                <span className="text-[9px] text-gs-muted tracking-widest uppercase font-mono font-medium -mt-1 hidden sm:block">
                  Roblox Ingame Item Shopping
                </span>
              </div>
            </a>

            {/* "Select Games" Interactive Dropdown (Desktop) */}
            <div className="relative hidden md:block shrink-0" ref={gamesRef}>
              <button
                onClick={() => {
                  setIsGamesOpen(!isGamesOpen);
                  triggerAudio('click');
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                  isGamesOpen
                    ? 'bg-gs-raised border-gs-primary text-white shadow-glow-primary'
                    : 'bg-gs-card/80 border-gs-border text-gs-light hover:border-gs-border-glow hover:bg-gs-raised'
                }`}
              >
                <Sparkles className="w-4 h-4 text-gs-primary shrink-0" />
                <span className="font-heading tracking-wide max-w-[125px] truncate">
                  {selectedGame === 'all'
                    ? 'Select Games'
                    : games.find((g) => g.id === selectedGame)?.name || 'Select Games'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-gs-muted transition-transform duration-200 ${
                    isGamesOpen ? 'rotate-180 text-gs-primary' : ''
                  }`}
                />
              </button>

              {/* Games Dropdown Menu */}
              <AnimatePresence>
                {isGamesOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-72 bg-gs-card/95 border border-gs-border rounded-xl shadow-2xl backdrop-blur-xl p-2 z-50"
                  >
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-gs-muted border-b border-gs-border/60 flex items-center justify-between">
                      <span>Roblox Marketplaces</span>
                      <span className="text-gs-primary text-[10px]">Staff Trade</span>
                    </div>

                    <div className="mt-1.5 space-y-1">
                      {/* All Games option */}
                      <button
                        onClick={() => handleGameSelect('all')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          selectedGame === 'all'
                            ? 'bg-gs-primary text-white font-semibold shadow-glow-primary'
                            : 'text-gs-light hover:bg-gs-raised hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">🌐</span>
                          <div>
                            <div className="font-heading">All Games</div>
                            <div className="text-[11px] text-gs-muted font-sans">Full catalog showcase</div>
                          </div>
                        </div>
                        {selectedGame === 'all' && <Check className="w-4 h-4 shrink-0" />}
                      </button>

                      {/* Game Items */}
                      {games.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => handleGameSelect(g.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            selectedGame === g.id
                              ? 'bg-gs-raised border border-gs-primary/50 text-white font-semibold'
                              : 'text-gs-light hover:bg-gs-raised hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CustomEmoji name={g.id} type="game" size="md" className="rounded-lg shadow-sm" />
                            <div>
                              <div className="font-heading flex items-center gap-1.5">
                                <span>{g.name}</span>
                                {g.popular && (
                                  <Flame className="w-3 h-3 text-gs-primary shrink-0" />
                                )}
                              </div>
                              <div className="text-[11px] text-gs-muted font-sans">{g.count}</div>
                            </div>
                          </div>
                          {selectedGame === g.id && (
                            <span className="w-2 h-2 rounded-full bg-gs-primary"></span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* CENTER: Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-1.5 shrink-0">
            {/* Proofs Link */}
            <button
              onClick={() => {
                openProofsModal();
                triggerAudio('click');
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gs-light hover:text-white hover:bg-gs-raised transition-colors flex items-center gap-1.5 xl:gap-2 group whitespace-nowrap"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Proofs</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 group-hover:border-emerald-400">
                LIVE
              </span>
            </button>

            {/* Status Link */}
            <button
              onClick={() => {
                openStatusModal();
                triggerAudio('click');
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gs-light hover:text-white hover:bg-gs-raised transition-colors flex items-center gap-1.5 xl:gap-2 group whitespace-nowrap"
            >
              <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Status</span>
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                99.98%
              </span>
            </button>

            {/* Tutorial Link */}
            <button
              onClick={() => {
                openTutorialModal();
                triggerAudio('click');
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gs-light hover:text-white hover:bg-gs-raised transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-gs-muted" />
              <span>Tutorial</span>
            </button>

            {/* My Orders / Ongoing Orders Link */}
            <button
              onClick={() => {
                openOrdersModal();
                triggerAudio('click');
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gs-light hover:text-white hover:bg-gs-raised transition-colors flex items-center gap-1.5 group cursor-pointer whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-gs-primary group-hover:scale-110 transition-transform" />
              <span>My Orders</span>
              {ongoingOrders && ongoingOrders.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black bg-emerald-500 text-white flex items-center gap-1 shadow-glow-success animate-pulse">
                  <span>{ongoingOrders.length}</span>
                </span>
              ) : ordersHistory.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-gs-raised text-gs-muted border border-gs-border">
                  {ordersHistory.length}
                </span>
              ) : null}
            </button>

            {/* Support Link */}
            <button
              onClick={() => {
                openSupportModal();
                triggerAudio('click');
              }}
              className="px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-medium text-gs-light hover:text-white hover:bg-gs-raised transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Headphones className="w-4 h-4 text-gs-muted" />
              <span>Support</span>
            </button>
          </div>

          {/* RIGHT: Currency Selector, Roblox User, Cart Trigger, Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Currency Selector Dropdown */}
            <div className="relative shrink-0" ref={currencyRef}>
              <button
                onClick={() => {
                  setIsCurrencyOpen(!isCurrencyOpen);
                  triggerAudio('click');
                }}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-gs-card border border-gs-border hover:border-gs-primary/50 text-[11px] sm:text-xs font-mono font-bold text-gs-light transition-all whitespace-nowrap"
              >
                <span className="text-gs-primary">{currency}</span>
                <ChevronDown className="w-3 h-3 text-gs-muted" />
              </button>

              <AnimatePresence>
                {isCurrencyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-gs-card/95 border border-gs-border rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gs-muted border-b border-gs-border/60">
                      Display Currency
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {currencies.map((curr) => (
                        <button
                          key={curr.code}
                          onClick={() => handleCurrencySelect(curr.code)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                            currency === curr.code
                              ? 'bg-gs-primary text-white font-bold'
                              : 'text-gs-light hover:bg-gs-raised hover:text-white'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 text-center font-bold text-gs-primary-glow">
                              {curr.symbol}
                            </span>
                            <span>{curr.code}</span>
                          </span>
                          {currency === curr.code && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Real User Profile / Auth Dropdown Trigger */}
            <div className="relative hidden sm:block shrink-0" ref={userRef}>
              {currentUser ? (
                <button
                  data-testid="navbar-user-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gs-card border border-gs-border hover:border-gs-primary transition-colors group shrink-0 whitespace-nowrap"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-6 h-6 rounded-full object-cover bg-gs-raised border border-white/20 shrink-0"
                  />
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-heading font-bold text-white max-w-[95px] truncate whitespace-nowrap">
                        {currentUser.name}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase whitespace-nowrap ${
                        isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs' :
                        isStaff ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isAdmin ? 'bg-purple-400 animate-pulse' :
                          isStaff ? 'bg-emerald-400' :
                          'bg-cyan-400'
                        }`}></span>
                        <span>{currentUser.role}</span>
                      </span>
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-gs-muted group-hover:text-white shrink-0" />
                </button>
              ) : (
                <button
                  data-testid="navbar-signin-btn"
                  onClick={() => {
                    openAuthModal('login');
                    triggerAudio('click');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gs-primary hover:bg-gs-primary-glow text-xs font-heading font-bold text-white shadow-glow-primary transition-colors shrink-0 whitespace-nowrap"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">Sign In</span>
                </button>
              )}

              {/* User Dropdown */}
              <AnimatePresence>
                {isUserMenuOpen && currentUser && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-gs-card/95 border border-gs-border rounded-2xl shadow-2xl backdrop-blur-xl p-2.5 z-50 space-y-2"
                  >
                    {/* User Header */}
                    <div className="p-2.5 rounded-xl bg-gs-raised/70 border border-gs-border/60">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gs-muted">
                        <span>Account Role</span>
                        <span className={`font-bold uppercase ${
                          isAdmin ? 'text-purple-400' : isStaff ? 'text-emerald-400' : 'text-cyan-400'
                        }`}>
                          {currentUser.role}
                        </span>
                      </div>
                      <div className="font-heading font-bold text-white text-sm mt-0.5 truncate">
                        {currentUser.name}
                      </div>
                      <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                        Roblox: @{currentUser.robloxUsername || 'Not set'}
                      </div>
                    </div>

                    {/* Staff & Admin Direct Action Triggers */}
                    <div className="space-y-1">
                      {isStaff && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            openStaffPortal();
                            triggerAudio('click');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-heading font-bold flex items-center justify-between shadow-sm transition-all"
                        >
                          <span className="flex items-center gap-1.5">
                            <Headphones className="w-3.5 h-3.5" />
                            <span>Staff Delivery Portal</span>
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black font-mono text-[9px] font-black">
                            LIVE
                          </span>
                        </button>
                      )}

                      {isAdmin && (
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              openAdminStaffModal('coupons');
                              triggerAudio('click');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-heading font-bold flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🎟️ Promo Codes &amp; Discounts</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500 text-black font-mono text-[9px] font-black">
                              CMS
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              openAdminStaffModal('blacklist');
                              triggerAudio('click');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-heading font-bold flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>🛡️ Anti-Scam Fraud Shield</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-red-500 text-white font-mono text-[9px] font-black">
                              BAN
                            </span>
                          </button>

                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              openAdminStaffModal('roster');
                              triggerAudio('click');
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-heading font-bold flex items-center justify-between transition-all cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>👑 Staff Team &amp; Roster</span>
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white font-mono text-[9px] font-black">
                              ADMIN
                            </span>
                          </button>
                        </div>
                      )}
                    </div>





                    {/* Switch / Sign Out */}
                    <div className="pt-1 border-t border-gs-border/60 space-y-1">
                      <button
                        data-testid="switch-account-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          openAuthModal('login');
                          triggerAudio('click');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-gs-light hover:bg-gs-raised transition-colors cursor-pointer flex items-center justify-between"
                      >
                        <span>Switch Account / Sign In</span>
                        <span className="text-[10px] text-gs-muted font-mono">AUTH</span>
                      </button>

                      <button
                        data-testid="sign-out-btn"
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          triggerAudio('click');
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Drawer Trigger Button */}
            <motion.button
              onClick={openCart}
              whileTap={{ scale: 0.94 }}
              className="relative btn-primary px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-glow-primary group shrink-0 whitespace-nowrap"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 shrink-0" />
              <span className="font-heading hidden sm:inline whitespace-nowrap">Cart</span>
              
              {/* Badge Counter */}
              {cartCount > 0 ? (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.6, rotate: -15 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="px-1.5 py-0.2 rounded-full bg-white text-gs-primary font-mono font-black text-[10px] sm:text-[11px] min-w-[16px] text-center shadow"
                >
                  {cartCount}
                </motion.span>
              ) : (
                <span className="text-[11px] text-white/80 font-mono hidden xl:inline">
                  (0)
                </span>
              )}
            </motion.button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-1.5 sm:p-2 rounded-lg bg-gs-card border border-gs-border text-gs-light hover:text-white hover:bg-gs-raised shrink-0"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ---------------------------------------------------- */}
      {/* Mobile Slide-Out Drawer                              */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-gs-card border-b border-gs-border overflow-hidden px-4 py-4 space-y-4"
          >
            {/* Mobile Game Switcher Grid */}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gs-muted mb-2 font-heading">
                Select Roblox Game
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleGameSelect('all')}
                  className={`p-2 rounded-lg text-left text-xs flex items-center gap-2 border ${
                    selectedGame === 'all'
                      ? 'bg-gs-primary text-white border-gs-primary'
                      : 'bg-gs-raised text-gs-light border-gs-border'
                  }`}
                >
                  <span>🌐</span>
                  <span className="font-heading font-semibold">All Games</span>
                </button>
                {games.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGameSelect(g.id)}
                    className={`p-2 rounded-lg text-left text-xs flex items-center gap-2 border ${
                      selectedGame === g.id
                        ? 'bg-gs-raised text-white border-gs-primary'
                        : 'bg-gs-card text-gs-light border-gs-border'
                    }`}
                  >
                    <span>{g.icon}</span>
                    <span className="font-heading font-semibold truncate">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Nav Links */}
            <div className="space-y-1.5 pt-2 border-t border-gs-border/60">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openProofsModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gs-raised text-sm text-gs-light"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Live Delivery Proofs</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  LIVE
                </span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openStatusModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-gs-raised text-sm text-gs-light"
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>System Node Status</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">99.98%</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openTutorialModal();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-gs-raised text-sm text-gs-light"
              >
                <HelpCircle className="w-4 h-4 text-gs-muted" />
                <span>How Staff Trade Delivery Works</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  openSupportModal();
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-lg bg-gs-raised text-sm text-gs-light"
              >
                <Headphones className="w-4 h-4 text-gs-muted" />
                <span>24/7 Discord & Ticket Support</span>
              </button>
            </div>

            {/* Mobile Account Section */}
            <div className="pt-2 border-t border-gs-border/60">
              {currentUser ? (
                <div className="p-3 rounded-xl bg-gs-raised border border-gs-border/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover bg-gs-card border border-purple-500/40 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-heading font-bold text-white">{currentUser.name}</div>
                        <div className="text-[10px] text-gs-muted">{currentUser.email}</div>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                      isAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-xs' :
                      isStaff ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isAdmin ? 'bg-purple-400 animate-pulse' :
                        isStaff ? 'bg-emerald-400' :
                        'bg-cyan-400'
                      }`}></span>
                      <span>{currentUser.role}</span>
                    </span>
                  </div>

                  {/* Admin Command Quick Links for Mobile */}
                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-gs-border/60">
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAdminStaffModal('coupons');
                          triggerAudio('click');
                        }}
                        className="p-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-heading font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <span>🎟️ Coupons</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          openAdminStaffModal('blacklist');
                          triggerAudio('click');
                        }}
                        className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-[11px] font-heading font-bold flex items-center justify-center gap-1 transition-all"
                      >
                        <span>🛡️ Shield</span>
                      </button>
                    </div>
                  )}

                  <div className="pt-1.5 space-y-1.5">
                    <button
                      data-testid="mobile-switch-auth-btn"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        openAuthModal('login');
                        triggerAudio('click');
                      }}
                      className="w-full py-2 rounded-xl bg-gs-card border border-gs-border text-center text-xs font-heading font-bold text-white hover:bg-gs-raised transition-all"
                    >
                      Switch Account / Sign In
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                        triggerAudio('click');
                      }}
                      className="w-full py-1.5 rounded-lg bg-red-950/40 text-red-400 border border-red-500/30 text-xs font-semibold hover:bg-red-900/50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  data-testid="mobile-auth-btn"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    openAuthModal('login');
                    triggerAudio('click');
                  }}
                  className="w-full py-2.5 rounded-xl btn-primary text-center text-xs font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-glow-primary"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Create Account</span>
                </button>
              )}
            </div>

            {/* Mobile Roblox User Input */}
            <div className="pt-2 border-t border-gs-border/60">
              {robloxUser.isValid ? (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-2">
                    <img
                      src={robloxUser.avatarUrl}
                      alt={robloxUser.username}
                      className="w-7 h-7 rounded-full bg-gs-card"
                    />
                    <div className="text-xs">
                      <div className="font-bold text-white">@{robloxUser.username}</div>
                      <div className="text-[10px] text-emerald-400">Trade Ready</div>
                    </div>
                  </div>
                  <button
                    onClick={clearRobloxUser}
                    className="text-xs text-red-400 underline"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowUserModal(true);
                  }}
                  className="w-full p-2.5 rounded-lg bg-gs-raised text-center text-xs font-heading font-semibold text-white border border-gs-border flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4 text-gs-primary" />
                  <span>Set Roblox Username for Staff Trades</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------- */}
      {/* Roblox Username Fast Prompt Modal                    */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {showUserModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gs-card border border-gs-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
            >
              <button
                onClick={() => setShowUserModal(false)}
                className="absolute top-4 right-4 text-gs-muted hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-white">Roblox Verification</h3>
                  <p className="text-xs text-gs-muted">Enables direct 1-on-1 in-game staff delivery</p>
                </div>
              </div>

              <form onSubmit={handleSaveRobloxUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gs-light mb-1.5 uppercase font-heading">
                    Enter Exact Roblox Username:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GamerPro2026"
                    value={tempUsername}
                    onChange={(e) => setTempUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-sm font-mono placeholder:text-gs-muted"
                  />
                  <p className="text-[11px] text-gs-muted mt-1">
                    ⚠️ Never share passwords. We only need your public username to send in-game trade invitations.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gs-muted hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-5 py-2.5 rounded-xl text-xs font-heading font-bold tracking-wider"
                  >
                    Verify & Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
