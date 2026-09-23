import { soundFx } from '../../utils/soundFx';
import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, Plus, Edit3 } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import CustomEmoji from '../common/CustomEmoji';

export default function GameFilterTabs() {
  const {
    games,
    selectedGame,
    setSelectedGame,
    selectedCategory,
    setSelectedCategory,
    products,
    isAdminEditMode,
    openGameEditor,
    triggerAudio
  } = useStore();

  const { isAdmin } = useAuth();

  const activeGameObject = games.find((g) => g.id === selectedGame);
  const categoriesList = activeGameObject?.categories || [
    { id: 'all', name: 'All Categories', emoji: '✨' }
  ];

  const getProductCountForGame = (gameId) => {
    if (gameId === 'all') return products.length;
    return products.filter((p) => p.gameId === gameId).length;
  };

  return (
    <div className="space-y-3">
      {/* Horizontal Game Switcher Tabs */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
          {/* 'All Games' Tab */}
          <button
            type="button"
            onClick={() => { setSelectedGame('all'); setSelectedCategory('all'); soundFx.tabSwitch(); }}
            className={`px-4 py-2.5 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shrink-0 border ${
              selectedGame === 'all'
                ? 'bg-gs-primary text-white border-gs-primary shadow-glow-primary'
                : 'bg-gs-card text-gs-muted hover:text-white border-gs-border hover:border-gs-border/90'
            }`}
          >
            <CustomEmoji name="all" type="game" size="sm" />
            <span>All Games</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
              selectedGame === 'all' ? 'bg-white/20 text-white' : 'bg-gs-raised text-gs-muted'
            }`}>
              {getProductCountForGame('all')}
            </span>
          </button>

          {/* Individual Games */}
          {games.map((game) => {
            const count = getProductCountForGame(game.id);
            const isSelected = selectedGame === game.id;
            const gameIconSource = game.iconImage || game.image || game.icon;
            const isImageUrl = typeof gameIconSource === 'string' && (gameIconSource.startsWith('http') || gameIconSource.startsWith('data:image') || gameIconSource.startsWith('/'));

            return (
              <div key={game.id} className="relative shrink-0 flex items-center">
                <button
                  type="button"
                  onClick={() => { setSelectedGame(game.id); setSelectedCategory('all'); soundFx.tabSwitch(); }}
                  className={`px-4 py-2.5 rounded-2xl font-heading font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2.5 border ${
                    isSelected
                      ? 'bg-gs-raised border-gs-primary text-white shadow-glow-primary'
                      : 'bg-gs-card text-gs-muted hover:text-white border-gs-border hover:border-gs-border/90'
                  }`}
                >
                  {/* Custom Game Thumbnail Image Emoji */}
                  {isImageUrl ? (
                    <img
                      src={gameIconSource}
                      alt={game.name}
                      className="w-5 h-5 rounded-lg object-cover shadow-sm border border-white/10 ring-1 ring-black/40 shrink-0 pointer-events-none"
                    />
                  ) : (
                    <CustomEmoji name={game.id} type="game" size="sm" />
                  )}

                  <span>{game.name}</span>
                  {game.popular && (
                    <Flame className="w-3 h-3 text-gs-primary fill-current shrink-0" />
                  )}
                  <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-gs-primary/20 text-gs-primary-glow border border-gs-primary/30' : 'bg-gs-raised text-gs-muted'
                  }`}>
                    {count}
                  </span>
                </button>

                {/* In-Place Edit Game Tab button */}
                {isAdmin && isAdminEditMode && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openGameEditor(game); soundFx.tabSwitch(); }}
                    className="ml-1 p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs shadow-sm"
                    title={`Edit ${game.name} Tab`}
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* In-Place Add Game Button */}
          {isAdmin && isAdminEditMode && (
            <button
              type="button"
              onClick={() => { openGameEditor(null); soundFx.tabSwitch(); }}
              className="px-3 py-2 rounded-2xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/50 text-purple-300 text-xs font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Game Tab</span>
            </button>
          )}
        </div>
      </div>

      {/* Category Pills */}
      {selectedGame !== 'all' && categoriesList.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-heading font-bold uppercase text-gs-muted shrink-0 flex items-center gap-1">
            <span>Filter:</span>
          </span>
          {categoriesList.map((cat) => {
            const isCatActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setSelectedCategory(cat.id); soundFx.tabSwitch(); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-heading font-bold transition-all flex items-center gap-1.5 shrink-0 border ${
                  isCatActive
                    ? 'bg-gs-raised border-gs-primary text-white shadow-sm'
                    : 'bg-gs-card text-gs-muted hover:text-white border-gs-border'
                }`}
              >
                <CustomEmoji name={cat.id} emoji={cat.emoji} type="category" size="xs" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
