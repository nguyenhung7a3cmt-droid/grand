export const systemStatus = {
  overallUptime: '99.98%',
  avgDeliveryTime: '38s',
  activeBots: 30,
  totalDelivered24h: 1842,
  networkLoad: 'Optimal (18%)',
  nodes: [
    {
      id: 'node-bf',
      name: 'Blox Fruits Trade Node',
      game: 'Blox Fruits',
      online: 12,
      total: 12,
      status: 'Operational',
      queue: 0,
      latency: '24ms',
      type: 'game-node',
      color: '#EE1D36'
    },
    {
      id: 'node-mm2',
      name: 'MM2 Godly Dispatcher',
      game: 'Murder Mystery 2',
      online: 8,
      total: 8,
      status: 'Operational',
      queue: 0,
      latency: '18ms',
      type: 'game-node',
      color: '#A855F7'
    },
    {
      id: 'node-gpo',
      name: 'GPO High-Sea Node',
      game: 'Grand Piece Online',
      online: 6,
      total: 6,
      status: 'Operational',
      queue: 0,
      latency: '31ms',
      type: 'game-node',
      color: '#06B6D4'
    },
    {
      id: 'node-fisch',
      name: 'Fisch Delivery Node',
      game: 'Fisch',
      online: 4,
      total: 4,
      status: 'Operational',
      queue: 0,
      latency: '22ms',
      type: 'game-node',
      color: '#10B981'
    },
    {
      id: 'node-stripe',
      name: 'Stripe & Card Escrow Gateway',
      game: 'Payment System',
      online: 1,
      total: 1,
      health: '100%',
      status: 'Operational',
      queue: 0,
      latency: '45ms',
      type: 'gateway',
      color: '#6366F1'
    },
    {
      id: 'node-crypto',
      name: 'Instant Crypto Settlement Gateway',
      game: 'Payment System',
      online: 1,
      total: 1,
      health: '100%',
      status: 'Operational',
      queue: 0,
      latency: '12ms',
      type: 'gateway',
      color: '#F59E0B'
    }
  ],
  recentIncidents: [
    {
      id: 'inc-0',
      title: 'All Systems Fully Operational',
      date: 'Today',
      description: 'Zero disruptions recorded. 18 verified trade staff specialists active on 24/7 live ticket shifts.',
      status: 'Resolved'
    }
  ]
};
