import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Coins,
  Flame,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  CheckCircle2,
  Gift
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function AffiliateModal() {
  const { isAffiliateModalOpen, closeAffiliateModal, robloxUser, formatPrice, triggerAudio } = useStore();
  const [customTag, setCustomTag] = useState(
    (robloxUser.username || 'GRAND2026').toLowerCase().replace(/[^a-z0-9]/g, '') || 'grand2026'
  );
  const [isCopied, setIsCopied] = useState(false);

  // Payout Simulator State
  const [payoutMethod, setPayoutMethod] = useState('paypal');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('84.50');
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [pendingBalance, setPendingBalance] = useState(84.5);

  if (!isAffiliateModalOpen) return null;

  const affLink = `https://grandstock.net/?ref=${customTag}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(affLink);
    setIsCopied(true);
    triggerAudio('click');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRequestPayout = (e) => {
    e.preventDefault();
    if (parseFloat(payoutAmount) > 0 && payoutAddress.trim()) {
      setPayoutSuccess(true);
      triggerAudio('success');
      setPendingBalance((prev) => Math.max(0, prev - parseFloat(payoutAmount)));
      setTimeout(() => {
        setPayoutSuccess(false);
      }, 4000);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeAffiliateModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain z-10 p-5 sm:p-8 flex flex-col justify-between" data-lenis-prevent="true"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gs-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-glow-primary">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-white uppercase flex items-center gap-2">
                    <span>Creator &amp; Affiliate Hub</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      7% COMMISSION
                    </span>
                  </h2>
                  <p className="text-xs text-gs-muted">
                    Earn recurring real-cash commission on every referred trade order
                  </p>
                </div>
              </div>

              <button
                onClick={closeAffiliateModal}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-4 border-b border-gs-border/60">
              <div className="p-3 rounded-xl bg-gs-raised border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Total Clicks</div>
                <div className="text-lg font-heading font-black text-white mt-0.5">482</div>
              </div>
              <div className="p-3 rounded-xl bg-gs-raised border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Orders Referred</div>
                <div className="text-lg font-heading font-black text-emerald-400 mt-0.5">38</div>
              </div>
              <div className="p-3 rounded-xl bg-gs-raised border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Pending Balance</div>
                <div className="text-lg font-heading font-black text-amber-400 mt-0.5">${pendingBalance.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-xl bg-gs-raised border border-gs-border text-center">
                <div className="text-[10px] text-gs-muted uppercase font-heading font-bold">Total Paid Out</div>
                <div className="text-lg font-heading font-black text-gs-primary mt-0.5">$312.00</div>
              </div>
            </div>
          </div>

          {/* Main Affiliate Content */}
          <div className="py-5 space-y-5">
            {/* Custom Referral Link Creator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gs-raised/70 border border-gs-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-bold uppercase tracking-wider text-gs-light">
                  Your Custom Referral Link:
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Instant 7% Tier</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center w-full px-3 py-2.5 rounded-xl bg-gs-card border border-gs-border focus-within:border-gs-primary">
                  <span className="text-xs font-mono text-gs-muted shrink-0">grandstock.net/?ref=</span>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) =>
                      setCustomTag(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                    }
                    placeholder="yourname"
                    className="w-full bg-transparent border-none text-xs font-mono text-gs-primary font-bold focus:outline-none pl-1"
                  />
                </div>

                <button
                  onClick={handleCopy}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                    isCopied
                      ? 'bg-emerald-500 text-white'
                      : 'btn-primary'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'Link Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <p className="text-[11px] text-gs-muted font-sans leading-relaxed">
                Post your referral link on YouTube descriptions, Discord servers, TikTok, or Roblox trade groups. Whenever a buyer purchases Blox Fruits or MM2 Godlies, you receive 7% cash automatically!
              </p>
            </div>

            {/* Payout Request Simulator */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gs-raised/70 border border-gs-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-heading font-bold uppercase tracking-wider text-gs-light flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Request Instant Commission Payout:</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Available: ${pendingBalance.toFixed(2)}
                </span>
              </div>

              {payoutSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-1"
                >
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Payout Request Dispatched Successfully!</span>
                  </div>
                  <p className="text-[11px] text-gs-muted font-sans">
                    ${payoutAmount} is being transferred to your {payoutMethod.toUpperCase()} destination.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleRequestPayout} className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'paypal', label: 'PayPal (USD)' },
                      { id: 'crypto-btc', label: 'Bitcoin (BTC)' },
                      { id: 'crypto-usdt', label: 'USDT (TRC20)' },
                      { id: 'robux', label: 'Robux (R$)' }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPayoutMethod(m.id)}
                        className={`p-2 rounded-xl text-center border text-[11px] font-heading font-bold transition-all ${
                          payoutMethod === m.id
                            ? 'bg-gs-card border-amber-400 text-amber-400 shadow-glow-primary'
                            : 'bg-gs-card border-gs-border text-gs-muted hover:text-white'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder={
                        payoutMethod === 'paypal'
                          ? 'PayPal Email'
                          : payoutMethod === 'robux'
                          ? 'Roblox Username'
                          : 'Crypto Wallet Address'
                      }
                      value={payoutAddress}
                      onChange={(e) => setPayoutAddress(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-mono placeholder:text-gs-muted focus:outline-none focus:border-gs-primary"
                    />

                    <button
                      type="submit"
                      disabled={pendingBalance <= 0}
                      className="btn-primary w-full py-2 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Request Cash Payout (${pendingBalance.toFixed(2)})</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Affiliate Tiers Table */}
            <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border space-y-2">
              <div className="text-[11px] font-heading font-bold uppercase text-gs-muted">
                Affiliate Commission Tiers:
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-gs-raised border border-gs-border">
                  <span className="font-heading font-bold text-gs-muted block">Bronze</span>
                  <span className="font-mono font-bold text-white text-sm">5%</span>
                  <span className="text-[9px] text-gs-muted block">0-10 Orders</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="font-heading font-bold text-amber-400 block">Silver (Active)</span>
                  <span className="font-mono font-bold text-white text-sm">7%</span>
                  <span className="text-[9px] text-amber-400/80 block">10-50 Orders</span>
                </div>
                <div className="p-2 rounded-xl bg-gs-raised border border-gs-border">
                  <span className="font-heading font-bold text-purple-400 block">Gold Partner</span>
                  <span className="font-mono font-bold text-white text-sm">10%</span>
                  <span className="text-[9px] text-gs-muted block">50+ Orders</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gs-border flex items-center justify-between text-xs text-gs-muted font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Automated payouts processed every 24 hours. Zero hidden fees.</span>
            </span>
            <button
              onClick={closeAffiliateModal}
              className="btn-secondary px-5 py-2 rounded-xl text-xs font-heading font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
