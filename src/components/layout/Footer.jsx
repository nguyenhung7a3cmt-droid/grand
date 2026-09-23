import { soundFx } from '../../utils/soundFx';
import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  Lock,
  Star,
  ExternalLink,
  Headphones,
  CheckCircle2,
  Sparkles,
  Layers,
  ShoppingBag,
  Activity,
  HelpCircle,
  Clock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import PaymentBrandIcon from '../common/PaymentBrandIcon';
import logoSvg from '../../assets/logo.svg';

export default function Footer() {
  const {
    openProofsModal,
    openStatusModal,
    openTutorialModal,
    openSupportModal,
    openOrdersModal,
    triggerAudio
  } = useStore();

  const { openStaffPortal, openAdminStaffModal, isStaff, isAdmin } = useAuth();

  const [discordStats, setDiscordStats] = useState({
    formattedOnline: '226 Online',
    formattedTotal: '2.4k Members',
    inviteUrl: 'https://discord.gg/tanstock'
  });

  useEffect(() => {
    fetch('/api/discord/stats')
      .then(r => r.json())
      .then(data => {
        if (data.formattedOnline) {
          setDiscordStats(data);
        }
      })
      .catch(() => {});
  }, []);

  const paymentMethods = [
    'Visa',
    'Mastercard',
    'Apple Pay',
    'Google Pay',
    'PayPal',
    'Cash App',
    'Bitcoin (BTC)',
    'USDT (Tether)',
    'Solana (SOL)',
    'Ethereum (ETH)',
    'Litecoin (LTC)'
  ];

  return (
    <footer className="mt-20 border-t border-gs-border/80 bg-gradient-to-b from-[#0a0b10] via-[#08090d] to-[#040406] relative overflow-hidden select-none">
      {/* Ambient Top Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-gs-primary/50 to-transparent" />
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-gs-primary/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10 pb-12 border-b border-gs-border/60">
          
          {/* Brand Col (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gs-raised to-[#181a24] border border-gs-border/80 flex items-center justify-center p-2 shadow-lg">
                <img src={logoSvg} alt="GrandStock" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-heading font-black text-xl text-white tracking-wider">
                  GRAND<span className="text-gs-primary">STOCK</span>
                </span>
                <span className="block text-[10px] font-mono uppercase text-gs-muted tracking-widest">
                  ROBLOX IN-GAME ITEM SHOPPING
                </span>
              </div>
            </div>

            <p className="text-xs text-gs-muted leading-relaxed font-sans max-w-sm">
              Your premier marketplace for instant Roblox in-game trading. Backed by 1-on-1 staff escrow protection, live trade delivery proofs, and 24/7 Discord support.
            </p>

            {/* Live Discord Community Card */}
            <div className="pt-2">
              <a
                href="https://discord.gg/tanstock"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerAudio?.('click')}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#5865F2]/15 hover:bg-[#5865F2]/25 border border-[#5865F2]/40 text-[#5865F2] hover:text-white transition-all group shadow-sm"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-white">
                  Join Discord ({discordStats.formattedOnline})
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* Col 2: Fast Navigation */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gs-primary" />
              <span>Explore</span>
            </h4>
            <ul className="space-y-2 text-xs text-gs-muted font-sans">
              <li>
                <button
                  type="button"
                  onClick={() => { openProofsModal(); triggerAudio?.('click'); }}
                  className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Live Delivery Proofs</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold">LIVE</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { openStatusModal(); triggerAudio?.('click'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  System &amp; Bot Cluster Status
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { openTutorialModal(); triggerAudio?.('click'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  How Delivery Works (Tutorial)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { openOrdersModal(); triggerAudio?.('click'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Order History
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Community */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Support &amp; Rep</span>
            </h4>
            <ul className="space-y-2 text-xs text-gs-muted font-sans">
              <li>
                <a
                  href="https://discord.gg/tanstock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Official Discord: #vouches</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { openSupportModal(); triggerAudio?.('click'); }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  24/7 Live Ticket Support
                </button>
              </li>
              <li>
                <a
                  href="https://discord.gg/tanstock"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Discord Community (2.4k+)</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Escrow Guarantee */}
          <div className="space-y-3">
            <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gs-primary" />
              <span>Escrow Security</span>
            </h4>
            <div className="p-3 rounded-xl bg-gs-raised/60 border border-gs-border/70 space-y-2 text-[11px] text-gs-muted leading-tight">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>256-Bit Escrow Vault</span>
              </div>
              <p>
                Funds are held in secure escrow and only released after your in-game trade is confirmed with proof screenshot.
              </p>
            </div>
          </div>

        </div>

        {/* Accepted Payment Methods Showcase in Footer */}
        <div className="py-6 border-b border-gs-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-heading font-bold uppercase tracking-wider text-gs-muted">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Accepted Payment Gateways</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {paymentMethods.map((pm, i) => (
              <div
                key={i}
                onMouseEnter={() => soundFx.pillHover()} className="px-2.5 py-1.5 rounded-lg bg-gs-card border border-gs-border text-[11px] font-mono flex items-center gap-1.5 text-gs-light hover:border-gs-primary/40 transition-colors cursor-default"
              >
                <PaymentBrandIcon name={pm} className="w-4 h-3.5 object-contain" />
                <span className="text-[10px] text-white font-medium">{pm.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar: Copyright & Staff Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gs-muted font-sans">
          <div>
            &copy; {new Date().getFullYear()} <strong className="text-white font-heading">GrandStock</strong>. All rights reserved. Powered by TANN STOCK.
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://discord.gg/tanstock"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              discord.gg/tanstock
            </a>
            <span>•</span>
            <button
              type="button"
              onClick={() => { openProofsModal(); triggerAudio?.('click'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Proofs Ledger
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => { openSupportModal(); triggerAudio?.('click'); }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Support Center
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
