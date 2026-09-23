import { reviewService } from '../../services/reviewService';
import { maskRobloxUsername } from '../../utils/privacyMask';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { soundFx } from '../../utils/soundFx';
import {
  X,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  ExternalLink,
  Copy,
  Check,
  User,
  Clock,
  Sparkles,
  Send,
  Paperclip,
  Trash2,
  MessageSquare,
  FileText,
  AlertCircle,
  Headphones,
  Gamepad2,
  Star,
  Radio,
  Loader2,
  Camera,
  UserPlus
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { ticketSyncService } from '../../services/ticketSyncService';
import PhotoProofReceipt from './PhotoProofReceipt';

const STAGES = [
  { step: 1, title: 'Payment Confirmed', desc: 'Escrow held' },
  { step: 2, title: 'Staff Claimed', desc: 'Agent assigned' },
  { step: 3, title: 'In-Game Meetup', desc: 'Joining game' },
  { step: 4, title: 'Trade Handshake', desc: 'PIN verified' },
  { step: 5, title: 'Delivered', desc: 'Proof attached' }
];

const QUICK_REPLIES = [
  "I'm joining your game now! 🚀",
  "Sent you a friend request on Roblox 👍",
  "I'm at the trade table waiting 🎮",
  "Trade accepted in-game! Thank you ⭐"
];

export default function OrderTrackingModal() {
  const {
    isOrderTrackingOpen,
    closeOrderTracking,
    activeOrder,
    setActiveOrder,
    ongoingOrders,
    formatPrice,
    triggerAudio
  } = useStore();

  const { currentUser } = useAuth();

  const [liveTicket, setLiveTicket] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [chatAttachments, setChatAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const attachmentInputRef = useRef(null);
  const [copiedStaffName, setCopiedStaffName] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [radarSeconds, setRadarSeconds] = useState(0);

  // Customer 5-Star Rating & Review States
  const [ratingStars, setRatingStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [selectedTag, setSelectedTag] = useState('⚡ Instant Bot Delivery');
  const [existingReview, setExistingReview] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const chatBottomRef = useRef(null);
  const confettiTriggered = useRef(false);

  // Sync ticket from real-time ticketSyncService
  useEffect(() => {
    if (!isOrderTrackingOpen || !activeOrder) return;

    let current = ticketSyncService.getTicketById(activeOrder.id) || ticketSyncService.getTicketById(activeOrder.orderNumber);
    if (!current) {
      current = ticketSyncService.publishTicket(activeOrder);
    }
    if (current) {
      setLiveTicket({ ...current });
    }
    const rev = reviewService.getReviewByOrderId(activeOrder.id || activeOrder.orderNumber);
    if (rev) {
      setExistingReview(rev);
    }

    const unsubscribe = ticketSyncService.subscribe((event) => {
      const targetId = activeOrder?.id || activeOrder?.orderNumber;
      const updated = ticketSyncService.getTicketById(targetId);
      if (updated) {
        setLiveTicket(updated);
        if (event.type === 'TICKET_CLAIMED') {
          soundFx.orderCreated();
        } else if (event.type === 'TICKET_COMPLETED') {
          soundFx.orderCreated();
        } else if (event.type === 'MESSAGE_SENT' && event.message?.sender === 'staff') {
          soundFx.chatMessageReceived();
        }
      }
    });

    return () => unsubscribe();
  }, [isOrderTrackingOpen, activeOrder, currentUser, triggerAudio]);

  // Unclaimed Radar Timer
  useEffect(() => {
    if (liveTicket?.status === 'UNCLAIMED') {
      const timer = setInterval(() => setRadarSeconds(s => s + 1), 1000);
      return () => clearInterval(timer);
    }
  }, [liveTicket?.status]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveTicket?.messages]);

  // Confetti trigger on completion (only when staff completes with real proof)
  useEffect(() => {
    if (liveTicket?.status === 'DELIVERED' && !confettiTriggered.current) {
      confettiTriggered.current = true;
      try {
        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.55 },
          colors: ['#EE1D36', '#FF2E4D', '#10B981', '#F59E0B', '#FFFFFF']
        });
      } catch (err) {}
    }
    if (liveTicket?.status !== 'DELIVERED') {
      confettiTriggered.current = false;
    }
  }, [liveTicket?.status]);

  if (!isOrderTrackingOpen || !activeOrder) return null;

  const currentStep = liveTicket?.statusStep || 1;
  const staff = liveTicket?.staff || null;
  const isUnclaimed = liveTicket?.status === 'UNCLAIMED';

    const handleSubmitReview = (e) => {
    e?.preventDefault();
    if (!activeOrder) return;
    
    const finalComment = reviewComment.trim() || `${selectedTag} — Trade delivered smoothly!`;
    const primaryItem = (activeOrder.items && activeOrder.items[0]?.name) || activeOrder.item || 'Roblox Item';
    const primaryGame = (activeOrder.items && activeOrder.items[0]?.gameName) || activeOrder.game || liveTicket?.game || 'Blox Fruits';

    const saved = reviewService.addReview({
      orderId: activeOrder.id || activeOrder.orderNumber,
      author: activeOrder.robloxUser?.username || activeOrder.buyerUsername || 'Player',
      avatar: activeOrder.robloxUser?.avatarUrl || activeOrder.buyerAvatar,
      stars: ratingStars,
      game: primaryGame,
      itemPurchased: primaryItem,
      comment: finalComment
    });

    setExistingReview(saved);
    setReviewSuccess(true);
    triggerAudio('success');

    // Notify ticket chat
    if (liveTicket) {
      soundFx.chatMessageSent(); ticketSyncService.sendMessage(liveTicket.id, {
        sender: 'buyer',
        senderName: activeOrder.robloxUser?.username || 'Customer',
        avatar: activeOrder.robloxUser?.avatarUrl,
        text: `⭐ Submitted a ${ratingStars}-Star Review: "${finalComment}"`
      });
    }

    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#EE1D36', '#FFFFFF']
      });
    } catch (e) {}
  };

  const handleAttachmentFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setChatAttachments((prev) => [...prev, ev.target.result].slice(0, 8));
        try { soundFx.buttonClick(); } catch(e){}
      };
      reader.readAsDataURL(file);
    });
  };

  const handleInputPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setChatAttachments((prev) => [...prev, ev.target.result].slice(0, 8));
            try { soundFx.buttonClick(); } catch(e){}
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleRemoveAttachment = (idx) => {
    setChatAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const textToSend = (inputMessage || '').trim();
    const attachList = chatAttachments;

    if (!textToSend && attachList.length === 0) return;

    const currentOrder = activeOrder;
    if (!currentOrder) return;

    let targetTicket = liveTicket || 
                       ticketSyncService.getTicketById(currentOrder.id) || 
                       ticketSyncService.getTicketById(currentOrder.orderNumber);

    if (!targetTicket) {
      targetTicket = ticketSyncService.createTicket({
        orderId: currentOrder.id || currentOrder.orderNumber,
        buyerUser: currentUser || currentOrder.robloxUser,
        items: currentOrder.items,
        total: currentOrder.total,
        pinCode: currentOrder.pinCode,
        paymentMethod: currentOrder.paymentMethod
      });
    }

    if (!targetTicket) return;

    try { soundFx.chatMessageSent(); } catch(e){}
    const updated = ticketSyncService.sendMessage(targetTicket.id, {
      sender: 'buyer',
      senderName: currentUser?.name || currentOrder.robloxUser?.username || currentOrder.buyerUsername || 'Customer',
      avatar: currentUser?.avatar || currentOrder.robloxUser?.avatarUrl || currentOrder.buyerAvatar,
      text: textToSend,
      attachments: attachList,
      attachment: attachList[0] || null
    });

    if (updated) {
      setLiveTicket({ ...updated });
    }

    setInputMessage('');
    setChatAttachments([]);
  };

  const handleQuickReply = (text) => {
    const currentOrder = activeOrder;
    if (!currentOrder) return;

    let targetTicket = liveTicket || 
                       ticketSyncService.getTicketById(currentOrder.id) || 
                       ticketSyncService.getTicketById(currentOrder.orderNumber);

    if (!targetTicket) {
      targetTicket = ticketSyncService.createTicket({
        orderId: currentOrder.id || currentOrder.orderNumber,
        buyerUser: currentUser || currentOrder.robloxUser,
        items: currentOrder.items,
        total: currentOrder.total,
        pinCode: currentOrder.pinCode,
        paymentMethod: currentOrder.paymentMethod
      });
    }

    if (!targetTicket) return;

    try { soundFx.chatMessageSent(); } catch(e){}
    const updated = ticketSyncService.sendMessage(targetTicket.id, {
      sender: 'buyer',
      senderName: currentUser?.name || currentOrder.robloxUser?.username || currentOrder.buyerUsername || 'Customer',
      avatar: currentUser?.avatar || currentOrder.robloxUser?.avatarUrl || currentOrder.buyerAvatar,
      text: text
    });

    if (updated) {
      setLiveTicket({ ...updated });
    }
  };

  const handleCopyStaff = () => {
    if (staff?.robloxUsername) {
      navigator.clipboard?.writeText(staff.robloxUsername);
      setCopiedStaffName(true);
      triggerAudio('click');
      setTimeout(() => setCopiedStaffName(false), 2000);
    }
  };

  const handleCopyPin = () => {
    navigator.clipboard?.writeText(liveTicket?.pinCode || activeOrder.pinCode || '8842');
    setCopiedPin(true);
    triggerAudio('click');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleOpenRobloxProfile = () => {
    triggerAudio('step');
    const url = staff?.robloxUsername
      ? `https://www.roblox.com/search/users?keyword=${encodeURIComponent(staff.robloxUsername)}`
      : 'https://www.roblox.com';
    window.open(url, '_blank', 'noreferrer');
  };

  return (
    <>
      <AnimatePresence>
        <div
          data-lenis-prevent="true" className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
        >
          <div className="fixed inset-0" onClick={closeOrderTracking} />

          <motion.div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden overscroll-contain z-10 flex flex-col"
          >
            {/* Top Bar */}
            <div className="p-4 sm:p-5 border-b border-gs-border bg-gs-raised/60 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-heading font-black text-base sm:text-lg text-white uppercase tracking-tight">
                      Order #{activeOrder?.orderNumber || activeOrder?.id} • Live Ticket Hub
                    </h2>
                    {isUnclaimed ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                        <span>AWAITING STAFF CLAIM</span>
                      </span>
                    ) : liveTicket?.status === 'DELIVERED' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        DELIVERED &amp; PROOF VERIFIED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        STAFF CLAIMED &amp; ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gs-muted font-sans mt-0.5">
                    Buyer: <strong className="text-emerald-400 font-mono">@{activeOrder.robloxUser?.username || 'Player'}</strong> • Escrow Protected
                  </p>
                </div>
              </div>

              <button
                onClick={closeOrderTracking}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white hover:bg-gs-card transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

                        {/* Multi-Order Live Switcher Bar (When multiple concurrent orders exist) */}
            {ongoingOrders && ongoingOrders.length > 1 && (
              <div className="px-4 py-2 bg-[#090a0f] border-b border-gs-border flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
                <span className="text-[10px] font-mono text-gs-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Your Active Orders ({ongoingOrders.length}):</span>
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {ongoingOrders.map((ord) => {
                    const isCurrent = ord.id === activeOrder.id || ord.orderNumber === activeOrder.orderNumber;
                    return (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => {
                          triggerAudio('click');
                          setActiveOrder(ord);
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-500 text-black shadow-glow-success font-black'
                            : 'bg-gs-raised text-gs-muted hover:text-white border border-gs-border hover:border-emerald-500/40'
                        }`}
                      >
                        <span>{ord.orderNumber || ord.id}</span>
                        <span className="text-[10px] opacity-80 font-sans font-normal truncate max-w-[100px]">
                          ({ord.items?.[0]?.name || ord.item || 'Item'})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5-Stage Tracker */}
            <div className="px-4 py-3 border-b border-gs-border/60 bg-[#08090d] shrink-0">
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {STAGES.map((s) => {
                  const isDone = currentStep >= s.step;
                  const isCurrent = currentStep === s.step;
                  return (
                    <div key={s.step} className="flex flex-col items-center text-center">
                      <div
                        className={`w-full h-1.5 rounded-full mb-1.5 transition-all duration-500 ${
                          isDone
                            ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
                            : 'bg-gs-raised'
                        }`}
                      />
                      <span
                        className={`text-[9px] sm:text-[11px] font-heading font-bold uppercase truncate max-w-full ${
                          isCurrent
                            ? 'text-white font-black'
                            : isDone
                            ? 'text-emerald-400'
                            : 'text-gs-muted'
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
              
              {/* LEFT SIDEBAR: Staff & Order Details (4 cols) */}
              <div className="md:col-span-4 p-4 sm:p-5 border-r border-gs-border bg-gs-raised/30 flex flex-col justify-between overflow-y-auto space-y-4" data-lenis-prevent="true">
                
                {/* Staff Card or Dispatching Radar */}
                {staff ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-2xl bg-gs-card border border-emerald-500/40 shadow-glow-success space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={staff.avatar}
                          alt={staff.name}
                          className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 bg-gs-raised"
                        />
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-gs-card animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-sm text-white">{staff.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {staff.badge || 'STAFF'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gs-muted font-sans">{staff.role}</div>
                        <div className="text-[10px] text-amber-400 font-mono font-semibold flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{staff.rating || '5.0★'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Staff Roblox Handle */}
                    <div className="pt-2 border-t border-gs-border/60">
                      <div className="text-[10px] font-heading font-bold uppercase text-gs-muted mb-1">
                        Staff Roblox Username:
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-xl bg-gs-raised border border-gs-border">
                        <span className="text-xs font-mono font-bold text-emerald-400 truncate">
                          @{staff.robloxUsername}
                        </span>
                        <button
                          onClick={handleCopyStaff}
                          className="px-2 py-1 rounded-lg bg-gs-card text-[10px] font-mono text-white flex items-center gap-1 hover:border-gs-primary border border-gs-border transition-colors"
                        >
                          {copiedStaffName ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gs-muted" />}
                          <span>{copiedStaffName ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-950/20 to-black border border-amber-500/30 text-center space-y-3">
                    <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                      <span className="absolute inset-0 rounded-full border-2 border-amber-400/40 animate-ping" />
                      <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
                        <Radio className="w-5 h-5 animate-pulse" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-heading font-bold text-xs text-white uppercase tracking-wider">
                        Dispatching to Staff Hub
                      </h4>
                      <p className="text-[11px] text-gs-muted font-sans mt-0.5">
                        Broadcasted to live delivery specialists • Waiting: <strong className="text-amber-400 font-mono">{radarSeconds}s</strong>
                      </p>
                    </div>
                  </div>
                )}

                {/* Anti-Scam Verification PIN */}
                <div className="p-3.5 rounded-2xl bg-gs-card border border-gs-border space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-heading font-bold uppercase text-gs-muted">
                      Anti-Scam Handshake PIN
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      SECURE ESCROW
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-gs-raised border border-gs-border">
                    <span className="text-lg font-mono font-black text-gs-primary-glow tracking-widest">
                      #{liveTicket?.pinCode || activeOrder.pinCode || activeOrder.verificationPin || '8842'}
                    </span>
                    <button
                      onClick={handleCopyPin}
                      className="px-2.5 py-1 rounded-lg bg-gs-card text-[10px] font-mono text-white flex items-center gap-1 hover:border-gs-primary border border-gs-border transition-colors cursor-pointer"
                    >
                      {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gs-muted" />}
                      <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-gs-muted font-sans leading-tight">
                    Verify this 4-digit code in chat with your staff agent before accepting the in-game trade.
                  </p>
                </div>

                {/* Order Items */}
                <div className="p-3.5 rounded-2xl bg-gs-card/80 border border-gs-border space-y-2">
                  <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light flex items-center justify-between">
                    <span>Order Items ({activeOrder.items?.length || 1})</span>
                    <span className="font-mono text-emerald-400 font-black">{formatPrice(activeOrder.total)}</span>
                  </div>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1" data-lenis-prevent="true">
                    {activeOrder.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg bg-gs-raised/60 text-xs">
                        <img src={item.image} alt={item.name} className="w-7 h-7 rounded-md object-contain bg-gs-card border border-gs-border shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-heading font-bold text-white text-[11px] truncate">{item.name}</div>
                          <div className="text-[10px] text-gs-muted font-mono">Qty: {item.quantity || 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT MAIN: Real 2-Way Live Chat (8 cols) */}
              <div className="md:col-span-8 flex flex-col justify-between h-full bg-[#0a0b0f] overflow-hidden">
                
                {/* Message Feed */}
                <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 overscroll-contain" data-lenis-prevent="true">
                  {liveTicket?.messages?.map((msg) => {
                    const isStaff = msg.sender === 'staff';
                    const isBuyer = msg.sender === 'buyer';
                    const isSystem = msg.sender === 'system';

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center my-2">
                          <div className="px-3 py-1 rounded-full bg-gs-raised border border-gs-border text-[10px] font-mono text-gs-muted flex items-center gap-1.5 shadow-sm text-center">
                            <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{msg.text}</span>
                            <span className="text-gs-muted/60">• {msg.timestamp}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isBuyer ? 'justify-end' : 'justify-start'}`}
                      >
                        {isStaff && (
                          <img
                            src={msg.avatar || staff?.avatar}
                            alt={msg.senderName}
                            className="w-8 h-8 rounded-xl object-cover bg-gs-raised border border-gs-border shrink-0 mb-1"
                          />
                        )}

                        <div className={`max-w-[85%] space-y-1.5 ${isBuyer ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans text-gs-muted">
                            <span className="font-heading font-bold text-white">{msg.senderName}</span>
                            {isStaff && (
                              <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                STAFF
                              </span>
                            )}
                            <span>• {msg.timestamp}</span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed shadow-md ${
                              isBuyer
                                ? 'bg-gs-primary text-white rounded-br-none'
                                : 'bg-gs-card border border-gs-border text-gs-light rounded-bl-none'
                            }`}
                          >
                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                            {/* Render Image Attachments Gallery */}
                            {((msg.attachments && msg.attachments.length > 0) || msg.attachment) && (
                              <div className={`mt-2.5 gap-2 ${
                                (msg.attachments?.length || (msg.attachment ? 1 : 0)) > 1
                                  ? 'grid grid-cols-2 sm:grid-cols-3'
                                  : 'flex flex-col'
                              }`}>
                                {(msg.attachments || [msg.attachment]).map((imgSrc, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    onClick={() => setPreviewImage(imgSrc)}
                                    className="relative group/img overflow-hidden rounded-xl border border-white/20 bg-black/40 cursor-pointer shadow-md transition-transform hover:scale-[1.02]"
                                  >
                                    <img
                                      src={imgSrc}
                                      alt={`Attachment ${imgIdx + 1}`}
                                      className="w-full max-h-48 object-cover rounded-xl"
                                    />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-[11px] font-mono font-bold transition-opacity">
                                      🔍 Click to Enlarge
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Embedded Actions: Copy Roblox Handle & Open Profile */}
                            {msg.hasActions && staff?.robloxUsername && (
                              <div className="mt-3 pt-2.5 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <button
                                  onClick={handleCopyStaff}
                                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition-all"
                                >
                                  {copiedStaffName ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span>{copiedStaffName ? 'Copied @' + staff.robloxUsername : 'Copy @' + staff.robloxUsername}</span>
                                </button>

                                <button
                                  onClick={handleOpenRobloxProfile}
                                  className="px-3 py-2 rounded-xl bg-gs-raised hover:bg-gs-raised/80 text-white font-heading font-bold text-[11px] flex items-center justify-center gap-1.5 border border-gs-border transition-colors"
                                >
                                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Find on Roblox</span>
                                  <ExternalLink className="w-3 h-3 text-gs-muted" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isBuyer && (
                          <img
                            src={msg.avatar || currentUser?.avatar}
                            alt="Buyer Avatar"
                            className="w-8 h-8 rounded-xl object-cover bg-gs-raised border border-gs-border shrink-0 mb-1"
                          />
                        )}
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Bottom Chat Controls */}
                <div className="p-3 sm:p-4 border-t border-gs-border bg-gs-raised/60 space-y-2.5 shrink-0">
                  {/* Quick Replies with Horizontal Mouse-Wheel Scrolling */}
                  {liveTicket?.status !== 'DELIVERED' && (
                    <div
                      onWheel={(e) => {
                        if (e.deltaY !== 0) {
                          e.currentTarget.scrollLeft += e.deltaY;
                        }
                      }}
                      className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none overscroll-contain select-none cursor-grab"
                    >
                      {QUICK_REPLIES.map((chip, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleQuickReply(chip)}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-gs-card hover:bg-white/10 active:scale-95 border border-gs-border hover:border-gs-primary/60 text-xs font-sans text-gs-light transition-all whitespace-nowrap cursor-pointer shadow-sm hover:text-white"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Status Banner */}
                  {liveTicket?.status !== 'DELIVERED' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
                      <div className="text-[11px] font-sans text-emerald-300">
                        In-game trade in progress. Your staff agent will upload the trade proof screenshot once handed over in-game.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Delivered Banner */}
                      <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="text-xs text-emerald-400 font-heading font-bold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          <span>Order Completed &amp; Staff In-Game Trade Verified!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowReceipt(true)}
                          className="btn-primary px-4 py-1.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 cursor-pointer shadow-glow-primary"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>View Proof Screenshot</span>
                        </button>
                      </div>

                      {/* Interactive Star Rating & Review Box */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-gs-card via-gs-raised to-gs-card border border-amber-500/40 shadow-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <h4 className="font-heading font-black text-xs sm:text-sm text-white uppercase tracking-wide">
                              {existingReview ? 'Your Verified Trade Review' : 'Rate Your Delivery Experience'}
                            </h4>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            {existingReview ? '✅ PUBLISHED ON STORE' : '⭐ 5-STAR VOUCH'}
                          </span>
                        </div>

                        {existingReview ? (
                          <div className="p-3 rounded-xl bg-black/40 border border-amber-500/30 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${s <= existingReview.stars ? 'fill-amber-400 text-amber-400' : 'text-gs-muted'}`}
                                  />
                                ))}
                                <span className="text-xs font-mono font-bold text-white ml-1">
                                  {existingReview.stars}.0 / 5.0
                                </span>
                              </div>
                              <span className="text-[10px] text-gs-muted font-mono">{existingReview.date}</span>
                            </div>
                            <p className="text-xs text-gs-light font-sans italic">
                              "{existingReview.comment}"
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleSubmitReview} className="space-y-2.5">
                            {/* Interactive Star Selector */}
                            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-gs-border">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() => { setRatingStars(star); soundFx.ratingStar(star); }}
                                    onMouseEnter={() => { setHoverStars(star); soundFx.ratingStar(star); }}
                                    onMouseLeave={() => setHoverStars(0)}
                                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                  >
                                    <Star
                                      className={`w-5 h-5 transition-colors ${
                                        star <= (hoverStars || ratingStars)
                                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                                          : 'text-gs-muted/40'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                              <span className="text-xs font-heading font-black text-amber-300">
                                {ratingStars === 5 ? '⭐⭐⭐⭐⭐ Outstanding (<30s)' :
                                 ratingStars === 4 ? '⭐⭐⭐⭐ Great' :
                                 ratingStars === 3 ? '⭐⭐⭐ Good' :
                                 ratingStars === 2 ? '⭐⭐ Fair' : '⭐ Poor'}
                              </span>
                            </div>

                            {/* Quick Tags */}
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                              {[
                                '⚡ Instant Bot Delivery',
                                '🤝 Super Friendly Agent',
                                '🔒 100% Safe Escrow',
                                '💎 Best Price Guaranteed',
                                '🔥 Legit & Fast'
                              ].map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  onClick={() => { setSelectedTag(tag); setReviewComment(prev => prev ? `${prev} • ${tag}` : tag); triggerAudio('click'); }}
                                  className={`shrink-0 px-2 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                                    selectedTag === tag
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                      : 'bg-gs-raised text-gs-muted hover:text-white border border-gs-border'
                                  }`}
                                >
                                  {tag}
                                </button>
                              ))}
                            </div>

                            {/* Review Text Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                placeholder="Write a quick comment... (e.g. Agent delivered in 20s, very polite!)"
                                className="flex-1 bg-gs-card border border-gs-border rounded-xl px-3.5 py-2 text-xs text-white placeholder-gs-muted focus:outline-none focus:border-amber-500 transition-colors font-sans"
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all cursor-pointer shrink-0"
                              >
                                Submit Review ⭐
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Multi-Attachment Preview Strip */}
                  {chatAttachments && chatAttachments.length > 0 && (
                    <div className="mb-2 p-2 rounded-2xl bg-black/60 border border-gs-primary/40 space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <span>Attached Screenshots ({chatAttachments.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setChatAttachments([])}
                          className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {chatAttachments.map((img, idx) => (
                          <div key={idx} className="relative group/thumb shrink-0">
                            <img
                              src={img}
                              alt={`Attachment ${idx + 1}`}
                              className="w-14 h-14 object-cover rounded-xl border border-white/20"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(idx)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold shadow-md hover:bg-red-500 transition-colors cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locked Notice or Live Chat Input Form */}
                  {liveTicket?.status === 'DELIVERED' ? (
                    <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-emerald-500/30 flex items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2.5 text-xs text-gs-muted font-sans min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-heading font-black text-white text-xs flex items-center gap-1.5">
                            <span>Trade Finalized &amp; Chat Locked</span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">CLOSED</span>
                          </p>
                          <p className="text-[11px] text-gs-muted truncate">
                            This order has been verified and archived. For new inquiries, contact support.
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://discord.gg/tanstock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-[#5865F2]/20 hover:bg-[#5865F2]/30 text-[#5865F2] border border-[#5865F2]/40 font-heading font-bold text-[11px] flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <span>Discord 24/7</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Hidden Multi-File Input */}
                    <input
                      type="file"
                      ref={attachmentInputRef}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAttachmentFiles(e.target.files);
                        }
                        e.target.value = '';
                      }}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />

                    {/* Multi-Attachment Button */}
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      title="Attach screenshots (supports multiple images or Ctrl+V paste)"
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 border ${
                        chatAttachments.length > 0
                          ? 'bg-gs-primary/20 border-gs-primary text-emerald-400'
                          : 'bg-gs-card hover:bg-white/10 text-gs-muted hover:text-white border-gs-border hover:border-gs-primary'
                      }`}
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onPaste={handleInputPaste}
                      placeholder={staff ? `Message ${staff.name}... (e.g. "I sent you a friend request", or Ctrl+V images)` : "Type a message or paste screenshots..."}
                      className="flex-1 bg-gs-card border border-gs-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gs-muted focus:outline-none focus:border-gs-primary transition-colors font-sans"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim() && chatAttachments.length === 0}
                      className="p-2.5 rounded-xl bg-gs-primary hover:bg-gs-primary-glow disabled:opacity-40 text-white shadow-glow-primary transition-all shrink-0 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                  )}
                </div>

              </div>

            </div>
          </motion.div>
        </div>
      </AnimatePresence>

            {/* Full-screen Image Preview Lightbox */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          data-lenis-prevent="true" className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={previewImage} alt="Enlarged Screenshot" className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-black/80 text-white border border-white/30 hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded PhotoProofReceipt */}
      {showReceipt && (
        <PhotoProofReceipt order={liveTicket || activeOrder} onClose={() => setShowReceipt(false)} />
      )}
    </>
  );
}
