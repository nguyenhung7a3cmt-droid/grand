import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  HelpCircle,
  ShoppingBag,
  User,
  Zap,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Bot,
  Lock,
  Server,
  MessageSquare
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const TUTORIAL_STEPS = [
  {
    step: 1,
    number: '01',
    title: 'Select Items & Enter Roblox Username',
    tagline: 'Browse rare Blox Fruits, MM2 Godlies, GPO & Fisch inventory',
    desc: 'Pick your desired in-game items from our live catalog. In the cart drawer or checkout, input your exact Roblox Username so our staff can locate your character and send friend requests.',
    proTip: 'Make sure your Roblox account privacy settings allow trade requests or server joins.',
    icon: ShoppingBag,
    color: 'text-gs-primary',
    border: 'border-gs-primary/30',
    bg: 'bg-gs-primary/10'
  },
  {
    step: 2,
    number: '02',
    title: 'Secure Checkout & Escrow Protection',
    tagline: 'Card, Apple Pay, PayPal, Cash App, or 0-Fee Crypto',
    desc: 'Complete your payment safely. Funds are placed into automated escrow protection and are only released once your assigned staff member confirms full delivery into your Roblox inventory.',
    proTip: 'Crypto payments enjoy an automatic 5% discount with zero gateway processing fees.',
    icon: Lock,
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10'
  },
  {
    step: 3,
    number: '03',
    title: 'Open 1-on-1 Live Staff Ticket Chat',
    tagline: 'Dedicated staff agent connects in under 45 seconds',
    desc: 'A private Live Order Ticket opens immediately. Your assigned staff specialist greets you in chat, gives you their Roblox username, and coordinates an in-game meeting to trade your items.',
    proTip: 'You can chat directly with your delivery agent in real-time, ask questions, or coordinate in-game trading.',
    icon: MessageSquare,
    color: 'text-purple-400',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10'
  },
  {
    step: 4,
    number: '04',
    title: 'In-Game Trade Handshake & Delivery',
    tagline: 'Hand-delivered safe trades with photo receipt proof',
    desc: 'Meet your staff agent at the in-game trade table with your verification PIN. Accept the trade, verify items in your inventory, and download your official trade certificate receipt!',
    proTip: 'You can leave a 5-star rating for your staff agent once the trade is finalized.',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10'
  }
];

export default function TutorialModal() {
  const { isTutorialModalOpen, closeTutorialModal, triggerAudio } = useStore();
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    if (!isTutorialModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') closeTutorialModal();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [isTutorialModalOpen, closeTutorialModal]);

  if (!isTutorialModalOpen) return null;

  const current = TUTORIAL_STEPS[activeStep - 1];
  const Icon = current.icon;

  const handleNext = () => {
    if (activeStep < 4) {
      setActiveStep(prev => prev + 1);
      triggerAudio('click');
    } else {
      closeTutorialModal();
      triggerAudio('success');
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
      triggerAudio('click');
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeTutorialModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain z-10 p-5 sm:p-8 flex flex-col justify-between" data-lenis-prevent="true"
        >
          {/* Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gs-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-xl text-white uppercase">
                    How 1-on-1 Staff Delivery Works
                  </h2>
                  <p className="text-xs text-gs-muted">
                    Get your Roblox in-game items delivered securely in 4 simple steps
                  </p>
                </div>
              </div>

              <button
                onClick={closeTutorialModal}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Navigation Tabs */}
            <div className="grid grid-cols-4 gap-2 py-4 border-b border-gs-border/60">
              {TUTORIAL_STEPS.map((s) => {
                const isSelected = activeStep === s.step;
                const isPast = activeStep > s.step;
                return (
                  <button
                    key={s.step}
                    onClick={() => {
                      setActiveStep(s.step);
                      triggerAudio('click');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-gs-raised border-gs-primary text-white shadow-glow-primary'
                        : isPast
                        ? 'bg-gs-card border-emerald-500/40 text-emerald-400'
                        : 'bg-gs-card border-gs-border text-gs-muted hover:text-white'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold uppercase">Step {s.number}</div>
                    <div className="text-xs font-heading font-bold truncate mt-0.5">
                      {s.step === 1 ? '1. Pick Items' : s.step === 2 ? '2. Checkout' : s.step === 3 ? '3. Join Server' : '4. Claim Loot'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content Card */}
          <div className="py-6">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className={`p-5 sm:p-6 rounded-2xl bg-gs-raised/70 border ${current.border} space-y-4`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${current.bg} border ${current.border} flex items-center justify-center ${current.color} shadow-lg shrink-0`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-gs-muted uppercase">
                    STAGE {current.number} OF 04
                  </span>
                  <h3 className="font-heading font-black text-lg sm:text-xl text-white">
                    {current.title}
                  </h3>
                  <div className="text-xs font-semibold text-emerald-400 font-sans mt-0.5">
                    {current.tagline}
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gs-light/90 font-sans leading-relaxed">
                {current.desc}
              </p>

              {/* Pro Tip Callout */}
              <div className="p-3 rounded-xl bg-gs-card border border-gs-border text-xs text-gs-muted flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Pro Tip:</strong> {current.proTip}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-gs-border flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={activeStep === 1}
              className="btn-secondary px-4 py-2.5 rounded-xl text-xs font-heading font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeStep === i
                      ? 'w-6 bg-gs-primary'
                      : activeStep > i
                      ? 'bg-emerald-400'
                      : 'bg-gs-border'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-black flex items-center gap-1.5 uppercase shadow-glow-primary"
            >
              <span>{activeStep === 4 ? 'Got It! Start Shopping' : 'Next Step'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
