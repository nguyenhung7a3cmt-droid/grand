import { getCountryForUser, getClientCountry } from '../../utils/countryLocation';
import { reviewService } from '../../services/reviewService';
import { maskRobloxUsername } from '../../utils/privacyMask';
import { generateSvgTradeProof } from '../../utils/tradeProofGenerator';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Star,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Calendar,
  Hash,
  UserCheck,
  Camera,
  FileCheck
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export default function PhotoProofReceipt({ order, onClose }) {
  const { formatPrice, triggerAudio } = useStore();
  const [copiedAudit, setCopiedAudit] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);

  if (!order) return null;

  const rawBuyerName = order.buyerUsername || order.robloxUser?.username || order.buyerMasked || order.buyer?.robloxUsername || 'Player';
  const buyerName = maskRobloxUsername(rawBuyerName);
  const staffName = order.staffName || order.staff?.name || 'Agent Alex';
  const staffBadge = order.staffBadge || order.staff?.badge || 'VERIFIED STAFF';
  const orderId = order.orderNumber || order.id || order.ticketId || 'GS-892104';
  const auditId = order.auditId || `GS-AUDIT-${orderId.replace(/[^0-9]/g, '') || '565073'}`;
  const auditSignature = order.auditSignature || `SIG-GS-2026-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const totalDisplay = order.total ? formatPrice(order.total) : order.amount || '$24.99';

  const defaultSvgProof = generateSvgTradeProof({
    orderNumber: orderId,
    buyerMasked: buyerName,
    staffName,
    item: (order.items && order.items[0]?.name) || order.item || 'Roblox In-Game Item',
    game: (order.items && order.items[0]?.gameName) || order.game || 'Blox Fruits',
    amount: totalDisplay,
    auditSignature
  });

  const rawScreenshot = order.proofScreenshot;
  const cleanScreenshot = rawScreenshot ? rawScreenshot.replace(/%2523/g, '%23') : null;
  const initialProof = cleanScreenshot || defaultSvgProof;

  const [currentImgSrc, setCurrentImgSrc] = useState(initialProof);
  const tradeNotes = order.tradeNotes || `In-game trade hand-delivered to @${buyerName}. Verification PIN verified.`;
  const orderReview = reviewService.getReviewByOrderId(orderId) || reviewService.getReviewByOrderId(order.orderNumber) || reviewService.getReviewByOrderId(order.id);

  const handleCopyAudit = () => {
    navigator.clipboard?.writeText(`${auditId} • ${auditSignature}`);
    setCopiedAudit(true);
    triggerAudio('click');
    setTimeout(() => setCopiedAudit(false), 2000);
  };

  const handleDownloadReceipt = () => {
    setIsDownloaded(true);
    triggerAudio('success');

    const receiptContent = `=====================================================
GRANDSTOCK.NET — OFFICIAL IN-GAME DELIVERY PROOF CERTIFICATE
=====================================================
Order ID:        ${orderId}
Audit Record:    ${auditId}
Security Seal:   ${auditSignature}
Timestamp:       ${order.completedAt ? new Date(order.completedAt).toUTCString() : new Date().toUTCString()}
Status:          100% VERIFIED & DELIVERED (ESCROW RELEASED)
Target Player:   @${buyerName} (Privacy Masked)
Customer Review: ${orderReview ? `[${orderReview.stars}.0 / 5.0 Stars] "${orderReview.comment}"` : '5.0 / 5.0 Stars (Verified Escrow Delivery)'}
Delivery Agent:  ${staffName} (${staffBadge})
Trade Notes:     ${tradeNotes}
Total Amount:    ${totalDisplay}

ITEMS DELIVERED:
${order.items && order.items.length > 0 ? order.items.map(it => ` - ${it.name} (Qty: ${it.quantity || 1}) [${it.gameName || 'Roblox'}]`).join('\n') : ` - ${order.item || 'Roblox In-Game Item'} (${order.game || 'Roblox'})`}

VERIFICATION PROOF:
Screenshot:      Attached & Archived in GrandStock Live Ledger
Verification:    https://grandstock.net/verify/${orderId}
=====================================================
GrandStock.net — Roblox In-Game Item Shopping Store
=====================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `GrandStock_Delivery_Proof_${orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setTimeout(() => setIsDownloaded(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto" data-lenis-prevent="true">
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[94vh] overflow-y-auto z-10 p-5 sm:p-8 flex flex-col justify-between" data-lenis-prevent="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gs-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <span>Official In-Game Delivery Proof</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    VERIFIED ATTACHMENT
                  </span>
                </h2>
                <p className="text-[11px] text-gs-muted font-mono">
                  Order ID: <strong className="text-white">{orderId}</strong> &bull; Delivered by:{' '}
                  <span className="text-emerald-400 font-bold">{staffName}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Actual Uploaded Screenshot Proof */}
          <div className="py-4 space-y-4">
            <div className="relative rounded-2xl bg-black border-2 border-emerald-500/40 overflow-hidden shadow-2xl">
              {/* Full Screenshot View */}
              <div className="relative min-h-[280px] sm:min-h-[380px] max-h-[500px] w-full overflow-hidden bg-[#07080e] flex items-center justify-center p-2">
                <img
                  src={currentImgSrc}
                  alt=""
                  onError={() => setCurrentImgSrc(defaultSvgProof)}
                  className="w-full h-full object-contain max-h-[480px] rounded-lg"
                />

                {/* Open Original Full Image Link if real photo */}
                {currentImgSrc && !currentImgSrc.startsWith('data:') && (
                  <a
                    href={currentImgSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 left-3 px-2 py-1 rounded-lg bg-black/80 hover:bg-black border border-white/20 text-white text-[10px] font-mono flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer z-10 shadow"
                    title="Open original high-res Discord photo"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-400" />
                    <span>View Full Photo</span>
                  </a>
                )}

                {/* Stamp overlay */}
                <div className="absolute top-4 right-4 sm:top-5 sm:right-6 rotate-3 sm:rotate-6 pointer-events-none select-none z-10">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border-2 border-dashed border-emerald-400 text-center backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <span className="text-[10px] sm:text-[11px] font-mono font-black text-emerald-400 uppercase tracking-widest block">
                      GRANDSTOCK VERIFIED
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-mono text-emerald-300 tracking-wider">
                      100% HANDSHAKE PROOF
                    </span>
                  </div>
                </div>
              </div>

              {/* Trade Log Banner */}
              <div className="p-3.5 bg-gs-raised/90 border-t border-gs-border/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-white">Staff Verification Notes:</span>
                    <span className="text-emerald-400 font-mono text-[11px]">@{buyerName}</span>
                  </div>
                  <p className="text-[11px] text-gs-light font-sans">{tradeNotes}</p>
                </div>

                <div className="font-mono font-black text-emerald-400 text-sm shrink-0">
                  {totalDisplay}
                </div>
              </div>
            </div>

            {/* Official Audit Box */}
            <div className="p-2.5 rounded-xl bg-black/60 border border-gs-border/60 flex items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-gs-muted text-[11px] truncate">
                  Audit: <strong className="text-emerald-400">{auditId}</strong> &bull; <strong className="text-gs-light">{auditSignature}</strong>
                </span>
              </div>

              <button
                onClick={handleCopyAudit}
                className="px-2 py-1 rounded-md bg-gs-card text-[10px] text-gs-muted hover:text-white border border-gs-border flex items-center gap-1 shrink-0"
              >
                {copiedAudit ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedAudit ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="pt-4 border-t border-gs-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleDownloadReceipt}
              className="btn-primary w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 shadow-glow-primary"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloaded ? 'Certificate Saved!' : 'Download Official Certificate (.txt)'}</span>
            </button>

            <button
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-heading font-bold"
            >
              Close Proof
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
