import { reviewService } from '../../services/reviewService';
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Star,
  Zap,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Download,
  Search,
  Package,
  ShieldCheck,
  Hash,
  User,
  ArrowRight,
  Sparkles,
  Camera
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { maskRobloxUsername } from '../../utils/privacyMask';
import { soundFx } from '../../utils/soundFx';

export default function CustomerOrdersModal() {
  const {
    isOrdersModalOpen,
    closeOrdersModal,
    ordersHistory,
    ongoingOrders,
    completedOrders,
    resumeOrderChat,
    openReceiptModal,
    formatPrice
  } = useStore();

  const [activeTab, setActiveTab] = useState('ongoing'); // 'ongoing' | 'history'
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOrdersModalOpen) return null;

  const safeOngoing = ongoingOrders || [];
  const safeCompleted = completedOrders || [];
  const currentList = activeTab === 'ongoing' ? safeOngoing : safeCompleted;

  const filteredOrders = currentList.filter((order) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchId = (order.orderNumber || order.id || '').toLowerCase().includes(q);
    const matchItem = order.items?.some(i => i.name.toLowerCase().includes(q)) || (order.item || '').toLowerCase().includes(q);
    return matchId || matchItem;
  });

  const handleResumeChat = (order) => {
    soundFx.click();
    resumeOrderChat(order);
  };

  const handleOpenReceipt = (order) => {
    soundFx.click();
    openReceiptModal(order);
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeOrdersModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden z-10 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gs-border bg-gs-raised/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase">
                    Customer Orders &amp; Purchase History
                  </h2>
                  {ongoingOrders.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span>{ongoingOrders.length} ONGOING</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-gs-muted">
                  Track ongoing live staff deliveries, resume trade chat, and view verified receipts
                </p>
              </div>
            </div>

            <button
              onClick={closeOrdersModal}
              className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white hover:bg-gs-border transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & Search */}
          <div className="p-4 bg-gs-raised/40 border-b border-gs-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => { setActiveTab('ongoing'); soundFx.tabSwitch(); }}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'ongoing'
                    ? 'bg-gs-primary text-white shadow-glow-primary'
                    : 'bg-gs-card text-gs-muted hover:text-white border border-gs-border'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ongoing Orders</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'ongoing' ? 'bg-black/40 text-white' : 'bg-gs-raised text-gs-light'
                }`}>
                  {ongoingOrders.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('history'); soundFx.tabSwitch(); }}
                className={`px-4 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'history'
                    ? 'bg-gs-primary text-white shadow-glow-primary'
                    : 'bg-gs-card text-gs-muted hover:text-white border border-gs-border'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Purchase History</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'history' ? 'bg-black/40 text-white' : 'bg-gs-raised text-gs-light'
                }`}>
                  {completedOrders.length}
                </span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gs-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search order ID or item..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-gs-card border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans placeholder:text-gs-muted"
              />
            </div>
          </div>

          {/* Orders List Container */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4" data-lenis-prevent="true">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order) => {
                const isOngoing = order.status !== 'COMPLETED' && order.status !== 'DELIVERED';
                const itemsCount = order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 1;
                const primaryItem = (order.items && order.items[0]) || { name: order.item || 'Roblox Item', image: '/items/bf-perm-kitsune.png', gameName: order.game || 'Blox Fruits' };

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 rounded-2xl bg-gs-raised/70 border border-gs-border hover:border-gs-border-glow transition-all shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Left: Order Info & Items */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {/* Item Thumbnail */}
                      <div className="relative w-16 h-16 rounded-xl bg-black/60 border border-gs-border p-1 shrink-0 overflow-hidden flex items-center justify-center shadow-inner">
                        <img
                          src={primaryItem.image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80'}
                          alt={primaryItem.name}
                          className="w-full h-full object-contain"
                        />
                        {itemsCount > 1 && (
                          <span className="absolute bottom-1 right-1 px-1 rounded bg-gs-primary text-white font-mono text-[9px] font-black">
                            +{itemsCount - 1}
                          </span>
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading font-black text-white text-sm">
                            {order.orderNumber || order.id}
                          </span>
                          
                          {isOngoing ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                              <span>AWAITING STAFF DELIVERY</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>100% DELIVERED &amp; VERIFIED</span>
                            </span>
                          )}
                        </div>

                        <h4 className="font-heading font-bold text-white text-sm truncate">
                          {order.items && order.items.length > 0
                            ? order.items.map(i => `${i.name} (x${i.quantity || 1})`).join(', ')
                            : order.item || 'Roblox Item'}
                        </h4>

                        <div className="flex items-center gap-3 text-xs text-gs-muted font-mono flex-wrap">
                          <span>Game: <strong className="text-gs-light">{primaryItem.gameName || 'Roblox'}</strong></span>
                          <span>&bull;</span>
                          <span>Recipient: <strong className="text-emerald-400 font-bold">@{maskRobloxUsername(order.robloxUser?.username || order.buyerUsername || 'Player')}</strong></span>
                          {order.verificationPin && (
                            <>
                              <span>&bull;</span>
                              <span>PIN: <strong className="text-amber-400">#{order.verificationPin}</strong></span>
                            </>
                          )}
                        </div>

                        <p className="text-[11px] text-gs-muted font-sans pt-0.5">
                          Ordered: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Recently'} &bull; Payment: {order.paymentMethod || 'Card / Stripe'}
                        </p>
                      </div>
                    </div>

                      {/* Right: Price Total & Action CTAs */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gs-border/60 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-black text-base sm:text-lg text-white">
                          {typeof order.total === 'number' ? formatPrice(order.total) : order.total || '$19.99'}
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 block">
                          Escrow Protected
                        </span>
                      </div>

                      {isOngoing ? (
                        <button
                          type="button"
                          onClick={() => handleResumeChat(order)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-success transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Open Live Chat</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResumeChat(order)}
                            className="px-3 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-black font-heading font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>Rate / Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(order)}
                            className="btn-secondary px-3 py-2 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 text-gs-primary" />
                            <span>Certificate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gs-raised flex items-center justify-center text-gs-muted border border-gs-border">
                  <Package className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="font-heading font-bold text-base text-white">
                  {activeTab === 'ongoing' ? 'No Ongoing Orders in Progress' : 'No Purchase History Yet'}
                </h3>
                <p className="text-xs text-gs-muted max-w-sm font-sans">
                  {activeTab === 'ongoing'
                    ? 'All your past orders have been successfully fulfilled. Add items from the catalog to start a new live delivery!'
                    : 'Your completed delivery receipts and trade certificates will be permanently archived here.'}
                </p>
                <button
                  type="button"
                  onClick={closeOrdersModal}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-bold"
                >
                  Browse Catalog
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gs-border bg-gs-raised/60 flex items-center justify-between text-xs text-gs-muted shrink-0">
            <span className="flex items-center gap-1.5 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>All orders are preserved in your browser and synced with staff dispatch.</span>
            </span>
            <button
              onClick={closeOrdersModal}
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
