import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PackageSearch, ArrowUpDown, Plus } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import ProductCard from './ProductCard';

export default function ProductGrid() {
  const {
    products,
    selectedGame,
    selectedCategory,
    searchQuery,
    games,
    isAdminEditMode,
    openProductEditor,
    triggerAudio
  } = useStore();

  const { isAdmin } = useAuth();
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price-asc' | 'price-desc' | 'name'

  const activeGame = games.find((g) => g.id === selectedGame);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by game
    if (selectedGame !== 'all') {
      list = list.filter((p) => p.gameId === selectedGame);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.gameName?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    // Sort products
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Default: popular / priority
      list.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }

    return list;
  }, [products, selectedGame, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="product-catalog" className="py-6 sm:py-8 scroll-mt-24 relative">
      <div id="catalog-section" className="absolute -top-24 left-0 pointer-events-none" />
      {/* Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gs-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-heading font-black text-xl sm:text-2xl text-white uppercase tracking-wider">
              {selectedGame === 'all' ? 'All Roblox Items' : activeGame?.name || 'Roblox Items'}
            </h2>
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-gs-primary/15 text-gs-primary border border-gs-primary/30">
              {filteredProducts.length} Items
            </span>
          </div>
          <p className="text-xs text-gs-muted mt-1 font-sans">
            {activeGame?.desc || 'Browse our full verified catalog of permanent fruits, Godlies, rods, and passes.'}
          </p>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-gs-muted shrink-0" />
          <span className="text-[11px] font-heading font-bold uppercase text-gs-muted">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gs-card border border-gs-border text-white text-xs font-heading font-bold focus:border-gs-primary focus:outline-none"
          >
            <option value="popular">★ Featured &amp; Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Grid View */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}

          {/* IN-PLACE "+ ADD NEW ITEM" GRID CARD */}
          {isAdmin && isAdminEditMode && (
            <button
              type="button"
              onClick={() => { openProductEditor(null); triggerAudio?.('click'); }}
              className="min-h-[280px] rounded-2xl sm:rounded-3xl border-2 border-dashed border-purple-500/50 hover:border-purple-400 bg-purple-950/20 hover:bg-purple-950/40 transition-all flex flex-col items-center justify-center p-6 text-center group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-black text-white text-base uppercase">
                + Add New Product
              </h3>
              <p className="text-xs text-purple-300/80 mt-1 max-w-xs">
                Instantly list a new item to {activeGame?.name || 'this catalog'}
              </p>
            </button>
          )}
        </div>
      ) : (
        <div className="py-16 text-center space-y-4 rounded-3xl bg-gs-card border border-gs-border p-8">
          <div className="w-16 h-16 rounded-2xl bg-gs-raised border border-gs-border flex items-center justify-center text-gs-muted mx-auto">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="font-heading font-bold text-lg text-white uppercase">
            No items found matching your filters
          </h3>
          <p className="text-xs text-gs-muted max-w-md mx-auto">
            Try searching for another item name, clearing category filters, or switching game tabs.
          </p>

          {isAdmin && (
            <button
              type="button"
              onClick={() => { openProductEditor(null); triggerAudio?.('click'); }}
              className="btn-primary px-6 py-2.5 rounded-xl text-xs font-heading font-bold inline-flex items-center gap-1.5 shadow-glow-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product To This Game</span>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
