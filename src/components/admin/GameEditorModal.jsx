import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gamepad2,
  Plus,
  Trash2,
  Save,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import ImageUploader from './ImageUploader';
import { useDialog } from '../../context/DialogContext';

export default function GameEditorModal() {
  const dialog = useDialog();
  const {
    isGameEditorOpen,
    closeGameEditor,
    editingGame,
    saveGame,
    deleteGame,
    triggerAudio
  } = useStore();

  const isEditing = Boolean(editingGame?.id);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🎮');
  const [iconImage, setIconImage] = useState('');
  const [desc, setDesc] = useState('');
  const [tagline, setTagline] = useState('');
  const [accentColor, setAccentColor] = useState('#EE1D36');
  const [categoriesText, setCategoriesText] = useState('all:All Items:✨\nitems:Items:⚔️\ngamepasses:Gamepasses:🎫');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (editingGame) {
      setName(editingGame.name || '');
      setEmoji(editingGame.emoji || '🎮');
      setIconImage(editingGame.iconImage || editingGame.icon || '');
      setDesc(editingGame.desc || '');
      setTagline(editingGame.tagline || '');
      setAccentColor(editingGame.accentColor || '#EE1D36');
      if (Array.isArray(editingGame.categories)) {
        setCategoriesText(editingGame.categories.map(c => `${c.id}:${c.name}:${c.emoji || '✨'}`).join('\n'));
      }
    } else {
      setName('');
      setEmoji('🎮');
      setIconImage('https://tr.rbxcdn.com/180DAY-a64f70da20fc1e80ee76fe5d49c1be0a/512/512/Image/Png/noFilter');
      setDesc('Verified in-game item marketplace');
      setTagline('Popular Roblox Game');
      setAccentColor('#EE1D36');
      setCategoriesText('all:All Items:✨\nitems:Weapons & Items:⚔️\ngamepasses:Gamepasses:🎫');
    }
    setErrorMsg(null);
  }, [editingGame, isGameEditorOpen]);

  if (!isGameEditorOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Game name is required.');
      triggerAudio?.('error');
      return;
    }

    setIsSubmitting(true);
    triggerAudio?.('click');

    const categoriesArray = categoriesText
      .split('\n')
      .map(line => {
        const parts = line.split(':');
        if (parts.length >= 2) {
          return { id: parts[0].trim(), name: parts[1].trim(), emoji: parts[2]?.trim() || '✨' };
        }
        return null;
      })
      .filter(Boolean);

    const gameId = editingGame?.id || name.trim().toLowerCase().replace(/\s+/g, '-');
    const gamePayload = {
      ...(editingGame || {}),
      id: gameId,
      name: name.trim(),
      icon: iconImage.trim() || emoji.trim() || '🎮',
      iconImage: iconImage.trim(),
      emoji: emoji.trim() || '🎮',
      desc: desc.trim(),
      tagline: tagline.trim(),
      accentColor,
      categories: categoriesArray.length > 0 ? categoriesArray : [{ id: 'all', name: 'All Items', emoji: '✨' }]
    };

    await saveGame(gamePayload);
    setIsSubmitting(false);
    triggerAudio?.('success');
    closeGameEditor();
  };

  const handleDelete = async () => {
    if (!editingGame?.id) return;
    const ok = await dialog.confirm({
      title: 'Delete Game Tab',
      message: `Are you sure you want to remove "${editingGame.name}" from the store categories?`,
      confirmText: 'Delete Game',
      variant: 'danger'
    });
    if (ok) {
      await deleteGame(editingGame.id);
      triggerAudio?.('click');
      closeGameEditor();
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeGameEditor} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden z-10 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gs-border bg-gs-raised/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase">
                  {isEditing ? 'Edit Game Tab' : 'Add New Roblox Game'}
                </h2>
                <p className="text-xs text-gs-muted">Configure storefront tabs, custom thumbnail icons, and category pills</p>
              </div>
            </div>

            <button
              onClick={closeGameEditor}
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

            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Game Name:
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Pet Simulator 99"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-purple-500 focus:outline-none text-white text-xs sm:text-sm font-sans"
              />
            </div>

            {/* Custom Emoji / Thumbnail Image Uploader */}
            <ImageUploader
              value={iconImage}
              onChange={setIconImage}
              label="Custom Game Thumbnail / Emoji Icon"
            />

            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Tagline:
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Top Roblox Pet Trading"
                className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-purple-500 focus:outline-none text-white text-xs font-sans"
              />
            </div>

            <div>
              <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light mb-1">
                Category Pills (Format: slug:Title:emoji):
              </label>
              <textarea
                rows={3}
                value={categoriesText}
                onChange={(e) => setCategoriesText(e.target.value)}
                placeholder="all:All Items:✨&#10;huge-pets:Huge Pets:🐱&#10;gems:Gems & Currency:💎"
                className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-purple-500 focus:outline-none text-white text-xs font-mono"
              />
            </div>

            <div className="pt-3 border-t border-gs-border flex items-center justify-between gap-3">
              {isEditing ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2.5 rounded-xl bg-red-950/50 hover:bg-red-900/60 text-red-400 border border-red-500/40 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Game</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeGameEditor}
                  className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-heading font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heading font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-glow-purple"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Game Tab'}</span>
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
