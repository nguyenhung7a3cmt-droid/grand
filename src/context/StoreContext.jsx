import { fetchRobloxUser } from '../services/robloxService';
import { soundFx } from '../utils/soundFx';
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { products as initialProducts } from '../data/products';
import { games as initialGames } from '../data/games';
import { ticketSyncService } from '../services/ticketSyncService';
import { proofService } from '../services/proofService';
import { catalogService } from '../services/catalogService';

const StoreContext = createContext(null);

const STORAGE_KEYS = {
  CART: 'grandstock_cart_v2',
  CURRENCY: 'grandstock_currency_v2',
  ROBLOX_USER: 'grandstock_roblox_user_v2',
  ORDERS: 'grandstock_orders_history_v3',
  ACTIVE_ORDER: 'grandstock_active_order_v3',
  SOUND: 'grandstock_sound_enabled_v2'
};

const CURRENCY_RATES = {
  USD: { code: 'USD', symbol: '$', rate: 1.0, name: 'US Dollar', flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, name: 'Euro', flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, name: 'British Pound', flag: '🇬🇧' },
  VND: { code: 'VND', symbol: '₫', rate: 25400.0, name: 'Vietnamese Dong', flag: '🇻🇳' },
  JPY: { code: 'JPY', symbol: '¥', rate: 155.0, name: 'Japanese Yen', flag: '🇯🇵' },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.52, name: 'Australian Dollar', flag: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', rate: 1.36, name: 'Canadian Dollar', flag: '🇨🇦' },
  PHP: { code: 'PHP', symbol: '₱', rate: 58.5, name: 'Philippine Peso', flag: '🇵🇭' },
  ROBUX: { code: 'ROBUX', symbol: 'R$', rate: 250.0, name: 'Robux Equivalent', flag: '🪙' }
};

const PROMO_CODES = {
  'GRAND10': { discount: 0.10, description: '10% Launch Special Discount' },
  'GS5': { discount: 0.05, description: '5% Instant Order Savings' },
  'PETMART': { discount: 0.15, description: '15% PetMart Partner Discount' },
  'STAFFFREE': { discount: 0.99, description: '99% Developer Test Code' }
};

export function StoreProvider({ children }) {
  // ----------------------------------------------------
  // Dynamic Catalog State (In-Place CMS)
  // ----------------------------------------------------
  const [products, setProducts] = useState(initialProducts);
  const [games, setGames] = useState(initialGames);
  const [isAdminEditMode, setIsAdminEditMode] = useState(false);
  const [isProductEditorOpen, setIsProductEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isGameEditorOpen, setIsGameEditorOpen] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  // Load live catalog on startup
  useEffect(() => {
    async function loadCatalog() {
      const data = await catalogService.fetchCatalogData();
      if (data.products && data.products.length > 0) {
        const existingIds = new Set(data.products.map(p => p.id));
        const missing = initialProducts.filter(p => !existingIds.has(p.id));
        setProducts([...data.products, ...missing]);
      }
      if (data.games && data.games.length > 0) {
        setGames(data.games.map(g => {
          const fallback = initialGames.find(fg => fg.id === g.id);
          return {
            ...fallback,
            ...g,
            categories: (g.categories && g.categories.length > 0) ? g.categories : (fallback?.categories || [])
          };
        }));
      }
    }
    loadCatalog();
  }, []);

  const toggleAdminEditMode = useCallback(() => {
    setIsAdminEditMode(prev => !prev);
  }, []);

  const openProductEditor = useCallback((product = null) => {
    setEditingProduct(product);
    setIsProductEditorOpen(true);
  }, []);

  const closeProductEditor = useCallback(() => {
    setIsProductEditorOpen(false);
    setEditingProduct(null);
  }, []);

  const openGameEditor = useCallback((game = null) => {
    setEditingGame(game);
    setIsGameEditorOpen(true);
  }, []);

  const closeGameEditor = useCallback(() => {
    setIsGameEditorOpen(false);
    setEditingGame(null);
  }, []);

  // Save / Update Product
  const saveProduct = useCallback(async (productData) => {
    const isExisting = products.some(p => p.id === productData.id);
    let result;
    if (isExisting) {
      result = await catalogService.updateProduct(productData);
      setProducts(prev => prev.map(p => p.id === productData.id ? { ...p, ...productData } : p));
    } else {
      result = await catalogService.createProduct(productData);
      setProducts(prev => [productData, ...prev]);
    }
    return result;
  }, [products]);

  // Delete Product
  const deleteProduct = useCallback(async (productId) => {
    await catalogService.deleteProduct(productId);
    setProducts(prev => prev.filter(p => p.id !== productId));
  }, []);

  // Save / Update Game
  const saveGame = useCallback(async (gameData) => {
    await catalogService.saveGame(gameData);
    setGames(prev => {
      const idx = prev.findIndex(g => g.id === gameData.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...gameData };
        return copy;
      }
      return [...prev, gameData];
    });
  }, []);

  // Delete Game
  const deleteGame = useCallback(async (gameId) => {
    await catalogService.deleteGame(gameId);
    setGames(prev => prev.filter(g => g.id !== gameId));
  }, []);

  // Reset Catalog
  const resetCatalog = useCallback(async () => {
    const data = await catalogService.resetCatalog();
    setProducts(data.products || initialProducts);
    setGames(data.games || initialGames);
  }, []);

  // ----------------------------------------------------
  // Audio Feedback
  // ----------------------------------------------------
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (!next) {
        soundFx.buttonClick();
      }
      localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(next));
      if (next) {
        soundFx.buttonClick();
      }
      return next;
    });
  }, []);

  const triggerAudio = useCallback((type = 'click') => {
    if (type === 'cart') soundFx.addToCart();
    else if (type === 'success') soundFx.success();
    else if (type === 'error') soundFx.error();
    else if (type === 'hover') soundFx.hover();
    else if (type === 'tab') soundFx.tabSwitch();
    else if (type === 'drawer') soundFx.drawerOpen();
    else if (type === 'modal') soundFx.modalOpen();
    else soundFx.click();
    return;
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'cart') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.06);
        osc.frequency.setValueAtTime(783.99, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'success') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.08);
        osc.frequency.setValueAtTime(659.25, now + 0.16);
        osc.frequency.setValueAtTime(880, now + 0.24);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch {}
  }, [soundEnabled]);

  // ----------------------------------------------------
  // Cart State
  // ----------------------------------------------------
  const [cartToast, setCartToast] = useState(null);
  const [cartBounceKey, setCartBounceKey] = useState(0);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CART);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  const addToCart = useCallback((product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: Math.min(product.stock || 99, item.quantity + qty) }
            : item
        );
      }
      return [...prev, { ...product, quantity: qty }];
    });
    setCartToast({ product, quantity: qty, timestamp: Date.now() });
    setCartBounceKey(prev => prev + 1);
    soundFx.addToCart();
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, qty) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: qty } : item
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Express 1-Click Buy Now (Direct Checkout Bypass)
  const buyNow = useCallback((product, qty = 1) => {
    if (!product) return;
    const cleanQty = Math.max(1, qty || 1);
    setCart([{ ...product, quantity: cleanQty }]);
    setActiveProductModal(null);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
    soundFx.modalOpen();
  }, []);

  // ----------------------------------------------------
  // Currency & Formatter
  // ----------------------------------------------------
  const [currency, setCurrency] = useState('USD');

  const convertPrice = useCallback((usdAmount) => {
    const activeRate = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
    return usdAmount * activeRate.rate;
  }, [currency]);

  const formatPrice = useCallback((usdAmount) => {
    const activeRate = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;
    const converted = usdAmount * activeRate.rate;
    if (currency === 'ROBUX') {
      return `${Math.round(converted).toLocaleString()} R$`;
    }
    if (currency === 'VND') {
      return `${Math.round(converted).toLocaleString()} ₫`;
    }
    if (currency === 'JPY') {
      return `¥${Math.round(converted).toLocaleString()}`;
    }
    return `${activeRate.symbol}${converted.toFixed(2)}`;
  }, [currency]);

  // ----------------------------------------------------
  // Cart Totals & Pricing Computations
  // ----------------------------------------------------
  const cartCount = useMemo(() => cart.reduce((acc, it) => acc + it.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((acc, it) => acc + (it.price * it.quantity), 0), [cart]);

  // ----------------------------------------------------
  // Dynamic Coupons & Discounts
  // ----------------------------------------------------
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const applyCoupon = useCallback(async (code) => {
    const clean = (code || '').trim().toUpperCase();
    if (!clean) return { success: false, message: 'Please enter a coupon code' };

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: clean, cartTotal: cartSubtotal })
      });
      const data = await res.json();
      if (res.ok && data.valid && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          discount: data.coupon.discount,
          discountPct: data.coupon.discountPct,
          description: data.coupon.description,
          minSpend: data.coupon.minSpend
        });
        soundFx.success?.();
        return { success: true, message: data.message || `Coupon ${clean} applied: ${data.coupon.discountPct}% OFF` };
      } else {
        soundFx.error?.();
        return { success: false, message: data.error || 'Invalid or expired coupon code' };
      }
    } catch (e) {
      return { success: false, message: 'Failed to validate promo code. Please try again.' };
    }
  }, [cartSubtotal]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const cartDiscountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return cartSubtotal * appliedCoupon.discount;
  }, [cartSubtotal, appliedCoupon]);
  const cartTotal = useMemo(() => Math.max(0, cartSubtotal - cartDiscountAmount), [cartSubtotal, cartDiscountAmount]);

  // ----------------------------------------------------
  // Filters & Search
  // ----------------------------------------------------
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // ----------------------------------------------------
  // Roblox User & Modals State
  // ----------------------------------------------------
  const [robloxUser, setRobloxUserState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROBLOX_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.isValid) return parsed;
      }
    } catch {}
    return {
      username: '',
      displayName: '',
      id: null,
      isValid: false,
      isChecking: false,
      avatarUrl: '',
      notFound: false
    };
  });

  const clearRobloxUser = useCallback(() => {
    const emptyUser = {
      username: '',
      displayName: '',
      id: null,
      isValid: false,
      isChecking: false,
      avatarUrl: '',
      notFound: false
    };
    setRobloxUserState(emptyUser);
    try {
      localStorage.removeItem(STORAGE_KEYS.ROBLOX_USER);
    } catch {}
    soundFx.click?.();
  }, []);

  const lookupTimeoutRef = useRef(null);

  const setRobloxUsername = useCallback((username) => {
    const clean = (username || '').trim();
    if (!clean) {
      clearRobloxUser();
      return;
    }

    setRobloxUserState({
      username: clean,
      displayName: clean,
      id: null,
      isValid: false,
      isChecking: true,
      avatarUrl: '',
      notFound: false
    });

    if (lookupTimeoutRef.current) {
      clearTimeout(lookupTimeoutRef.current);
    }

    lookupTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await fetchRobloxUser(clean);
        if (result && result.isValid) {
          const validUser = {
            username: result.username,
            displayName: result.displayName,
            id: result.id,
            isValid: true,
            isChecking: false,
            avatarUrl: result.avatarUrl,
            notFound: false
          };
          setRobloxUserState(validUser);
          try {
            localStorage.setItem(STORAGE_KEYS.ROBLOX_USER, JSON.stringify(validUser));
          } catch {}
          soundFx.success?.();
        } else {
          const invalidUser = {
            username: clean,
            displayName: clean,
            id: null,
            isValid: false,
            isChecking: false,
            avatarUrl: '',
            notFound: true,
            errorMessage: result?.errorMessage || 'Player not found on Roblox'
          };
          setRobloxUserState(invalidUser);
          try {
            localStorage.removeItem(STORAGE_KEYS.ROBLOX_USER);
          } catch {}
          soundFx.error?.();
        }
      } catch (e) {
        setRobloxUserState({
          username: clean,
          displayName: clean,
          id: null,
          isValid: false,
          isChecking: false,
          avatarUrl: '',
          notFound: true,
          errorMessage: 'Roblox verification failed'
        });
      }
    }, 350);
  }, [clearRobloxUser]);

  const [activeProductModal, setActiveProductModal] = useState(null);
  const openProductModal = useCallback((p) => { setActiveProductModal(p); triggerAudio('click'); }, [triggerAudio]);
  const closeProductModal = useCallback(() => { setActiveProductModal(null); triggerAudio('click'); }, [triggerAudio]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const openCart = useCallback(() => { setIsCartOpen(true); soundFx.drawerOpen(); }, []);
  const closeCart = useCallback(() => { setIsCartOpen(false); soundFx.drawerClose(); }, []);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const openCheckout = useCallback(() => { setIsCheckoutOpen(true); triggerAudio('click'); }, [triggerAudio]);
  const closeCheckout = useCallback(() => { setIsCheckoutOpen(false); triggerAudio('click'); }, [triggerAudio]);

  const [isOrderTrackingOpen, setIsOrderTrackingOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  // Persistent Orders History
  const [ordersHistory, setOrdersHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent Active Order
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_ORDER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync ordersHistory to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(ordersHistory));
    } catch (e) {}
  }, [ordersHistory]);

  // Sync activeOrder to localStorage
  useEffect(() => {
    try {
      if (activeOrder) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ORDER, JSON.stringify(activeOrder));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ORDER);
      }
    } catch (e) {}
  }, [activeOrder]);

  // Real-time synchronization between tickets and orders history
  useEffect(() => {
    const syncOrdersWithTickets = () => {
      const tickets = ticketSyncService.getAllTickets();
      if (!tickets || tickets.length === 0) return;

      setOrdersHistory(prevOrders => {
        let changed = false;
        const updated = prevOrders.map(ord => {
          const matchingTicket = tickets.find(t => t.orderId === ord.id || t.orderId === ord.orderNumber || t.id === ord.id);
          if (matchingTicket && matchingTicket.status && matchingTicket.status !== ord.status) {
            changed = true;
            return {
              ...ord,
              status: matchingTicket.status,
              proofScreenshot: matchingTicket.proofScreenshot || ord.proofScreenshot,
              staff: matchingTicket.staff || ord.staff,
              tradeNotes: matchingTicket.tradeNotes || ord.tradeNotes,
              completedAt: matchingTicket.completedAt || ord.completedAt || new Date().toISOString()
            };
          }
          return ord;
        });
        return changed ? updated : prevOrders;
      });
    };

    syncOrdersWithTickets();

    const unsubscribe = ticketSyncService.subscribe((event) => {
      syncOrdersWithTickets();
    });

    return () => unsubscribe();
  }, []);

  const isOrderDelivered = useCallback((order) => {
    if (!order) return false;
    if (order.status === 'DELIVERED' || order.status === 'COMPLETED') return true;
    const liveTicket = ticketSyncService.getTicketById(order.id || order.orderNumber);
    if (liveTicket && (liveTicket.status === 'DELIVERED' || liveTicket.status === 'COMPLETED')) return true;
    return false;
  }, []);

  const ongoingOrders = useMemo(() => {
    return ordersHistory.filter(o => !isOrderDelivered(o));
  }, [ordersHistory, isOrderDelivered]);

  const completedOrders = useMemo(() => {
    return ordersHistory.filter(o => isOrderDelivered(o));
  }, [ordersHistory, isOrderDelivered]);

  const openOrdersModal = useCallback(() => {
    setIsOrdersModalOpen(true);
    soundFx.click();
  }, []);

  const closeOrdersModal = useCallback(() => {
    setIsOrdersModalOpen(false);
    soundFx.modalClose();
  }, []);

  const resumeOrderChat = useCallback((order) => {
    if (!order) return;
    setActiveOrder(order);
    setIsOrdersModalOpen(false);
    setIsOrderTrackingOpen(true);
    soundFx.modalOpen();
  }, []);

  const openReceiptModal = useCallback((order) => {
    setSelectedReceiptOrder(order);
    soundFx.click();
  }, []);

  const closeReceiptModal = useCallback(() => {
    setSelectedReceiptOrder(null);
    soundFx.modalClose();
  }, []);

  // Create Order Dispatcher & Launch Live Staff Chat
  const createOrder = useCallback((paymentDetails = {}) => {
    const orderId = `GS-${Math.floor(100000 + Math.random() * 900000)}`;
    const pinCode = String(Math.floor(1000 + Math.random() * 9000));
    const newOrder = {
      id: orderId,
      orderNumber: orderId,
      ticketId: `TICK-${orderId.replace('GS-', '')}`,
      createdAt: new Date().toISOString(),
      status: 'UNCLAIMED',
      total: cartTotal,
      subtotal: cartSubtotal,
      discount: cartDiscountAmount,
      items: [...cart],
      robloxUser: { ...robloxUser },
      buyerUsername: robloxUser?.username || 'huypropsp',
      buyerAvatar: robloxUser?.avatarUrl,
      discordHandle: paymentDetails.discordHandle || '',
      paymentMethod: paymentDetails.method || 'Credit / Debit Card',
      verificationPin: pinCode,
      pinCode: pinCode
    };

    try {
      ticketSyncService.createTicket({
        orderId: newOrder.id,
        buyerUser: robloxUser,
        items: newOrder.items,
        total: newOrder.total,
        pinCode: pinCode,
        couponCode: appliedCoupon?.code || null,
        paymentMethod: newOrder.paymentMethod
      });
    } catch (e) {
      console.error('Error creating live ticket:', e);
    }

    setActiveOrder(newOrder);
    setOrdersHistory(prev => [newOrder, ...prev]);
    clearCart();
    setIsCartOpen(false);
    setIsCheckoutOpen(false);
    setIsOrderTrackingOpen(true);
    triggerAudio('success');
    return newOrder;
  }, [cart, cartTotal, cartSubtotal, cartDiscountAmount, robloxUser, clearCart, triggerAudio]);

  const [isProofsModalOpen, setIsProofsModalOpen] = useState(false);
  const openProofsModal = useCallback(() => { setIsProofsModalOpen(true); soundFx.modalOpen(); }, []);
  const closeProofsModal = useCallback(() => { setIsProofsModalOpen(false); soundFx.modalClose(); }, []);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const openStatusModal = useCallback(() => { setIsStatusModalOpen(true); soundFx.modalOpen(); }, []);
  const closeStatusModal = useCallback(() => { setIsStatusModalOpen(false); soundFx.modalClose(); }, []);

  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const openTutorialModal = useCallback(() => { setIsTutorialModalOpen(true); soundFx.modalOpen(); }, []);
  const closeTutorialModal = useCallback(() => { setIsTutorialModalOpen(false); soundFx.modalClose(); }, []);

  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const openSupportModal = useCallback(() => { setIsSupportModalOpen(true); soundFx.modalOpen(); }, []);
  const closeSupportModal = useCallback(() => { setIsSupportModalOpen(false); soundFx.modalClose(); }, []);

  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const openAffiliateModal = useCallback(() => { setIsAffiliateModalOpen(true); soundFx.modalOpen(); }, []);
  const closeAffiliateModal = useCallback(() => { setIsAffiliateModalOpen(false); soundFx.modalClose(); }, []);

  const value = {
    // Dynamic In-Place Catalog CMS
    products,
    games,
    isAdminEditMode,
    toggleAdminEditMode,
    isProductEditorOpen,
    openProductEditor,
    closeProductEditor,
    editingProduct,
    isGameEditorOpen,
    openGameEditor,
    closeGameEditor,
    editingGame,
    saveProduct,
    deleteProduct,
    saveGame,
    deleteGame,
    resetCatalog,

    // Cart
    cart,
    cartCount,
    cartToast,
    setCartToast,
    cartBounceKey,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    buyNow,

    // Currency
    currency,
    setCurrency,
    currencies: Object.values(CURRENCY_RATES),
    formatPrice,
    convertPrice,

    // Filters & Search
    selectedGame,
    setSelectedGame,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,

    // Roblox User
    robloxUser,
    setRobloxUsername,
    clearRobloxUser,

    // Coupons
    appliedCoupon,
    applyCoupon,
    removeCoupon,

    // Orders & Tracking
    activeOrder,
    setActiveOrder,
    ordersHistory: ordersHistory || [],
    setOrdersHistory,
    ongoingOrders: ongoingOrders || [],
    completedOrders: completedOrders || [],
    isOrdersModalOpen,
    openOrdersModal,
    closeOrdersModal,
    resumeOrderChat,
    createOrder,
    isOrderTrackingOpen,
    setIsOrderTrackingOpen,
    openOrderTracking: (o) => { if (o) setActiveOrder(o); setIsOrderTrackingOpen(true); },
    closeOrderTracking: () => setIsOrderTrackingOpen(false),
    selectedReceiptOrder,
    openReceiptModal: (o) => setSelectedReceiptOrder(o),
    closeReceiptModal: () => setSelectedReceiptOrder(null),

    // Modals
    activeProductModal,
    setActiveProductModal,
    openProductModal,
    closeProductModal,
    isCartOpen,
    openCart,
    closeCart,
    isCheckoutOpen,
    openCheckout,
    closeCheckout,
    isProofsModalOpen,
    openProofsModal,
    closeProofsModal,
    isStatusModalOpen,
    openStatusModal,
    closeStatusModal,
    isTutorialModalOpen,
    openTutorialModal,
    closeTutorialModal,
    isSupportModalOpen,
    openSupportModal,
    closeSupportModal,
    isAffiliateModalOpen,
    openAffiliateModal,
    closeAffiliateModal,

    // Sound
    soundEnabled,
    toggleSound,
    triggerAudio
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}

export default StoreContext;
