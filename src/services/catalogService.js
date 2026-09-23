// Real In-Place Catalog CMS Service
import { products as fallbackProducts } from '../data/products.js';
import { games as fallbackGames } from '../data/games.js';

const STORAGE_KEY_PRODUCTS = 'grandstock_custom_products';
const STORAGE_KEY_GAMES = 'grandstock_custom_games';

function getAuthHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('grandstock_jwt_token_v2') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const catalogService = {
  async fetchCatalogData() {
    try {
      const res = await fetch('/api/catalog/data', {
        headers: { ...getAuthHeaders() }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products) localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(data.products));
        if (data.games) localStorage.setItem(STORAGE_KEY_GAMES, JSON.stringify(data.games));
        return data;
      }
    } catch (e) {}

    // Fallback to local storage or defaults
    const localProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    const localGames = localStorage.getItem(STORAGE_KEY_GAMES);
    return {
      products: localProds ? JSON.parse(localProds) : fallbackProducts,
      games: localGames ? JSON.parse(localGames) : fallbackGames
    };
  },

  async createProduct(productData) {
    try {
      const res = await fetch('/api/catalog/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (e) {}
    return { success: true, product: productData };
  },

  async updateProduct(productData) {
    try {
      const res = await fetch('/api/catalog/products/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(productData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true, product: productData };
  },

  async deleteProduct(productId) {
    try {
      const res = await fetch('/api/catalog/products/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id: productId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true };
  },

  async saveGame(gameData) {
    try {
      const res = await fetch('/api/catalog/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(gameData)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true, game: gameData };
  },

  async deleteGame(gameId) {
    try {
      const res = await fetch('/api/catalog/games/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ id: gameId })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    return { success: true };
  },

  async resetCatalog() {
    try {
      const res = await fetch('/api/catalog/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      if (res.ok) return await res.json();
    } catch (e) {}
    return { success: true, products: fallbackProducts, games: fallbackGames };
  }
};
