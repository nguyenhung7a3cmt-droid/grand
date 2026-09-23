import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#F8FAFC',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': {
        color: '#64748B',
      },
      iconColor: '#EE1D36',
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444',
    },
  },
  hidePostalCode: false,
};

function InnerStripeForm({
  amount,
  currency,
  robloxUsername,
  items,
  formatPrice,
  onPaymentSuccess,
  isProcessing,
  setIsProcessing,
  triggerAudio
}) {
  const stripe = useStripe();
  const elements = useElements();

  const [cardName, setCardName] = useState('');
  const [errorMessage, setErrorMessage] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  // Serialized items string to prevent infinite re-renders on keystrokes
  const itemsKey = (items || []).map(i => `${i.id || 'item'}:${i.quantity || 1}`).join('|');

  const fetchSession = useCallback(async () => {
    setIsLoadingSession(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency: currency || 'USD',
          robloxUsername,
          items
        })
      });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
        setIsLoadingSession(false);
        return data.clientSecret;
      } else {
        const errText = data.error || 'Failed to initialize Stripe Payment Session.';
        setErrorMessage(errText);
        setIsLoadingSession(false);
        return null;
      }
    } catch (err) {
      setErrorMessage('Could not connect to Stripe server. Please check your internet connection.');
      setIsLoadingSession(false);
      return null;
    }
  }, [amount, currency, robloxUsername, itemsKey]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!cardName.trim()) {
      setErrorMessage('Please enter the cardholder name.');
      triggerAudio?.('error');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setErrorMessage(null);
    triggerAudio?.('click');

    try {
      // Ensure we have active clientSecret
      let secret = clientSecret;
      if (!secret) {
        secret = await fetchSession();
      }

      if (!secret) {
        setErrorMessage('Stripe Payment Session could not be initialized. Please refresh and try again.');
        setIsProcessing(false);
        triggerAudio?.('error');
        return;
      }

      // 💳 REAL STRIPE CARD CHARGE CONFIRMATION
      const result = await stripe.confirmCardPayment(secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardName,
          },
        },
      });

      if (result.error) {
        setErrorMessage(result.error.message || 'Payment failed. Please check your card details.');
        setIsProcessing(false);
        triggerAudio?.('error');
      } else if (result.paymentIntent && (result.paymentIntent.status === 'succeeded' || result.paymentIntent.status === 'processing')) {
        triggerAudio?.('success');
        
        let realCardBrand = 'CARD';
        let realLast4 = '';
        let realReceiptUrl = null;

        // Fetch verified card brand & last4 directly from Stripe API
        try {
          const detailRes = await fetch(`/api/stripe/payment-intent-details?paymentIntentId=${result.paymentIntent.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            if (detailData.last4) {
              realCardBrand = detailData.cardBrand || 'CARD';
              realLast4 = detailData.last4;
              realReceiptUrl = detailData.receiptUrl;
            }
          }
        } catch (e) {
          console.warn('Could not fetch expanded Stripe card details:', e);
        }

        onPaymentSuccess({
          paymentIntentId: result.paymentIntent.id,
          amount: (result.paymentIntent.amount || 0) / 100,
          currency: (result.paymentIntent.currency || 'USD').toUpperCase(),
          cardBrand: realCardBrand,
          last4: realLast4,
          receiptUrl: realReceiptUrl
        });
      } else {
        setErrorMessage(`Payment status: ${result.paymentIntent?.status || 'Unknown'}. Please contact support.`);
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during card authorization.');
      setIsProcessing(false);
      triggerAudio?.('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-gs-raised border border-gs-border space-y-3.5 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gs-primary" />
            <span className="font-heading font-bold text-xs uppercase text-white tracking-wider">
              Stripe Secure Card Element
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            256-BIT SSL ENCRYPTED
          </span>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-[10px] font-heading font-bold uppercase text-gs-muted mb-1">
            Cardholder Full Name:
          </label>
          <input
            type="text"
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            placeholder="e.g. John Doe"
            className="w-full px-3.5 py-2.5 rounded-xl bg-gs-card border border-gs-border focus:border-gs-primary focus:outline-none text-white text-xs font-sans placeholder-slate-500 transition-colors"
          />
        </div>

        {/* Official Stripe CardElement with Luhn/CVC/Expiry Check */}
        <div>
          <label className="block text-[10px] font-heading font-bold uppercase text-gs-muted mb-1">
            Credit or Debit Card Details:
          </label>
          <div className="p-3 rounded-xl bg-gs-card border border-gs-border focus-within:border-gs-primary transition-colors">
            <CardElement
              options={CARD_ELEMENT_OPTIONS}
              onChange={(e) => {
                setCardComplete(e.complete);
                if (e.error) {
                  setErrorMessage(e.error.message);
                } else {
                  setErrorMessage(null);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-3.5 rounded-2xl bg-[#090a0f] border border-gs-border space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-gs-muted">
          <span>Target Roblox Player:</span>
          <strong className="text-emerald-400 font-mono">@{robloxUsername}</strong>
        </div>
        <div className="flex items-center justify-between text-gs-muted">
          <span>Escrow Protection:</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Funds held until in-game delivery</span>
          </span>
        </div>
        <div className="pt-2 border-t border-gs-border/60 flex items-center justify-between text-sm">
          <span className="font-heading font-bold text-white">Total Amount to Pay:</span>
          <span className="font-mono font-black text-emerald-400 text-base">
            {formatPrice(amount)}
          </span>
        </div>
      </div>

      {/* Pay Button */}
      <button
        type="submit"
        disabled={isProcessing || !stripe || isLoadingSession}
        className="w-full py-3.5 rounded-xl bg-gs-primary hover:bg-gs-primary-glow disabled:opacity-50 text-white font-heading font-black text-sm uppercase tracking-wider shadow-glow-primary transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authorizing with Stripe...</span>
          </>
        ) : isLoadingSession ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Connecting to Stripe Vault...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Pay {formatPrice(amount)} via Stripe</span>
          </>
        )}
      </button>
    </form>
  );
}

export default function RealStripeElementsForm({
  amount,
  currency,
  robloxUsername,
  items,
  formatPrice,
  onPaymentSuccess,
  isProcessing,
  setIsProcessing,
  triggerAudio
}) {
  const [stripePromise, setStripePromise] = useState(null);

  useEffect(() => {
    const envKey = import.meta.env.VITE_STRIPE_PK || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (envKey && envKey.startsWith('pk_')) {
      setStripePromise(loadStripe(envKey));
      return;
    }

    fetch('/api/stripe/public-key')
      .then(r => r.json())
      .then(data => {
        const pk = data.publishableKey || data.publicKey;
        if (pk && pk.startsWith('pk_')) {
          setStripePromise(loadStripe(pk));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-3">
      {stripePromise ? (
        <Elements stripe={stripePromise}>
          <InnerStripeForm
            amount={amount}
            currency={currency}
            robloxUsername={robloxUsername}
            items={items}
            formatPrice={formatPrice}
            onPaymentSuccess={onPaymentSuccess}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            triggerAudio={triggerAudio}
          />
        </Elements>
      ) : (
        <div className="p-6 text-center text-gs-muted text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-gs-primary" />
          <span>Loading Stripe Elements...</span>
        </div>
      )}
    </div>
  );
}
