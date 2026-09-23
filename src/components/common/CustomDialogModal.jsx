import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  HelpCircle,
  Info,
  CheckCircle2,
  Trash2,
  X,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useDialog } from '../../context/DialogContext';

export default function CustomDialogModal() {
  const { dialogState, handleResolve, handleReject } = useDialog();
  const [val, setVal] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (dialogState?.type === 'prompt') {
      setVal(dialogState.defaultValue || '');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [dialogState]);

  // Handle ESC / Enter key
  useEffect(() => {
    if (!dialogState) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        handleReject();
      } else if (e.key === 'Enter' && dialogState.type !== 'confirm') {
        if (dialogState.type === 'prompt') {
          handleResolve(val);
        } else {
          handleResolve(true);
        }
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [dialogState, val, handleResolve, handleReject]);

  if (!dialogState) return null;

  const { type, title, message, confirmText, cancelText, variant, placeholder } = dialogState;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          iconColor: 'text-red-400',
          iconBg: 'bg-red-500/15 border-red-500/30',
          btnClass: 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.4)]',
          badge: 'bg-red-500/20 text-red-400 border-red-500/30'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          iconBg: 'bg-amber-500/15 border-amber-500/30',
          btnClass: 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_20px_rgba(217,119,6,0.4)]',
          badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        };
      case 'success':
        return {
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
          iconBg: 'bg-emerald-500/15 border-emerald-500/30',
          btnClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-success',
          badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        };
      case 'primary':
      default:
        return {
          icon: HelpCircle,
          iconColor: 'text-gs-primary',
          iconBg: 'bg-gs-primary/15 border-gs-primary/30',
          btnClass: 'btn-primary shadow-glow-primary',
          badge: 'bg-gs-primary/20 text-gs-primary border-gs-primary/30'
        };
    }
  };

  const v = getVariantStyles();
  const Icon = v.icon;

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true" className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none"
      >
        <div className="fixed inset-0" onClick={handleReject} />

        <motion.div
          data-lenis-prevent="true"
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10 p-6 flex flex-col justify-between"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${v.iconBg} border flex items-center justify-center ${v.iconColor} shrink-0 shadow-lg`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-black text-lg text-white uppercase tracking-wide flex items-center gap-2">
                  <span>{title}</span>
                </h3>
                <span className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${v.badge}`}>
                  GrandStock Security Guard
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleReject}
              className="p-1.5 rounded-xl bg-gs-raised text-gs-muted hover:text-white hover:bg-gs-border transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message Content */}
          <div className="py-3 text-xs text-gs-light font-sans leading-relaxed whitespace-pre-line">
            {message}
          </div>

          {/* Prompt Input Box */}
          {type === 'prompt' && (
            <div className="my-2">
              <input
                ref={inputRef}
                type="text"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans shadow-inner placeholder:text-gs-muted"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 border-t border-gs-border/60 flex items-center justify-end gap-2.5 mt-2">
            {type !== 'alert' && (
              <button
                type="button"
                onClick={handleReject}
                className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-heading font-bold cursor-pointer"
              >
                {cancelText || 'Cancel'}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleResolve(type === 'prompt' ? val : true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${v.btnClass}`}
            >
              <span>{confirmText || 'Confirm'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
