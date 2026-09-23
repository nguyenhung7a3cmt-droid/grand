import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Headphones,
  Send,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const FAQ_ITEMS = [
  {
    q: 'What happens if I cannot join the staff trade server right away?',
    a: 'No problem! Your order never expires. You can click "Re-queue Trade Server" at any time from your tracking window or Discord ticket to instantly summon a new bot instance.'
  },
  {
    q: 'Is 1-on-1 manual trading with GrandStock staff safe from Roblox bans?',
    a: '100% safe. All items in our bot cluster are clean, legitimate, and traded via standard in-game Roblox trade menus following all standard trade limits and requirements.'
  },
  {
    q: 'How fast do cryptocurrency payments confirm?',
    a: 'USDT TRC-20 and Solana confirm in 5-15 seconds. Bitcoin and Ethereum typically confirm on the very next block (<3-5 minutes). Bot trade fulfillment dispatches automatically.'
  },
  {
    q: 'Can I change my Roblox Username after submitting payment?',
    a: 'Yes! Simply submit a ticket below or ping our staff team on Discord with your Order ID, and our system will re-route the delivery to your updated account.'
  },
  {
    q: 'What if my in-game inventory is full?',
    a: 'Your assigned staff member will wait for you to clear inventory space or store items in your chest, then re-offer the trade automatically.'
  }
];

export default function SupportModal() {
  const { isSupportModalOpen, closeSupportModal, robloxUser, triggerAudio } = useStore();
  const [ticketCategory, setTicketCategory] = useState('Delivery Assistance');
  const [orderOrUsername, setOrderOrUsername] = useState(robloxUser?.username || '');
  const [contactHandle, setContactHandle] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [generatedTicketId, setGeneratedTicketId] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  if (!isSupportModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (orderOrUsername.trim() && ticketMessage.trim()) {
      const tId = `#TKT-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedTicketId(tId);

      // Persist ticket to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('grandstock_tickets') || '[]');
        const newTicket = {
          id: tId,
          createdAt: new Date().toISOString(),
          category: ticketCategory,
          user: orderOrUsername.trim(),
          contact: contactHandle.trim(),
          message: ticketMessage.trim(),
          status: 'IN_REVIEW'
        };
        localStorage.setItem('grandstock_tickets', JSON.stringify([newTicket, ...existing]));
      } catch (err) {
        console.warn('LocalStorage error:', err);
      }

      setIsSubmitted(true);
      triggerAudio('success');
    }
  };

  const handleResetTicket = () => {
    setIsSubmitted(false);
    setTicketMessage('');
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeSupportModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto overscroll-contain z-10 p-5 sm:p-8 flex flex-col justify-between" data-lenis-prevent="true"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gs-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-xl sm:text-2xl text-white uppercase">
                    24/7 GrandStock Support Center
                  </h2>
                  <p className="text-xs text-gs-muted">
                    Instant live response via Discord or priority web ticket (&lt;2 min response)
                  </p>
                </div>
              </div>

              <button
                onClick={closeSupportModal}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Discord Direct Channel Banner */}
            <div className="mt-5 p-4 rounded-2xl bg-[#5865F2]/15 border border-[#5865F2]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shrink-0 shadow-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-heading font-bold text-white text-sm sm:text-base flex items-center gap-2">
                    <span>Join Official GrandStock Discord</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  </div>
                  <div className="text-xs text-gs-muted">
                    14,200+ members • Dedicated support hub with 30-second live staff dispatch
                  </div>
                </div>
              </div>

              <a
                href="https://discord.gg/tanstock"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752c4] text-white font-heading font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-lg"
              >
                <span>Open Discord (Live)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Ticket Form or Submitted View */}
          <div className="py-5 space-y-5">
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/50 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-black text-lg text-white uppercase">
                  Priority Ticket Dispatched: {generatedTicketId}
                </h3>
                <p className="text-xs text-gs-muted max-w-md mx-auto font-sans leading-relaxed">
                  Our staff team has received your inquiry ({ticketCategory}). A staff moderator will review and update your trade status within 2 minutes.
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={handleResetTicket}
                    className="btn-secondary px-4 py-2 rounded-xl text-xs font-heading font-bold"
                  >
                    Submit Another Request
                  </button>
                  <button
                    onClick={closeSupportModal}
                    className="btn-primary px-6 py-2 rounded-xl text-xs font-heading font-bold"
                  >
                    Done
                  </button>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-5 rounded-2xl bg-gs-raised/70 border border-gs-border space-y-4">
                <div className="text-xs font-heading font-bold uppercase tracking-wider text-gs-light flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gs-primary" />
                  <span>Submit Priority Web Ticket:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-heading font-bold uppercase text-gs-muted mb-1">
                      Issue Category:
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={(e) => setTicketCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white focus:outline-none focus:border-gs-primary font-sans"
                    >
                      <option value="Delivery Assistance">Delivery Assistance (In-game trade meeting)</option>
                      <option value="Payment & Crypto Settlement">Payment &amp; Crypto Settlement Inquiry</option>
                      <option value="Username Change">Roblox Username Change Request</option>
                      <option value="Affiliate Payout">Affiliate &amp; Creator Payout Support</option>
                      <option value="General Question">General Marketplace Question</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-heading font-bold uppercase text-gs-muted mb-1">
                      Roblox Username / Order ID: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GS-892104 or RobloxUsername"
                      value={orderOrUsername}
                      onChange={(e) => setOrderOrUsername(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-mono placeholder:text-gs-muted focus:outline-none focus:border-gs-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-gs-muted mb-1">
                    Discord Tag or Email for Response Ping:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. shadow#1337 or user@gmail.com"
                    value={contactHandle}
                    onChange={(e) => setContactHandle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-sans placeholder:text-gs-muted focus:outline-none focus:border-gs-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-heading font-bold uppercase text-gs-muted mb-1">
                    Describe Your Issue in Detail: <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide relevant details so our team can resolve your inquiry immediately..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-sans placeholder:text-gs-muted focus:outline-none focus:border-gs-primary resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-2 shadow-glow-primary uppercase tracking-wider"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Ticket to Live Support Staff</span>
                </button>
              </form>
            )}

            {/* FAQ Accordion */}
            <div className="space-y-2">
              <div className="text-xs font-heading font-bold uppercase tracking-wider text-gs-muted mb-2 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Frequently Asked Questions</span>
              </div>

              {FAQ_ITEMS.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl bg-gs-raised/60 border border-gs-border overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-3 text-left flex items-center justify-between gap-2 text-xs font-heading font-bold text-white hover:text-gs-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-gs-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-gs-muted shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-3 pb-3 text-xs text-gs-muted font-sans leading-relaxed border-t border-gs-border/40 pt-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gs-border flex items-center justify-between text-xs text-gs-muted font-sans">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Encrypted ticket transmission with 24/7 human moderation.</span>
            </span>
            <button
              onClick={closeSupportModal}
              className="btn-secondary px-4 py-2 rounded-xl text-xs font-heading font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
