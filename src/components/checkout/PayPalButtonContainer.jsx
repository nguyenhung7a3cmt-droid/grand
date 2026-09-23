import React, { useState } from 'react';
import { PayPalButtons } from '@paypal/react-paypal-js';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function PayPalButtonContainer({ totalUSD, robloxUsername, onSuccess, onError }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const amount = parseFloat(totalUSD || 24.99).toFixed(2);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-heading font-bold uppercase text-gs-muted">
        <span>PayPal Official Gateway:</span>
        <span className="text-[#0070BA] font-mono flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> Buyer Escrow Active
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-sans flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isProcessing && (
        <div className="p-4 rounded-2xl bg-gs-card border border-gs-border text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#0070BA] mx-auto" />
          <p className="text-xs text-white font-mono font-bold">Confirming PayPal Payment...</p>
        </div>
      )}

      <div className="relative z-10 min-h-[140px] pt-1">
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'paypal',
            height: 44
          }}
          createOrder={async () => {
            setErrorMsg(null);
            try {
              const res = await fetch('/api/paypal/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  robloxUsername: robloxUsername || 'Customer'
                })
              });
              const orderData = await res.json();
              if (!res.ok || (!orderData.orderID && !orderData.id)) {
                throw new Error(orderData.error || 'Failed to create PayPal order on server.');
              }
              return orderData.orderID || orderData.id;
            } catch (err) {
              console.error('PayPal create-order error:', err);
              setErrorMsg(err.message || 'Could not initiate PayPal order.');
              if (onError) onError(err);
              throw err;
            }
          }}
          onApprove={async (data) => {
            setIsProcessing(true);
            setErrorMsg(null);
            try {
              const res = await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderID: data.orderID,
                  robloxUsername: robloxUsername || 'Customer'
                })
              });
              const captureData = await res.json();
              if (!res.ok || captureData.error || (captureData.status !== 'COMPLETED' && !captureData.success)) {
                throw new Error(captureData.error || 'Payment capture failed or amount verification failed.');
              }
              const transactionId = captureData.transactionId || captureData.id || data.orderID;
              onSuccess({
                method: 'PayPal Escrow',
                transactionId: transactionId,
                payerEmail: captureData.payerEmail || captureData.payer?.email_address,
                payerName: captureData.payerName || captureData.payer?.name?.given_name,
                orderID: data.orderID,
                captureData
              });
            } catch (err) {
              console.error('PayPal capture error:', err);
              setErrorMsg(err.message || 'Payment could not be captured. Please try again.');
              if (onError) onError(err);
            } finally {
              setIsProcessing(false);
            }
          }}
          onError={(err) => {
            console.error('PayPal button error:', err);
            setErrorMsg('PayPal encountered an error. Please try again or switch payment method.');
            if (onError) onError(err);
          }}
        />
      </div>

      <p className="text-[11px] text-center text-gs-muted font-sans">
        Instant 1-on-1 staff ticket opened upon PayPal authorization. 100% money-back escrow guarantee.
      </p>
    </div>
  );
}
