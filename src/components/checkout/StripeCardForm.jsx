import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Lock, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#F8FAFC',
      fontFamily: "'Inter', sans-serif",
      fontSmoothing: 'antialiased',
      fontSize: '14px',
      '::placeholder': {
        color: '#64748B'
      },
      iconColor: '#EE1D36'
    },
    invalid: {
      color: '#EF4444',
      iconColor: '#EF4444'
    }
  },
  hidePostalCode: false
};

export default function StripeCardForm({ totalUSD, robloxUsername, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      // 1. Create payment intent on backend to get clientSecret
      const intentRes = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(totalUSD || 24.99),
          currency: 'usd',
          robloxUsername: robloxUsername || 'Customer'
        })
      });

      const intentData = await intentRes.json();
      if (!intentRes.ok || !intentData.clientSecret) {
        setCardError(intentData.error || 'Failed to initialize payment intent.');
        setIsProcessing(false);
        return;
      }

      // 2. Confirm card payment with Stripe using clientSecret
      const result = await stripe.confirmCardPayment(intentData.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: robloxUsername ? `@${robloxUsername}` : 'GrandStock Buyer'
          }
        }
      });

      if (result.error) {
        setCardError(result.error.message || 'Card payment confirmation failed.');
        setIsProcessing(false);
        return;
      }

      // 3. Only call onSuccess if paymentIntent status is strictly 'succeeded'
      if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        const paymentIntent = result.paymentIntent;
        onSuccess({
          method: `Stripe (${paymentIntent.payment_method_types?.[0]?.toUpperCase() || 'CARD'})`,
          paymentIntentId: paymentIntent.id,
          amount: (paymentIntent.amount || 0) / 100,
          currency: (paymentIntent.currency || 'USD').toUpperCase(),
          status: paymentIntent.status
        });
      } else {
        setCardError(`Payment status: ${result.paymentIntent?.status || 'Unknown'}. Please contact support.`);
      }
    } catch (err) {
      console.error('Stripe error:', err);
      setCardError('Card processing failed. Please check details or try another card.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between text-xs font-heading font-bold uppercase text-gs-muted">
        <span>Card Details (Stripe Protected):</span>
        <span className="text-emerald-400 font-mono flex items-center gap-1">
          <Lock className="w-3 h-3" /> 256-Bit SSL Encrypted
        </span>
      </div>

      <div className="p-4 rounded-xl bg-gs-card border border-gs-border focus-within:border-gs-primary transition-all">
        <CardElement
          options={CARD_ELEMENT_OPTIONS}
          onChange={(e) => {
            setCardComplete(e.complete);
            if (e.error) {
              setCardError(e.error.message);
            } else {
              setCardError(null);
            }
          }}
        />
      </div>

      {cardError && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-sans flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{cardError}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full py-3.5 rounded-xl text-xs sm:text-sm font-heading font-black flex items-center justify-center gap-2 shadow-glow-primary uppercase tracking-wider disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Authorizing Card Payment...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Authorize & Pay ${parseFloat(totalUSD || 24.99).toFixed(2)} USD</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="text-[10px] text-center text-gs-muted flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>PCI-DSS Level 1 Certified. Your card data is directly encrypted by Stripe.</span>
      </div>
    </form>
  );
}
