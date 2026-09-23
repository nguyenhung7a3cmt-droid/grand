import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Trash2,
  Save,
  ShieldCheck,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import ImageUploader from './ImageUploader';
import { useDialog } from '../../context/DialogContext';
import { maskRobloxUsername } from '../../utils/privacyMask';

export default function ProofEditorModal({ isOpen, onClose, proof, onSave, onDelete }) {
  const dialog = useDialog();
  const isEditing = Boolean(proof?.id);

  const [orderNumber, setOrderNumber] = useState('');
  const [buyerUsername, setBuyerUsername] = useState('');
  const [item, setItem] = useState('');
  const [game, setGame] = useState('Blox Fruits');
  const [amount, setAmount] = useState('$24.99');
  const [staffName, setStaffName] = useState('Agent Alex');
  const [proofScreenshot, setProofScreenshot] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (proof) {
      setOrderNumber(proof.orderNumber || '');
      setBuyerUsername(proof.buyerUsername || proof.buyerMasked?.replace('***', '') || 'ShadowNinja');
      setItem(proof.item || '');
      setGame(proof.game || 'Blox Fruits');
      setAmount(proof.amount || '$24.99');
      setStaffName(proof.staffName || 'Agent Alex');
      setProofScreenshot(proof.proofScreenshot || proof.proofImageUrl || '');
      setTradeNotes(proof.tradeNotes || 'In-game trade delivered safely 1-on-1.');
    } else {
      setOrderNumber(`GS-${Math.floor(100000 + Math.random() * 900000)}`);
      setBuyerUsername('');
      setItem('Permanent Kitsune Fruit');
      setGame('Blox Fruits');
      setAmount('$24.99');
      setStaffName('Agent Alex');
      setProofScreenshot('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80');
      setTradeNotes('In-game trade completed and PIN verified.');
    }
    setErrorMsg(null);
  }, [proof, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!item.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      ...(proof || {}),
      id: proof?.id || `PROOF-${orderNumber}`,
      orderNumber: orderNumber.trim(),
      buyerUsername: buyerUsername.trim() || 'Player',
      buyerMasked: maskRobloxUsername(buyerUsername.trim() || 'Player'),
      item: item.trim(),
      game: game.trim(),
      amount: amount.startsWith('$') ? amount : `$${amount}`,
      staffName: staffName.trim(),
      proofScreenshot: proofScreenshot.trim(),
      tradeNotes: tradeNotes.trim()
    };

    await onSave(payload);
    setIsSubmitting(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!proof?.id) return;
    const ok = await dialog.confirm({
      title: 'Delete Delivery Proof',
      message: `Are you sure you want to delete proof record for order #${proof.orderNumber}?`,
      confirmText: 'Delete Proof',
      variant: 'danger'
    });
    if (ok) {
      await onDelete(proof.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={onClose} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden z-10 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gs-border bg-gs-raised/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <span>{isEditing ? 'Edit Delivery Proof' : 'Add New Delivery Proof'}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ADMIN CMS
                  </span>
                </h2>
                <p className="text-xs text-gs-muted">
                  {isEditing ? `Modifying Proof for ${orderNumber}` : 'Record a new verified in-game trade receipt'}
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

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4" data-lenis-prevent="true">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Order ID:
                </label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="GS-892104"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Buyer Roblox Username:
                </label>
                <input
                  type="text"
                  value={buyerUsername}
                  onChange={(e) => setBuyerUsername(e.target.value)}
                  placeholder="e.g. huypropsp"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs font-mono"
                />
                <span className="text-[10px] text-gs-muted mt-0.5 block">
                  Publicly displayed as: <strong className="text-emerald-400">{maskRobloxUsername(buyerUsername || 'player')}</strong>
                </span>
              </div>
            </div>

            {/* Proof Screenshot Uploader (File / Ctrl+V / URL / Presets) */}
            <ImageUploader
              value={proofScreenshot}
              onChange={setProofScreenshot}
              label="In-Game Trade Screenshot Proof Attachment"
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Item Delivered:
                </label>
                <input
                  type="text"
                  required
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                  placeholder="e.g. Permanent Kitsune Fruit"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Order Amount:
                </label>
                <input
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="$24.99"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Roblox Game:
                </label>
                <input
                  type="text"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  placeholder="Blox Fruits"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Staff Agent:
                </label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder="Agent Alex"
                  className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Trade Confirmation Notes:
              </label>
              <textarea
                rows={2}
                value={tradeNotes}
                onChange={(e) => setTradeNotes(e.target.value)}
                placeholder="Trade hand-delivered and verified 1-on-1."
                className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-emerald-500 focus:outline-none text-white text-xs"
              />
            </div>

            {/* Sticky Footer Buttons */}
            <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 sm:p-5 bg-gs-card/95 backdrop-blur-md border-t border-gs-border flex items-center justify-between gap-3 mt-4 z-10 shadow-lg">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-heading font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-success cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Proof'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
