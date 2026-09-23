import { soundFx } from '../../utils/soundFx';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Zap, Sparkles, Flame, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { products } from '../../data/products';

export default function SearchBar() {
  const {
    searchQuery,
    setSearchQuery,
    selectedGame,
    formatPrice,
    openProductModal,
    triggerAudio
  } = useStore();

  const [isFocused, setIsFocused] = useState(false);
  const searchInputRef = useRef(null);
  const containerRef = useRef(null);

  // Global Keyboard Shortcut: '/' or 'Ctrl+K' / 'Cmd+K'
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        triggerAudio('click');
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        if (
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA'
        ) {
          e.preventDefault();
          searchInputRef.current?.focus();
          triggerAudio('click');
        }
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        searchInputRef.current?.blur();
        setIsFocused(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerAudio]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered live results preview
  const liveResults = useMemo(() => {
    const query = (searchQuery || '').trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((p) => {
        const matchesQuery =
          p.name.toLowerCase().includes(query) ||
          p.gameName.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.rarity.toLowerCase().includes(query);

        if (selectedGame !== 'all') {
          return matchesQuery && p.gameId === selectedGame;
        }
        return matchesQuery;
      })
      .slice(0, 6);
  }, [searchQuery, selectedGame]);

  const handleSelectProduct = (product) => {
    openProductModal(product);
    setIsFocused(false);
    triggerAudio('click');
  };

  const handleClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
    triggerAudio('click');
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* ---------------------------------------------------- */}
      {/* Search Bar Input Container                           */}
      {/* ---------------------------------------------------- */}
      <div
        className={`relative flex items-center w-full rounded-2xl transition-all duration-300 border bg-gs-card/90 backdrop-blur-md ${
          isFocused
            ? 'border-gs-primary shadow-[0_0_25px_rgba(238,29,54,0.35)] bg-gs-card'
            : 'border-gs-border hover:border-gs-border-glow'
        }`}
      >
        <div className="pl-4 pr-2 text-gs-muted">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-gs-primary' : 'text-gs-muted'}`} />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { setIsFocused(true); soundFx.searchFocus(); }}
          placeholder="Search items, Godlies, Fruits, Rods, Gamepasses... (e.g. Kitsune, Harvester)"
          className="w-full py-3.5 pr-20 bg-transparent text-sm sm:text-base text-white placeholder:text-gs-muted/70 focus:outline-none font-sans"
        />

        {/* Action icons / Shortcut badge */}
        <div className="absolute right-3 flex items-center gap-2">
          {searchQuery && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md text-gs-muted hover:text-white hover:bg-gs-raised transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-gs-raised border border-gs-border text-[11px] font-mono text-gs-muted select-none">
            <span>Ctrl</span>
            <span>+</span>
            <span className="font-bold text-white">K</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Instant Search Results Dropdown Preview              */}
      {/* ---------------------------------------------------- */}
      <AnimatePresence>
        {isFocused && searchQuery.trim().length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-gs-card/95 border border-gs-border rounded-2xl shadow-2xl backdrop-blur-xl p-3 z-40 overflow-hidden"
          >
            {/* Header info */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gs-border/60 text-xs font-heading font-semibold text-gs-muted uppercase tracking-wider">
              <span>
                Matching Items ({liveResults.length})
              </span>
              <span className="text-[10px] text-gs-primary font-sans lowercase font-normal flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" /> click to inspect
              </span>
            </div>

            {/* Results List */}
            {liveResults.length > 0 ? (
              <div className="mt-2 space-y-1.5 max-h-80 overflow-y-auto">
                {liveResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left bg-gs-card/60 hover:bg-gs-raised border border-transparent hover:border-gs-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-gs-raised border border-gs-border/80 shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>

                      <div>
                        <div className="font-heading font-bold text-sm text-white group-hover:text-gs-primary-glow flex items-center gap-1.5">
                          <span>{product.name}</span>
                          {product.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-gs-primary/20 text-gs-primary border border-gs-primary/30">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gs-muted flex items-center gap-2 mt-0.5">
                          <span>{product.gameName}</span>
                          <span>•</span>
                          <span className="capitalize text-gs-light/70">{product.rarity}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-0.5 text-[11px]">
                            <Zap className="w-3 h-3" /> Instant
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-heading font-black text-sm text-white">
                        {formatPrice(product.price)}
                      </div>
                      {product.originalPrice && (
                        <div className="text-[11px] text-gs-muted line-through font-mono">
                          {formatPrice(product.originalPrice)}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-gs-muted text-sm font-sans">
                No items found matching "<span className="text-white font-medium">{searchQuery}</span>".
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
