export const reviews = [
  {
    id: 'rev-1',
    author: 'KitsuneMaster_99',
    stars: 5,
    date: '2 hours ago',
    game: 'Blox Fruits',
    itemPurchased: 'Permanent Kitsune Fruit',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=KitsuneMaster',
    comment: 'Literally received the trade invite within 15 seconds of paying. The staff agent accepted immediately in chat in Cafe Second Sea. GrandStock is 1000x faster than Discord sellers.'
  },
  {
    id: 'rev-2',
    author: 'ScytheGod_MM2',
    stars: 5,
    date: '4 hours ago',
    game: 'Murder Mystery 2',
    itemPurchased: 'Harvester Scythe',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ScytheGod',
    comment: 'Got my Harvester scythe instantly. Clean serial, zero trade locks. The automated bot system is insanely futuristic and smooth!'
  },
  {
    id: 'rev-3',
    author: 'SeaHunter_GPO',
    stars: 5,
    date: '6 hours ago',
    game: 'Grand Piece Online',
    itemPurchased: 'All Seeing Eye (ASE)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SeaHunter',
    comment: 'I was hesitant about buying an ASE online, but GrandStock escrow made it 100% painless. Bot joined my trade hub server right away.'
  },
  {
    id: 'rev-4',
    author: 'AnglerPro_Fisch',
    stars: 5,
    date: '9 hours ago',
    game: 'Fisch',
    itemPurchased: 'Destiny Rod (Max Enchanted)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AnglerPro',
    comment: 'Max enchanted Destiny Rod with Fortune and Mutated enchants already equipped. Caught 2 colossal squids in my first hour. 10/10!'
  },
  {
    id: 'rev-5',
    author: 'DragonAwakened',
    stars: 5,
    date: '12 hours ago',
    game: 'Blox Fruits',
    itemPurchased: 'Permanent Dragon (Rework Edition)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DragonAwakened',
    comment: 'Instant delivery during peak hours when other sites take hours. Applied the GRAND10 coupon code for an easy discount too.'
  },
  {
    id: 'rev-6',
    author: 'ChromaCollector',
    stars: 5,
    date: '14 hours ago',
    game: 'Murder Mystery 2',
    itemPurchased: 'Chroma Candleflame',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChromaCollector',
    comment: 'Completed my Chroma knife collection thanks to GrandStock. Customer support answered my question about in-game staff trades in 30 seconds.'
  },
  {
    id: 'rev-7',
    author: 'SigmaGrindset',
    stars: 5,
    date: '18 hours ago',
    game: 'Steal a Brainrot',
    itemPurchased: 'Mythic Sigma Skibidi Cat',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SigmaGrindset',
    comment: 'This pet is ridiculous LOL. The 500% speed bonus makes stealing so effortless. Super fast checkout with Apple Pay.'
  },
  {
    id: 'rev-8',
    author: 'SoloDefender_AD',
    stars: 5,
    date: '1 day ago',
    game: 'Anime Defenders',
    itemPurchased: 'Solar God (Almighty Trait)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=SoloDefender',
    comment: 'Almighty trait already rolled on it saved me thousands of reroll gems. Easiest Infinity clear of my life.'
  },
  {
    id: 'rev-9',
    author: 'ValkyrieSwords',
    stars: 5,
    date: '1 day ago',
    game: 'Blox Fruits',
    itemPurchased: 'Dark Blade (Yoru) Gamepass',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ValkyrieSwords',
    comment: 'Direct gamepass gift showed up in my notifications instantly. Smooth UI and ultra responsive team.'
  },
  {
    id: 'rev-10',
    author: 'RevolverElite',
    stars: 5,
    date: '2 days ago',
    game: 'Murder Mystery 2',
    itemPurchased: 'Corrupt Knife (Original)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=RevolverElite',
    comment: 'Been wanting an authentic Corrupt knife since 2019. GrandStock is the only site with verified clean inventory stock.'
  },
  {
    id: 'rev-11',
    author: 'DeepOceanKing',
    stars: 5,
    date: '2 days ago',
    game: 'Fisch',
    itemPurchased: '1,000,000 C$ (Fisch Cash)',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=DeepOceanKing',
    comment: 'Received my 1 Million Fisch cash without any issues. Traded through high-value relics. Best Roblox store hands down.'
  },
  {
    id: 'rev-12',
    author: 'MochiComboLord',
    stars: 5,
    date: '3 days ago',
    game: 'Blox Fruits',
    itemPurchased: 'Permanent Dough Fruit',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MochiComboLord',
    comment: 'The 1-on-1 live staff chat ticket is amazing! Agent Alex was super friendly and fast, you just enter server, accept trade and done!'
  },
  {
    id: 'rev-13',
    author: 'MythicRaider_GPO',
    stars: 5,
    date: '3 days ago',
    game: 'Grand Piece Online',
    itemPurchased: '10x Mythical Chest Bundle',
    verified: true,
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=MythicRaider',
    comment: 'Pulled a Pika and Tori from the 10 chests! Best purchase ever. Escrow bot delivery was under 30 seconds.'
  }
];

export const getReviewsByGame = (gameName) => {
  if (!gameName || gameName === 'all') return reviews;
  return reviews.filter(r => r.game.toLowerCase().includes(gameName.toLowerCase()));
};
