import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  UserCheck,
  UserX,
  UserPlus,
  Crown,
  Search,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Star,
  Users,
  Key,
  Mail,
  Lock,
  Plus,
  Trash2,
  Tag,
  Ban,
  Clock,
  Zap,
  TrendingUp,
  Percent,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useStore } from '../../context/StoreContext';

const AVAILABLE_GAMES = [
  'Blox Fruits',
  'Murder Mystery 2',
  'Grand Piece Online',
  'Fisch',
  'Steal a Brainrot',
  'Anime Defenders'
];

export default function AdminStaffModal() {
  const {
    users,
    createStaffAccount,
    updateUserRole,
    deleteUser,
    isAdminStaffModalOpen,
    adminModalInitialTab,
    closeAdminStaffModal
  } = useAuth();

  const { triggerAudio, formatPrice } = useStore();
  const { showConfirm, showAlert } = useDialog();

  // Tabs: 'roster' | 'create' | 'coupons' | 'blacklist'
  const [activeTab, setActiveTab] = useState('coupons');
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // 1. Staff Creation State
  // ----------------------------------------------------
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRoblox, setStaffRoblox] = useState('');
  const [selectedGames, setSelectedGames] = useState(['Blox Fruits', 'Murder Mystery 2']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(null);
  const [formError, setFormError] = useState(null);

  // ----------------------------------------------------
  // 2. Dynamic Coupons State
  // ----------------------------------------------------
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('10');
  const [newCouponMinSpend, setNewCouponMinSpend] = useState('0');
  const [newCouponMaxUses, setNewCouponMaxUses] = useState('0');
  const [newCouponDuration, setNewCouponDuration] = useState('none'); // '1h'|'24h'|'3d'|'7d'|'30d'|'none'
  const [couponMsg, setCouponMsg] = useState(null);

  // ----------------------------------------------------
  // 3. Fraud Shield Blacklist State
  // ----------------------------------------------------
  const [blacklist, setBlacklist] = useState([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [banType, setBanType] = useState('roblox_username'); // 'roblox_username' | 'ip_address' | 'email'
  const [banValue, setBanValue] = useState('');
  const [banReason, setBanReason] = useState('');
  const [blacklistMsg, setBlacklistMsg] = useState(null);

  // Fetch Coupons and Blacklist when modal opens or tab switches
  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/coupons/list', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (e) {}
    setLoadingCoupons(false);
  };

  const fetchBlacklist = async () => {
    setLoadingBlacklist(true);
    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/blacklist/list', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.blacklist) setBlacklist(data.blacklist);
    } catch (e) {}
    setLoadingBlacklist(false);
  };

  useEffect(() => {
    if (isAdminStaffModalOpen) {
      if (adminModalInitialTab) {
        setActiveTab(adminModalInitialTab);
      }
      fetchCoupons();
      fetchBlacklist();
    }
  }, [isAdminStaffModalOpen, adminModalInitialTab]);

  if (!isAdminStaffModalOpen) return null;

  // ----------------------------------------------------
  // Coupon Actions
  // ----------------------------------------------------
  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    setCouponMsg(null);
    const cleanCode = newCouponCode.trim().toUpperCase();
    const discountNum = Number(newCouponDiscount);

    if (!cleanCode || isNaN(discountNum) || discountNum <= 0 || discountNum > 100) {
      setCouponMsg({ type: 'error', text: 'Please enter a valid code and discount % (1-100).' });
      triggerAudio?.('error');
      return;
    }

    let expiresInHours = 0;
    if (newCouponDuration === '1h') expiresInHours = 1;
    else if (newCouponDuration === '24h') expiresInHours = 24;
    else if (newCouponDuration === '3d') expiresInHours = 72;
    else if (newCouponDuration === '7d') expiresInHours = 168;
    else if (newCouponDuration === '30d') expiresInHours = 720;

    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/coupons/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          code: cleanCode,
          discountPct: discountNum,
          minSpend: Number(newCouponMinSpend || 0),
          maxUses: Number(newCouponMaxUses || 0),
          expiresInHours
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
        setNewCouponCode('');
        setNewCouponDiscount('10');
        setNewCouponMinSpend('0');
        setNewCouponMaxUses('0');
        setNewCouponDuration('none');
        setCouponMsg({ type: 'success', text: `✅ Promo code ${cleanCode} created successfully!` });
        triggerAudio?.('success');
      } else {
        setCouponMsg({ type: 'error', text: data.error || 'Failed to create promo code.' });
        triggerAudio?.('error');
      }
    } catch (e) {
      setCouponMsg({ type: 'error', text: e.message });
    }
  };

  const handleDeleteCoupon = async (couponId, couponCode) => {
    const confirmed = await showConfirm(
      `Delete Promo Code "${couponCode}"?`,
      'This promo code will be immediately removed from SQLite.'
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/coupons/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: couponId })
      });
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
      triggerAudio?.('click');
    } catch (e) {}
  };

  const handleToggleCoupon = async (couponId, currentActive) => {
    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/coupons/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: couponId, isActive: !currentActive })
      });
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
      triggerAudio?.('click');
    } catch (e) {}
  };

  // ----------------------------------------------------
  // Blacklist Actions
  // ----------------------------------------------------
  const handleAddBlacklist = async (e) => {
    e.preventDefault();
    setBlacklistMsg(null);
    const cleanVal = banValue.trim();
    if (!cleanVal) {
      setBlacklistMsg({ type: 'error', text: 'Please provide target username, IP, or email.' });
      triggerAudio?.('error');
      return;
    }

    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/blacklist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          type: banType,
          value: cleanVal,
          reason: banReason.trim() || 'Suspicious / Fraudulent Trading Activity',
          bannedBy: 'GrandStock Admin'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBlacklist(data.blacklist);
        setBanValue('');
        setBanReason('');
        setBlacklistMsg({ type: 'success', text: `🛡️ ${cleanVal} added to Security Fraud Blacklist!` });
        triggerAudio?.('success');
      } else {
        setBlacklistMsg({ type: 'error', text: data.error || 'Failed to blacklist target.' });
        triggerAudio?.('error');
      }
    } catch (e) {
      setBlacklistMsg({ type: 'error', text: e.message });
    }
  };

  const handleRemoveBlacklist = async (banId, banVal) => {
    const confirmed = await showConfirm(
      `Remove "${banVal}" from Blacklist?`,
      'This user/IP will regain access to checkout and the store.'
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('grandstock_jwt_token_v2');
      const res = await fetch('/api/blacklist/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: banId })
      });
      const data = await res.json();
      if (data.blacklist) setBlacklist(data.blacklist);
      triggerAudio?.('click');
    } catch (e) {}
  };

  // ----------------------------------------------------
  // Staff Creation Actions
  // ----------------------------------------------------
  const toggleGameSelection = (game) => {
    setSelectedGames(prev =>
      prev.includes(game) ? prev.filter(g => g !== game) : [...prev, game]
    );
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!staffName || !staffEmail || !staffPassword || !staffRoblox) {
      setFormError('Please fill in all staff account fields.');
      triggerAudio?.('error');
      return;
    }

    setIsSubmitting(true);
    triggerAudio?.('click');

    const res = await createStaffAccount({
      name: staffName,
      email: staffEmail,
      password: staffPassword,
      robloxUsername: staffRoblox.startsWith('GS_') ? staffRoblox : `GS_${staffRoblox}`,
      assignedGames: selectedGames
    });

    setIsSubmitting(false);

    if (res.success) {
      triggerAudio?.('success');
      setFormSuccess(`Staff account @${res.staff?.robloxUsername || staffRoblox} successfully created!`);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffRoblox('');
    } else {
      setFormError(res.error || 'Failed to create staff account.');
      triggerAudio?.('error');
    }
  };

  // Staff list filtering
  const staffMembers = (users || []).filter(u => u.role === 'staff' || u.role === 'admin');
  const filteredStaff = staffMembers.filter(s =>
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.robloxUsername || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div data-lenis-prevent="true" className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAdminStaffModal}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden z-10"
        >
          {/* Top Header */}
          <div className="p-4 sm:p-5 border-b border-gs-border bg-gs-raised/60 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary-glow shadow-glow-primary">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-wider">
                    Admin Command Hub
                  </h2>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    MASTER CONTROL
                  </span>
                </div>
                <p className="text-xs text-gs-muted font-sans">
                  Dynamic Promo Codes &bull; Anti-Scam Shield &bull; Staff Roster &bull; SQLite Engine
                </p>
              </div>
            </div>

            <button
              onClick={closeAdminStaffModal}
              className="p-2 rounded-xl bg-gs-raised hover:bg-gs-border text-gs-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-4 sm:px-6 pt-3 border-b border-gs-border bg-gs-card/90 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => { setActiveTab('coupons'); triggerAudio?.('tab'); }}
              className={`pb-3 px-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'coupons'
                  ? 'border-emerald-500 text-emerald-400 font-black'
                  : 'border-transparent text-gs-muted hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>🎟️ Promo Codes ({coupons.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('blacklist'); triggerAudio?.('tab'); }}
              className={`pb-3 px-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'blacklist'
                  ? 'border-red-500 text-red-400 font-black'
                  : 'border-transparent text-gs-muted hover:text-white'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>🛡️ Anti-Scam Shield ({blacklist.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('roster'); triggerAudio?.('tab'); }}
              className={`pb-3 px-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'roster'
                  ? 'border-gs-primary text-gs-primary-glow font-black'
                  : 'border-transparent text-gs-muted hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👥 Staff Team ({staffMembers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('create'); triggerAudio?.('tab'); }}
              className={`pb-3 px-3 font-heading font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-400 font-black'
                  : 'border-transparent text-gs-muted hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>➕ Add Staff</span>
            </button>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-6" data-lenis-prevent="true">

            {/* =================================================================== */}
            {/* TAB 1: DYNAMIC PROMO CODES / COUPONS CMS                           */}
            {/* =================================================================== */}
            {activeTab === 'coupons' && (
              <div className="space-y-6">
                {/* Create Coupon Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gs-raised/60 border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-sm text-white uppercase flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-400" />
                      <span>Create New Dynamic Promo Code</span>
                    </h3>
                    <button
                      type="button"
                      onClick={fetchCoupons}
                      className="p-1.5 rounded-lg bg-gs-card text-gs-muted hover:text-white text-xs flex items-center gap-1 border border-gs-border"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingCoupons ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {couponMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      couponMsg.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/40 text-red-300 border border-red-500/40'
                    }`}>
                      {couponMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{couponMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateCoupon} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Code Input */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">PROMO CODE</label>
                        <input
                          type="text"
                          placeholder="e.g. FLASH20, SUMMER"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-mono uppercase focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Discount % */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">DISCOUNT %</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            placeholder="10"
                            value={newCouponDiscount}
                            onChange={(e) => setNewCouponDiscount(e.target.value)}
                            className="w-full pl-3 pr-7 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-2.5 top-2 text-gs-muted text-xs font-bold">%</span>
                        </div>
                      </div>

                      {/* Min Spend */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">MIN SPEND ($)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="0 = No Min"
                          value={newCouponMinSpend}
                          onChange={(e) => setNewCouponMinSpend(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Max Uses */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">MAX USES LIMIT</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0 = Unlimited"
                          value={newCouponMaxUses}
                          onChange={(e) => setNewCouponMaxUses(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Expiry Duration Chips */}
                    <div>
                      <label className="block text-[11px] font-mono text-gs-muted mb-1.5">AUTO-EXPIRATION DURATION</label>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: '1h', label: '⏳ 1 Hour' },
                          { id: '24h', label: '⚡ 24 Hours' },
                          { id: '3d', label: '📅 3 Days' },
                          { id: '7d', label: '🗓️ 7 Days' },
                          { id: '30d', label: '📆 30 Days' },
                          { id: 'none', label: '♾️ Never Expire' }
                        ].map((dur) => (
                          <button
                            key={dur.id}
                            type="button"
                            onClick={() => setNewCouponDuration(dur.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-colors cursor-pointer border ${
                              newCouponDuration === dur.id
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold shadow-sm'
                                : 'bg-gs-card text-gs-muted hover:text-white border-gs-border'
                            }`}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-xs uppercase tracking-wider shadow-glow-emerald transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>Save &amp; Activate Promo Code</span>
                    </button>
                  </form>
                </div>

                {/* Active Coupons Table */}
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs text-gs-muted uppercase tracking-wider">
                    Active &amp; Configured Store Coupons ({coupons.length})
                  </h4>

                  {coupons.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-gs-raised/40 border border-gs-border text-center text-xs text-gs-muted">
                      No active promo codes. Create your first coupon above to reward buyers!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {coupons.map((c) => {
                        const isExpired = c.expires_at && new Date(c.expires_at).getTime() < Date.now();
                        const isMaxReached = c.max_uses > 0 && c.used_count >= c.max_uses;

                        return (
                          <div
                            key={c.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                              isExpired || isMaxReached || c.is_active === 0
                                ? 'bg-black/40 border-red-500/30 opacity-70'
                                : 'bg-gs-raised/60 border-emerald-500/30 shadow-md'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-white text-base bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                                  {c.code}
                                </span>
                                <span className="font-heading font-black text-emerald-400 text-sm">
                                  {c.discount_pct}% OFF
                                </span>
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleCoupon(c.id, Boolean(c.is_active))}
                                  className="p-1 text-gs-muted hover:text-white"
                                  title={c.is_active ? 'Disable Code' : 'Enable Code'}
                                >
                                  {c.is_active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-gs-muted" />}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteCoupon(c.id, c.code)}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40"
                                  title="Delete Promo Code"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] font-sans text-gs-muted space-y-0.5 border-t border-gs-border/60 pt-2">
                              <div className="flex justify-between">
                                <span>Uses Count:</span>
                                <strong className="text-white font-mono">{c.used_count} {c.max_uses > 0 ? `/ ${c.max_uses}` : '(Unlimited)'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Min Spend:</span>
                                <strong className="text-white font-mono">{c.min_spend > 0 ? `$${c.min_spend.toFixed(2)}` : 'None ($0)'}</strong>
                              </div>
                              <div className="flex justify-between">
                                <span>Expires:</span>
                                <strong className={isExpired ? 'text-red-400 font-mono' : 'text-emerald-400 font-mono'}>
                                  {c.expires_at ? new Date(c.expires_at).toLocaleString() : 'Never (Permanent)'}
                                </strong>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: ANTI-SCAM FRAUD SHIELD BLACKLIST                            */}
            {/* =================================================================== */}
            {activeTab === 'blacklist' && (
              <div className="space-y-6">
                {/* Add to Blacklist Box */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gs-raised/60 border border-red-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-black text-sm text-white uppercase flex items-center gap-2">
                      <Ban className="w-4 h-4 text-red-400" />
                      <span>Block Target from Checkout &amp; Store (Anti-Scam Shield)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={fetchBlacklist}
                      className="p-1.5 rounded-lg bg-gs-card text-gs-muted hover:text-white text-xs flex items-center gap-1 border border-gs-border"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingBlacklist ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {blacklistMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      blacklistMsg.type === 'success' ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/40' : 'bg-red-950/40 text-red-300 border border-red-500/40'
                    }`}>
                      {blacklistMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{blacklistMsg.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddBlacklist} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Target Type */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">TARGET TYPE</label>
                        <select
                          value={banType}
                          onChange={(e) => setBanType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-sans focus:outline-none focus:border-red-500"
                        >
                          <option value="roblox_username">🎮 Roblox Username</option>
                          <option value="ip_address">🌐 IP Address</option>
                          <option value="email">📧 Email Address</option>
                        </select>
                      </div>

                      {/* Target Value */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">VALUE TO BLOCK</label>
                        <input
                          type="text"
                          placeholder={banType === 'ip_address' ? 'e.g. 118.69.45.12' : banType === 'email' ? 'e.g. baduser@domain.com' : 'e.g. ScammerRoblox123'}
                          value={banValue}
                          onChange={(e) => setBanValue(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-mono focus:outline-none focus:border-red-500"
                        />
                      </div>

                      {/* Reason */}
                      <div>
                        <label className="block text-[11px] font-mono text-gs-muted mb-1">FRAUD REASON / NOTES</label>
                        <input
                          type="text"
                          placeholder="e.g. Chargeback threat, bot spam"
                          value={banReason}
                          onChange={(e) => setBanReason(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-sans focus:outline-none focus:border-red-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-heading font-black text-xs uppercase tracking-wider shadow-glow-primary transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block Target from Storefront</span>
                    </button>
                  </form>
                </div>

                {/* Blacklist Table */}
                <div className="space-y-3">
                  <h4 className="font-heading font-bold text-xs text-gs-muted uppercase tracking-wider">
                    Blacklisted Entities ({blacklist.length})
                  </h4>

                  {blacklist.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-gs-raised/40 border border-gs-border text-center text-xs text-gs-muted">
                      No users or IPs currently blacklisted. Your store is protected by default escrow verification.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {blacklist.map((b) => (
                        <div
                          key={b.id}
                          className="p-3.5 rounded-xl bg-gs-raised/70 border border-red-500/30 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-300 border border-red-500/40 shrink-0">
                              {b.type === 'ip_address' ? 'IP ADDRESS' : b.type === 'email' ? 'EMAIL' : 'ROBLOX USER'}
                            </span>
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-white text-sm">
                                {b.value}
                              </span>
                              <span className="text-[11px] text-gs-muted font-sans ml-2">
                                &bull; {b.reason || 'Fraud Flag'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-mono text-gs-muted">
                              {new Date(b.created_at).toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveBlacklist(b.id, b.value)}
                              className="px-2.5 py-1 rounded-lg bg-gs-card hover:bg-white/10 text-red-400 hover:text-red-300 border border-gs-border text-xs font-heading font-bold"
                            >
                              Unban
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: STAFF ROSTER & PERFORMANCE LEADERBOARD                     */}
            {/* =================================================================== */}
            {activeTab === 'roster' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gs-muted absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search staff by name, Roblox username, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-gs-raised border border-gs-border text-xs text-white placeholder:text-gs-muted focus:outline-none focus:border-gs-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredStaff.map((st) => (
                    <div
                      key={st.id}
                      className="p-4 rounded-2xl bg-gs-raised/70 border border-gs-border flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={st.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={st.name}
                          className="w-11 h-11 rounded-xl object-cover border border-gs-border shrink-0 bg-gs-card"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-black text-white text-sm truncate">
                              {st.name}
                            </span>
                            {st.isOwner ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5">
                                <Crown className="w-2.5 h-2.5" />
                                <span>OWNER</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                                STAFF
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gs-primary-glow font-mono font-bold truncate">
                            @{st.robloxUsername}
                          </div>
                          <div className="text-[11px] text-gs-muted font-sans truncate">
                            {st.email}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 space-y-1">
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          {st.tradesCompleted || 0} Trades
                        </div>
                        <div className="text-[10px] text-amber-400 font-mono flex items-center justify-end gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{st.rating || '5.0★'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 4: ADD STAFF ACCOUNT                                           */}
            {/* =================================================================== */}
            {activeTab === 'create' && (
              <div className="max-w-xl mx-auto space-y-4">
                <form onSubmit={handleCreateStaff} className="p-5 rounded-2xl bg-gs-raised/60 border border-gs-border space-y-4">
                  <h3 className="font-heading font-black text-base text-white uppercase flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-blue-400" />
                    <span>Create Dedicated Staff Account</span>
                  </h3>

                  {formSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {formError && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-heading font-bold text-white mb-1">Staff Member Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Agent Alex"
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white focus:outline-none focus:border-gs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold text-white mb-1">Staff Email Login</label>
                      <input
                        type="email"
                        placeholder="alex@grandstock.net"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white focus:outline-none focus:border-gs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold text-white mb-1">Temporary Password</label>
                      <input
                        type="password"
                        placeholder="Min 6 characters (Salted PBKDF2 hashed)"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white focus:outline-none focus:border-gs-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-heading font-bold text-white mb-1">Staff Roblox Trading Handle</label>
                      <input
                        type="text"
                        placeholder="GS_AlexStaff"
                        value={staffRoblox}
                        onChange={(e) => setStaffRoblox(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border text-xs text-white font-mono focus:outline-none focus:border-gs-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gs-primary hover:bg-gs-primary-glow disabled:opacity-50 text-white font-heading font-black text-xs uppercase tracking-wider shadow-glow-primary transition-all cursor-pointer"
                  >
                    {isSubmitting ? 'Creating Staff Account...' : 'Create Staff Member'}
                  </button>
                </form>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gs-border bg-gs-raised/60 flex items-center justify-between text-xs text-gs-muted shrink-0">
            <span>SQLite Master Control &bull; GrandStock Anti-Scam Shield 2026</span>
            <button
              onClick={closeAdminStaffModal}
              className="btn-primary px-5 py-1.5 rounded-xl text-xs font-heading font-bold"
            >
              Close Hub
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
