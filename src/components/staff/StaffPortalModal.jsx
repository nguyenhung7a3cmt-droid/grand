import { staffAudioAlerts } from '../../utils/staffAudioAlerts';
import { soundFx } from '../../utils/soundFx';
import CountryFlag from '../common/CountryFlag';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  MessageSquare,
  FileText,
  AlertCircle,
  Headphones,
  Gamepad2,
  Layers,
  CheckCheck,
  ArrowRight,
  Upload,
  Image as ImageIcon,
  Camera,
  Paperclip,
  Trash2,
  RotateCcw,
  Share2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useStore } from '../../context/StoreContext';
import { ticketSyncService } from '../../services/ticketSyncService';
import { proofService } from '../../services/proofService';

const STAFF_MACROS = [
  "Hello! Please add my Roblox account so we can trade 👍",
  "I am online in-game right now! Join me at the trade table 🎮",
  "Trade request sent in-game! Please click accept 🤝",
  "Trade PIN verified! Depositing your items now 🔑",
  "Trade complete! Uploading proof screenshot to your ticket now ⭐"
];

export default function StaffPortalModal() {
  const {
    currentUser,
    users,
    isStaff,
    isStaffPortalOpen,
    closeStaffPortal,
    selectedStaffTicketId
  } = useAuth();

  const { formatPrice, triggerAudio } = useStore();
  const dialog = useDialog();

  const [tickets, setTickets] = useState([]);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [inputMsg, setInputMsg] = useState('');
  const [staffChatAttachments, setStaffChatAttachments] = useState([]);
  const [staffChatPreview, setStaffChatPreview] = useState(null);
  const staffFileInputRef = useRef(null);
  const [copiedBuyer, setCopiedBuyer] = useState(false);
  const [activeTab, setActiveTab] = useState('unclaimed'); // 'unclaimed' | 'active' | 'completed'
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState(true);

  const toggleSoundAlerts = () => {
    setSoundAlertsEnabled(prev => !prev);
    triggerAudio?.('click');
  };

  // Proof Upload Dialog State
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [proofImage, setProofImage] = useState(null);
  const [proofNotes, setProofNotes] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Load and listen for real-time ticket updates
  useEffect(() => {
    if (!isStaffPortalOpen) return;
    setTickets(ticketSyncService.getAllTickets());

    const unsubscribe = ticketSyncService.subscribe((event) => {
      setTickets(ticketSyncService.getAllTickets());
      if (event.type === 'TICKET_CREATED') {
        triggerAudio('step');
      } else if (event.type === 'TICKET_CLAIMED' || event.type === 'MESSAGE_SENT') {
        triggerAudio('click');
      }
    });

    return () => unsubscribe();
  }, [isStaffPortalOpen, triggerAudio]);

  // Auto-select initial ticket if opened from direct link
  useEffect(() => {
    if (selectedStaffTicketId) {
      setSelectedTicketId(selectedStaffTicketId);
      const target = ticketSyncService.getTicketById(selectedStaffTicketId);
      if (target) {
        if (target.status === 'UNCLAIMED') setActiveTab('unclaimed');
        else if (target.status === 'DELIVERED') setActiveTab('completed');
        else setActiveTab('active');
      }
    }
  }, [selectedStaffTicketId]);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId) || null;

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedTicket?.messages]);

  if (!isStaff || !isStaffPortalOpen) return null;

  const unclaimedTickets = tickets.filter(t => t.status === 'UNCLAIMED');
  const myActiveTickets = tickets.filter(
    t => (t.status === 'CLAIMED' || t.status === 'IN_GAME_TRADE')
  );
  const completedTickets = tickets.filter(t => t.status === 'DELIVERED');

  // Staff Claims an Unclaimed Ticket
  const handleClaimTicket = (ticketId) => {
    if (!currentUser) return;
    const updated = ticketSyncService.claimTicket(ticketId, currentUser);
    if (updated) {
      triggerAudio('success');
      setSelectedTicketId(ticketId);
      setActiveTab('active');
    }
  };

  // Staff Releases a Claimed Ticket back to Unclaimed Queue
  const handleUnclaimTicket = async (ticketId) => {
    const reason = await dialog.prompt({
      title: 'Release Ticket',
      message: 'Reason for releasing ticket back to unclaimed queue:',
      defaultValue: 'Need backup / switching games',
      placeholder: 'e.g. Need backup or switching trade servers',
      confirmText: 'Release to Queue',
      variant: 'warning'
    });
    if (reason !== null && reason !== false) {
      ticketSyncService.unclaimTicket(ticketId, currentUser, String(reason).trim() || 'Agent released ticket');
      triggerAudio('click');
      setSelectedTicketId(null);
      setActiveTab('unclaimed');
    }
  };

  // Staff Transfers Ticket to another staff member
  const handleTransferTicket = async (ticketId) => {
    const availableStaff = users.filter(u => (u.role === 'staff' || u.role === 'admin') && u.id !== currentUser.id);
    if (availableStaff.length === 0) {
      await dialog.alert({
        title: 'No Staff Available',
        message: 'There are currently no other registered staff members available to receive this transfer.',
        confirmText: 'Understood',
        variant: 'info'
      });
      return;
    }
    const staffNames = availableStaff.map((s, i) => `${i + 1}. ${s.name} (@${s.robloxUsername})`).join('\n');
    const pick = await dialog.prompt({
      title: 'Reassign Ticket Specialist',
      message: `Select staff number to transfer ticket to:\n\n${staffNames}`,
      defaultValue: '1',
      placeholder: 'Enter number (e.g. 1)',
      confirmText: 'Transfer Ticket',
      variant: 'primary'
    });
    if (pick) {
      const idx = parseInt(pick, 10) - 1;
      if (availableStaff[idx]) {
        ticketSyncService.transferTicket(ticketId, currentUser, availableStaff[idx], 'Reassigned to specialist');
        triggerAudio('success');
        setSelectedTicketId(null);
      }
    }
  };

  const handleStaffChatFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    fileList.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        setStaffChatAttachments((prev) => [...prev, ev.target.result].slice(0, 8));
        try { triggerAudio('click'); } catch(e){}
      };
      reader.readAsDataURL(file);
    });
  };

  const handleStaffChatPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setStaffChatAttachments((prev) => [...prev, ev.target.result].slice(0, 8));
            try { triggerAudio('click'); } catch(e){}
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleRemoveStaffAttachment = (idx) => {
    setStaffChatAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    const textToSend = (inputMsg || '').trim();
    const attachList = staffChatAttachments;

    if (!textToSend && attachList.length === 0) return;
    if (!selectedTicket) return;

    // Auto-claim ticket if sending message on an unclaimed ticket
    if (selectedTicket.status === 'UNCLAIMED') {
      ticketSyncService.claimTicket(selectedTicket.id, currentUser || { name: 'Staff Agent', robloxUsername: 'GS_Staff' });
    }

    const staffName = currentUser?.name || 'Staff Agent';
    const staffAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const staffBadge = currentUser?.role === 'admin' ? 'LEAD ADMIN' : 'VERIFIED STAFF';

    try { soundFx.chatMessageSent(); } catch(e){}
    const updated = ticketSyncService.sendMessage(selectedTicket.id, {
      sender: 'staff',
      senderName: staffName,
      avatar: staffAvatar,
      badge: staffBadge,
      text: textToSend,
      attachments: attachList,
      attachment: attachList[0] || null,
      hasActions: textToSend.toLowerCase().includes('add') || textToSend.toLowerCase().includes('roblox')
    });

    if (updated) {
      setTickets(ticketSyncService.getAllTickets());
    }

    setInputMsg('');
    setStaffChatAttachments([]);
  };

  const handleSendMacro = (macroText) => {
    if (!selectedTicket) return;
    const staffUsername = currentUser?.robloxUsername || 'GS_Staff';
    const textWithHandle = macroText.includes('@GS_Staff')
      ? macroText.replace('@GS_Staff', `@${staffUsername}`)
      : macroText;

    // Auto-claim ticket if sending macro on an unclaimed ticket
    if (selectedTicket.status === 'UNCLAIMED') {
      ticketSyncService.claimTicket(selectedTicket.id, currentUser || { name: 'Staff Agent', robloxUsername: staffUsername });
    }

    const staffName = currentUser?.name || 'Staff Agent';
    const staffAvatar = currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const staffBadge = currentUser?.role === 'admin' ? 'LEAD ADMIN' : 'VERIFIED STAFF';

    try { soundFx.chatMessageSent(); } catch(e){}
    const updated = ticketSyncService.sendMessage(selectedTicket.id, {
      sender: 'staff',
      senderName: staffName,
      avatar: staffAvatar,
      badge: staffBadge,
      text: textWithHandle,
      hasActions: true
    });

    if (updated) {
      setTickets(ticketSyncService.getAllTickets());
    }
  };

  // Open Proof Upload Dialog
  const handleOpenProofModal = () => {
    setProofImage(null);
    setUploadError(null);
    setProofNotes(`Hand-delivered to @${selectedTicket?.buyer?.robloxUsername} in ${selectedTicket?.game || 'Roblox'}. Trade PIN #${selectedTicket?.pinCode} verified.`);
    setIsProofModalOpen(true);
    triggerAudio('click');
  };

  // Handle File Upload from Staff's Computer
  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setProofImage(e.target.result);
      triggerAudio('click');
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste Support (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        handleFileUpload(blob);
        break;
      }
    }
  };

  // Submit Completed Delivery with Staff's Actual Uploaded Attachment Proof
  const handleSubmitProofDelivery = () => {
    if (!selectedTicket) return;
    if (!proofImage) {
      setUploadError('You must upload an in-game screenshot attachment before completing the order.');
      triggerAudio('error');
      return;
    }

    const finalNotes = proofNotes.trim() || `In-game trade verified and delivered to @${selectedTicket.buyer?.robloxUsername}.`;

    const updated = ticketSyncService.markDelivered(
      selectedTicket.id,
      currentUser,
      proofImage,
      finalNotes
    );

    if (updated) {
      proofService.createProofFromTicket(updated, proofImage, finalNotes);
      triggerAudio('success');
      setIsProofModalOpen(false);
      setActiveTab('completed');
    }
  };

  const handleCopyBuyer = (robloxName) => {
    navigator.clipboard?.writeText(robloxName);
    setCopiedBuyer(true);
    triggerAudio('click');
    setTimeout(() => setCopiedBuyer(false), 2000);
  };

  return (
    <>
      <AnimatePresence>
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md"
        >
          <div className="fixed inset-0" onClick={closeStaffPortal} />

          <motion.div
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl h-[92vh] max-h-[92vh] overflow-hidden z-10 flex flex-col"
          >
            {/* Top Bar */}
            <div className="p-4 sm:p-5 border-b border-gs-border bg-gs-raised/80 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-success">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase">
                      Live Staff Ticket Dispatch &amp; Claiming Hub
                    </h2>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE QUEUE
                    </span>
                  </div>
                  <p className="text-xs text-gs-muted">
                    Logged in as: <strong className="text-white font-heading">{currentUser?.name}</strong> (Roblox: <strong className="text-emerald-400 font-mono">@{currentUser?.robloxUsername || 'GS_Staff'}</strong>)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Audible Chimes Toggle */}
                <button
                  type="button"
                  onClick={toggleSoundAlerts}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-heading font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    soundAlertsEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm'
                      : 'bg-gs-card text-gs-muted border-gs-border hover:text-white'
                  }`}
                  title="Toggle Audible Chimes for New Orders & Messages"
                >
                  {soundAlertsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundAlertsEnabled ? 'Sound Alerts: ON' : 'Muted'}</span>
                </button>

                <button
                  onClick={closeStaffPortal}
                  className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main 2-Column Split Workspace */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
              
              {/* LEFT: Ticket Queue Sidebar (4 cols) */}
              <div className="md:col-span-4 p-4 border-r border-gs-border bg-[#090a0e] flex flex-col justify-between overflow-hidden">
                
                {/* Queue Tab Selector */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-gs-raised/60 border border-gs-border rounded-xl mb-3 shrink-0">
                  <button
                    onClick={() => { setActiveTab('unclaimed'); triggerAudio('click'); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'unclaimed'
                        ? 'bg-gs-primary text-white shadow-glow-primary'
                        : 'text-gs-muted hover:text-white'
                    }`}
                  >
                    <span>Unclaimed</span>
                    {unclaimedTickets.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-white text-gs-primary font-mono text-[9px] font-black animate-pulse">
                        {unclaimedTickets.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => { setActiveTab('active'); triggerAudio('click'); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      activeTab === 'active'
                        ? 'bg-emerald-500 text-black font-black shadow-glow-success'
                        : 'text-gs-muted hover:text-white'
                    }`}
                  >
                    <span>My Active</span>
                    <span className="font-mono text-[9px]">({myActiveTickets.length})</span>
                  </button>

                  <button
                    onClick={() => { setActiveTab('completed'); triggerAudio('click'); }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-heading font-bold uppercase tracking-wider transition-all ${
                      activeTab === 'completed'
                        ? 'bg-purple-600 text-white font-black'
                        : 'text-gs-muted hover:text-white'
                    }`}
                  >
                    <span>Resolved</span>
                    <span className="font-mono text-[9px]">({completedTickets.length})</span>
                  </button>
                </div>

                {/* Ticket Cards List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 overscroll-contain" data-lenis-prevent="true">
                  {activeTab === 'unclaimed' && unclaimedTickets.length === 0 && (
                    <div className="p-8 text-center text-gs-muted space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-70" />
                      <p className="text-xs font-sans">Queue is clear! All customer tickets are currently claimed.</p>
                    </div>
                  )}

                  {activeTab === 'active' && myActiveTickets.length === 0 && (
                    <div className="p-8 text-center text-gs-muted space-y-2">
                      <Layers className="w-8 h-8 text-gs-muted mx-auto opacity-50" />
                      <p className="text-xs font-sans">You have no active claimed tickets. Claim one from Unclaimed!</p>
                    </div>
                  )}

                  {activeTab === 'completed' && completedTickets.length === 0 && (
                    <div className="p-8 text-center text-gs-muted space-y-2">
                      <FileText className="w-8 h-8 text-gs-muted mx-auto opacity-50" />
                      <p className="text-xs font-sans">No completed deliveries yet today.</p>
                    </div>
                  )}

                  {(activeTab === 'unclaimed' ? unclaimedTickets : activeTab === 'active' ? myActiveTickets : completedTickets).map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    const firstItem = ticket.items?.[0];
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => { setSelectedTicketId(ticket.id); triggerAudio('click'); }}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                          isSelected
                            ? 'bg-gs-raised border-gs-primary shadow-glow-primary'
                            : 'bg-gs-card border-gs-border hover:border-gs-border/90'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-black text-xs text-white uppercase">
                            {ticket.orderId}
                          </span>
                          <div className="flex items-center gap-1">
                            {ticket.game && (
                              <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-gs-raised text-gs-light border border-gs-border">
                                {ticket.game}
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                              ticket.status === 'UNCLAIMED'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse'
                                : ticket.status === 'DELIVERED'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <img
                            src={ticket.buyer?.avatar}
                            alt="Buyer"
                            className="w-7 h-7 rounded-lg object-cover bg-gs-raised border border-gs-border shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-heading font-bold text-white truncate flex items-center gap-1.5">
                              <CountryFlag code={ticket.countryCode || 'VN'} name={ticket.countryName || 'Vietnam'} variant="circle" size="xs" />
                              <span>@{ticket.buyer?.robloxUsername}</span>
                            </div>
                            <div className="text-[10px] text-gs-muted truncate font-sans">
                              {firstItem?.name} {ticket.items?.length > 1 && `+ ${ticket.items.length - 1} more`}
                            </div>
                          </div>
                          <div className="font-mono font-black text-emerald-400 text-xs shrink-0">
                            {formatPrice(ticket.total)}
                          </div>
                        </div>

                        {/* Quick Claim Button on Card */}
                        {ticket.status === 'UNCLAIMED' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClaimTicket(ticket.id);
                            }}
                            className="w-full py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-[11px] uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-1"
                          >
                            <Zap className="w-3 h-3 fill-current" />
                            <span>⚡ Claim This Order</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT: Live Chat & Delivery Workspace (8 cols) */}
              <div className="md:col-span-8 flex flex-col justify-between bg-[#0b0c11] overflow-hidden">
                {selectedTicket ? (
                  <>
                    {/* Selected Ticket Top Header with Claim/Release Actions */}
                    <div className="p-3.5 sm:p-4 border-b border-gs-border bg-gs-raised/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedTicket.buyer?.avatar}
                          alt="Buyer"
                          className="w-10 h-10 rounded-xl object-cover border border-gs-border bg-gs-card"
                        />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-heading font-bold text-white text-sm flex items-center gap-1.5">
                              <CountryFlag code={selectedTicket.countryCode || 'VN'} name={selectedTicket.countryName || 'Vietnam'} variant="circle" size="sm" />
                              <span>Buyer: @{selectedTicket.buyer?.robloxUsername}</span>
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                              <CountryFlag code={selectedTicket.countryCode || 'VN'} variant="rounded" size="xs" />
                              <span>{selectedTicket.countryName || 'Vietnam'} • IP: {selectedTicket.ipMasked || selectedTicket.ipAddress || '127.0.0.1'}</span>
                            </span>
                            <button
                              onClick={() => handleCopyBuyer(selectedTicket.buyer?.robloxUsername)}
                              className="px-2 py-0.5 rounded-md bg-gs-raised text-[10px] font-mono text-gs-muted hover:text-white border border-gs-border flex items-center gap-1"
                            >
                              {copiedBuyer ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedBuyer ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                          <div className="text-[11px] text-gs-muted font-sans flex items-center gap-2 mt-0.5">
                            <span>Trade PIN: <strong className="text-gs-primary-glow font-mono">#{selectedTicket.pinCode}</strong></span>
                            <span>•</span>
                            <span>Total: <strong className="text-emerald-400 font-mono">{formatPrice(selectedTicket.total)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Claim or Release/Transfer Controls */}
                      <div className="flex items-center gap-2">
                        {selectedTicket.status === 'UNCLAIMED' ? (
                          <button
                            onClick={() => handleClaimTicket(selectedTicket.id)}
                            className="btn-primary px-5 py-2 rounded-xl text-xs font-heading font-black uppercase tracking-wider shadow-glow-primary animate-bounce flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Claim Ticket Now</span>
                          </button>
                        ) : selectedTicket.status !== 'DELIVERED' && selectedTicket.staff?.id === currentUser?.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUnclaimTicket(selectedTicket.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-heading font-bold flex items-center gap-1 transition-colors"
                              title="Release ticket back to unclaimed queue"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Release</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleTransferTicket(selectedTicket.id)}
                              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 text-xs font-heading font-bold flex items-center gap-1 transition-colors"
                              title="Transfer ticket to another online staff agent"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>Transfer</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Items to Hand Over Strip */}
                    <div className="p-2.5 px-4 bg-[#07080a] border-b border-gs-border/60 flex items-center gap-3 overflow-x-auto shrink-0 scrollbar-none">
                      <span className="text-[10px] font-heading font-bold uppercase text-gs-muted shrink-0">
                        Items to Deliver:
                      </span>
                      {selectedTicket.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gs-raised border border-gs-border text-xs shrink-0">
                          <img src={item.image} alt={item.name} className="w-5 h-5 rounded object-contain" />
                          <span className="font-heading font-bold text-white text-[11px]">{item.name}</span>
                          <span className="text-emerald-400 font-mono text-[10px]">x{item.quantity || 1}</span>
                        </div>
                      ))}
                    </div>

                    {/* Scrollable Live Chat Feed */}
                    <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 overscroll-contain" data-lenis-prevent="true">
                      {selectedTicket.messages?.map((msg) => {
                        const isMe = msg.sender === 'staff';
                        const isBuyer = msg.sender === 'buyer';
                        const isSystem = msg.sender === 'system';

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center my-2">
                              <div className="px-3 py-1 rounded-full bg-gs-raised border border-gs-border text-[10px] font-mono text-gs-muted flex items-center gap-1.5 shadow-sm">
                                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                <span>{msg.text}</span>
                                <span className="text-gs-muted/60">• {msg.timestamp}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            {isBuyer && (
                              <img
                                src={msg.avatar || selectedTicket.buyer?.avatar}
                                alt={msg.senderName}
                                className="w-8 h-8 rounded-xl object-cover bg-gs-raised border border-gs-border shrink-0 mb-1"
                              />
                            )}

                            <div className={`max-w-[85%] space-y-1.5 ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center gap-1.5 px-1 text-[10px] font-sans text-gs-muted">
                                <span className="font-heading font-bold text-white">{msg.senderName}</span>
                                {isMe && (
                                  <span className="px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    YOU (STAFF)
                                  </span>
                                )}
                                <span>• {msg.timestamp}</span>
                              </div>

                              <div
                                className={`p-3.5 rounded-2xl text-xs font-sans leading-relaxed shadow-md ${
                                  isMe
                                    ? 'bg-gs-primary text-white rounded-br-none'
                                    : 'bg-gs-card border border-gs-border text-gs-light rounded-bl-none'
                                }`}
                              >
                                {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                                {/* Render Customer / Staff Image Attachments Gallery */}
                                {((msg.attachments && msg.attachments.length > 0) || msg.attachment) && (
                                  <div className={`mt-2.5 gap-2 ${
                                    (msg.attachments?.length || (msg.attachment ? 1 : 0)) > 1
                                      ? 'grid grid-cols-2 sm:grid-cols-3'
                                      : 'flex flex-col'
                                  }`}>
                                    {(msg.attachments || [msg.attachment]).map((imgSrc, imgIdx) => (
                                      <div
                                        key={imgIdx}
                                        onClick={() => setStaffChatPreview(imgSrc)}
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
                              </div>
                            </div>

                            {isMe && (
                              <img
                                src={msg.avatar || currentUser?.avatar}
                                alt="Staff Avatar"
                                className="w-8 h-8 rounded-xl object-cover bg-gs-raised border border-gs-border shrink-0 mb-1"
                              />
                            )}
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Quick Action Staff Macros & Controls */}
                    <div className="p-3 sm:p-4 border-t border-gs-border bg-gs-raised/80 space-y-2.5 shrink-0">
                      {/* Macro Buttons with Horizontal Mouse-Wheel Scrolling */}
                      <div
                        onWheel={(e) => {
                          if (e.deltaY !== 0) {
                            e.currentTarget.scrollLeft += e.deltaY;
                          }
                        }}
                        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none overscroll-contain select-none cursor-grab"
                      >
                        {STAFF_MACROS.map((macro, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSendMacro(macro)}
                            className="shrink-0 px-3 py-1.5 rounded-xl bg-gs-card hover:bg-white/10 active:scale-95 border border-gs-border hover:border-gs-primary/60 text-xs font-sans text-gs-light truncate max-w-[240px] cursor-pointer shadow-sm hover:text-white transition-all"
                            title={macro}
                          >
                            {macro}
                          </button>
                        ))}
                      </div>

                      {/* Trade Completion & Upload Proof Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                        <div className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 pl-1">
                          <Gamepad2 className="w-4 h-4" />
                          <span>Delivering as: @{currentUser?.robloxUsername || 'GS_Staff'}</span>
                        </div>

                        {selectedTicket.status !== 'DELIVERED' ? (
                          <button
                            type="button"
                            onClick={handleOpenProofModal}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-glow-success flex items-center gap-1.5 transition-all transform hover:scale-105"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Attach Proof Screenshot &amp; Complete Order</span>
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-mono font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Delivered &amp; Screenshot Proof Published</span>
                          </span>
                        )}
                      </div>

                      {/* Staff Multi-Attachment Preview Strip */}
                      {staffChatAttachments && staffChatAttachments.length > 0 && (
                        <div className="mb-2 p-2 rounded-2xl bg-black/60 border border-purple-500/40 space-y-1.5">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-mono text-purple-300 font-bold flex items-center gap-1">
                              <span>Attached Screenshots ({staffChatAttachments.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setStaffChatAttachments([])}
                              className="text-[10px] font-mono text-red-400 hover:text-red-300 transition-colors"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {staffChatAttachments.map((img, idx) => (
                              <div key={idx} className="relative group/thumb shrink-0">
                                <img
                                  src={img}
                                  alt={`Attachment ${idx + 1}`}
                                  className="w-14 h-14 object-cover rounded-xl border border-white/20"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStaffAttachment(idx)}
                                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold shadow-md hover:bg-red-500 transition-colors cursor-pointer"
                                >
                              ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Locked Notice or Staff Chat Input Form */}
                      {selectedTicket.status === 'DELIVERED' ? (
                        <div className="p-3 rounded-2xl bg-[#0b0c11] border border-emerald-500/30 flex items-center justify-between gap-3 shadow-inner">
                          <div className="flex items-center gap-2.5 text-xs text-gs-muted font-sans min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-heading font-bold text-white text-xs">
                                Order Delivered &amp; Ticket Archived
                              </span>
                              <span className="text-[10px] text-gs-muted ml-2">
                                (Chat locked for completed transactions)
                              </span>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            VERIFIED &bull; CLOSED
                          </span>
                        </div>
                      ) : (
                        <form onSubmit={handleSendStaffMessage} className="flex items-center gap-2">
                          {/* Hidden Staff Multi-File Input */}
                          <input
                            type="file"
                            ref={staffFileInputRef}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleStaffChatFiles(e.target.files);
                              }
                              e.target.value = '';
                            }}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />

                          {/* Attachment Button */}
                          <button
                            type="button"
                            onClick={() => staffFileInputRef.current?.click()}
                            title="Attach screenshots (supports multiple images or Ctrl+V paste)"
                            className={`p-2.5 rounded-xl transition-colors cursor-pointer shrink-0 border ${
                              staffChatAttachments.length > 0
                                ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                                : 'bg-gs-card hover:bg-white/10 text-gs-muted hover:text-white border-gs-border hover:border-gs-primary'
                            }`}
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>

                          <input
                            type="text"
                            value={inputMsg}
                            onChange={(e) => setInputMsg(e.target.value)}
                            onPaste={handleStaffChatPaste}
                            placeholder={`Reply to @${selectedTicket.buyer?.robloxUsername || 'Customer'} (or paste Ctrl+V images)...`}
                            className="flex-1 bg-gs-card border border-gs-border rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gs-muted focus:outline-none focus:border-gs-primary transition-colors font-sans"
                          />
                          <button
                            type="submit"
                            disabled={!inputMsg.trim() && staffChatAttachments.length === 0}
                            className="p-2.5 rounded-xl bg-gs-primary hover:bg-gs-primary-glow disabled:opacity-40 text-white shadow-glow-primary transition-all shrink-0 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gs-muted space-y-3">
                    <Headphones className="w-12 h-12 text-gs-muted opacity-40 animate-pulse" />
                    <h3 className="font-heading font-bold text-base text-white">
                      Select a Ticket from the Queue to Claim
                    </h3>
                    <p className="text-xs max-w-sm font-sans">
                      Unclaimed tickets appear on the left in real time. Click "Claim This Order" to become the assigned delivery specialist.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Upload Proof Dialog */}
      <AnimatePresence>
        {isProofModalOpen && selectedTicket && (
          <div
            data-lenis-prevent="true"
            onPaste={handlePaste}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/95 backdrop-blur-lg"
          >
            <div className="fixed inset-0" onClick={() => setIsProofModalOpen(false)} />

            <motion.div
              data-lenis-prevent="true"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto z-10 p-5 sm:p-6 space-y-4" 
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gs-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-base sm:text-lg text-white uppercase">
                      Upload In-Game Trade Screenshot
                    </h3>
                    <p className="text-xs text-gs-muted">
                      Order #{selectedTicket.orderId} • Buyer: @{selectedTicket.buyer?.robloxUsername}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsProofModalOpen(false)}
                  className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {uploadError && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                className={`relative rounded-2xl border-2 border-dashed p-4 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-950/30'
                    : proofImage
                    ? 'border-emerald-500/50 bg-[#07080c]'
                    : 'border-gs-border hover:border-gs-primary bg-gs-raised/40'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                  accept="image/*"
                  className="hidden"
                />

                {proofImage ? (
                  <div className="space-y-2">
                    <div className="relative rounded-xl overflow-hidden max-h-60 border border-emerald-500/40 bg-black">
                      <img
                        src={proofImage}
                        alt="Proof Screenshot"
                        className="w-full h-full object-contain max-h-60"
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/80 backdrop-blur-md text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Screenshot Loaded</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-heading font-bold">
                      ✓ Screenshot ready. Click or drag to replace.
                    </p>
                  </div>
                ) : (
                  <div className="py-8 space-y-2.5">
                    <Upload className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                    <div className="font-heading font-bold text-white text-sm">
                      Upload or Paste Your In-Game Trade Screenshot
                    </div>
                    <p className="text-xs text-gs-muted">
                      Drag &amp; drop file here, click to browse, or press <strong>Ctrl + V</strong> to paste clipboard screenshot
                    </p>
                  </div>
                )}
              </div>

              {/* Trade Notes */}
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1.5">
                  Staff Delivery Notes / Handshake Log:
                </label>
                <input
                  type="text"
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="e.g. Hand-delivered in-game. Trade PIN confirmed."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
                />
              </div>

              {/* Confirm & Publish Button */}
              <div className="pt-2 border-t border-gs-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(false)}
                  className="btn-secondary px-4 py-2 rounded-xl text-xs font-heading font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProofDelivery}
                  disabled={!proofImage}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider shadow-glow-primary flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Publish Proof &amp; Finalize Delivery</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Fullscreen Lightbox */}
      {staffChatPreview && (
        <div
          onClick={() => setStaffChatPreview(null)}
          data-lenis-prevent="true" className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={staffChatPreview} alt="Enlarged Screenshot" className="max-w-full max-h-[85vh] rounded-2xl object-contain border border-white/20 shadow-2xl" />
            <button
              onClick={() => setStaffChatPreview(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-black/80 text-white border border-white/30 hover:bg-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}