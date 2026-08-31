import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Share2,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  Play,
  Film,
  Maximize2,
  X,
  MessageCircle,
  Clock,
  Ruler,
} from 'lucide-react';
import { Product, Review } from '../types';
import { COLOR_SWATCHES, ALL_SIZES } from '../data/initialData';

interface ProductPageProps {
  product: Product;
  allProducts: Product[];
  reviews: Review[];
  isWishlisted: boolean;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product, size: string, color: string, qty: number) => void;
  onOpenWhatsAppOrder: (product: Product, size: string, color: string, qty: number) => void;
  onOpenSizeGuide: () => void;
  onAddReview: (productId: string, rating: number, comment: string, userName: string) => void;
}

// Robust video URL parser for YouTube, Vimeo, and direct video files
export function parseVideoUrl(url?: string): {
  type: 'youtube' | 'vimeo' | 'direct' | 'none';
  src: string;
} {
  if (!url || !url.trim()) return { type: 'none', src: '' };
  const clean = url.trim();

  // YouTube match (watch?v=, youtu.be, shorts/, embed/)
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
  );
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'youtube',
      src: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&mute=0&rel=0&modestbranding=1&playsinline=1`,
    };
  }

  // Vimeo match
  const vimeoMatch = clean.match(
    /vimeo\.com\/(?:video\/|channels\/|groups\/[^\/]+\/videos\/|album\/[^\/]+\/video\/)?([0-9]+)/
  );
  if (vimeoMatch && vimeoMatch[1]) {
    return {
      type: 'vimeo',
      src: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&muted=0`,
    };
  }

  // Direct video file (mp4, webm, mov, supabase storage link, blob, data url)
  return {
    type: 'direct',
    src: clean,
  };
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  allProducts,
  reviews,
  isWishlisted,
  onBack,
  onSelectProduct,
  onToggleWishlist,
  onAddToCart,
  onOpenWhatsAppOrder,
  onOpenSizeGuide,
  onAddReview,
}) => {
  // Gallery & media management
  const images = [product.image, ...(product.gallery || [])].filter(Boolean);
  const videoData = parseVideoUrl(product.videoUrl);
  const hasVideo = videoData.type !== 'none';

  const [activeMediaMode, setActiveMediaMode] = useState<'image' | 'video'>('image');
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'L');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || 'Noir');
  const [quantity, setQuantity] = useState(1);
  const [showLightbox, setShowLightbox] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<'description' | 'care' | 'shipping'>('description');
  const [addedAnimation, setAddedAnimation] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveImgIndex(0);
    setActiveMediaMode('image');
    setSelectedSize(product.sizes[0] || 'L');
    setSelectedColor(product.colors[0] || 'Noir');
    setQuantity(1);
    setReviewSubmitted(false);
  }, [product.id]);

  const productReviews = reviews.filter((r) => r.productId === product.id);
  const averageRating =
    productReviews.length > 0
      ? (
          productReviews.reduce((acc, r) => acc + r.rating, 0) /
          productReviews.length
        ).toFixed(1)
      : '5.0';

  const relatedProducts = allProducts
    .filter((p) => p.id !== product.id && (p.category === product.category || true))
    .slice(0, 4);

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !newName.trim()) return;
    onAddReview(product.id, newRating, newComment, newName);
    setReviewSubmitted(true);
    setNewComment('');
    setNewName('');
  };

  const handleAddToCartWithFeedback = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1800);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20">
      {/* Breadcrumb & Navigation bar */}
      <div className="border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md sticky top-[56px] sm:top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs sm:text-sm font-mono text-stone-300 hover:text-amber-400 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Retour à la collection</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs font-mono text-stone-400">
            <span className="cursor-pointer hover:text-stone-200" onClick={onBack}>
              Boutique
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <span className="capitalize text-stone-300">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
            <span className="text-amber-300 font-semibold truncate max-w-[200px]">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleWishlist(product.id)}
              className={`p-2 rounded-full border transition-all cursor-pointer ${
                isWishlisted
                  ? 'bg-red-500/10 border-red-500/40 text-red-400'
                  : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white hover:border-stone-700'
              }`}
              title={isWishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart
                className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
              />
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: `${product.name} | WISDOM`,
                    text: product.description,
                    url: window.location.href,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Lien du produit copié dans le presse-papier !');
                }
              }}
              className="p-2 rounded-full bg-stone-900 border border-stone-800 text-stone-300 hover:text-white hover:border-stone-700 transition-colors cursor-pointer"
              title="Partager"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT COLUMN: MEDIA & GALLERY (7 cols on lg) ================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Media Switcher Tabs (if product has a video) */}
            {hasVideo && (
              <div className="flex items-center gap-2 p-1 bg-stone-900/90 border border-stone-800 rounded-xl w-fit">
                <button
                  onClick={() => setActiveMediaMode('image')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeMediaMode === 'image'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <span>Photos ({images.length})</span>
                </button>

                <button
                  onClick={() => setActiveMediaMode('video')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    activeMediaMode === 'video'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Présentation Vidéo</span>
                </button>
              </div>
            )}

            {/* Main Stage Frame */}
            <div className="relative aspect-[4/5] sm:aspect-[1/1] md:aspect-[4/4] lg:aspect-[4/4.5] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-900/80 border border-stone-800/90 shadow-2xl flex items-center justify-center p-2 sm:p-4 group">
              {activeMediaMode === 'video' && hasVideo ? (
                /* VIDEO VIEWER */
                <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden bg-black flex items-center justify-center relative">
                  {videoData.type === 'youtube' ? (
                    <iframe
                      src={videoData.src}
                      title={product.name}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : videoData.type === 'vimeo' ? (
                    <iframe
                      src={videoData.src}
                      title={product.name}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    /* DIRECT VIDEO FILE (MP4, WEBM, BLOB) */
                    <video
                      key={videoData.src}
                      src={videoData.src}
                      controls
                      autoPlay
                      playsInline
                      loop
                      className="w-full h-full object-contain rounded-xl"
                      onError={(e) => {
                        console.error('Erreur lecture vidéo direct:', e);
                      }}
                    >
                      <source src={videoData.src} type="video/mp4" />
                      <p className="text-xs text-stone-400 p-4">
                        Format vidéo non supporté directement par le navigateur.
                      </p>
                    </video>
                  )}
                </div>
              ) : images[activeImgIndex] ? (
                /* HIGH RESOLUTION IMAGE VIEWER */
                <div
                  onClick={() => setShowLightbox(true)}
                  className="w-full h-full flex items-center justify-center cursor-zoom-in relative"
                >
                  <img
                    src={images[activeImgIndex]}
                    alt={`${product.name} - Vue ${activeImgIndex + 1}`}
                    className="w-full h-full object-contain filter drop-shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />

                  {/* Zoom hint badge */}
                  <div className="absolute bottom-4 right-4 bg-stone-950/80 backdrop-blur-sm border border-stone-700/60 text-stone-200 text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Agrandir</span>
                  </div>
                </div>
              ) : (
                /* FALLBACK VECTOR PREVIEW */
                <div className="w-full h-full flex flex-col items-center justify-center bg-stone-900/60 p-8">
                  <svg viewBox="0 0 100 120" className="w-40 h-48 text-amber-400/80">
                    <path
                      d="M30 15 C 40 25, 60 25, 70 15 L 90 30 L 80 50 L 72 45 L 72 105 C 72 108, 70 110, 68 110 L 32 110 C 30 110, 28 108, 28 105 L 28 45 L 20 50 L 10 30 Z"
                      fill="currentColor"
                      stroke="#292524"
                      strokeWidth="2"
                    />
                  </svg>
                  <p className="text-xs font-mono text-stone-400 mt-2">Visuel en confection</p>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel Bar */}
            {images.length > 1 && (
              <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveImgIndex(idx);
                      setActiveMediaMode('image');
                    }}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-900 border-2 transition-all flex-shrink-0 cursor-pointer p-1 ${
                      activeMediaMode === 'image' && activeImgIndex === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                        : 'border-stone-800 opacity-60 hover:opacity-100 hover:border-stone-700'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Miniature ${idx + 1}`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}

                {hasVideo && (
                  <button
                    onClick={() => setActiveMediaMode('video')}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-stone-900 border-2 transition-all flex-shrink-0 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      activeMediaMode === 'video'
                        ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105 bg-stone-900'
                        : 'border-stone-800 opacity-60 hover:opacity-100 hover:border-stone-700'
                    }`}
                  >
                    <Play className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-mono font-bold text-stone-300">Vidéo</span>
                  </button>
                )}
              </div>
            )}

            {/* Reassurance Features under gallery */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-stone-800/80">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-900/40 border border-stone-800/50">
                <Truck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-200">Expédition Rapide</h4>
                  <p className="text-[11px] text-stone-400">Livraison suivie 24h/48h au Bénin & international</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-900/40 border border-stone-800/50">
                <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-200">Qualité Atelier</h4>
                  <p className="text-[11px] text-stone-400">Grammage lourd 240g/m² & coutures renforcées</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-900/40 border border-stone-800/50">
                <RotateCcw className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold text-stone-200">Échanges Faciles</h4>
                  <p className="text-[11px] text-stone-400">14 jours pour échanger votre taille</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: PRODUCT INFO & PURCHASE (5 cols on lg) ================= */}
          <div className="lg:col-span-5 space-y-6 lg:pl-2">
            
            {/* Top Badges & Category */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                {product.category || 'Collection Essentielle'}
              </span>

              <div className="flex items-center gap-1.5 text-xs font-mono text-stone-400">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-stone-200 font-bold">{averageRating}</span>
                <span className="text-stone-500">({productReviews.length} avis)</span>
              </div>
            </div>

            {/* Product Title & Price */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-100 tracking-tight leading-tight">
                {product.name}
              </h1>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-mono font-extrabold text-amber-300">
                  {product.price.toLocaleString('fr-FR')} FCFA
                </span>
                <span className="text-xs font-mono text-stone-400">
                  (~{(product.price / 655.957).toFixed(2)} €)
                </span>
              </div>

              <p className="mt-4 text-sm text-stone-300 leading-relaxed font-sans">
                {product.description}
              </p>
            </div>

            <hr className="border-stone-800" />

            {/* Color Swatches */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-300 font-bold">
                    Couleur sélectionnée :{' '}
                    <span className="text-amber-400 capitalize">{selectedColor}</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((colorName) => {
                    const isSelected = selectedColor === colorName;
                    const swatchObj = Array.isArray(COLOR_SWATCHES)
                      ? COLOR_SWATCHES.find(
                          (s) => s.name.toLowerCase() === colorName.toLowerCase()
                        )
                      : null;
                    const hex = swatchObj?.hex || (typeof COLOR_SWATCHES === 'object' && (COLOR_SWATCHES as any)[colorName]) || '#57534e';
                    return (
                      <button
                        key={colorName}
                        onClick={() => setSelectedColor(colorName)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-stone-900 text-white shadow-md ring-1 ring-amber-400'
                            : 'border-stone-800 bg-stone-900/60 text-stone-300 hover:border-stone-700'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20 flex-shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="text-xs font-mono">{colorName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-stone-300 font-bold">
                    Taille : <span className="text-amber-400 font-black">{selectedSize}</span>
                  </label>

                  <button
                    onClick={onOpenSizeGuide}
                    className="flex items-center gap-1 text-xs font-mono text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    <span>Guide des tailles</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md scale-105'
                            : 'bg-stone-900/90 text-stone-300 border-stone-800 hover:border-stone-700 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-300 font-bold mb-2">
                Quantité
              </label>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3.5 py-2 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer text-sm font-mono font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-mono font-bold text-amber-300 min-w-[32px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3.5 py-2 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer text-sm font-mono font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 px-3 py-1.5 rounded-xl">
                  <Check className="w-3.5 h-3.5" />
                  <span>En stock · Atelier Cotonou</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Add to Cart & WhatsApp Order */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleAddToCartWithFeedback}
                className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl font-mono font-black text-sm uppercase tracking-wide transition-all shadow-xl cursor-pointer ${
                  addedAnimation
                    ? 'bg-emerald-500 text-stone-950 scale-[0.98]'
                    : 'bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 shadow-amber-400/20 hover:shadow-amber-400/30'
                }`}
              >
                {addedAnimation ? (
                  <>
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>Ajouté au panier !</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
                    <span>Ajouter au panier ({(product.price * quantity).toLocaleString('fr-FR')} FCFA)</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenWhatsAppOrder(product, selectedSize, selectedColor, quantity)}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/60 font-mono font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Commander directement sur WhatsApp</span>
              </button>
            </div>

            {/* Information Tabs Accordion */}
            <div className="border border-stone-800 rounded-2xl overflow-hidden bg-stone-900/40 divide-y divide-stone-800">
              {/* Tab 1: Description & Fit */}
              <div className="p-4">
                <button
                  onClick={() =>
                    setActiveTabSection(activeTabSection === 'description' ? ('' as any) : 'description')
                  }
                  className="w-full flex items-center justify-between text-left text-xs font-mono font-bold uppercase tracking-wider text-stone-200 hover:text-amber-400 transition-colors"
                >
                  <span>Détails & Coupe</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeTabSection === 'description' ? 'rotate-90 text-amber-400' : 'text-stone-500'
                    }`}
                  />
                </button>
                {activeTabSection === 'description' && (
                  <div className="mt-3 text-xs text-stone-400 space-y-2 leading-relaxed">
                    <p>• Coupe oversize décontractée inspirée du streetwear contemporain.</p>
                    <p>• Col rond côtelé avec bande de propreté intérieure renforcée.</p>
                    <p>• Sérigraphie artisanale haute durabilité résistante aux lavages fréquents.</p>
                    <p>• Édition limitée produite en série restreinte dans notre atelier.</p>
                  </div>
                )}
              </div>

              {/* Tab 2: Materials & Care */}
              <div className="p-4">
                <button
                  onClick={() =>
                    setActiveTabSection(activeTabSection === 'care' ? ('' as any) : 'care')
                  }
                  className="w-full flex items-center justify-between text-left text-xs font-mono font-bold uppercase tracking-wider text-stone-200 hover:text-amber-400 transition-colors"
                >
                  <span>Matières & Entretien</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeTabSection === 'care' ? 'rotate-90 text-amber-400' : 'text-stone-500'
                    }`}
                  />
                </button>
                {activeTabSection === 'care' && (
                  <div className="mt-3 text-xs text-stone-400 space-y-2 leading-relaxed">
                    <p>• 100% Coton peigné biologique lourd (240 g/m²).</p>
                    <p>• Lavage en machine à 30°C sur l'envers recommandé.</p>
                    <p>• Repassage doux sur l'envers, ne pas repasser directement l'imprimé.</p>
                    <p>• Séchage à l'air libre pour préserver l'éclat des fibres.</p>
                  </div>
                )}
              </div>

              {/* Tab 3: Shipping & Returns */}
              <div className="p-4">
                <button
                  onClick={() =>
                    setActiveTabSection(activeTabSection === 'shipping' ? ('' as any) : 'shipping')
                  }
                  className="w-full flex items-center justify-between text-left text-xs font-mono font-bold uppercase tracking-wider text-stone-200 hover:text-amber-400 transition-colors"
                >
                  <span>Livraison & Retours</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeTabSection === 'shipping' ? 'rotate-90 text-amber-400' : 'text-stone-500'
                    }`}
                  />
                </button>
                {activeTabSection === 'shipping' && (
                  <div className="mt-3 text-xs text-stone-400 space-y-2 leading-relaxed">
                    <p>• Cotonou & environs : Livraison en 24h à domicile ou en point relais.</p>
                    <p>• Autres villes du Bénin : Expédition sécurisée 24h/48h.</p>
                    <p>• International (Afrique & Europe) : Expédition par DHL / Chronopost.</p>
                    <p>• Retours acceptés sous 14 jours si le produit n'a pas été porté.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ================= CUSTOMER REVIEWS SECTION ================= */}
        <div className="mt-16 pt-12 border-t border-stone-800">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Avis de nos clients ({productReviews.length})
                </h3>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Retours d'expérience authentiques sur ce modèle
                </p>
              </div>

              <div className="flex items-center gap-3 bg-stone-900 border border-stone-800 px-4 py-2 rounded-2xl w-fit">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(Number(averageRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-700'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-mono text-sm font-bold text-stone-200">
                  {averageRating} / 5
                </span>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {productReviews.length === 0 ? (
                <div className="p-8 rounded-2xl bg-stone-900/40 border border-stone-800 text-center">
                  <p className="text-sm text-stone-400">
                    Soyez le premier à partager votre expérience sur cette pièce !
                  </p>
                </div>
              ) : (
                productReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-200">
                          {rev.userName}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
                          Achat vérifié
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-stone-500">{rev.date}</span>
                    </div>

                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'
                          }`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-stone-300 leading-relaxed font-sans">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Submit Review Form */}
            <div className="p-6 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-4">
              <h4 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider">
                Laisser un avis sur ce produit
              </h4>

              {reviewSubmitted ? (
                <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Merci beaucoup pour votre avis ! Il a bien été publié.</span>
                </div>
              ) : (
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-300">Votre note :</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 text-stone-600 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-stone-400 mb-1">
                        Votre nom ou prénom *
                      </label>
                      <input
                        type="text"
                        required
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ex: Fabrice K."
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3.5 py-2 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-stone-400 mb-1">
                      Votre commentaire *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Qualité du tissu, taille ressentie, finitions..."
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    Publier mon avis
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ================= RELATED PRODUCTS (YOU MAY ALSO LIKE) ================= */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-stone-800">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
                  Vous aimerez aussi
                </h3>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Complétez votre style avec nos autres créations
                </p>
              </div>

              <button
                onClick={onBack}
                className="text-xs font-mono text-amber-400 hover:underline cursor-pointer"
              >
                Voir tout →
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectProduct(rel)}
                  className="group bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden hover:border-amber-400/60 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/5] bg-stone-950 p-2 overflow-hidden flex items-center justify-center">
                    <img
                      src={rel.image}
                      alt={rel.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {rel.videoUrl && (
                      <span className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-sm border border-stone-700 text-amber-400 p-1.5 rounded-full">
                        <Film className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="p-3 sm:p-4 space-y-1">
                    <p className="text-[10px] font-mono uppercase text-amber-400">
                      {rel.category}
                    </p>
                    <h4 className="text-xs sm:text-sm font-semibold text-stone-100 truncate group-hover:text-amber-300 transition-colors">
                      {rel.name}
                    </h4>
                    <p className="text-xs font-mono font-bold text-amber-400 pt-1">
                      {rel.price.toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ================= FULLSCREEN LIGHTBOX MODAL ================= */}
      {showLightbox && images[activeImgIndex] && (
        <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setShowLightbox(false)}
            className="absolute top-4 right-4 p-3 bg-stone-900 hover:bg-stone-800 text-stone-200 rounded-full cursor-pointer z-20 border border-stone-800 shadow-xl"
            title="Fermer le plein écran"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center">
            <img
              src={images[activeImgIndex]}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex gap-2 mt-4 z-20">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImgIndex(idx)}
                className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all p-0.5 bg-stone-900 ${
                  activeImgIndex === idx
                    ? 'border-amber-400 scale-105'
                    : 'border-stone-800 opacity-60'
                }`}
              >
                <img
                  src={img}
                  alt={`Aperçu ${idx + 1}`}
                  className="w-full h-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
