import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CreditCard,
  Lock,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Gamepad2,
  Headphones,
  Check,
  Copy,
  Receipt,
  Clock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import RealStripeElementsForm from './RealStripeElementsForm';
import confetti from 'canvas-confetti';

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    cart,
    cartCount,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
    appliedCoupon,
    currency,
    formatPrice,
    robloxUser,
    setRobloxUsername,
    createOrder,
    triggerAudio
  } = useStore();

  const [step, setStep] = useState(1); // 1: Delivery Details, 2: Real Stripe Form, 3: Verified Charge Receipt Screen
  const [discordHandle, setDiscordHandle] = useState('');
  const [robloxUsernameInput, setRobloxUsernameInput] = useState(robloxUser?.username || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successfulPayment, setSuccessfulPayment] = useState(null);
  const [countdown, setCountdown] = useState(5);
  const [copiedId, setCopiedId] = useState(false);

  // Sync initial username when modal opens
  useEffect(() => {
    if (isCheckoutOpen) {
      setStep(1);
      setSuccessfulPayment(null);
      setRobloxUsernameInput(robloxUser?.username || '');
      setCountdown(5);
    }
  }, [isCheckoutOpen, robloxUser?.username]);

  // Countdown timer on Step 3 before auto-entering live chat
  useEffect(() => {
    if (step === 3 && successfulPayment) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleProceedToChat();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, successfulPayment]);

  if (!isCheckoutOpen) return null;

  const handleNextStep = () => {
    if (step === 1) {
      const trimmedUser = robloxUsernameInput.trim();
      if (!trimmedUser && !robloxUser.username) {
        setErrorMsg('Please enter your Roblox username so staff can find you in-game.');
        triggerAudio?.('error');
        return;
      }
      if (trimmedUser && trimmedUser !== robloxUser.username) {
        setRobloxUsername(trimmedUser);
      }
      setErrorMsg(null);
      setStep(2);
      triggerAudio?.('step');
    }
  };


  // Callback when Real Stripe charge succeeds
  const handleStripePaymentSuccess = (paymentDetails) => {
    setSuccessfulPayment(paymentDetails);
    setStep(3);
    triggerAudio?.('success');

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {}
  };

  const handleProceedToChat = () => {
    if (!successfulPayment) return;
    closeCheckout();
    createOrder({
      method: `Credit / Debit Card (Stripe ${successfulPayment.cardBrand?.toUpperCase() || 'CARD'}${successfulPayment.last4 ? ' •••• ' + successfulPayment.last4 : ''})`,
      discordHandle: discordHandle,
      robloxUsername: robloxUsernameInput || robloxUser.username,
      stripePaymentIntentId: successfulPayment.paymentIntentId,
      chargedAmount: successfulPayment.amount,
      currency: successfulPayment.currency || 'USD'
    });
  };

  const handleCopyTransactionId = () => {
    if (successfulPayment?.paymentIntentId) {
      navigator.clipboard.writeText(successfulPayment.paymentIntentId);
      setCopiedId(true);
      triggerAudio?.('click');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={step === 3 ? undefined : closeCheckout} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden z-10 flex flex-col justify-between"
        >
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-gs-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gs-primary/15 border border-gs-primary/30 flex items-center justify-center text-gs-primary shadow-glow-primary">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <span>GrandStock Stripe Checkout</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    REAL STRIPE LIVE
                  </span>
                </h2>
                <p className="text-xs text-gs-muted">Step {step} of 3 &bull; 256-Bit Escrow Vault Protected</p>
              </div>
            </div>

            {step !== 3 && (
              <button
                onClick={closeCheckout}
                className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>


          {/* Stepper Wizard Bar */}
          <div className="px-6 py-3 border-b border-gs-border/60 bg-[#090a0f] flex items-center justify-between text-xs">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-gs-primary-glow font-bold' : 'text-gs-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-gs-raised border border-gs-border flex items-center justify-center text-[10px] font-mono">1</span>
              <span>Delivery Details</span>
            </div>
            <span className="text-gs-muted/40">&rarr;</span>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-gs-primary-glow font-bold' : 'text-gs-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-gs-raised border border-gs-border flex items-center justify-center text-[10px] font-mono">2</span>
              <span>Stripe Card Payment</span>
            </div>
            <span className="text-gs-muted/40">&rarr;</span>
            <div className={`flex items-center gap-2 ${step === 3 ? 'text-emerald-400 font-bold' : 'text-gs-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-mono text-emerald-400">3</span>
              <span>Verified Receipt</span>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4" data-lenis-prevent="true">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* STEP 1: In-Game Delivery Details */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gs-light mb-1.5">
                    Your Exact Roblox Username:
                  </label>
                  <div className="relative">
                    <Gamepad2 className="w-4 h-4 text-gs-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={robloxUsernameInput}
                      onChange={(e) => setRobloxUsernameInput(e.target.value)}
                      placeholder="e.g. huypropsp"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs sm:text-sm font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-gs-muted mt-1">
                    Your assigned staff agent will add this username on Roblox to trade in-game.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gs-light mb-1.5">
                    Discord Username (Optional):
                  </label>
                  <input
                    type="text"
                    value={discordHandle}
                    onChange={(e) => setDiscordHandle(e.target.value)}
                    placeholder="e.g. yourname#0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gs-raised border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs sm:text-sm font-sans"
                  />
                  <p className="text-[11px] text-gs-muted mt-1">
                    Receive a Discord notification as soon as a staff member claims your ticket.
                  </p>
                </div>

                {/* Fulfillment Channel Info */}
                <div>
                  <label className="block text-xs font-heading font-bold uppercase tracking-wider text-gs-light mb-2">
                    Delivery Method:
                  </label>
                  <div className="p-4 rounded-2xl bg-gs-raised/80 border border-emerald-500/40 shadow-glow-success space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                          <Headphones className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-heading font-bold text-white text-sm">
                            1-on-1 Dedicated Staff Manual Delivery
                          </div>
                          <div className="text-[11px] text-gs-muted font-sans">
                            Assigned staff adds you on Roblox and hand-delivers in-game
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        100% SAFE
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Real Stripe Elements Form */}
            {step === 2 && (
              <RealStripeElementsForm
                amount={cartTotal}
                currency={currency}
                robloxUsername={robloxUsernameInput || robloxUser.username}
                items={cart}
                formatPrice={formatPrice}
                onPaymentSuccess={handleStripePaymentSuccess}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
                triggerAudio={triggerAudio}
              />
            )}

            {/* STEP 3: Payment Authorized & Verified Receipt */}
            {step === 3 && successfulPayment && (
              <div className="space-y-5 text-center py-2">
                {/* Success Animation & Badge */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-glow-success animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="font-heading font-black text-xl text-white uppercase tracking-wider">
                    Payment Authorized &amp; Charged!
                  </h3>
                  <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/30">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Funds Secured in 256-Bit Escrow Vault</span>
                  </p>
                </div>

                {/* Verified Transaction Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gs-raised/90 border border-gs-border text-left space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-gs-border/60 pb-2.5">
                    <span className="text-xs font-heading font-bold uppercase text-gs-muted flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Stripe Live Receipt</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500 text-black">
                      PAID / CONFIRMED
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gs-muted text-[11px]">Total Charged:</span>
                      <div className="font-heading font-black text-white text-base text-emerald-400">
                        ${successfulPayment.amount?.toFixed(2) || '0.50'} {successfulPayment.currency || 'USD'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gs-muted text-[11px]">Payment Method:</span>
                      <div className="font-sans font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="w-3.5 h-3.5 text-gs-primary" />
                        <span>{successfulPayment.cardBrand?.toUpperCase() || 'CARD'}{successfulPayment.last4 ? ' •••• ' + successfulPayment.last4 : ''}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gs-border/60">
                    <span className="text-gs-muted text-[11px] block mb-1">Stripe Payment Intent ID:</span>
                    <div className="flex items-center justify-between bg-gs-card p-2 rounded-xl border border-gs-border font-mono text-[11px] text-gs-muted">
                      <span className="truncate text-white font-mono">{successfulPayment.paymentIntentId}</span>
                      <button
                        type="button"
                        onClick={handleCopyTransactionId}
                        className="ml-2 text-gs-primary hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold shrink-0 cursor-pointer"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-gs-muted bg-gs-card/50 p-2.5 rounded-xl flex items-center gap-2 border border-gs-border/40">
                    <Headphones className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your order has been broadcasted to our live on-duty staff team.</span>
                  </div>
                </div>

                {/* Auto Redirect CTA */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleProceedToChat}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-heading font-black text-sm uppercase tracking-wider shadow-glow-success transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Enter Live Staff Delivery Chat</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-gs-muted flex items-center justify-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Auto-opening live chat in {countdown} seconds...</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Wizard Controls */}
          {step === 1 && (
            <div className="p-4 border-t border-gs-border bg-gs-raised/40 flex items-center justify-between">
              <div />
              <button
                type="button"
                onClick={handleNextStep}
                className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center gap-1.5 shadow-glow-primary cursor-pointer"
              >
                <span>Continue to Stripe Card Payment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
