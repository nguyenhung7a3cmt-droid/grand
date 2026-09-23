import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Check,
  ExternalLink,
  Filter,
  Camera,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import { proofService } from '../../services/proofService';
import { maskRobloxUsername } from '../../utils/privacyMask';
import { getCountryForUser } from '../../utils/countryLocation';
import { useStore } from '../../context/StoreContext';
import { soundFx } from '../../utils/soundFx';
import CountryFlag from '../common/CountryFlag';

const GAME_CATEGORIES = [
  { id: 'all', label: 'All Games', icon: '🎮' },
  { id: 'blox-fruits', label: 'Blox Fruits', icon: '⚔️' },
  { id: 'gpo', label: 'Grand Piece Online', icon: '🌊' },
  { id: 'mm2', label: 'Murder Mystery 2', icon: '🔪' },
  { id: 'fisch', label: 'Fisch', icon: '🎣' },
  { id: 'brainrot', label: 'Steal a Brainrot', icon: '🧠' }
];

export default function CustomerReviews() {
  const { openProofsModal, triggerAudio } = useStore();
  const [reviewsList, setReviewsList] = useState(() => reviewService.getAllReviews());
  const [proofsList, setProofsList] = useState(() => proofService.getAllProofs());
  
  // Tab: 'all' | 'discord' | 'escrow'
  const [sourceTab, setSourceTab] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');

  useEffect(() => {
    const unsubR = reviewService.subscribe((event) => {
      if (event.reviews) setReviewsList(event.reviews);
    });
    const unsubP = proofService.subscribe((event) => {
      if (event.proofs) setProofsList(event.proofs);
    });
    return () => {
      unsubR();
      unsubP();
    };
  }, []);

  // Merge and harmonize into unified reputation items
  const combinedItems = useMemo(() => {
    const items = [];

    // 1. Discord Vouches
    reviewsList.forEach(r => {
      items.push({
        id: r.id,
        source: 'discord',
        sourceLabel: 'Discord #vouches',
        author: r.author || 'Discord Member',
        avatar: r.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        stars: r.stars || 5,
        date: r.date || 'Discord Vouch',
        game: r.game || 'Blox Fruits',
        item: r.itemPurchased || 'In-Game Items',
        comment: r.comment || 'Vouch @tanstock',
        verified: true,
        screenshot: null,
        createdAt: r.createdAt || new Date().toISOString()
      });
    });

    // 2. Verified Trade Proofs
    proofsList.forEach(p => {
      items.push({
        id: p.id,
        source: 'escrow',
        sourceLabel: 'Verified Trade Proof',
        author: p.buyerUsername || 'Roblox Customer',
        avatar: p.buyerAvatar || 'https://cdn.discordapp.com/embed/avatars/1.png',
        stars: 5,
        date: p.timestamp || 'Trade Verified',
        game: p.game || 'Blox Fruits',
        item: p.item || 'Roblox Item',
        amount: p.amount || '$19.99',
        comment: p.tradeNotes || `Hand-delivered in private server by ${p.staffName || 'Staff'}. Trade PIN verified.`,
        verified: true,
        screenshot: p.proofScreenshot || null,
        orderNumber: p.orderNumber || p.id,
        countryCode: p.countryCode || 'US',
        createdAt: p.createdAt || new Date().toISOString()
      });
    });

    // Sort newest first
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [reviewsList, proofsList]);

  // Filtered stream
  const filteredItems = useMemo(() => {
    return combinedItems.filter(it => {
      // Source filter
      if (sourceTab === 'discord' && it.source !== 'discord') return false;
      if (sourceTab === 'escrow' && it.source !== 'escrow') return false;

      // Game filter
      if (selectedGame !== 'all') {
        const gameSlug = (it.game || '').toLowerCase().replace(/\s+/g, '-');
        if (selectedGame === 'blox-fruits' && !gameSlug.includes('blox') && !it.comment.toLowerCase().includes('fruit') && !it.comment.toLowerCase().includes('kitsune') && !it.comment.toLowerCase().includes('dragon')) return false;
        if (selectedGame === 'gpo' && !gameSlug.includes('gpo') && !gameSlug.includes('grand') && !it.comment.toLowerCase().includes('gpo')) return false;
        if (selectedGame === 'mm2' && !gameSlug.includes('mm2') && !gameSlug.includes('murder') && !it.comment.toLowerCase().includes('mm2') && !it.comment.toLowerCase().includes('godly')) return false;
        if (selectedGame === 'fisch' && !gameSlug.includes('fisch') && !it.comment.toLowerCase().includes('fisch') && !it.comment.toLowerCase().includes('rod')) return false;
        if (selectedGame === 'brainrot' && !gameSlug.includes('brainrot') && !it.comment.toLowerCase().includes('brainrot')) return false;
      }

      return true;
    });
  }, [combinedItems, sourceTab, selectedGame]);

  const discordCount = reviewsList.length;
  const escrowCount = proofsList.length;

  return (
    <section className="relative py-4 px-2 sm:px-0 select-none">
      {/* Container with Cyber Glass styling */}
      <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#12141f] via-[#0d0e15] to-[#0a0b10] border border-gs-border/90 p-4 sm:p-8 shadow-[0_15px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Background glow orb */}
        <div className="absolute top-0 right-1/4 w-96 h-48 bg-[#5865F2]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-48 bg-emerald-500/10 blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-gs-border/70 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
              <span className="px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-mono font-black bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/40 flex items-center gap-1.5 shadow-[0_0_15px_rgba(88,101,242,0.25)] max-w-full">
                <MessageSquare className="w-3.5 h-3.5 fill-[#5865F2] text-[#5865F2] shrink-0" />
                <span className="truncate">DISCORD SERVER + ESCROW PROOFS HUB</span>
              </span>
              <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE REPUTATION FEED</span>
              </span>
            </div>

            <h2 className="font-heading font-black text-xl sm:text-3xl text-white uppercase tracking-tight">
              Customer Vouches &amp; Trade Proofs
            </h2>
            <p className="text-xs text-gs-muted font-sans mt-1">
              Categorized real-time feedback from Discord (#vouches) and verified 1-on-1 website staff deliveries
            </p>
          </div>

          {/* Quick Metrics & Proofs CTA */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-2.5 bg-black/60 border border-gs-border/80 rounded-2xl p-2.5 px-4 shadow-inner">
              <span className="font-heading font-black text-2xl sm:text-3xl text-amber-400">4.99</span>
              <div className="flex flex-col leading-tight">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-[10px] text-gs-muted font-mono mt-0.5">{combinedItems.length}+ Verified Vouches</span>
              </div>
            </div>

            <button
              type="button"
              onMouseEnter={() => soundFx.cardHover()}
              onClick={() => { soundFx.modalOpen(); openProofsModal(); }}
              className="px-4 py-3 rounded-2xl bg-gs-raised hover:bg-white/10 text-white border border-gs-border hover:border-emerald-500/60 font-heading font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg group"
            >
              <span>View Full Ledger ({proofsList.length})</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Multi-Source Switcher Tabs (Discord vs Website Escrow) */}
        <div className="pt-6 pb-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative z-10">
          
          {/* Source Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-black/70 border border-gs-border/80 overflow-x-auto max-w-full no-scrollbar">
            <button
              type="button"
              onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('all'); soundFx.click(); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                sourceTab === 'all'
                  ? 'bg-gs-primary text-white shadow-glow-primary'
                  : 'text-gs-muted hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All ({combinedItems.length})</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('discord'); soundFx.click(); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                sourceTab === 'discord'
                  ? 'bg-[#5865F2] text-white shadow-[0_0_15px_rgba(88,101,242,0.4)]'
                  : 'text-gs-muted hover:text-[#8ea1e1]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#23a55a] animate-pulse" />
              <span className="hidden sm:inline">Discord #vouches ({discordCount})</span>
              <span className="sm:hidden">Discord ({discordCount})</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('escrow'); soundFx.click(); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                sourceTab === 'escrow'
                  ? 'bg-emerald-600 text-white shadow-glow-success'
                  : 'text-gs-muted hover:text-emerald-400'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Escrow Receipts ({escrowCount})</span>
              <span className="sm:hidden">Escrow ({escrowCount})</span>
            </button>
          </div>

          {/* Game Categorization Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 no-scrollbar">
            {GAME_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                type="button"
                onMouseEnter={() => soundFx.pillHover()} onClick={() => { setSelectedGame(cat.id); soundFx.click(); }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-heading font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 ${
                  selectedGame === cat.id
                    ? 'bg-gs-raised border-gs-primary text-white shadow-xs'
                    : 'bg-[#090a10]/60 border-gs-border/60 text-gs-muted hover:text-white hover:border-gs-border'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

        </div>

        {/* 3-Column Harmonized Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 relative z-10">
          <AnimatePresence mode="popLayout">
            {filteredItems.slice(0, 6).map((item) => {
              const country = getCountryForUser(item.author || item.id);
              const isDiscord = item.source === 'discord';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  onMouseEnter={() => soundFx.vouchHover()}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-lg group relative overflow-hidden transform-gpu ${
                    isDiscord
                      ? 'bg-[#0b0d18]/90 border-[#5865F2]/30 hover:border-[#5865F2]/60 hover:shadow-[0_0_20px_rgba(88,101,242,0.15)]'
                      : 'bg-[#090a10]/90 border-emerald-500/30 hover:border-emerald-500/60 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  }`}
                >
                  {/* Top Bar: Origin Badge & Stars */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {isDiscord ? (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
                          <span>DISCORD VOUCH</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>VERIFIED ESCROW</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-gs-muted">
                        {item.date}
                      </span>
                    </div>

                    {/* Golden Stars */}
                    <div className="flex text-amber-400 shrink-0">
                      {[...Array(item.stars || 5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  {/* Customer Header */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-xl bg-gs-raised border border-gs-border overflow-hidden shrink-0">
                      <img
                        src={item.avatar}
                        alt={item.author}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://cdn.discordapp.com/embed/avatars/0.png';
                        }}
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#090a10] flex items-center justify-center ${
                        isDiscord ? 'bg-[#5865F2]' : 'bg-emerald-500'
                      }`}>
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    </div>

                    <div className="overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs shrink-0">{country.flag}</span>
                        <span className="font-heading font-black text-white text-xs sm:text-sm truncate">
                          @{maskRobloxUsername(item.author)}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 mt-0.5">
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>{isDiscord ? 'Verified Community Vouch' : 'Delivered in <35s'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Screenshot Thumbnail Preview if available */}
                  {item.screenshot && (
                    <div className="relative rounded-xl overflow-hidden h-28 bg-black/80 border border-gs-border/80 group-hover:border-emerald-500/40 transition-colors">
                      <img
                        src={item.screenshot}
                        alt="Trade Proof Screenshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/20 text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                        <Camera className="w-3 h-3 text-emerald-400" />
                        <span>Trade Screenshot</span>
                      </div>
                    </div>
                  )}

                  {/* Comment Quote */}
                  <p className="text-xs text-gs-light/95 font-sans leading-relaxed italic line-clamp-3">
                    "{item.comment}"
                  </p>

                  {/* Footer Tag & Game Category */}
                  <div className="pt-2.5 border-t border-gs-border/60 flex items-center justify-between text-[11px] font-mono text-gs-muted">
                    <span className="truncate max-w-[170px] text-white font-medium flex items-center gap-1">
                      <span className="text-gs-primary">●</span>
                      <span>{item.game}</span>
                    </span>

                    {isDiscord ? (
                      <a
                        href="https://discord.gg/tanstock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-[#8ea1e1] hover:text-white font-bold flex items-center gap-1 transition-colors"
                      >
                        <span>#vouches</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                        {item.orderNumber ? `#${item.orderNumber}` : 'DELIVERED'}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottom Bar with Discord Link & Full Ledger Trigger */}
        <div className="mt-8 pt-6 border-t border-gs-border/60 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 text-xs text-gs-muted font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Showing {Math.min(6, filteredItems.length)} of {filteredItems.length} live reputation records</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://discord.gg/tanstock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8ea1e1] hover:text-white font-heading font-bold flex items-center gap-1.5 transition-colors"
            >
              <span>Join TANN STOCK on Discord</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <span>•</span>

            <button
              type="button"
              onClick={() => { soundFx.modalOpen(); openProofsModal(); }}
              className="text-emerald-400 hover:text-emerald-300 font-heading font-bold cursor-pointer"
            >
              Browse All Proofs Ledger &rarr;
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
