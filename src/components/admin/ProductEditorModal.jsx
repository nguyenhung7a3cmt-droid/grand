import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Save,
  Sparkles,
  Gamepad2,
  DollarSign,
  Package,
  Layers,
  Tag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ImageUploader from './ImageUploader';
import { useDialog } from '../../context/DialogContext';

const RARITY_OPTIONS = [
  { value: 'mythical', label: 'Mythical (Red Glow)', color: 'text-red-400' },
  { value: 'godly', label: 'Godly (Crimson Glow)', color: 'text-rose-400' },
  { value: 'legendary', label: 'Legendary (Gold Glow)', color: 'text-amber-400' },
  { value: 'rare', label: 'Rare (Purple Glow)', color: 'text-purple-400' }
];

export default function ProductEditorModal() {
  const dialog = useDialog();
  const {
    isProductEditorOpen,
    closeProductEditor,
    editingProduct,
    saveProduct,
    deleteProduct,
    games,
    triggerAudio
  } = useStore();

  const isEditing = Boolean(editingProduct?.id);

  const [name, setName] = useState('');
  const [gameId, setGameId] = useState('blox-fruits');
  const [category, setCategory] = useState('permanent-fruits');
  const [price, setPrice] = useState('19.99');
  const [originalPrice, setOriginalPrice] = useState('24.99');
  const [stock, setStock] = useState('15');
  const [rarity, setRarity] = useState('mythical');
  const [badge, setBadge] = useState('HOT');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [tradeRequirements, setTradeRequirements] = useState('');
  const [perksText, setPerksText] = useState('100% Clean Item\nInstant In-Game Delivery\nStaff Escrow Protected');
  const [isPopular, setIsPopular] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setGameId(editingProduct.gameId || 'blox-fruits');
      setCategory(editingProduct.category || 'permanent-fruits');
      setPrice(String(editingProduct.price || '19.99'));
      setOriginalPrice(String(editingProduct.originalPrice || '24.99'));
      setStock(String(editingProduct.stock || '15'));
      setRarity(editingProduct.rarity || 'mythical');
      setBadge(editingProduct.badge || 'HOT');
      setImage(editingProduct.image || '');
      setDescription(editingProduct.description || '');
      setTradeRequirements(editingProduct.tradeRequirements || '');
      setPerksText(Array.isArray(editingProduct.perks) ? editingProduct.perks.join('\n') : '100% Clean Item\nInstant In-Game Delivery');
      setIsPopular(Boolean(editingProduct.popular));
    } else {
      setName('');
      setGameId('blox-fruits');
      setCategory('permanent-fruits');
      setPrice('14.99');
      setOriginalPrice('19.99');
      setStock('10');
      setRarity('mythical');
      setBadge('NEW');
      setImage('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80');
      setDescription('Verified Roblox in-game item with instant staff trade.');
      setTradeRequirements('Standard in-game trade level required.');
      setPerksText('100% Verified Clean Item\nInstant 1-on-1 Staff Trade\n24/7 Escrow Warranty');
      setIsPopular(true);
    }
    setErrorMsg(null);
  }, [editingProduct, isProductEditorOpen]);

  if (!isProductEditorOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Product name is required.');
      triggerAudio?.('error');
      return;
    }

    setIsSubmitting(true);
    triggerAudio?.('click');

    const selectedGame = games.find(g => g.id === gameId);
    const perksArray = perksText
      .split('\n')
      .map(p => p.trim())
      .filter(Boolean);

    const productPayload = {
      ...(editingProduct || {}),
      id: editingProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      gameId,
      gameName: selectedGame?.name || 'Roblox',
      category,
      rarity,
      price: parseFloat(price) || 9.99,
      originalPrice: parseFloat(originalPrice) || (parseFloat(price) * 1.3 || 12.99),
      stock: parseInt(stock, 10) || 10,
      badge: badge.trim(),
      image: image.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80',
      description: description.trim() || 'Verified in-game item.',
      tradeRequirements: tradeRequirements.trim() || 'Standard trade requirements apply.',
      perks: perksArray.length > 0 ? perksArray : ['100% Clean Item', 'Instant Delivery'],
      popular: isPopular
    };

    await saveProduct(productPayload);
    setIsSubmitting(false);
    triggerAudio?.('success');
    closeProductEditor();
  };

  const handleDelete = async () => {
    if (!editingProduct?.id) return;
    const ok = await dialog.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to permanently remove "${editingProduct.name}" from the live catalog?`,
      confirmText: 'Delete Product',
      variant: 'danger'
    });
    if (ok) {
      await deleteProduct(editingProduct.id);
      triggerAudio?.('click');
      closeProductEditor();
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true" className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeProductEditor} />

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
              <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <span>{isEditing ? 'Edit Store Product' : 'Add New Store Product'}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    LIVE CMS
                  </span>
                </h2>
                <p className="text-xs text-gs-muted">
                  {isEditing ? `Modifying: ${editingProduct?.name}` : 'Instantly list a new item on the storefront'}
                </p>
              </div>
            </div>

            <button
              onClick={closeProductEditor}
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

            {/* Product Name */}
            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Item Title / Name:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Permanent Kitsune Fruit"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs sm:text-sm font-sans"
              />
            </div>

            {/* Interactive Image & GIF Uploader / Paste / Presets */}
            <ImageUploader
              value={image}
              onChange={setImage}
              label="Item Product Image / GIF Asset"
            />

            {/* Game & Category Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Assigned Roblox Game:
                </label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
                >
                  {games.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Category Slug:
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. permanent-fruits, godly-weapons"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Pricing & Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Price ($USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="19.99"
                  className="w-full px-3 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Original Price:
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="24.99"
                  className="w-full px-3 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Stock Units:
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="15"
                  className="w-full px-3 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Rarity & Badge */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Rarity Glow Border:
                </label>
                <select
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
                >
                  {RARITY_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                  Badge Tag (e.g. HOT, 50% OFF):
                </label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="HOT"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Bullet Perks */}
            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Perks &amp; Highlights (One per line):
              </label>
              <textarea
                rows={3}
                value={perksText}
                onChange={(e) => setPerksText(e.target.value)}
                placeholder="100% Clean Item&#10;Instant In-Game Delivery&#10;Escrow Warranty"
                className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Full Item Description:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed description of the item..."
                className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans"
              />
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-gs-border flex items-center justify-between gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Product</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeProductEditor}
                  className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-heading font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 shadow-glow-primary"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Product'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
