import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ArrowRight, X } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { soundFx } from '../../utils/soundFx';

export default function OngoingOrderWidget() {
  const { ongoingOrders, resumeOrderChat, isOrderTrackingOpen } = useStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // Hide widget if live chat modal is open or no ongoing orders or dismissed
  if (isOrderTrackingOpen || !ongoingOrders || ongoingOrders.length === 0 || isDismissed) {
    return null;
  }

  const latestOrder = ongoingOrders[0];

  const handleOpen = () => {
    soundFx.click();
    resumeOrderChat(latestOrder);
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    soundFx.click();
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="fixed bottom-6 left-4 sm:left-6 z-40 pointer-events-auto max-w-md"
      >
        <div
          onClick={handleOpen}
          className="group relative flex items-center gap-3 pl-3.5 pr-2 py-2.5 rounded-full bg-gs-card/90 border border-emerald-500/50 hover:border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all duration-300 cursor-pointer backdrop-blur-xl"
        >
          {/* Animated Active Radar Dot */}
          <div className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>

          {/* Order Details in Single Crisp Line (Supports 1 or Multiple) */}
          <div className="flex items-center gap-2 text-xs font-sans min-w-0 pr-1">
            {ongoingOrders.length > 1 ? (
              <>
                <span className="font-heading font-black text-white whitespace-nowrap">
                  {ongoingOrders.length} Orders in Progress
                </span>
                <span className="text-gs-muted hidden sm:inline">&bull;</span>
                <span className="text-emerald-400 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                  {latestOrder.orderNumber || latestOrder.id} +{ongoingOrders.length - 1} more
                </span>
              </>
            ) : (
              <>
                <span className="font-heading font-black text-white whitespace-nowrap">
                  {latestOrder.orderNumber || latestOrder.id}
                </span>
                <span className="text-gs-muted hidden sm:inline">&bull;</span>
                <span className="text-emerald-400 font-medium truncate max-w-[140px] sm:max-w-[180px]">
                  {latestOrder.items?.[0]?.name || latestOrder.item || 'Delivery in progress'}
                </span>
              </>
            )}
          </div>

          {/* Chat Action Pill */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500 text-emerald-300 group-hover:text-black font-heading font-black text-[11px] uppercase tracking-wider transition-all shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={handleDismiss}
            title="Minimize"
            className="p-1 rounded-full text-gs-muted hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
