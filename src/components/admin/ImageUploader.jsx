import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Link,
  Clipboard,
  X,
  Check,
  Sparkles,
  RefreshCw,
  Eye,
  Film
} from 'lucide-react';
import { GAME_IMAGE_EMOJIS, CATEGORY_IMAGE_EMOJIS } from '../../data/emojis';

const PRESET_ICONS = [
  { name: 'Blox Fruits Logo', url: 'https://tr.rbxcdn.com/180DAY-a64f70da20fc1e80ee76fe5d49c1be0a/512/512/Image/Png/noFilter' },
  { name: 'MM2 Knife Logo', url: 'https://tr.rbxcdn.com/180DAY-313f1416cd5e4335a97d054183743fdd/512/512/Image/Png/noFilter' },
  { name: 'GPO Ocean Logo', url: 'https://tr.rbxcdn.com/180DAY-61f33eb729ebe09e8dbdbfa22e9c8942/512/512/Image/Png/noFilter' },
  { name: 'Fisch Reel Logo', url: 'https://tr.rbxcdn.com/180DAY-2684eacfcad775e9768bc78be661a2e2/512/512/Image/Png/noFilter' },
  { name: 'Brainrot Meme', url: 'https://tr.rbxcdn.com/180DAY-b6d19693e04ab70e438d33dde653c1de/512/512/Image/Png/noFilter' },
  { name: 'Anime Defenders', url: 'https://tr.rbxcdn.com/180DAY-2ef69e4e4d0be01a2b12ecb16536d54f/512/512/Image/Png/noFilter' },
  { name: 'Kitsune Fruit', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80' },
  { name: 'Dragon Fruit', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80' },
  { name: 'Godly Harvester', url: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&w=300&q=80' },
  { name: 'Chroma Lightbringer', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=300&q=80' },
  { name: 'Mythical Rod', url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=300&q=80' },
  { name: 'Treasure Chest', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80' }
];

export default function ImageUploader({ value, onChange, label = 'Item Image / GIF' }) {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [urlInput, setUrlInput] = useState(value || '');
  const [isDragging, setIsDragging] = useState(false);
  const [isPastedSuccess, setIsPastedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setUrlInput(value || '');
  }, [value]);

  const handleFileSelect = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      onChange(dataUrl);
      setIsPastedSuccess(true);
      setTimeout(() => setIsPastedSuccess(false), 2000);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      e.preventDefault();
      handleFileSelect(e.clipboardData.files[0]);
    } else if (e.clipboardData) {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && (pastedText.startsWith('http') || pastedText.startsWith('data:image') || pastedText.startsWith('/'))) {
        onChange(pastedText.trim());
        setUrlInput(pastedText.trim());
      }
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-light flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-gs-primary" />
          <span>{label} (PNG, JPG, WEBP, GIF, SVG)</span>
        </label>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-gs-raised p-1 rounded-xl border border-gs-border text-[10px] font-heading font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              activeTab === 'upload' ? 'bg-gs-primary text-white shadow-sm' : 'text-gs-muted hover:text-white'
            }`}
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload / Paste</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              activeTab === 'url' ? 'bg-gs-primary text-white shadow-sm' : 'text-gs-muted hover:text-white'
            }`}
          >
            <Link className="w-3 h-3" />
            <span>URL</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
              activeTab === 'presets' ? 'bg-gs-primary text-white shadow-sm' : 'text-gs-muted hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Presets</span>
          </button>
        </div>
      </div>

      {/* TAB 1: UPLOAD / DRAG & DROP / CLIPBOARD PASTE */}
      {activeTab === 'upload' && (
        <div
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group outline-none ${
            isDragging
              ? 'border-gs-primary bg-gs-primary/10 shadow-glow-primary scale-[1.01]'
              : 'border-gs-border hover:border-gs-primary/60 bg-gs-raised/60 hover:bg-gs-raised'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.gif,.svg,.webp,.png,.jpg,.jpeg"
            onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-xl bg-gs-card border border-gs-border flex items-center justify-center text-gs-primary group-hover:scale-110 transition-transform">
            <UploadCloud className="w-5 h-5" />
          </div>

          <div className="space-y-0.5">
            <div className="font-heading font-bold text-white text-xs flex items-center justify-center gap-1.5">
              <span>Click to Browse File</span>
              <span className="text-gs-muted">&bull;</span>
              <span className="text-emerald-400 font-mono">Press Ctrl+V to Paste</span>
            </div>
            <p className="text-[10px] text-gs-muted">
              Supports animated GIFs, transparent PNGs, WebP, JPG, SVG
            </p>
          </div>

          {isPastedSuccess && (
            <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
              <Check className="w-3 h-3" />
              <span>Image Loaded from Clipboard!</span>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECT URL INPUT */}
      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); onChange(e.target.value); }}
              placeholder="https://images.unsplash.com/... or /items/... or .gif URL"
              className="w-full px-3.5 py-2 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-mono"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => { setUrlInput(''); onChange(''); }}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white border border-gs-border"
                title="Clear"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PRESETS GALLERY */}
      {activeTab === 'presets' && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 scrollbar-none">
          {PRESET_ICONS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => { onChange(preset.url); setUrlInput(preset.url); }}
              className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 group ${
                value === preset.url
                  ? 'bg-gs-raised border-gs-primary shadow-glow-primary'
                  : 'bg-gs-card border-gs-border hover:border-gs-border/90'
              }`}
            >
              <img
                src={preset.url}
                alt={preset.name}
                className="w-8 h-8 rounded-lg object-contain group-hover:scale-110 transition-transform"
              />
              <span className="text-[9px] text-gs-light font-heading truncate w-full">
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* LIVE IMAGE / GIF PREVIEW BOX */}
      {value && (
        <div className="p-3 rounded-2xl bg-[#090a0f] border border-gs-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-14 h-14 rounded-xl bg-black/60 border border-gs-border overflow-hidden flex items-center justify-center shrink-0 p-1">
              <img
                src={value}
                alt="Live Preview"
                className="max-h-full max-w-full object-contain drop-shadow-md"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=200&q=80';
                }}
              />
              {value.includes('.gif') && (
                <span className="absolute top-0.5 right-0.5 px-1 rounded bg-gs-primary text-[8px] font-mono font-bold text-white uppercase">
                  GIF
                </span>
              )}
            </div>

            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-heading font-bold text-white flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Image Attached</span>
              </span>
              <p className="text-[10px] text-gs-muted truncate font-mono">
                {value.startsWith('data:image') ? 'Data URL (Local File/Paste)' : value}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { onChange(''); setUrlInput(''); }}
            className="p-1.5 rounded-lg bg-gs-raised hover:bg-red-950/40 text-gs-muted hover:text-red-400 border border-gs-border transition-colors shrink-0"
            title="Remove Image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
