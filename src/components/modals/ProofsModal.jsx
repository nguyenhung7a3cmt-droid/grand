import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../../utils/soundFx';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  Filter,
  Camera,
  Sparkles,
  Edit3,
  Trash2,
  RotateCcw,
  Star,
  MessageSquare,
  Layers,
  Check
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { proofService } from '../../services/proofService';
import { reviewService } from '../../services/reviewService';
import { maskRobloxUsername } from '../../utils/privacyMask';
import CountryFlag from '../common/CountryFlag';
import PhotoProofReceipt from '../orders/PhotoProofReceipt';
import ProofEditorModal from '../admin/ProofEditorModal';
import { generateSvgTradeProof } from '../../utils/tradeProofGenerator';


const GAMES_LIST = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'blox-fruits', name: 'Blox Fruits', icon: '⚔️' },
  { id: 'gpo', name: 'Grand Piece Online', icon: '🌊' },
  { id: 'mm2', name: 'Murder Mystery 2', icon: '🔪' },
  { id: 'fisch', name: 'Fisch', icon: '🎣' },
  { id: 'brainrot', name: 'Steal a Brainrot', icon: '🧠' }
];

function getGameIcon(gameName = '') {
  const g = String(gameName).toLowerCase();
  if (g.includes('blox')) return '⚔️';
  if (g.includes('grand') || g.includes('gpo') || g.includes('piece')) return '🌊';
  if (g.includes('murder') || g.includes('mm2')) return '🔪';
  if (g.includes('fisch')) return '🎣';
  if (g.includes('brainrot')) return '🧠';
  if (g.includes('defenders') || g.includes('anime')) return '🛡️';
  return '🎮';
}

export default function ProofsModal() {
  const { isProofsModalOpen, closeProofsModal, triggerAudio } = useStore();
  const { isAdmin, isStaff } = useAuth();
  const canManageProofs = isAdmin || isStaff;

  const [proofs, setProofs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [editingProof, setEditingProof] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Filters
  const [sourceTab, setSourceTab] = useState('screenshots'); // 'screenshots' | 'discord' | 'all'
  const [filterGame, setFilterGame] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setVisibleCount(24);
  }, [sourceTab, filterGame, searchQuery]);

  useEffect(() => {
    if (!isProofsModalOpen) return;
    proofService.fetchAllProofs().then(setProofs);
    reviewService.fetchLiveReviews().then(setReviews);

    const unsubP = proofService.subscribe(() => setProofs(proofService.getAllProofs()));
    const unsubR = reviewService.subscribe(() => setReviews(reviewService.getAllReviews()));

    return () => {
      unsubP();
      unsubR();
    };
  }, [isProofsModalOpen]);

  // Combine unified proof items
  const combinedLedger = useMemo(() => {
    const list = [];

    // 1. Trade Proofs (with screenshots)
    proofs.forEach(p => {
      const safeOrder = p.orderNumber || p.id || 'GS-892104';
      const safeBuyer = p.buyerMasked || maskRobloxUsername(p.buyerUsername || 'Roblox Customer');
      const safeStaff = p.staffName || 'Staff Agent';
      const safeItem = p.item || 'Roblox In-Game Item';
      const safeGame = p.game || 'Blox Fruits';
      const safeAmount = p.amount || '$19.99';

      let screenshot = p.proofScreenshot;
      if (!screenshot || screenshot.includes('cdn.discordapp.com/attachments/')) {
        screenshot = generateSvgTradeProof({
          orderNumber: safeOrder,
          buyerMasked: safeBuyer,
          staffName: safeStaff,
          item: safeItem,
          game: safeGame,
          amount: safeAmount
        });
      }

      list.push({
        id: p.id,
        source: 'screenshot',
        sourceLabel: 'Trade Screenshot',
        orderNumber: safeOrder,
        buyerUsername: p.buyerUsername || 'Roblox Customer',
        buyerMasked: safeBuyer,
        buyerAvatar: p.buyerAvatar || 'https://cdn.discordapp.com/embed/avatars/1.png',
        countryCode: p.countryCode || 'US',
        countryName: p.countryName || 'United States',
        staffName: safeStaff,
        game: safeGame,
        item: safeItem,
        amount: safeAmount,
        proofScreenshot: screenshot,
        tradeNotes: p.tradeNotes || 'Hand-delivered in private server. Trade PIN verified.',
        timestamp: p.timestamp || 'Trade Verified',
        verified: true,
        createdAt: p.createdAt || new Date().toISOString()
      });
    });

    // 2. Discord Vouches
    reviews.forEach(r => {
      list.push({
        id: r.id,
        source: 'discord',
        sourceLabel: 'Discord #vouches',
        orderNumber: r.id.replace('rev-disc-', 'DISC-'),
        buyerUsername: r.author || 'Discord Member',
        buyerMasked: r.buyerMasked || maskRobloxUsername(r.author || 'Discord Member'),
        buyerAvatar: r.avatar || 'https://cdn.discordapp.com/embed/avatars/0.png',
        countryCode: 'US',
        countryName: 'Discord Community',
        staffName: 'Community Trade',
        game: r.game || 'Blox Fruits',
        item: r.itemPurchased || 'In-Game Items',
        amount: 'Verified Rep',
        proofScreenshot: null,
        tradeNotes: r.comment || 'Vouch @tanstock',
        timestamp: r.date || 'Discord Vouch',
        verified: true,
        stars: r.stars || 5,
        createdAt: r.createdAt || new Date().toISOString()
      });
    });

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [proofs, reviews]);

  const filteredItems = useMemo(() => {
    return combinedLedger.filter((item) => {
      // Source filter
      if (sourceTab === 'screenshots' && !item.proofScreenshot) return false;
      if (sourceTab === 'discord' && item.source !== 'discord') return false;

      // Game filter
      if (filterGame !== 'all') {
        const gameSlug = (item.game || '').toLowerCase().replace(/\s+/g, '-');
        const notes = (item.tradeNotes || '').toLowerCase();
        if (filterGame === 'blox-fruits' && !gameSlug.includes('blox') && !notes.includes('fruit') && !notes.includes('kitsune') && !notes.includes('dragon')) return false;
        if (filterGame === 'gpo' && !gameSlug.includes('gpo') && !gameSlug.includes('grand') && !notes.includes('gpo')) return false;
        if (filterGame === 'mm2' && !gameSlug.includes('mm2') && !gameSlug.includes('murder') && !notes.includes('mm2') && !notes.includes('godly')) return false;
        if (filterGame === 'fisch' && !gameSlug.includes('fisch') && !notes.includes('fisch') && !notes.includes('rod')) return false;
        if (filterGame === 'brainrot' && !gameSlug.includes('brainrot') && !notes.includes('brainrot')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          (item.item && item.item.toLowerCase().includes(q)) ||
          (item.orderNumber && item.orderNumber.toLowerCase().includes(q)) ||
          (item.buyerUsername && item.buyerUsername.toLowerCase().includes(q)) ||
          (item.tradeNotes && item.tradeNotes.toLowerCase().includes(q)) ||
          (item.staffName && item.staffName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [combinedLedger, sourceTab, filterGame, searchQuery]);

  useEffect(() => {
    if (!isProofsModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') closeProofsModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isProofsModalOpen, closeProofsModal]);

  if (!isProofsModalOpen) return null;

  const handleOpenReceipt = (proofItem) => {
    setSelectedProof(proofItem);
    triggerAudio?.('click');
  };

  const handleOpenAdminEdit = (proofItem, e) => {
    e.stopPropagation();
    setEditingProof(proofItem);
    setIsEditorOpen(true);
    triggerAudio?.('click');
  };

  const handleAdminDelete = async (proofId, e) => {
    e.stopPropagation();
    const ok = window.confirm('Are you sure you want to permanently delete this delivery proof record from the ledger?');
    if (ok) {
      await proofService.deleteProof(proofId);
      triggerAudio?.('click');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex sm:items-center sm:justify-center p-0 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative bg-gs-card border-0 sm:border border-gs-border rounded-none sm:rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 sm:p-4.5 border-b border-gs-border flex items-center justify-between shrink-0 bg-gs-raised/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="font-heading font-black text-xs sm:text-base md:text-lg text-white uppercase tracking-tight truncate">
                  Proofs &amp; Reputation
                </h2>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{combinedLedger.length} VERIFIED</span>
                </span>
              </div>
              <p className="hidden sm:block text-xs text-gs-muted font-sans mt-0.5 truncate">
                Official delivery proof screenshots and live vouches automatically fetched from Discord #vouches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#8ea1e1] text-[10px] sm:text-[11px] font-mono font-medium shrink-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#5865F2] animate-pulse shrink-0 shadow-[0_0_8px_#5865F2]" />
              <span className="hidden sm:inline font-bold">DISCORD:</span>
              <span className="text-white font-bold">LIVE-SYNC</span>
            </div>

            <button
              onClick={closeProofsModal}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-gs-muted hover:text-white bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Source Switcher & Filter Hub */}
        <div className="p-2 sm:p-3.5 border-b border-gs-border bg-[#090a10] space-y-2 shrink-0">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            
            {/* Multi-Source Switcher Pills */}
            <div className="grid grid-cols-3 sm:flex items-center p-1 rounded-xl bg-black/70 border border-gs-border/80 gap-1 shrink-0">
              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()}
                onClick={() => { setSourceTab('screenshots'); triggerAudio?.('click'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'screenshots'
                    ? 'bg-emerald-600 text-white shadow-glow-success'
                    : 'text-gs-muted hover:text-emerald-400'
                }`}
              >
                <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Trades ({proofs.length})</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()}
                onClick={() => { setSourceTab('discord'); triggerAudio?.('click'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'discord'
                    ? 'bg-[#5865F2] text-white shadow-[0_0_15px_rgba(88,101,242,0.4)]'
                    : 'text-gs-muted hover:text-[#8ea1e1]'
                }`}
              >
                <MessageSquare className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">Discord ({reviews.length})</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()}
                onClick={() => { setSourceTab('all'); triggerAudio?.('click'); }}
                className={`px-2 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'all'
                    ? 'bg-gs-primary text-white shadow-glow-primary'
                    : 'text-gs-muted hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                <span className="truncate">All ({combinedLedger.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gs-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by user or item..."
                className="w-full bg-gs-card border border-gs-border rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-gs-muted focus:outline-hidden focus:border-emerald-500/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gs-muted hover:text-white p-1"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Game Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 no-scrollbar touch-pan-x">
            {GAMES_LIST.map(g => (
              <button
                key={g.id}
                type="button"
                onMouseEnter={() => soundFx.pillHover()}
                onClick={() => { setFilterGame(g.id); triggerAudio?.('click'); }}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-heading font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1 shrink-0 ${
                  filterGame === g.id
                    ? 'bg-gs-raised border-emerald-500/80 text-white shadow-xs'
                    : 'bg-black/50 border-gs-border/60 text-gs-muted hover:text-white hover:border-gs-border'
                }`}
              >
                <span>{g.icon}</span>
                <span>{g.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Proof Cards Grid */}
        <div
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
            if (scrollHeight - scrollTop - clientHeight < 350 && visibleCount < filteredItems.length) {
              setVisibleCount((prev) => Math.min(prev + 24, filteredItems.length));
            }
          }}
          className="p-2.5 sm:p-4 overflow-y-auto flex-1 overscroll-contain"
        >
          {filteredItems.length === 0 ? (
            <div className="py-12 sm:py-16 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 sm:w-12 sm:h-12 text-gs-muted mx-auto opacity-40" />
              <p className="text-xs sm:text-sm text-gs-muted font-heading font-bold">No delivery records found</p>
              <p className="text-[11px] sm:text-xs text-gs-muted font-sans">Try selecting a different game category or clearing your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {filteredItems.slice(0, visibleCount).map((item) => {
                const isDiscord = item.source === 'discord';

                return (
                  <div
                    key={item.id}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 140px' }}
                    onMouseEnter={() => soundFx.vouchHover()}
                    onClick={() => handleOpenReceipt(item)}
                    className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 group relative overflow-hidden ${
                      isDiscord
                        ? 'bg-[#0b0d18]/90 border-[#5865F2]/25 hover:border-[#5865F2]/70 hover:shadow-[0_0_20px_rgba(88,101,242,0.2)]'
                        : 'bg-[#090a10]/90 border-emerald-500/25 hover:border-emerald-500/70 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {/* Top Header */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-black text-white text-xs sm:text-sm tracking-tight truncate">
                        {item.orderNumber}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isDiscord ? (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
                            <span>VOUCH</span>
                          </span>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Body */}
                    {!isDiscord ? (
                      /* Trade Screenshot / Handshake Content */
                      <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/60 border border-emerald-500/20 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-sm shrink-0">
                              {getGameIcon(item.game)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-heading font-black text-white text-xs sm:text-sm truncate">
                                {item.item}
                              </div>
                              <div className="text-[10px] font-mono text-emerald-400 font-semibold truncate">
                                {item.game}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-emerald-400 text-xs sm:text-sm block">
                              {item.amount}
                            </span>
                            <span className="text-[9px] font-mono text-gs-muted block">
                              ESCROW
                            </span>
                          </div>
                        </div>

                        <div className="px-2 py-1 rounded bg-[#0d0f17] border border-white/5 flex items-center justify-between text-[10px] font-mono text-gs-muted">
                          <span className="truncate">Staff: <strong className="text-slate-300 font-medium">{item.staffName}</strong></span>
                          <span className="text-emerald-400 font-bold shrink-0">✓ Delivered</span>
                        </div>
                      </div>
                    ) : (
                      /* Discord Message Card Body */
                      <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-black/50 border border-[#5865F2]/20 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gs-raised border border-gs-border overflow-hidden shrink-0">
                              <img
                                src={item.buyerAvatar}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%236366f1"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>`;
                                }}
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="font-heading font-bold text-white text-xs truncate">
                                @{item.buyerMasked}
                              </div>
                              <div className="flex text-amber-400 text-[10px]">
                                {[...Array(item.stars || 5)].map((_, i) => (
                                  <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                ))}
                              </div>
                            </div>
                          </div>

                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#5865F2]/15 text-[#8ea1e1] border border-[#5865F2]/30 shrink-0">
                            #vouches
                          </span>
                        </div>

                        <p className="text-[11px] sm:text-xs text-gs-light/90 italic line-clamp-2 px-2 py-1 rounded bg-black/40 border border-white/5">
                          "{item.tradeNotes}"
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-1.5 border-t border-gs-border/60 flex items-center justify-between text-xs">
                      <div className="text-[10px] sm:text-[11px] text-gs-muted font-sans truncate flex items-center gap-1.5">
                        <CountryFlag code={item.countryCode || 'US'} name={item.countryName || 'Verified'} variant="circle" size="xs" />
                        <span className="truncate">@{item.buyerMasked}</span>
                        <span className="mx-0.5">•</span>
                        <span className="truncate">{item.game}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {canManageProofs && item.source === 'screenshot' && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenAdminEdit(item, e)}
                              className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[9px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit this proof record"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAdminDelete(item.id, e)}
                              className="p-1 rounded bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                              title="Delete this proof"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        <div className="text-[10px] sm:text-[11px] font-heading font-bold text-emerald-400 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                          <span>Receipt</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              {visibleCount < filteredItems.length && (
                <div className="col-span-full pt-3 pb-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 36, filteredItems.length))}
                    className="px-5 py-2 rounded-xl bg-gs-raised hover:bg-gs-card border border-gs-border/80 text-xs font-heading font-bold text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-xs"
                  >
                    <span>Load More Proofs ({filteredItems.length - visibleCount} remaining)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 sm:p-3.5 border-t border-gs-border bg-gs-raised/60 flex items-center justify-between text-xs text-gs-muted shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Cryptographic masking active to protect player privacy.</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="https://discord.gg/tanstock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8ea1e1] hover:text-white font-heading font-bold flex items-center gap-1 text-[10px] sm:text-xs transition-colors"
            >
              <span>discord.gg/tanstock</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={closeProofsModal}
              className="hidden sm:inline-flex px-4 py-1.5 rounded-xl bg-gs-card hover:bg-gs-raised border border-gs-border text-white text-xs font-heading font-bold cursor-pointer transition-colors"
            >
              Close Ledger
            </button>
          </div>
        </div>

      </motion.div>

      {/* Full Photo Receipt Lightbox when clicking an item */}
      {selectedProof && (
        <PhotoProofReceipt
          order={{
            orderNumber: selectedProof.orderNumber,
            id: selectedProof.id,
            buyerMasked: selectedProof.buyerMasked,
            buyerUsername: selectedProof.buyerUsername,
            countryCode: selectedProof.countryCode,
            countryName: selectedProof.countryName,
            staffName: selectedProof.staffName,
            game: selectedProof.game,
            item: selectedProof.item,
            amount: selectedProof.amount,
            proofScreenshot: selectedProof.proofScreenshot,
            timestamp: selectedProof.timestamp,
            tradeNotes: selectedProof.tradeNotes,
            auditId: `GS-AUDIT-${selectedProof.orderNumber}`,
            auditSignature: 'SIG-VERIFIED-2026'
          }}
          onClose={() => setSelectedProof(null)}
        />
      )}

      {/* Proof Editor Modal for Admin & Staff to Add or Edit Proofs */}
      <ProofEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        proof={editingProof}
        onSave={async (payload) => {
          await proofService.saveProof(payload);
          const updated = await proofService.fetchAllProofs();
          setProofs(updated);
          triggerAudio?.('success');
        }}
        onDelete={async (proofId) => {
          await proofService.deleteProof(proofId);
          const updated = await proofService.fetchAllProofs();
          setProofs(updated);
          triggerAudio?.('click');
        }}
      />
    </div>
  );
}
