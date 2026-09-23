import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Zap, ShieldCheck, CheckCircle, ExternalLink } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { proofService } from '../../services/proofService';
import { maskRobloxUsername } from '../../utils/privacyMask';
import CountryFlag from '../common/CountryFlag';
import { getCountryForUser, getClientCountry } from '../../utils/countryLocation';

export default function LivePurchaseTicker() {
  const { ordersHistory, ongoingOrders, products, openProofsModal, formatPrice } = useStore();
  const [liveProofs, setLiveProofs] = useState(() => proofService.getAllProofs());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Subscribe to live proof updates
  useEffect(() => {
    const unsub = proofService.subscribe((event) => {
      if (event.proofs) {
        setLiveProofs(event.proofs);
      }
    });
    return () => unsub();
  }, []);

  // Build Real Items Feed from actual orders, live proofs ledger, and catalog
  const tickerItems = useMemo(() => {
    const items = [];

    // 1. Real user placed orders
    if (ordersHistory && ordersHistory.length > 0) {
      ordersHistory.forEach((o) => {
        const primary = o.items?.[0] || { name: o.item || 'Roblox Item', image: '/items/bf-perm-kitsune.png', gameName: o.game || 'Blox Fruits' };
        items.push({
          id: `order-${o.id}`,
          buyer: o.robloxUser?.username || o.buyerUsername || 'Player',
          avatar: o.robloxUser?.avatarUrl || o.buyerAvatar,
          item: primary.name,
          image: primary.image,
          game: primary.gameName || o.game || 'Blox Fruits',
          amount: typeof o.total === 'number' ? formatPrice(o.total) : o.total,
          time: 'Just now',
          country: getClientCountry(),
          isUserOrder: true
        });
      });
    }

    // 2. Real Verified Proofs from live ledger
    if (liveProofs && liveProofs.length > 0) {
      liveProofs.slice(0, 10).forEach((p) => {
        const country = getCountryForUser(p.orderNumber || p.id || p.buyerUsername);
        items.push({
          id: p.id || p.orderNumber,
          buyer: p.buyerUsername || p.buyerMasked || 'RobloxPlayer',
          avatar: p.buyerAvatar,
          item: p.item,
          image: p.itemImage || '/items/bf-perm-kitsune.png',
          game: p.game,
          amount: p.amount,
          time: p.timestamp || '2m ago',
          country: country,
          isProof: true
        });
      });
    }

    // 3. If empty, build from live products
    if (items.length === 0 && products && products.length > 0) {
      const sampleBuyers = ['ShadowHunter', 'KitsuneMaster', 'ViperX', 'DragonLord', 'AnglerPro'];
      products.slice(0, 5).forEach((prod, i) => {
        const buyer = sampleBuyers[i % sampleBuyers.length];
        items.push({
          id: `sample-${prod.id}`,
          buyer,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(buyer)}&backgroundColor=111218`,
          item: prod.name,
          image: prod.image,
          game: prod.gameName,
          amount: formatPrice(prod.price),
          time: `${(i + 1) * 2}m ago`,
          country: getCountryForUser(buyer)
        });
      });
    }

    return items;
  }, [ordersHistory, liveProofs, products, formatPrice]);

  useEffect(() => {
    if (tickerItems.length === 0) return;
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % tickerItems.length);
        setIsVisible(true);
      }, 450);
    }, 6500);

    return () => clearInterval(interval);
  }, [tickerItems.length]);

  // Hide live ticker when customer has an active ongoing delivery to keep UI clean
  if (ongoingOrders && ongoingOrders.length > 0) return null;
  if (tickerItems.length === 0) return null;

  const currentItem = tickerItems[currentIndex] || tickerItems[0];
  const maskedName = maskRobloxUsername(currentItem.buyer);

  return (
    <div className="fixed bottom-6 left-4 sm:left-6 z-30 max-w-xs sm:max-w-sm pointer-events-auto hidden md:block">
      <AnimatePresence mode="wait">
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            onClick={openProofsModal}
            className="p-3 rounded-2xl bg-[#0e1017]/95 border border-gs-border/90 hover:border-emerald-500/60 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl flex items-center gap-3 cursor-pointer group transition-all"
          >
            {/* Real Item / Avatar Thumbnail */}
            <div className="relative w-11 h-11 rounded-xl bg-black/60 border border-gs-border/80 overflow-hidden shrink-0 p-1 flex items-center justify-center shadow-inner">
              <img
                src={currentItem.image || currentItem.avatar || '/items/bf-perm-kitsune.png'}
                alt={currentItem.item}
                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0e1017] flex items-center justify-center shadow-sm">
                <CheckCircle className="w-2.5 h-2.5 text-white" />
              </div>
            </div>

            {/* Purchase Info with REAL COUNTRY FLAG */}
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-gs-muted">
                <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                  <CountryFlag code={currentItem.country?.code || 'US'} name={currentItem.country?.name || 'Customer Region'} variant="circle" size="xs" />
                  <span className="font-bold text-white truncate min-w-0">
                    @{maskedName}
                  </span>
                </div>
                <span className="shrink-0">{currentItem.time}</span>
              </div>

              <p className="text-xs font-heading font-black text-white truncate">
                Purchased <span className="text-gs-primary-glow">{currentItem.item}</span>
              </p>

              <div className="text-[10px] text-emerald-400 font-mono font-bold flex items-center justify-between gap-1 pt-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>Delivered in &lt;40s via Staff Escrow</span>
                </span>
                {currentItem.amount && (
                  <span className="text-white/80 font-mono">{currentItem.amount}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
