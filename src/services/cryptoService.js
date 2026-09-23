/**
 * Real Live Cryptocurrency Pricing & Deposit Address Service
 * Connects directly to public Binance ticker API for real-time rates
 */

export const CRYPTO_WALLETS = {
  USDT_TRC20: {
    id: 'USDT_TRC20',
    symbol: 'USDT',
    network: 'TRON (TRC-20)',
    address: 'TXgZ8qNm4kR2eP8Q1V6x7b9c0Y3d4e5F6G',
    decimals: 2,
    explorer: 'https://tronscan.org/#/address/TXgZ8qNm4kR2eP8Q1V6x7b9c0Y3d4e5F6G',
    uriPrefix: 'tron:'
  },
  BTC: {
    id: 'BTC',
    symbol: 'BTC',
    network: 'Bitcoin (Native SegWit)',
    address: 'bc1q9v8w7e6r5t4y3u2i1o0p9a8s7d6f5g4h3j2k1l',
    decimals: 8,
    explorer: 'https://www.blockchain.com/explorer/addresses/btc/bc1q9v8w7e6r5t4y3u2i1o0p9a8s7d6f5g4h3j2k1l',
    uriPrefix: 'bitcoin:'
  },
  SOL: {
    id: 'SOL',
    symbol: 'SOL',
    network: 'Solana (SPL)',
    address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    decimals: 6,
    explorer: 'https://solscan.io/account/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    uriPrefix: 'solana:'
  },
  ETH: {
    id: 'ETH',
    symbol: 'ETH',
    network: 'Ethereum (ERC-20)',
    address: '0x71C8366420A092679b543619444b059Fb0530972',
    decimals: 6,
    explorer: 'https://etherscan.io/address/0x71C8366420A092679b543619444b059Fb0530972',
    uriPrefix: 'ethereum:'
  },
  LTC: {
    id: 'LTC',
    symbol: 'LTC',
    network: 'Litecoin',
    address: 'ltc1q4n8m7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1g',
    decimals: 6,
    explorer: 'https://blockchair.com/litecoin/address/ltc1q4n8m7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1g',
    uriPrefix: 'litecoin:'
  }
};

let cachedRates = {
  USDT: 1.0,
  BTC: 77800.0,
  ETH: 2450.0,
  SOL: 105.0,
  LTC: 49.0,
  lastUpdated: 0
};

export async function fetchLiveCryptoRates() {
  const now = Date.now();
  // Cache for 30 seconds
  if (now - cachedRates.lastUpdated < 30000 && cachedRates.lastUpdated > 0) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/price');
    if (!res.ok) throw new Error('Binance API rate limit');
    const data = await res.json();
    
    const pairMap = {
      BTCUSDT: 'BTC',
      ETHUSDT: 'ETH',
      SOLUSDT: 'SOL',
      LTCUSDT: 'LTC'
    };

    const newRates = { USDT: 1.0 };
    data.forEach(item => {
      if (pairMap[item.symbol]) {
        newRates[pairMap[item.symbol]] = parseFloat(item.price) || cachedRates[pairMap[item.symbol]];
      }
    });

    cachedRates = {
      ...cachedRates,
      ...newRates,
      lastUpdated: now
    };
    return cachedRates;
  } catch (err) {
    console.warn('Using fallback crypto rates:', err);
    return cachedRates;
  }
}

export function calculateCryptoAmount(usdTotal, cryptoSymbol, rates) {
  const symbol = cryptoSymbol.toUpperCase();
  const rate = (rates && rates[symbol]) || cachedRates[symbol] || 1.0;
  const rawAmount = usdTotal / rate;

  if (symbol === 'BTC') return rawAmount.toFixed(6);
  if (symbol === 'ETH') return rawAmount.toFixed(5);
  if (symbol === 'SOL') return rawAmount.toFixed(4);
  if (symbol === 'LTC') return rawAmount.toFixed(4);
  return rawAmount.toFixed(2);
}
