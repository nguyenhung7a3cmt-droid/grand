import React from 'react';
import { motion } from 'framer-motion';
import {
  Edit3,
  Plus,
  Gamepad2,
  RefreshCw,
  Crown,
  Eye,
  Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';
import { useStore } from '../../context/StoreContext';

export default function AdminLiveBar() {
  const dialog = useDialog();
  const { isAdmin } = useAuth();
  const {
    isAdminEditMode,
    toggleAdminEditMode,
    openProductEditor,
    openGameEditor,
    resetCatalog,
    triggerAudio
  } = useStore();

  if (!isAdmin) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-40 bg-gradient-to-r from-purple-950/90 via-[#0d0714]/95 to-black/90 border-b border-purple-500/40 backdrop-blur-md px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs shadow-2xl overflow-hidden"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
            <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="font-heading font-black text-white uppercase text-[10px] sm:text-[11px] tracking-wider flex items-center gap-1.5 whitespace-nowrap">
            <span className="hidden sm:inline">Site Owner Live Editor</span>
            <span className="sm:hidden">CMS Live</span>
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-mono font-bold ${
              isAdminEditMode
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-gs-raised text-gs-muted border border-gs-border/60'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAdminEditMode ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`}></span>
              <span>{isAdminEditMode ? 'EDIT' : 'VIEW'}</span>
            </span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
          {/* Toggle In-Place Edit Mode */}
          <button
            type="button"
            onClick={() => { toggleAdminEditMode(); triggerAudio?.('click'); }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-heading font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 transition-all ${
              isAdminEditMode
                ? 'bg-purple-600 text-white shadow-glow-purple border border-purple-400'
                : 'bg-gs-raised text-gs-muted hover:text-white border border-gs-border'
            }`}
          >
            <Sliders className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{isAdminEditMode ? 'Edit Mode ON' : 'Edit Mode'}</span>
          </button>

          {/* Add Product Button */}
          <button
            type="button"
            onClick={() => { openProductEditor(null); triggerAudio?.('click'); }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-gs-primary hover:bg-gs-primary-glow text-white font-heading font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-glow-primary transition-all"
          >
            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>+ Product</span>
          </button>

          {/* Add Game Tab Button */}
          <button
            type="button"
            onClick={() => { openGameEditor(null); triggerAudio?.('click'); }}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-purple-900/60 hover:bg-purple-800/80 text-purple-300 border border-purple-500/40 font-heading font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center gap-1 transition-all"
          >
            <Gamepad2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>+ Game Tab</span>
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={async () => {
              const ok = await dialog.confirm({
                title: 'Reset Catalog Defaults',
                message: 'Are you sure you want to reset the store catalog to factory default items? All custom changes will be restored.',
                confirmText: 'Reset to Factory Defaults',
                variant: 'danger'
              });
              if (ok) {
                resetCatalog();
                triggerAudio?.('click');
              }
            }}
            className="p-1.5 rounded-xl bg-gs-raised hover:bg-gs-card text-gs-muted hover:text-white border border-gs-border transition-colors"
            title="Reset Catalog to Defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
