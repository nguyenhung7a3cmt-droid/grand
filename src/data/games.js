export const games = [
  {
    id: 'blox-fruits',
    name: 'Blox Fruits',
    icon: '⚔️🏴‍☠️',
    emoji: '⚔️',
    count: '48 items',
    popular: true,
    desc: 'Permanent fruits, gamepasses & physical items',
    tagline: 'Most Popular Anime RPG',
    accentColor: '#EE1D36',
    gradient: 'from-red-600/20 to-orange-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'permanent-fruits', name: 'Permanent Fruits', emoji: '🍇' },
      { id: 'physical-fruits', name: 'Physical Fruits', emoji: '🍎' },
      { id: 'gamepasses', name: 'Gamepasses & Items', emoji: '🎫' },
      { id: 'swords', name: 'Swords & Melee', emoji: '⚔️' },
      { id: 'bundles', name: 'Bundles & Accounts', emoji: '🎁' }
    ]
  },
  {
    id: 'mm2',
    name: 'Murder Mystery 2',
    icon: '🔪🩸',
    emoji: '🔪',
    count: '36 items',
    popular: true,
    desc: 'Godlies, Ancients & Chroma sets',
    tagline: 'Legendary Knives & Guns',
    accentColor: '#A855F7',
    gradient: 'from-purple-600/20 to-pink-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'godly-weapons', name: 'Godly Weapons', emoji: '🗡️' },
      { id: 'chroma-sets', name: 'Chroma Sets', emoji: '🌈' },
      { id: 'ancients', name: 'Ancient & Unique', emoji: '👑' },
      { id: 'bundles', name: 'Knife Bundles', emoji: '🎁' }
    ]
  },
  {
    id: 'gpo',
    name: 'Grand Piece Online',
    icon: '🌊⛵',
    emoji: '🌊',
    count: '24 items',
    popular: true,
    desc: 'All Seeing Eye, Chests & Fruit Bags',
    tagline: 'High-Sea High-Tier Trades',
    accentColor: '#06B6D4',
    gradient: 'from-cyan-600/20 to-blue-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'mythical-fruits', name: 'Mythical Fruits', emoji: '🍍' },
      { id: 'chests', name: 'Legendary Chests', emoji: '📦' },
      { id: 'accessories', name: 'Rare Accessories', emoji: '👑' },
      { id: 'gamepasses', name: 'Gamepasses', emoji: '🎫' }
    ]
  },
  {
    id: 'fisch',
    name: 'Fisch',
    icon: '🎣🐟',
    emoji: '🎣',
    count: '20 items',
    popular: true,
    desc: 'Mythical rods, relics & in-game cash',
    tagline: 'Deep Sea Angler Marketplace',
    accentColor: '#10B981',
    gradient: 'from-emerald-600/20 to-teal-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'rods', name: 'Mythical Rods', emoji: '🔱' },
      { id: 'relics', name: 'Enchant Relics', emoji: '🔮' },
      { id: 'currency', name: 'Coins & Cash', emoji: '💰' },
      { id: 'bait-traps', name: 'Bait & Traps', emoji: '🦐' }
    ]
  },
  {
    id: 'brainrot',
    name: 'Steal a Brainrot',
    icon: '🧠🗿',
    emoji: '🧠',
    count: '16 items',
    popular: true,
    desc: 'Brainrot pets & rare seeds',
    tagline: 'Meme Pets & Instant Spawns',
    accentColor: '#F59E0B',
    gradient: 'from-amber-600/20 to-yellow-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'pets', name: 'Brainrot Pets', emoji: '🗿' },
      { id: 'seeds', name: 'Rare Seeds', emoji: '🌱' },
      { id: 'potions', name: 'Speed Potions', emoji: '🧪' },
      { id: 'currency', name: 'Coins', emoji: '🪙' }
    ]
  },
  {
    id: 'anime-defenders',
    name: 'Anime Defenders',
    icon: '⚡⛩️',
    emoji: '⚡',
    count: '18 items',
    popular: false,
    desc: 'Mythic units, traits & gems',
    tagline: 'Top Meta Tower Defense',
    accentColor: '#3B82F6',
    gradient: 'from-blue-600/20 to-indigo-600/10',
    categories: [
      { id: 'all', name: 'All Items', emoji: '✨' },
      { id: 'units', name: 'Mythic Units', emoji: '🧙' },
      { id: 'gems', name: 'Gems & Currency', emoji: '💎' },
      { id: 'traits', name: 'Trait Crystals', emoji: '🔮' },
      { id: 'vip', name: 'VIP Gamepasses', emoji: '🎫' }
    ]
  }
];

export const getGameById = (id) => games.find(g => g.id === id);
