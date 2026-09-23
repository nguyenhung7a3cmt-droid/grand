import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Copy,
  Check,
  Zap,
  ExternalLink,
  ShieldCheck,
  Clock,
  QrCode,
  ArrowRight,
  Coins
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

const CRYPTO_OPTIONS = [
  {
    id: 'usdt-trc20',
    symbol: 'USDT',
    name: 'Tether USD',
    network: 'TRC-20 (TRON Network)',
    feeNote: 'Lowest Fee: <$0.50 Gas',
    address: 'TWd8Q7rXkKk8P41rE2xZ7Z4vLpXQ2v7m1B',
    explorer: 'https://tronscan.org/#/address/TWd8Q7rXkKk8P41rE2xZ7Z4vLpXQ2v7m1B',
    iconColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    rateUsd: 1.0
  },
  {
    id: 'ltc',
    symbol: 'LTC',
    name: 'Litecoin',
    network: 'Litecoin Mainnet',
    feeNote: 'Ultra-Low Fee: <$0.05',
    address: 'LTC1q8x99vp8d89qwrx7m7l7qq67q2m2p3w8x99',
    explorer: 'https://blockchair.com/litecoin',
    iconColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    rateUsd: 85.0
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana Mainnet',
    feeNote: 'Instant Finality: <$0.01',
    address: '9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    explorer: 'https://solscan.io/account/9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
    iconColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    rateUsd: 180.0
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin Native SegWit',
    feeNote: 'Decentralized Gold',
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    explorer: 'https://blockchair.com/bitcoin',
    iconColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    rateUsd: 65000.0
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum (ERC-20)',
    feeNote: 'Smart Contract Vault',
    address: '0x71C...8942a',
    explorer: 'https://etherscan.io',
    iconColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
    rateUsd: 3200.0
  }
];

export default function CryptoPaymentModal() {
  const {
    isCryptoModalOpen,
    closeCryptoModal,
    cartTotal,
    formatPrice,
    robloxUser,
    triggerAudio
  } = useStore();

  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_OPTIONS[0]);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const [livePrices, setLivePrices] = useState({
    tether: 1.0,
    litecoin: 85.0,
    solana: 180.0,
    bitcoin: 65000.0,
    ethereum: 3200.0
  });

  // Fetch Live Rates from CoinGecko Public API
  useEffect(() => {
    if (!isCryptoModalOpen) return;
    const fetchRates = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,litecoin,solana,bitcoin,ethereum&vs_currencies=usd');
        if (res.ok) {
          const data = await res.json();
          setLivePrices({
            tether: data.tether?.usd || 1.0,
            litecoin: data.litecoin?.usd || 85.0,
            solana: data.solana?.usd || 180.0,
            bitcoin: data.bitcoin?.usd || 65000.0,
            ethereum: data.ethereum?.usd || 3200.0
          });
        }
      } catch (err) {}
    };
    fetchRates();
  }, [isCryptoModalOpen]);

  // 15-minute invoice countdown timer
  useEffect(() => {
    if (!isCryptoModalOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isCryptoModalOpen]);

  if (!isCryptoModalOpen) return null;

  const getPriceForCrypto = (cryptoId) => {
    switch (cryptoId) {
      case 'usdt-trc20': return livePrices.tether;
      case 'ltc': return livePrices.litecoin;
      case 'sol': return livePrices.solana;
      case 'btc': return livePrices.bitcoin;
      case 'eth': return livePrices.ethereum;
      default: return 1.0;
    }
  };

  const rate = getPriceForCrypto(selectedCrypto.id);
  const cryptoAmount = (cartTotal / rate).toFixed(
    selectedCrypto.symbol === 'BTC' ? 6 : selectedCrypto.symbol === 'ETH' ? 5 : selectedCrypto.symbol === 'SOL' ? 4 : selectedCrypto.symbol === 'LTC' ? 4 : 2
  );

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(selectedCrypto.address);
    setCopiedAddress(true);
    triggerAudio('click');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard?.writeText(cryptoAmount);
    setCopiedAmount(true);
    triggerAudio('click');
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Confirm Payment Sent -> Staff Manual Verification Flow
  const handleVerifyPaid = () => {
    setIsPendingVerification(true);
    triggerAudio?.('click');
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md"
      >
        <div className="fixed inset-0" onClick={closeCryptoModal} />

        <motion.div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative bg-gs-card border border-gs-border rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto overscroll-contain z-10 p-5 sm:p-7 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gs-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase flex items-center gap-2">
                  <span>Crypto Invoice</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    LOWEST FEES
                  </span>
                </h2>
                <p className="text-xs text-gs-muted">Live CoinGecko Conversion &bull; 0% Processing Fee</p>
              </div>
            </div>

            <button
              onClick={closeCryptoModal}
              className="p-2 rounded-xl bg-gs-raised text-gs-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Currency Selection Pills */}
          <div>
            <label className="block text-[11px] font-heading font-bold uppercase tracking-wider text-gs-muted mb-1.5">
              Select Blockchain Network:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {CRYPTO_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedCrypto(c); triggerAudio('click'); }}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    selectedCrypto.id === c.id
                      ? 'bg-gs-raised border-gs-primary shadow-glow-primary'
                      : 'bg-gs-card border-gs-border hover:border-gs-border/90'
                  }`}
                >
                  <div className="font-heading font-black text-xs text-white">{c.symbol}</div>
                  <div className="text-[9px] text-gs-muted truncate mt-0.5">{c.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Invoice Box */}
          <div className="p-4 rounded-2xl bg-[#090a0f] border border-gs-border space-y-3.5">
            {/* Amount & Timer */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-heading font-bold uppercase text-gs-muted">Total to Send:</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-mono font-black text-white">{cryptoAmount} {selectedCrypto.symbol}</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">({formatPrice(cartTotal)})</span>
                </div>
              </div>

              <div className="px-2.5 py-1 rounded-lg bg-gs-raised border border-gs-border text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            </div>

            {/* Network Note */}
            <div className="p-2 rounded-xl bg-gs-raised border border-gs-border flex items-center justify-between text-xs">
              <span className="text-gs-muted text-[11px]">Network:</span>
              <strong className="text-white font-mono text-[11px]">{selectedCrypto.network}</strong>
            </div>

            {/* Address Box */}
            <div>
              <label className="block text-[10px] font-heading font-bold uppercase text-gs-muted mb-1">
                Deposit Address:
              </label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gs-card border border-gs-border">
                <span className="text-xs font-mono text-emerald-400 truncate pr-2">
                  {selectedCrypto.address}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="px-2.5 py-1 rounded-lg bg-gs-raised text-[10px] font-mono text-white flex items-center gap-1 hover:border-gs-primary border border-gs-border shrink-0"
                >
                  {copiedAddress ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedAddress ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Confirm Button / Pending Verification Notice */}
          <div className="pt-2 border-t border-gs-border flex flex-col gap-2">
            {isPendingVerification ? (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-heading font-bold text-sm">
                  <Clock className="w-4 h-4 shrink-0 animate-pulse text-amber-400" />
                  <span>Payment Verification Pending</span>
                </div>
                <p className="font-sans text-xs leading-relaxed text-amber-200/90">
                  Payment verification pending — your order will be confirmed once the transaction is verified on-chain. Please allow up to 30 minutes. Staff will manually verify the deposit on the blockchain explorer before fulfilling your order.
                </p>
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={closeCryptoModal}
                    className="px-4 py-2 rounded-xl bg-gs-raised hover:bg-gs-card text-white text-xs font-heading font-bold border border-gs-border transition-colors cursor-pointer"
                  >
                    Close Invoice
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleVerifyPaid}
                className="btn-primary w-full py-3 rounded-xl text-xs font-heading font-black uppercase tracking-wider shadow-glow-primary flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>I Have Sent Payment</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
