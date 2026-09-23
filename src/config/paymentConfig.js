/**
 * GrandStock Real Payment Gateways & API Configuration
 * Supports Live & Sandbox modes with real providers (Stripe, PayPal, Web3, Binance)
 */

export const PAYMENT_CONFIG = {
  // PayPal Configuration
  // Default 'test' runs on PayPal Sandbox with real interactive popup & testing accounts
  paypal: {
    clientId: 'test',
    currency: 'USD',
    intent: 'capture',
    enableFunding: 'card,paylater,venmo'
  },

  // Stripe Configuration
  stripe: {
    publishableKey: 'pk_test_51NABCxyzGrandStockPublicTestingKey2026',
    merchantName: 'GrandStock.net',
    statementDescriptor: 'GRANDSTOCK ROBLOX'
  },

  // Crypto Deposit Wallets (Web3 & On-Chain)
  crypto: {
    wallets: {
      USDT_TRC20: {
        symbol: 'USDT',
        network: 'TRON (TRC-20)',
        address: 'TXgZ8qNm4kR2eP8Q1V6x7b9c0Y3d4e5F6G',
        explorer: 'https://tronscan.org/#/address/TXgZ8qNm4kR2eP8Q1V6x7b9c0Y3d4e5F6G'
      },
      BTC: {
        symbol: 'BTC',
        network: 'Bitcoin Native SegWit',
        address: 'bc1q9v8w7e6r5t4y3u2i1o0p9a8s7d6f5g4h3j2k1l',
        explorer: 'https://www.blockchain.com/explorer/addresses/btc/bc1q9v8w7e6r5t4y3u2i1o0p9a8s7d6f5g4h3j2k1l'
      },
      SOL: {
        symbol: 'SOL',
        network: 'Solana (SPL)',
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        explorer: 'https://solscan.io/account/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
      },
      ETH: {
        symbol: 'ETH',
        network: 'Ethereum (ERC-20)',
        address: '0x71C8366420A092679b543619444b059Fb0530972',
        explorer: 'https://etherscan.io/address/0x71C8366420A092679b543619444b059Fb0530972'
      },
      LTC: {
        symbol: 'LTC',
        network: 'Litecoin',
        address: 'ltc1q4n8m7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1g',
        explorer: 'https://blockchair.com/litecoin/address/ltc1q4n8m7x6w5v4u3t2s1r0q9p8o7n6m5l4k3j2h1g'
      }
    }
  },

  // Cash App Pay Configuration
  cashApp: {
    cashtag: 'GrandStockHQ'
  }
};
