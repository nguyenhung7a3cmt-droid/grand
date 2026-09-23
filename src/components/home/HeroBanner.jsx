import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  Clock,
  Star,
  Sparkles,
  ArrowRight,
  ShoppingBag,
  CheckCircle2,
  Lock,
  Flame,
  CreditCard,
  Coins
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useSmoothScroll } from '../common/SmoothScrollProvider';
import { soundFx } from '../../utils/soundFx';
import PaymentBrandIcon from '../common/PaymentBrandIcon';

export default function HeroBanner() {
  const { openProofsModal, triggerAudio } = useStore();
  const { scrollTo } = useSmoothScroll();

  const handleBrowseClick = (e) => {
    if (e) e.preventDefault();
    soundFx.click();
    scrollTo('#product-catalog', { offset: -90, duration: 950 });
  };

  const handleProofsClick = () => {
    soundFx.click();
    openProofsModal();
  };

  const metrics = [
    {
      icon: ShieldCheck,
      value: '25,000+',
      label: 'Orders Fulfilled',
      subtext: '100% Escrow protected',
      color: 'text-gs-primary',
      bgGlow: 'bg-gs-primary/10 border-gs-primary/30'
    },
    {
      icon: Clock,
      value: '45s',
      label: 'Staff Response',
      subtext: 'Live 1-on-1 ticket chat',
      color: 'text-amber-400',
      bgGlow: 'bg-amber-500/10 border-amber-500/30'
    },
    {
      icon: Zap,
      value: '18 Online',
      label: 'Staff on Duty',
      subtext: 'Dedicated delivery specialists',
      color: 'text-emerald-400',
      bgGlow: 'bg-emerald-500/10 border-emerald-500/30'
    },
    {
      icon: Star,
      value: '4.9★',
      label: '1,400+ Vouches',
      subtext: 'Top verified ratings',
      color: 'text-purple-400',
      bgGlow: 'bg-purple-500/10 border-purple-500/30'
    }
  ];

  const paymentMethods = [
    { name: 'Visa', type: 'fiat', icon: '💳' },
    { name: 'Mastercard', type: 'fiat', icon: '💳' },
    { name: 'Apple Pay', type: 'fiat', icon: '🍎' },
    { name: 'Google Pay', type: 'fiat', icon: '🌐' },
    { name: 'PayPal', type: 'fiat', icon: '🅿️' },
    { name: 'Cash App', type: 'fiat', icon: '💵' },
    { name: 'Bitcoin (BTC)', type: 'crypto', icon: '₿' },
    { name: 'USDT (Tether)', type: 'crypto', icon: '₮' },
    { name: 'Solana (SOL)', type: 'crypto', icon: '◎' },
    { name: 'Ethereum (ETH)', type: 'crypto', icon: 'Ξ' },
    { name: 'Litecoin (LTC)', type: 'crypto', icon: 'Ł' }
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-12 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] bg-gs-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-0 right-10 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Top Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-gs-card border border-gs-primary/40 shadow-glow-primary mb-6 backdrop-blur-md max-w-full"
        >
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-white font-heading truncate">
            GrandStock v2.4 • 1-on-1 Dedicated Staff Delivery &amp; Live Ticket Hub
          </span>
          <Sparkles className="w-3.5 h-3.5 text-gs-primary shrink-0" />
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white tracking-tight uppercase max-w-5xl leading-[1.08]"
        >
          Your Go-To Roblox <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-red-100 to-gs-primary">
            In-Game Shopping Store
          </span>
        </motion.h1>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 sm:mt-6 text-sm sm:text-lg text-gs-muted max-w-3xl font-sans leading-relaxed"
        >
          <span className="text-emerald-400 font-medium">1-on-1 Manual Staff Delivery</span> •{' '}
          <span className="text-gs-light font-medium">Live Order Ticket Chat</span> •{' '}
          <span className="text-gs-light font-medium">100% Escrow Guaranteed Trades</span>
        </motion.p>

        {/* Action Buttons with Eased Glide */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={handleBrowseClick}
            className="w-full sm:w-auto btn-primary px-8 py-3.5 rounded-xl text-sm sm:text-base font-bold font-heading flex items-center justify-center gap-2.5 group shadow-glow-primary-lg cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5 transition-transform group-hover:scale-110" />
            <span>Browse Catalog</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            type="button"
            onClick={handleProofsClick}
            className="w-full sm:w-auto btn-secondary px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold font-heading flex items-center justify-center gap-2 group hover:border-emerald-500/50 cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>Live Delivery Proofs</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              LIVE
            </span>
          </button>
        </motion.div>

        {/* Trust Metrics Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-10 sm:mt-16 w-full max-w-6xl"
        >
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                onMouseEnter={() => soundFx.hover()}
                className="glass-card glass-card-hover p-3.5 sm:p-5 rounded-2xl border border-gs-border/80 flex flex-col items-center sm:items-start text-center sm:text-left relative overflow-hidden group transition-all"
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${m.bgGlow} flex items-center justify-center mb-2.5 sm:mb-3 transition-transform group-hover:scale-110`}>
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${m.color}`} />
                </div>
                <div className="font-heading font-black text-xl sm:text-3xl text-white tracking-tight">
                  {m.value}
                </div>
                <div className="font-heading font-semibold text-[11px] sm:text-sm text-gs-light mt-0.5">
                  {m.label}
                </div>
                <div className="text-[11px] text-gs-muted mt-1 font-sans hidden sm:block">
                  {m.subtext}
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Accepted Payment Gateways Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 sm:mt-12 w-full max-w-5xl pt-6 border-t border-gs-border/50"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-heading font-semibold uppercase tracking-wider text-gs-muted mb-4">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accepted Payment Gateways &amp; Cryptocurrencies</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            {paymentMethods.map((pm, i) => (
              <div
                key={i}
                onMouseEnter={() => soundFx.hover()}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 border transition-all cursor-default ${
                  pm.type === 'crypto'
                    ? 'bg-[#12151f] border-amber-500/30 text-amber-300 hover:border-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-gs-card border-gs-border text-gs-light hover:border-gs-primary/50 hover:shadow-[0_0_15px_rgba(238,29,54,0.15)]'
                }`}
              >
                <PaymentBrandIcon name={pm.name} className="w-5 h-4 object-contain" />
                <span className="font-heading font-semibold text-xs text-white">{pm.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
