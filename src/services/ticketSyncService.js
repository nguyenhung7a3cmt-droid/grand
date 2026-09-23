import { getClientCountry } from '../utils/countryLocation.js';
import { proofService } from './proofService.js';
/**
 * GRANDSTOCK REAL-TIME TICKET & 2-WAY LIVE CHAT SERVICE
 * BroadcastChannel + LocalStorage + Server REST API Sync
 */

const STORAGE_KEY_TICKETS = 'grandstock_live_tickets';
const CHANNEL_NAME = 'grandstock_tickets_bus';

let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {}

const listeners = new Set();

if (broadcastChannel) {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      listeners.forEach((callback) => {
        try { callback(event.data); } catch (err) {}
      });
    }
  };
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_TICKETS && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        listeners.forEach((callback) => {
          callback({ type: 'TICKETS_UPDATED', tickets: parsed });
        });
      } catch (err) {}
    }
  });
}

function broadcast(eventData) {
  if (broadcastChannel) {
    try { broadcastChannel.postMessage(eventData); } catch (e) {}
  }
  listeners.forEach((callback) => {
    try { callback(eventData); } catch (err) {}
  });
}

export function getStoredTickets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveStoredTickets(tickets) {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (e) {}
}

async function syncServer(endpoint, payload) {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('grandstock_jwt_token_v2') : null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (e) {}
}

export const ticketSyncService = {
  subscribe(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getAllTickets() {
    return getStoredTickets();
  },

  getTicketById(ticketId) {
    if (!ticketId) return null;
    const tickets = getStoredTickets();
    const cleanId = String(ticketId).trim();
    return tickets.find(t =>
      t.id === cleanId ||
      t.orderId === cleanId ||
      t.id === `TICKET-${cleanId}` ||
      t.orderId === `GS-${cleanId}` ||
      (cleanId.startsWith('TICKET-') && t.orderId === cleanId.replace('TICKET-', '')) ||
      (t.id && t.id.toLowerCase() === cleanId.toLowerCase()) ||
      (t.orderId && t.orderId.toLowerCase() === cleanId.toLowerCase())
    );
  },

  publishTicket(order) {
    if (!order) return null;
    return this.createTicket({
      orderId: order.id || order.orderNumber,
      buyerUser: order.robloxUser || { username: order.buyerUsername, avatarUrl: order.buyerAvatar },
      items: order.items || [],
      total: order.total || 0,
      pinCode: order.verificationPin || order.pinCode,
      paymentMethod: order.paymentMethod
    });
  },

  createTicket({ orderId, buyerUser, items, total, pinCode, paymentMethod }) {
    const tickets = getStoredTickets();
    const cleanOrderId = orderId || `GS-${Date.now().toString().slice(-6)}`;
    const existing = this.getTicketById(cleanOrderId);
    if (existing) return existing;

    const safeItems = Array.isArray(items) ? items : (items ? [items] : []);
    const itemNames = safeItems.map(i => i?.name || i?.item || 'Roblox Item').join(', ') || 'Roblox Item';
    const primaryGame = (safeItems && (safeItems[0]?.gameName || safeItems[0]?.game)) || 'Blox Fruits';

    const clientGeo = getClientCountry();
    const newTicket = {
      id: `TICKET-${cleanOrderId}`,
      orderId: cleanOrderId,
      countryCode: clientGeo.code,
      countryName: clientGeo.name,
      countryFlag: clientGeo.flag,
      clientTimezone: typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'Asia/Ho_Chi_Minh',
      createdAt: new Date().toISOString(),
      status: 'UNCLAIMED',
      statusStep: 1,
      game: primaryGame,
      items: safeItems,
      total: total || 0,
      pinCode: pinCode || '8842',
      paymentMethod: paymentMethod || 'Credit / Debit Card (Stripe)',
      buyer: {
        id: buyerUser?.id || 'guest',
        name: buyerUser?.name || 'Customer',
        robloxUsername: buyerUser?.robloxUsername || buyerUser?.username || 'RobloxPlayer',
        avatar: buyerUser?.avatar || buyerUser?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'
      },
      staff: null,
      auditId: `GS-AUDIT-${cleanOrderId}`,
      auditSignature: `SIG-GS-2026-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      typing: null,
      proofScreenshot: null,
      tradeNotes: '',
      messages: [
        {
          id: `msg-sys-${Date.now()}`,
          sender: 'system',
          senderName: 'GrandStock Security',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Payment authorized via ${paymentMethod || 'Stripe'}. Ticket #TICKET-${cleanOrderId} opened for [${itemNames}]. Broadcasted to live staff queue.`
        }
      ]
    };

    const updated = [newTicket, ...tickets];
    saveStoredTickets(updated);
    broadcast({ type: 'TICKET_CREATED', ticket: newTicket, tickets: updated });
    syncServer('/api/tickets/create', newTicket);
    return newTicket;
  },

  claimTicket(ticketId, staffUser) {
    const tickets = getStoredTickets();
    const cleanId = String(ticketId).trim();
    const index = tickets.findIndex(t =>
      t.id === cleanId || t.orderId === cleanId || t.id === `TICKET-${cleanId}`
    );
    if (index === -1) return null;

    const target = tickets[index];

    // Prevent sending messages to delivered/closed tickets
    if (target.status === 'DELIVERED') {
      console.warn('Ticket is DELIVERED and closed. Message sending blocked:', cleanId);
      return target;
    }
    const staffObj = {
      id: staffUser?.id || 'staff-1',
      name: staffUser?.name || 'Agent Alex',
      robloxUsername: staffUser?.robloxUsername || 'GS_AlexStaff',
      role: staffUser?.role === 'admin' ? 'Lead Administrator' : 'Senior Delivery Specialist',
      badge: staffUser?.role === 'admin' ? 'LEAD ADMIN' : 'VERIFIED STAFF',
      rating: staffUser?.rating || '5.0★',
      avatar: staffUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    };

    const updatedTicket = {
      ...target,
      status: 'CLAIMED',
      statusStep: 2,
      claimedAt: new Date().toISOString(),
      staff: staffObj,
      messages: [
        ...(target.messages || []),
        {
          id: `msg-staff-claim-${Date.now()}`,
          sender: 'staff',
          senderName: staffObj.name,
          avatar: staffObj.avatar,
          badge: staffObj.badge,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Hello @${target.buyer?.robloxUsername || 'Customer'}! 👋 I have claimed your ticket. I am preparing your items now. Please add my Roblox account @${staffObj.robloxUsername} to trade in-game. Your verification trade PIN is #${target.pinCode}.`,
          hasActions: true
        }
      ]
    };

    tickets[index] = updatedTicket;
    saveStoredTickets(tickets);
    broadcast({ type: 'TICKET_CLAIMED', ticket: updatedTicket, tickets });
    syncServer('/api/tickets/claim', { ticketId: target.id, staffUser: staffObj });
    return updatedTicket;
  },

  unclaimTicket(ticketId, staffUser, reason = 'Agent released ticket to queue') {
    const tickets = getStoredTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.orderId === ticketId);
    if (index === -1) return null;

    const target = tickets[index];
    const unclaimMsg = {
      id: `msg-sys-unclaim-${Date.now()}`,
      sender: 'system',
      senderName: 'GrandStock Dispatcher',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `🔄 ${staffUser?.name || 'Staff'} released this ticket back to the queue (${reason}). Finding next available agent.`
    };

    const updatedTicket = {
      ...target,
      status: 'UNCLAIMED',
      statusStep: 1,
      staff: null,
      messages: [...(target.messages || []), unclaimMsg]
    };

    tickets[index] = updatedTicket;
    saveStoredTickets(tickets);
    broadcast({ type: 'TICKET_UNCLAIMED', ticket: updatedTicket, tickets });
    return updatedTicket;
  },

  transferTicket(ticketId, fromStaffUser, toStaffUser, reason = 'Specialist reassignment') {
    const tickets = getStoredTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.orderId === ticketId);
    if (index === -1) return null;

    const target = tickets[index];
    const newStaffObj = {
      id: toStaffUser.id,
      name: toStaffUser.name,
      robloxUsername: toStaffUser.robloxUsername || 'GS_StaffAgent',
      role: toStaffUser.role === 'admin' ? 'Lead Administrator' : 'Senior Delivery Specialist',
      badge: toStaffUser.role === 'admin' ? 'LEAD ADMIN' : 'VERIFIED STAFF',
      rating: toStaffUser.rating || '5.0★',
      avatar: toStaffUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    };

    const transferMsg = {
      id: `msg-sys-transfer-${Date.now()}`,
      sender: 'system',
      senderName: 'GrandStock Dispatcher',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `🔀 Ticket transferred from ${fromStaffUser.name} to ${newStaffObj.name} (${reason}).`
    };

    const updatedTicket = {
      ...target,
      status: 'CLAIMED',
      staff: newStaffObj,
      messages: [...(target.messages || []), transferMsg]
    };

    tickets[index] = updatedTicket;
    saveStoredTickets(tickets);
    broadcast({ type: 'TICKET_TRANSFERRED', ticket: updatedTicket, tickets });
    return updatedTicket;
  },

  // 2-Way Message Dispatch (Instant local, storage, broadcast, and server)
  sendMessage(ticketId, { sender, senderName, avatar, badge, text, attachment, attachments, hasActions } = {}) {
    const tickets = getStoredTickets();
    const cleanId = String(ticketId).trim();
    const index = tickets.findIndex(t =>
      t.id === cleanId ||
      t.orderId === cleanId ||
      t.id === `TICKET-${cleanId}` ||
      (cleanId.startsWith('TICKET-') && t.orderId === cleanId.replace('TICKET-', ''))
    );

    if (index === -1) {
      console.warn('Ticket not found for sendMessage:', ticketId);
      return null;
    }

    const safeText = typeof text === 'string' ? text.trim() : '';
    const safeAttachments = Array.isArray(attachments)
      ? attachments
      : (attachment ? [attachment] : []);

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: sender || 'buyer',
      senderName: senderName || (sender === 'staff' ? 'Staff Agent' : 'Customer'),
      avatar: avatar || null,
      badge: badge || (sender === 'staff' ? 'VERIFIED STAFF' : null),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: safeText,
      attachment: safeAttachments[0] || null,
      attachments: safeAttachments,
      hasActions: Boolean(hasActions)
    };

    const target = tickets[index];
    const updatedTicket = {
      ...target,
      statusStep: target.statusStep < 3 && sender === 'staff' ? 3 : target.statusStep,
      typing: null,
      messages: [...(target.messages || []), newMsg]
    };

    tickets[index] = updatedTicket;
    saveStoredTickets(tickets);
    broadcast({ type: 'MESSAGE_SENT', ticketId: target.id, orderId: target.orderId, message: newMsg, ticket: updatedTicket, tickets });
    syncServer('/api/chat/send', { ticketId: target.id, ...newMsg });
    return updatedTicket;
  },

  setTyping(ticketId, senderName, isTyping) {
    broadcast({ type: 'TYPING_STATUS', ticketId, senderName, isTyping });
  },

  markDelivered(ticketId, staffUser, uploadedProofScreenshot, tradeNotes = '') {
    if (!uploadedProofScreenshot) return null;

    const tickets = getStoredTickets();
    const index = tickets.findIndex(t => t.id === ticketId || t.orderId === ticketId);
    if (index === -1) return null;

    const target = tickets[index];
    const completionMsg = {
      id: `msg-sys-done-${Date.now()}`,
      sender: 'system',
      senderName: 'GrandStock Security',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `✅ In-game trade confirmed & delivered by ${staffUser?.name || 'Staff'}. Order #${target.orderId} completed with verified trade screenshot.`
    };

    const updatedTicket = {
      ...target,
      status: 'DELIVERED',
      statusStep: 5,
      proofScreenshot: uploadedProofScreenshot,
      tradeNotes: tradeNotes || `Delivered to @${target.buyer?.robloxUsername || 'Customer'}.`,
      completedAt: new Date().toISOString(),
      staff: staffUser || target.staff,
      messages: [...(target.messages || []), completionMsg]
    };

    tickets[index] = updatedTicket;
    saveStoredTickets(tickets);
    try {
      proofService.createProofFromTicket(updatedTicket, uploadedProofScreenshot, tradeNotes);
    } catch (e) {}
    broadcast({ type: 'TICKET_COMPLETED', ticket: updatedTicket, ticketId: target.id });
    syncServer('/api/tickets/deliver', {
      ticketId: target.id,
      staffUser,
      proofScreenshot: uploadedProofScreenshot,
      tradeNotes
    });
    return updatedTicket;
  }
};
