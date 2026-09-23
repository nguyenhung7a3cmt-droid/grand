import { soundFx } from '../../utils/soundFx';
import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  ShoppingCart,
  Check,
  Eye,
  Tag,
  Flame,
  ShieldCheck,
  Sparkles,
  Edit3,
  Trash2
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';
import { useDialog } from '../../context/DialogContext';

const RARITY_STYLES = {
  mythical: {
    border: 'border-red-500/40 hover:border-red-500',
    glow: 'group-hover:shadow-[0_0_25px_rgba(238,29,54,0.35)]',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    titleGlow: 'hover:text-red-400'
  },
  godly: {
    border: 'border-rose-500/40 hover:border-rose-500',
    glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.35)]',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    titleGlow: 'hover:text-rose-400'
  },
  legendary: {
    border: 'border-amber-500/40 hover:border-amber-500',
    glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.35)]',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    titleGlow: 'hover:text-amber-400'
  },
  rare: {
    border: 'border-purple-500/40 hover:border-purple-500',
    glow: 'group-hover:shadow-[0_0_25px_rgba(168,85,247,0.35)]',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    titleGlow: 'hover:text-purple-400'
  }
};

const ProductCard = React.forwardRef(({ product }, ref) => {
  const {
    openProductModal,
    addToCart,
    buyNow,
    openCheckout,
    formatPrice,
    isAdminEditMode,
    openProductEditor,
    deleteProduct,
    triggerAudio
  } = useStore();

  const { isAdmin } = useAuth();
  const dialog = useDialog();
  const [isAdded, setIsAdded] = React.useState(false);

  if (!product) return null;

  const rarityStyle = RARITY_STYLES[product.rarity] || RARITY_STYLES.mythical;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
    soundFx.addToCart();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleInstantBuy = (e) => {
    e.stopPropagation();
    buyNow(product, 1);
    soundFx.instantBuy();
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    openProductEditor(product);
    triggerAudio?.('click');
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    const ok = await dialog.confirm({
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.name}" from the store catalog?`,
      confirmText: 'Delete Item',
      variant: 'danger'
    });
    if (ok) {
      deleteProduct(product.id);
      triggerAudio?.('click');
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => openProductModal(product)}
      onMouseEnter={() => soundFx.cardHover()}
      className={`group relative bg-gs-card rounded-2xl sm:rounded-3xl border ${rarityStyle.border} ${rarityStyle.glow} transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer p-4 sm:p-5 transform-gpu w-full max-w-sm sm:max-w-none mx-auto`}
    >
            {/* Holographic Diagonal Light Sheen Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none z-20" />

      {/* Top Bar: Rarity, Badge & Admin In-Place Controls */}
      <div className="flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border ${rarityStyle.badge}`}>
            {product.rarity}
          </span>
          {product.badge && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-heading font-black bg-gs-primary/20 text-gs-primary border border-gs-primary/30 flex items-center gap-1">
              <Flame className="w-3 h-3 fill-current" />
              <span>{product.badge}</span>
            </span>
          )}
        </div>

        {/* IN-PLACE ADMIN CONTROLS */}
        {isAdmin ? (
          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-purple-500/50 shadow-lg">
            <button
              type="button"
              onClick={handleEditClick}
              className="p-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
              title="Edit Product Details"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors cursor-pointer"
              title="Delete Product"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              -{discountPercent}% OFF
            </span>
          )
        )}
      </div>

      {/* Image Thumbnail */}
      <div className="relative my-3 sm:my-4 h-36 sm:h-44 rounded-xl sm:rounded-2xl bg-black/40 border border-gs-border/60 overflow-hidden flex items-center justify-center p-3">
        <img
          src={product.image}
          alt={product.name}
          className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111218]/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono text-gs-muted uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {product.emoji && <span className="text-sm select-none">{product.emoji}</span>}
            <span>{product.gameName}</span>
          </span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            <span>Instant Trade</span>
          </span>
        </div>

        <h3 className={`font-heading font-black text-sm sm:text-base text-white line-clamp-1 transition-colors ${rarityStyle.titleGlow}`}>
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="text-base sm:text-lg font-mono font-black text-white">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs font-mono text-gs-muted line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gs-border/60">
        <button
          type="button"
          onClick={handleQuickAdd}
          className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-heading font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 touch-manipulation ${
            isAdded
              ? 'bg-emerald-500 text-white shadow-glow-success'
              : 'btn-secondary hover:border-gs-primary'
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              <span className="font-black">Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleInstantBuy}
          className="btn-primary min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-heading font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-glow-primary transition-all active:scale-95 touch-manipulation"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Buy</span>
        </button>
      </div>
    </motion.div>
  );
});

export default ProductCard;
