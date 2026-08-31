import React from 'react';
import { Heart, ShoppingBag, Sparkles, SlidersHorizontal } from 'lucide-react';
import { Product } from '../types';
import { COLOR_SWATCHES } from '../data/initialData';

interface ProductCardProps {
  product: Product;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
}) => {
  return (
    <div className="group relative bg-stone-900 border border-stone-800 hover:border-amber-400/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col justify-between">
      {/* Product Image & Badges */}
      <div
        onClick={() => onSelectProduct(product)}
        className="relative aspect-[4/5] bg-stone-950 overflow-hidden cursor-pointer"
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900/90 p-6 relative group-hover:bg-stone-850 transition-colors">
            {/* Mannequin / T-shirt Vector Placeholder */}
            <svg viewBox="0 0 100 120" className="w-28 h-32 text-stone-700 group-hover:text-amber-400/80 transition-colors">
              <path
                d="M30 15 C 40 25, 60 25, 70 15 L 90 30 L 80 50 L 72 45 L 72 105 C 72 108, 70 110, 68 110 L 32 110 C 30 110, 28 108, 28 105 L 28 45 L 20 50 L 10 30 Z"
                fill="currentColor"
                stroke="#444444"
                strokeWidth="1.5"
              />
              <path d="M38 15 C 44 24, 56 24, 62 15" fill="none" stroke="#262626" strokeWidth="2.5" />
            </svg>
            <div className="absolute bottom-6 px-3 py-1 bg-stone-950/80 border border-stone-800 rounded-full text-[10px] font-mono text-stone-400 group-hover:text-amber-300 transition-colors">
              WISDOM · Photo à venir
            </div>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-transform duration-200 hover:scale-110 cursor-pointer ${
            isWishlisted
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'bg-stone-950/60 text-stone-200 hover:text-white border border-stone-700/60'
          }`}
          title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Top / Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.top && (
            <span className="bg-amber-400 text-stone-950 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              TOP
            </span>
          )}
          {product.badge && (
            <span className="bg-stone-950/90 text-amber-300 border border-amber-400/40 font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase">
              {product.badge}
            </span>
          )}
          {product.customisable && (
            <span className="bg-amber-500/20 text-amber-300 backdrop-blur-md border border-amber-400/50 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Personnalisable</span>
            </span>
          )}
          {product.videoUrl && (
            <span className="bg-red-500/20 text-red-300 backdrop-blur-md border border-red-400/50 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
              <span>Vidéo</span>
            </span>
          )}
        </div>

        {/* Gallery count hint */}
        {product.gallery && product.gallery.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-stone-950/80 text-stone-300 font-mono text-[10px] px-2 py-1 rounded-md border border-stone-800">
            📷 {product.gallery.length + 1} photos
          </div>
        )}
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 gap-3">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
              WISDOM
            </span>
            <div className="flex items-center gap-1">
              {product.colors.map((colorName) => {
                const swatch = COLOR_SWATCHES.find((s) => s.name === colorName);
                if (!swatch) return null;
                return (
                  <span
                    key={colorName}
                    className="w-2.5 h-2.5 rounded-full border border-stone-700"
                    style={{ backgroundColor: swatch.hex }}
                    title={colorName}
                  />
                );
              })}
            </div>
          </div>

          <h3
            onClick={() => onSelectProduct(product)}
            className="font-serif text-base sm:text-lg font-bold text-stone-100 hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer mt-1"
          >
            {product.name}
          </h3>

          <p className="text-xs text-stone-400 line-clamp-2 font-light mt-1">
            {product.description}
          </p>

          {/* Sizes available */}
          <div className="flex items-center gap-1 mt-2.5 flex-wrap">
            <span className="text-[10px] font-mono text-stone-500 mr-1">Tailles:</span>
            {product.sizes.map((size) => (
              <span
                key={size}
                className="text-[10px] font-mono font-medium text-stone-300 bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-700/50"
              >
                {size}
              </span>
            ))}
          </div>
        </div>

        {/* Price & Add Action */}
        <div className="pt-3 border-t border-stone-800 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-mono text-stone-400 uppercase">Prix Bénin</p>
            <p className="font-serif text-lg font-extrabold text-amber-300">
              {product.price.toLocaleString('fr-FR')} FCFA
            </p>
          </div>

          <button
            onClick={() => onAddToCart(product)}
            className="px-3.5 py-2 bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-100 rounded-xl font-mono text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border border-stone-700 hover:border-amber-400"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
