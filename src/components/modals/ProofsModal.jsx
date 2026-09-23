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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gs-border flex items-center justify-between shrink-0 bg-gs-raised/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight">
                  Public Proofs &amp; Reputation Ledger
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{combinedLedger.length} VERIFIED</span>
                </span>
              </div>
              <p className="text-xs text-gs-muted font-sans mt-0.5">
                Official delivery proof screenshots and live vouches automatically fetched from Discord #vouches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#8ea1e1] text-[11px] font-mono font-medium shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse shrink-0 shadow-[0_0_8px_#5865F2]" />
              <span className="hidden sm:inline font-bold">DISCORD BOT:</span>
              <span className="text-white font-bold">AUTO-SYNCED</span>
            </div>

            <button
              onClick={closeProofsModal}
              className="p-2 rounded-xl text-gs-muted hover:text-white hover:bg-gs-raised transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Source Switcher & Filter Hub */}
        <div className="p-4 sm:p-5 border-b border-gs-border bg-[#090a10] space-y-3 shrink-0">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Multi-Source Switcher Pills */}
            <div className="flex items-center p-1 rounded-xl bg-black/70 border border-gs-border/80 overflow-x-auto max-w-full no-scrollbar">
              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('screenshots'); triggerAudio?.('click'); }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'screenshots'
                    ? 'bg-emerald-600 text-white shadow-glow-success'
                    : 'text-gs-muted hover:text-emerald-400'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trade Screenshots ({proofs.length})</span>
                <span className="sm:hidden">Screenshots ({proofs.length})</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('discord'); triggerAudio?.('click'); }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'discord'
                    ? 'bg-[#5865F2] text-white shadow-[0_0_15px_rgba(88,101,242,0.4)]'
                    : 'text-gs-muted hover:text-[#8ea1e1]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Discord #vouches ({reviews.length})</span>
                <span className="sm:hidden">Discord ({reviews.length})</span>
              </button>

              <button
                type="button"
                onMouseEnter={() => soundFx.tabHover()} onClick={() => { setSourceTab('all'); triggerAudio?.('click'); }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap ${
                  sourceTab === 'all'
                    ? 'bg-gs-primary text-white shadow-glow-primary'
                    : 'text-gs-muted hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All ({combinedLedger.length})</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gs-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, item or keyword..."
                className="w-full bg-gs-card border border-gs-border rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gs-muted focus:outline-hidden focus:border-emerald-500/60"
              />
            </div>
          </div>

          {/* Game Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {GAMES_LIST.map(g => (
              <button
                key={g.id}
                type="button"
                onMouseEnter={() => soundFx.pillHover()} onClick={() => { setFilterGame(g.id); triggerAudio?.('click'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-bold uppercase tracking-wider whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
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
          className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain"
        >
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-gs-muted mx-auto opacity-40" />
              <p className="text-sm text-gs-muted font-heading font-bold">No delivery records found</p>
              <p className="text-xs text-gs-muted font-sans">Try selecting a different game category or clearing your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.slice(0, visibleCount).map((item) => {
                const isDiscord = item.source === 'discord';

                return (
                  <div
                    key={item.id}
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 260px' }}
                    onMouseEnter={() => soundFx.vouchHover()}
                    onClick={() => handleOpenReceipt(item)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group relative overflow-hidden ${
                      isDiscord
                        ? 'bg-[#0b0d18]/90 border-[#5865F2]/30 hover:border-[#5865F2]/70 hover:shadow-[0_0_20px_rgba(88,101,242,0.2)]'
                        : 'bg-[#090a10]/90 border-emerald-500/30 hover:border-emerald-500/70 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {/* Top Header */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-heading font-black text-white text-sm">
                        {item.orderNumber}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isDiscord ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#5865F2]/20 text-[#8ea1e1] border border-[#5865F2]/40 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#23a55a]" />
                            <span>DISCORD VOUCH</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED TRADE</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Screenshot Preview if available */}
                    {item.proofScreenshot ? (
                      <div className="relative rounded-xl overflow-hidden h-36 min-h-[144px] bg-[#0d0f17] border border-gs-border/80 group-hover:border-emerald-500/40 transition-colors">
                        <img
                          src={item.proofScreenshot}
                          alt=""
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = generateSvgTradeProof({
                              orderNumber: item.orderNumber,
                              buyerMasked: item.buyerMasked,
                              staffName: item.staffName,
                              item: item.item,
                              game: item.game,
                              amount: item.amount
                            });
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md border border-white/20 text-[9px] font-mono text-emerald-400 font-bold flex items-center gap-1 z-10 pointer-events-none">
                          <Camera className="w-3 h-3 text-emerald-400" />
                          <span>Staff Screenshot</span>
                        </div>

                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs z-10 pointer-events-none">
                          <span className="font-heading font-bold truncate text-[11px] drop-shadow-md">
                            {item.item}
                          </span>
                          <span className="font-mono font-bold text-emerald-400 text-xs shrink-0 drop-shadow-md">
                            {item.amount}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Discord Message Card Body */
                      <div className="p-3 rounded-xl bg-black/50 border border-gs-border/60 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="relative w-8 h-8 rounded-lg bg-gs-raised border border-gs-border overflow-hidden shrink-0">
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
                          <div>
                            <div className="font-heading font-bold text-white text-xs">
                              @{item.buyerMasked}
                            </div>
                            <div className="flex text-amber-400 text-[10px]">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gs-light/90 italic line-clamp-2">
                          "{item.tradeNotes}"
                        </p>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="pt-2 border-t border-gs-border/60 flex items-center justify-between text-xs">
                      <div className="text-[11px] text-gs-muted font-sans truncate flex items-center gap-1.5">
                        <CountryFlag code={item.countryCode || 'US'} name={item.countryName || 'Verified'} variant="circle" size="xs" />
                        <span>@{item.buyerMasked}</span>
                        <span className="mx-1">•</span>
                        <span>{item.game}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {canManageProofs && item.source === 'screenshot' && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenAdminEdit(item, e)}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Edit this proof record"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleAdminDelete(item.id, e)}
                              className="p-1 rounded-md bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                              title="Delete this proof"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}

                        <div className="text-[11px] font-heading font-bold text-emerald-400 flex items-center gap-1 shrink-0 group-hover:translate-x-1 transition-transform">
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                  </div>
                );
              })}

              {visibleCount < filteredItems.length && (
                <div className="col-span-full pt-4 pb-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 36, filteredItems.length))}
                    className="px-6 py-2.5 rounded-xl bg-gs-raised hover:bg-gs-card border border-gs-border/80 text-xs font-heading font-bold text-emerald-400 hover:text-white transition-all cursor-pointer flex items-center gap-2 shadow-sm"
                  >
                    <span>Load More Proofs ({filteredItems.length - visibleCount} remaining)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gs-border bg-gs-raised/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gs-muted shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>All buyer usernames enforce cryptographic masking to protect player privacy.</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://discord.gg/tanstock"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8ea1e1] hover:text-white font-heading font-bold flex items-center gap-1 transition-colors"
            >
              <span>discord.gg/tanstock</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={closeProofsModal}
              className="px-5 py-2 rounded-xl bg-gs-card hover:bg-gs-raised border border-gs-border text-white text-xs font-heading font-bold cursor-pointer"
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
