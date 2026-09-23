const STORAGE_KEY_REVIEWS = 'tanstock_real_discord_reviews_v12';
const CHANNEL_NAME = 'tanstock_reviews_bus_v12';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {}

const listeners = new Set();
let cachedReviews = [];

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      listeners.forEach((callback) => {
        try { callback(event.data); } catch (e) {}
      });
    }
  };
}

export function getStoredReviews() {
  if (cachedReviews.length > 0) return cachedReviews;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedReviews = parsed;
        return parsed;
      }
    }
  } catch (e) {}
  return [];
}

export function saveStoredReviews(reviewsList) {
  cachedReviews = reviewsList;
  try {
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(reviewsList));
  } catch (e) {}
}

export const reviewService = {
  subscribe(callback) {
    listeners.add(callback);
    // Fetch fresh reviews on subscribe
    this.fetchLiveReviews().catch(() => {});
    return () => listeners.delete(callback);
  },

  getAllReviews() {
    return getStoredReviews();
  },

  getReviewByOrderId(orderId) {
    if (!orderId) return null;
    const cleanId = String(orderId).trim();
    const all = getStoredReviews();
    return all.find(r => 
      r.orderId === cleanId || 
      r.id === cleanId || 
      r.id === `rev-${cleanId}` ||
      (r.orderId && r.orderId.toLowerCase() === cleanId.toLowerCase())
    ) || null;
  },

  async fetchLiveReviews() {
    try {
      const res = await fetch('/api/reviews/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.reviews) && data.reviews.length > 0) {
          const formatted = data.reviews.map(r => ({
            id: r.id,
            orderId: r.id.replace('rev-disc-', 'GS-DISC-').replace('rev-', ''),
            author: r.buyer_name || 'Discord Customer',
            buyerMasked: r.buyer_masked,
            avatar: r.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(r.buyer_name || 'customer')}`,
            stars: Number(r.rating || 5),
            date: r.timestamp || 'Discord Vouch',
            game: r.game || 'Blox Fruits',
            itemPurchased: r.game ? `${r.game} In-Game Item` : 'Roblox In-Game Item',
            verified: true,
            comment: r.comment || 'Verified Discord Vouch ⭐⭐⭐⭐⭐',
            createdAt: r.created_at
          }));
          saveStoredReviews(formatted);
          const eventPayload = { type: 'REVIEWS_UPDATED', reviews: formatted };
          listeners.forEach(cb => { try { cb(eventPayload); } catch (e) {} });
          return formatted;
        }
      }
    } catch (e) {}
    return getStoredReviews();
  },

  addReview({ orderId, author, avatar, stars = 5, game = 'Blox Fruits', itemPurchased = 'Roblox Item', comment = '' }) {
    const all = getStoredReviews();
    const cleanOrderId = orderId || `GS-${Date.now().toString().slice(-6)}`;
    
    const newReview = {
      id: `rev-${cleanOrderId}`,
      orderId: cleanOrderId,
      author: author || 'Verified Customer',
      stars: Math.max(1, Math.min(5, stars || 5)),
      date: 'Just now',
      timestamp: Date.now(),
      game: game || 'Blox Fruits',
      itemPurchased: itemPurchased || 'Roblox In-Game Item',
      verified: true,
      avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(author || 'customer')}`,
      comment: comment.trim() || 'Fast and safe trade! 100% satisfied with GrandStock service.'
    };

    const updatedList = [newReview, ...all];
    saveStoredReviews(updatedList);

    const eventPayload = { type: 'REVIEW_ADDED', review: newReview, reviews: updatedList };
    if (broadcastChannel) {
      try { broadcastChannel.postMessage(eventPayload); } catch (e) {}
    }
    listeners.forEach((callback) => {
      try { callback(eventPayload); } catch (e) {}
    });

    return newReview;
  }
};
