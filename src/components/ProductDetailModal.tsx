import React, { useState } from 'react';
import { X, Heart, ShoppingBag, Star, ShieldCheck, Truck, RotateCcw, Sparkles, Check, ChevronRight, Play, Film } from 'lucide-react';
import { Product, Review } from '../types';
import { COLOR_SWATCHES, ALL_SIZES } from '../data/initialData';
import { sanitizeImageUrl, handleImageError, DEFAULT_BLACK_SHIRT } from '../utils/imageHelpers';

interface ProductDetailModalProps {
  product: Product | null;
  reviews: Review[];
  isWishlisted: boolean;
  onClose: () => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, size: string, color: string, qty: number) => void;
  onOpenWhatsAppOrder: (product: Product, size: string, color: string, qty: number) => void;
  onOpenSizeGuide: () => void;
  onAddReview: (productId: string, rating: number, comment: string, userName: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  reviews,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onAddToCart,
  onOpenWhatsAppOrder,
  onOpenSizeGuide,
  onAddReview,
}) => {
  if (!product) return null;

  const rawImages = [product.image, ...(product.gallery || [])].filter(Boolean);
  const images = (rawImages.length > 0 ? rawImages : [DEFAULT_BLACK_SHIRT]).map((img) =>
    sanitizeImageUrl(img, DEFAULT_BLACK_SHIRT)
  );
  const hasVideo = Boolean(product.videoUrl);
  
  // Media items: if hasVideo, item 0 can be activeVideo or gallery items
  const [activeMediaMode, setActiveMediaMode] = useState<'image' | 'video'>('image');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'L');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Noir');
  const [quantity, setQuantity] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const productReviews = reviews.filter((r) => r.productId === product.id);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newName.trim()) return;
    onAddReview(product.id, newRating, newComment, newName);
    setReviewSubmitted(true);
    setNewComment('');
    setNewName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Main Modal Box */}
      <div className="relative w-full max-w-4xl bg-stone-900 border-0 sm:border sm:border-stone-800 rounded-none sm:rounded-3xl shadow-2xl text-stone-100 z-10 min-h-screen sm:min-h-0 sm:max-h-[92vh] flex flex-col my-0 sm:my-auto">
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 bg-stone-900/95 backdrop-blur-md border-b border-stone-800 px-4 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 truncate pr-2">
            <span className="font-serif text-sm sm:text-base font-bold text-amber-300 truncate">
              {product.name}
            </span>
            {hasVideo && (
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                <Film className="w-3 h-3" />
                <span>Vidéo</span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-full transition-colors cursor-pointer border border-stone-700 shadow-sm flex-shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body: Smooth and natural scrolling on Mobile & PC */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-stone-800/80">
          {/* Gallery & Media Preview (Column 1) */}
          <div className="p-4 sm:p-6 bg-stone-950 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Media Player / Full Image Box */}
              <div className="relative h-72 sm:h-80 md:h-96 rounded-2xl overflow-hidden bg-stone-950 border border-stone-800/90 flex items-center justify-center p-2">
                {activeMediaMode === 'video' && product.videoUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-black rounded-xl overflow-hidden">
                    {product.videoUrl.includes('youtube.com') || product.videoUrl.includes('youtu.be') ? (
                      <iframe
                        src={
                          product.videoUrl.includes('embed')
                            ? product.videoUrl
                            : `https://www.youtube.com/embed/${product.videoUrl.split('v=')[1]?.split('&')[0] || product.videoUrl.split('/').pop()}`
                        }
                        title={product.name}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={product.videoUrl}
                        controls
                        autoPlay
                        loop
                        playsInline
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>
                ) : images[activeImgIndex] ? (
                  <div
                    onClick={() => setShowLightbox(true)}
                    className="w-full h-full flex items-center justify-center cursor-zoom-in group"
                  >
                    <img
                      src={images[activeImgIndex]}
                      alt={product.name}
                      onError={(e) => handleImageError(e, DEFAULT_BLACK_SHIRT)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900/90 p-6 relative">
                    <svg viewBox="0 0 100 120" className="w-32 h-40 text-amber-400/80">
                      <path
                        d="M30 15 C 40 25, 60 25, 70 15 L 90 30 L 80 50 L 72 45 L 72 105 C 72 108, 70 110, 68 110 L 32 110 C 30 110, 28 108, 28 105 L 28 45 L 20 50 L 10 30 Z"
                        fill="currentColor"
                        stroke="#444444"
                        strokeWidth="1.5"
                      />
                      <path d="M38 15 C 44 24, 56 24, 62 15" fill="none" stroke="#262626" strokeWidth="2.5" />
                    </svg>
                    <div className="mt-3 px-3 py-1 bg-stone-950/90 border border-stone-800 rounded-full text-xs font-mono text-amber-300">
                      WISDOM APPAREL · Photo à venir
                    </div>
                  </div>
                )}

                {/* Counter Badge */}
                <div className="absolute top-3 right-3 bg-stone-950/90 text-amber-300 font-mono text-[11px] font-bold px-3 py-1 rounded-full border border-amber-400/30 shadow-md">
                  {activeMediaMode === 'video' ? '🎥 Vidéo HD' : `Photo ${activeImgIndex + 1} / ${images.length}`}
                </div>

                {activeMediaMode === 'image' && images[activeImgIndex] && (
                  <div className="absolute bottom-3 left-3 bg-stone-950/90 text-stone-300 font-mono text-[10px] px-2.5 py-1 rounded-full border border-stone-800 flex items-center gap-1">
                    <span>🔍 Clic pour zoomer en plein écran</span>
                  </div>
                )}
              </div>

              {/* Gallery Thumbnails (Photos & Video selector) */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                  Médias du produit ({images.length + (hasVideo ? 1 : 0)}) :
                </span>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {/* Video Thumbnail Button if available */}
                  {hasVideo && (
                    <button
                      onClick={() => setActiveMediaMode('video')}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer bg-stone-900 p-0.5 flex flex-col items-center justify-center gap-1 ${
                        activeMediaMode === 'video'
                          ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 shadow-md bg-stone-800'
                          : 'border-stone-800 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-300">Vidéo</span>
                    </button>
                  )}

                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveMediaMode('image');
                        setActiveImgIndex(idx);
                      }}
                      className={`relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer bg-stone-950 p-0.5 ${
                        activeMediaMode === 'image' && activeImgIndex === idx
                          ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 shadow-md'
                          : 'border-stone-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt=""
                        onError={(e) => handleImageError(e, DEFAULT_BLACK_SHIRT)}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 bg-stone-950/90 text-amber-400 font-mono text-[9px] px-1 font-bold">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Badges & Trust Callouts */}
            <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-2 text-xs font-mono text-stone-400">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Livraison Express sous 24h-48h à Cotonou & Bénin</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>100% Coton peigné bio · Sérigraphie haute résistance</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Échange de taille garanti sous 48h</span>
              </div>
            </div>
          </div>

          {/* Product Details & Selection (Column 2) */}
          <div className="p-4 sm:p-6 md:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
                  WISDOM OFFICIAL
                </span>
                <button
                  onClick={() => onToggleWishlist(product.id)}
                  className={`p-2 rounded-full border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                    isWishlisted
                      ? 'bg-red-600/20 border-red-500 text-red-400'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-red-500' : ''}`} />
                  <span>{isWishlisted ? 'Favori' : 'Sauvegarder'}</span>
                </button>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-100 mt-2">
                {product.name}
              </h2>

              <div className="flex items-center gap-3 mt-2">
                <span className="font-serif text-2xl font-black text-amber-300">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-xs font-mono bg-amber-400/10 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  Stock disponible
                </span>
              </div>
            </div>

            <p className="text-stone-300 text-sm font-light leading-relaxed">
              {product.description}
            </p>

            {/* Color Choice */}
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
                Couleur sélectionnée : <span className="text-amber-300">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((colorName) => {
                  const swatch = COLOR_SWATCHES.find((s) => s.name === colorName);
                  const hex = swatch ? swatch.hex : '#1C1A16';
                  return (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(colorName)}
                      className={`px-3 py-2 rounded-xl border text-xs font-mono font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        selectedColor === colorName
                          ? 'bg-stone-800 border-amber-400 text-amber-300 ring-2 ring-amber-400/20'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-full border border-stone-600 flex-shrink-0" style={{ backgroundColor: hex }} />
                      <span>{colorName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Choice with Size Guide Modal Link */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-mono font-bold text-stone-300 uppercase">
                  Taille : <span className="text-amber-300">{selectedSize}</span>
                </label>
                <button
                  onClick={onOpenSizeGuide}
                  className="text-xs font-mono text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Guide des tailles</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-mono font-bold cursor-pointer transition-all ${
                      selectedSize === size
                        ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md font-extrabold'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Stepper */}
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
                Quantité :
              </label>
              <div className="inline-flex items-center bg-stone-950 border border-stone-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-stone-300 hover:bg-stone-800 font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-5 font-mono text-xs font-bold text-stone-100">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 text-stone-300 hover:bg-stone-800 font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Dual CTA Order Buttons */}
            <div className="space-y-3 pt-2">
              <button
                onClick={() => onAddToCart(product, selectedSize, selectedColor, quantity)}
                className="w-full py-3.5 sm:py-4 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 font-mono font-bold text-sm rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Ajouter au Panier</span>
              </button>

              <button
                onClick={() => onOpenWhatsAppOrder(product, selectedSize, selectedColor, quantity)}
                className="w-full py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-extrabold text-sm rounded-2xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span>Commander par WhatsApp</span>
              </button>
            </div>

            {/* Customer Reviews Section */}
            <div className="pt-6 border-t border-stone-800 space-y-4">
              <h3 className="font-serif text-lg font-bold text-stone-100 flex items-center justify-between">
                <span>Avis Clients ({productReviews.length})</span>
                <div className="flex items-center gap-1 text-amber-400 text-xs font-mono">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.9 / 5</span>
                </div>
              </h3>

              {productReviews.length === 0 ? (
                <p className="text-xs text-stone-500 italic">Soyez le premier à laisser un avis sur ce modèle !</p>
              ) : (
                <div className="space-y-3">
                  {productReviews.map((rev) => (
                    <div key={rev.id} className="p-3 bg-stone-950/80 rounded-xl border border-stone-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-stone-200">{rev.userName}</span>
                        <span className="text-[10px] font-mono text-stone-500">{rev.date}</span>
                      </div>
                      <div className="flex text-amber-400 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                      <p className="text-stone-300 font-light">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Review Form */}
              <div className="pt-3 border-t border-stone-800/60">
                <p className="text-xs font-mono font-bold text-amber-400 uppercase mb-2">Laisser un avis</p>
                {reviewSubmitted ? (
                  <p className="text-xs text-green-400 font-mono">Merci ! Votre avis a été enregistré avec succès.</p>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-2">
                    <input
                      type="text"
                      placeholder="Votre nom"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                    <textarea
                      placeholder="Votre avis sur la qualité du tissu, la taille, etc."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                      rows={2}
                      className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Publier mon avis
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && images[activeImgIndex] && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowLightbox(false)}
        >
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-6 right-6 text-white text-2xl font-mono cursor-pointer"
          >
            ✕
          </button>
          <img
            src={images[activeImgIndex]}
            alt={product.name}
            onError={(e) => handleImageError(e, DEFAULT_BLACK_SHIRT)}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};
