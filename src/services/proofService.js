import { maskRobloxUsername } from '../utils/privacyMask.js';

const STORAGE_KEY_PROOFS = 'tanstock_real_discord_proofs_v14';
const CHANNEL_NAME = 'tanstock_proofs_bus_v14';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {}

const listeners = new Set();
let cachedProofs = [];

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      listeners.forEach((cb) => {
        try { cb(event.data); } catch (e) {}
      });
    }
  };
}

export function getStoredProofs() {
  if (cachedProofs.length > 0) return cachedProofs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROOFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Discard if containing expired discord attachments
        const hasExpired = parsed.some(p => p.proofScreenshot && p.proofScreenshot.includes('cdn.discordapp.com/attachments/'));
        if (!hasExpired) {
          cachedProofs = parsed;
          return parsed;
        }
      }
    }
  } catch (e) {}
  return [];
}

export function saveStoredProofs(proofs) {
  cachedProofs = proofs;
  try {
    localStorage.setItem(STORAGE_KEY_PROOFS, JSON.stringify(proofs));
  } catch (e) {}
}

export const proofService = {
  subscribe(callback) {
    listeners.add(callback);
    this.fetchAllProofs().catch(() => {});
    return () => listeners.delete(callback);
  },

  async fetchAllProofs() {
    try {
      const res = await fetch('/api/proofs/list');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.proofs) && data.proofs.length > 0) {
          saveStoredProofs(data.proofs);
          listeners.forEach((cb) => {
            try { cb({ type: 'PROOFS_SYNCED', proofs: data.proofs }); } catch (e) {}
          });
          return data.proofs;
        }
      }
    } catch (err) {}
    return getStoredProofs();
  },

  getAllProofs() {
    return getStoredProofs();
  },

  getProofsByGame(gameId) {
    const proofs = getStoredProofs();
    if (!gameId || gameId === 'all') return proofs;
    return proofs.filter(p => (p.game || '').toLowerCase().replace(/\s+/g, '-') === gameId.toLowerCase());
  },

  createProofFromTicket(ticket, proofImageUrl, tradeNotes = '') {
    if (!ticket) return null;

    const newProof = {
      id: `proof-${Date.now()}`,
      orderNumber: ticket.orderId || ticket.id,
      buyerUsername: ticket.buyer?.robloxUsername || 'RobloxPlayer',
      buyerMasked: maskRobloxUsername(ticket.buyer?.robloxUsername || 'RobloxPlayer'),
      buyerAvatar: ticket.buyer?.avatar || '',
      countryCode: ticket.countryCode || 'US',
      countryName: ticket.countryName || 'United States',
      countryFlag: ticket.countryFlag || '🇺🇸',
      staffName: ticket.staff?.name || 'Agent Alex',
      staffAvatar: ticket.staff?.avatar || '',
      staffBadge: ticket.staff?.badge || 'VERIFIED STAFF',
      game: ticket.game || 'Blox Fruits',
      item: (ticket.items && ticket.items[0]?.name) || 'In-Game Items',
      itemImage: (ticket.items && ticket.items[0]?.image) || '/items/bf-perm-kitsune.png',
      proofScreenshot: proofImageUrl,
      amount: `$${Number(ticket.total || 0).toFixed(2)}`,
      timestamp: 'Just now',
      verified: true,
      auditId: ticket.auditId || `GS-AUDIT-${ticket.orderId}`,
      auditSignature: ticket.auditSignature || `SIG-GS-2026-VERIFIED`,
      tradeNotes: tradeNotes || `Hand delivered to @${ticket.buyer?.robloxUsername} by staff ${ticket.staff?.name}.`
    };

    const currentProofs = getStoredProofs();
    const updated = [newProof, ...currentProofs];
    saveStoredProofs(updated);

    if (broadcastChannel) {
      try { broadcastChannel.postMessage({ type: 'PROOF_ADDED', proof: newProof, proofs: updated }); } catch (e) {}
    }
    listeners.forEach((cb) => {
      try { cb({ type: 'PROOF_ADDED', proof: newProof, proofs: updated }); } catch (e) {}
    });

    return newProof;
  },

  async saveProof(proof) {
    if (!proof) return null;
    try {
      const res = await fetch('/api/proofs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof)
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.proofs)) {
          saveStoredProofs(data.proofs);
          if (broadcastChannel) {
            try { broadcastChannel.postMessage({ type: 'PROOFS_SYNCED', proofs: data.proofs }); } catch (e) {}
          }
          listeners.forEach((cb) => {
            try { cb({ type: 'PROOFS_SYNCED', proofs: data.proofs }); } catch (e) {}
          });
          return data.proofs;
        }
      }
    } catch (err) {}

    // Fallback local storage update
    const current = getStoredProofs();
    const idx = current.findIndex(p => p.id === proof.id || p.orderNumber === proof.orderNumber);
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...proof };
    } else {
      updated = [proof, ...current];
    }
    saveStoredProofs(updated);
    if (broadcastChannel) {
      try { broadcastChannel.postMessage({ type: 'PROOFS_SYNCED', proofs: updated }); } catch (e) {}
    }
    listeners.forEach((cb) => {
      try { cb({ type: 'PROOFS_SYNCED', proofs: updated }); } catch (e) {}
    });
    return updated;
  },

  async deleteProof(proofId) {
    if (!proofId) return;
    try {
      const res = await fetch('/api/proofs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: proofId })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.proofs)) {
          saveStoredProofs(data.proofs);
          if (broadcastChannel) {
            try { broadcastChannel.postMessage({ type: 'PROOFS_SYNCED', proofs: data.proofs }); } catch (e) {}
          }
          listeners.forEach((cb) => {
            try { cb({ type: 'PROOFS_SYNCED', proofs: data.proofs }); } catch (e) {}
          });
          return data.proofs;
        }
      }
    } catch (err) {}

    const current = getStoredProofs();
    const updated = current.filter(p => p.id !== proofId && p.orderNumber !== proofId);
    saveStoredProofs(updated);
    if (broadcastChannel) {
      try { broadcastChannel.postMessage({ type: 'PROOFS_SYNCED', proofs: updated }); } catch (e) {}
    }
    listeners.forEach((cb) => {
      try { cb({ type: 'PROOFS_SYNCED', proofs: updated }); } catch (e) {}
    });
    return updated;
  }
};
