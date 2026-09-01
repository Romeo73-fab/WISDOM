import React from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Product } from '../types';
import { sanitizeImageUrl, handleImageError, DEFAULT_BLACK_SHIRT } from '../utils/imageHelpers';

interface WishlistDrawerProps {
  isOpen: boolean;
  wishlistIds: string[];
  products: Product[];
  onClose: () => void;
  onRemoveFromWishlist: (id: string) => void;
  onAddToCart: (product: Product) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({
  isOpen,
  wishlistIds,
  products,
  onClose,
  onRemoveFromWishlist,
  onAddToCart,
}) => {
  if (!isOpen) return null;

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              <h2 className="font-serif text-xl font-bold">Vos Favoris</h2>
              <span className="font-mono text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-bold">
                {wishlistProducts.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {wishlistProducts.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Heart className="w-12 h-12 text-stone-700 mx-auto" />
                <p className="font-serif text-lg font-bold text-stone-300">
                  Aucun coup de cœur sauvegardé
                </p>
                <p className="text-xs text-stone-400 max-w-xs mx-auto">
                  Cliquez sur l'icône cœur ♡ sur un t-shirt pour l'ajouter à vos favoris.
                </p>
              </div>
            ) : (
              wishlistProducts.map((p) => {
                const img = sanitizeImageUrl(p.image, DEFAULT_BLACK_SHIRT);
                return (
                  <div
                    key={p.id}
                    className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex gap-4 items-center justify-between"
                  >
                    <img
                      src={img}
                      alt={p.name}
                      onError={(e) => handleImageError(e, DEFAULT_BLACK_SHIRT)}
                      className="w-16 h-20 object-cover rounded-xl bg-stone-900 flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />

                    <div className="flex-1 space-y-1">
                      <h4 className="font-serif font-bold text-sm text-stone-100 line-clamp-1">
                        {p.name}
                      </h4>
                      <p className="font-serif text-amber-300 font-bold text-sm">
                        {p.price.toLocaleString('fr-FR')} FCFA
                      </p>

                      <button
                        onClick={() => {
                          onAddToCart(p);
                          onRemoveFromWishlist(p.id);
                        }}
                        className="mt-1 px-3 py-1 bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-200 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Ajouter au panier</span>
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveFromWishlist(p.id)}
                      className="p-2 text-stone-500 hover:text-red-400 cursor-pointer"
                      title="Retirer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
