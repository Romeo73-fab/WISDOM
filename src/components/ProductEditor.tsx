import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Upload,
  Film,
  Image as ImageIcon,
  CheckCircle2,
  Trash2,
  Sparkles,
  Tag,
  Check,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { Product } from '../types';

interface ProductEditorProps {
  initialProduct?: Product | null;
  onSave: (product: Product) => Promise<void>;
  onCancel: () => void;
  onUploadMedia: (file: File, folder: 'products' | 'assets' | 'video') => Promise<{ url: string; isRemote: boolean }>;
  onShowToast: (message: string) => void;
  isSubmitting?: boolean;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const PRESET_COLORS = [
  { name: 'Noir', hex: '#111111', border: '#333333' },
  { name: 'Blanc', hex: '#FFFFFF', border: '#CCCCCC' },
  { name: 'Or', hex: '#D4AF37', border: '#AA8822' },
  { name: 'Terracotta', hex: '#C86D51', border: '#9E4F38' },
  { name: 'Indigo', hex: '#2B3A67', border: '#1C2746' },
  { name: 'Vert Forêt', hex: '#2D5A27', border: '#1D3B19' },
  { name: 'Gris', hex: '#4A4A4A', border: '#2A2A2A' },
  { name: 'Bordeaux', hex: '#5E1914', border: '#3D100D' },
  { name: 'Bleu Marine', hex: '#1B263B', border: '#0F1622' },
  { name: 'Beige', hex: '#D8C3A5', border: '#B59F82' },
];

const PRESET_BADGES = ['NOUVEAU', 'BESTSELLER', 'COUP DE CŒUR', 'TENDANCE', 'SIGNATURE', 'PROMOTION'];

const CATEGORIES = [
  { id: 'wisdom', label: 'Signature WISDOM (Prestige)', desc: 'T-shirts emblématiques or, noir & finitions nobles' },
  { id: 'neutre', label: 'Basiques Neutres', desc: 'T-shirts unis minimalistes 100% coton peigné' },
  { id: 'perso', label: 'Personnalisés (Wisdom Lab)', desc: 'Modèles conçus pour l’impression sur-mesure' },
  { id: 'evenement', label: 'Événementiel & Corporate', desc: 'Séries pour entreprises, clubs et cérémonies' },
];

export const ProductEditor: React.FC<ProductEditorProps> = ({
  initialProduct,
  onSave,
  onCancel,
  onUploadMedia,
  onShowToast,
  isSubmitting = false,
}) => {
  const isEditing = Boolean(initialProduct && initialProduct.id);

  // Form states
  const [name, setName] = useState(initialProduct?.name || '');
  const [price, setPrice] = useState<number | string>(initialProduct?.price || 4000);
  const [category, setCategory] = useState<string>(initialProduct?.category || 'wisdom');
  const [keyword, setKeyword] = useState(initialProduct?.keyword || '');
  const [description, setDescription] = useState(
    initialProduct?.description ||
      '100% Coton peigné biologique 240g/m². Coupe regular confortable, finitions haut de gamme et sérigraphie haute durabilité.'
  );

  // 1 Main Image + 2 Gallery Images + 1 Video
  const [mainImage, setMainImage] = useState(
    initialProduct?.image || '/assets/images/wisdom_black_shirt_1786398483035.jpg'
  );
  const [galleryImage1, setGalleryImage1] = useState(initialProduct?.gallery?.[0] || '');
  const [galleryImage2, setGalleryImage2] = useState(initialProduct?.gallery?.[1] || '');
  const [videoUrl, setVideoUrl] = useState(initialProduct?.videoUrl || '');

  // Attributes
  const [sizes, setSizes] = useState<string[]>(initialProduct?.sizes || ['S', 'M', 'L', 'XL', 'XXL']);
  const [colors, setColors] = useState<string[]>(initialProduct?.colors || ['Noir', 'Blanc', 'Or']);
  const [badge, setBadge] = useState(initialProduct?.badge || (isEditing ? '' : 'NOUVEAU'));
  const [inStock, setInStock] = useState(initialProduct?.inStock !== false);
  const [top, setTop] = useState(initialProduct?.top ?? true);
  const [customisable, setCustomisable] = useState(initialProduct?.customisable ?? false);

  // Upload loaders
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingG1, setUploadingG1] = useState(false);
  const [uploadingG2, setUploadingG2] = useState(false);
  const [uploadingVid, setUploadingVid] = useState(false);

  // Parse video helper
  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const getYouTubeEmbed = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
    return match && match[1] ? `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=0&rel=0` : null;
  };

  // Toggle size
  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      if (sizes.length === 1) {
        onShowToast('Au moins une taille doit rester sélectionnée');
        return;
      }
      setSizes(sizes.filter((s) => s !== size));
    } else {
      setSizes([...sizes, size]);
    }
  };

  // Toggle color
  const toggleColor = (color: string) => {
    if (colors.includes(color)) {
      if (colors.length === 1) {
        onShowToast('Au moins une couleur doit rester sélectionnée');
        return;
      }
      setColors(colors.filter((c) => c !== color));
    } else {
      setColors([...colors, color]);
    }
  };

  // Upload handlers
  const handleUploadMain = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMain(true);
    try {
      const { url } = await onUploadMedia(file, 'products');
      setMainImage(url);
      onShowToast('Photo principale téléversée avec succès ✓');
    } catch (err: any) {
      onShowToast(`Erreur téléversement: ${err.message}`);
    } finally {
      setUploadingMain(false);
    }
  };

  const handleUploadGallery1 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingG1(true);
    try {
      const { url } = await onUploadMedia(file, 'products');
      setGalleryImage1(url);
      onShowToast('Photo secondaire n°1 téléversée avec succès ✓');
    } catch (err: any) {
      onShowToast(`Erreur téléversement: ${err.message}`);
    } finally {
      setUploadingG1(false);
    }
  };

  const handleUploadGallery2 = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingG2(true);
    try {
      const { url } = await onUploadMedia(file, 'products');
      setGalleryImage2(url);
      onShowToast('Photo secondaire n°2 téléversée avec succès ✓');
    } catch (err: any) {
      onShowToast(`Erreur téléversement: ${err.message}`);
    } finally {
      setUploadingG2(false);
    }
  };

  const handleUploadVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVid(true);
    try {
      const { url } = await onUploadMedia(file, 'video');
      setVideoUrl(url);
      onShowToast('Vidéo de présentation téléversée avec succès ✓');
    } catch (err: any) {
      onShowToast(`Erreur téléversement vidéo: ${err.message}`);
    } finally {
      setUploadingVid(false);
    }
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onShowToast('Veuillez entrer le nom du produit');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      onShowToast('Veuillez entrer un prix valide supérieur à 0 FCFA');
      return;
    }

    if (!mainImage.trim()) {
      onShowToast('L’image principale est obligatoire');
      return;
    }

    // Build gallery array (max 2 images as requested)
    const gallery = [galleryImage1.trim(), galleryImage2.trim()].filter(Boolean);

    const productPayload: Product = {
      id: initialProduct?.id || 'p' + Date.now(),
      name: name.trim(),
      price: numPrice,
      category: category || 'wisdom',
      keyword: keyword.trim(),
      description: description.trim(),
      image: mainImage.trim(),
      gallery,
      videoUrl: videoUrl.trim() || undefined,
      sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
      colors: colors.length > 0 ? colors : ['Noir', 'Blanc'],
      badge: badge.trim() || undefined,
      inStock,
      top,
      customisable,
    };

    await onSave(productPayload);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Navigation & Action Header */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Retour au catalogue des produits</span>
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
              {isEditing ? `Modifier : ${initialProduct?.name}` : 'Ajouter un nouveau produit'}
            </h2>
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold uppercase ${
                isEditing
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isEditing ? 'Édition Produit' : 'Nouveau Produit'}
            </span>
          </div>
          <p className="text-xs font-mono text-stone-400">
            Formulaire complet et ergonomique. Vos photos, vidéo, prix et caractéristiques sont synchronisés en direct sur Supabase et le serveur.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 md:flex-initial px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer text-center"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 md:flex-initial px-7 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-mono text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'ENREGISTREMENT...' : '💾 ENREGISTRER SUR SUPABASE'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* ========================================================================= */}
        {/* SECTION 1: MÉDIAS (1 IMAGE PRINCIPALE + 2 IMAGES SECONDAIRES + 1 VIDÉO) */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-100">
                  1. Médias & Visuels du Produit
                </h3>
                <p className="text-xs font-mono text-stone-400">
                  Structure : 1 image principale + 2 photos galerie + 1 vidéo de présentation
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              Format Carré / 3:4 Recommandé
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1.1 PHOTO PRINCIPALE */}
            <div className="bg-stone-950 border-2 border-amber-400/40 rounded-2xl p-5 space-y-4 relative shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Photo Principale * (Couverture)</span>
                </span>
                <span className="text-[10px] font-mono bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded">
                  OBLIGATOIRE
                </span>
              </div>

              {/* Preview */}
              <div className="aspect-[3/4] bg-stone-900 border border-stone-800 rounded-xl overflow-hidden relative flex items-center justify-center group">
                {mainImage ? (
                  <img
                    src={mainImage}
                    alt="Aperçu principal"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-4 space-y-2">
                    <ImageIcon className="w-10 h-10 text-stone-700 mx-auto" />
                    <p className="text-xs font-mono text-stone-500">Aucune photo sélectionnée</p>
                  </div>
                )}
                {uploadingMain && (
                  <div className="absolute inset-0 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center font-mono text-xs text-amber-300">
                    Téléversement...
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 font-mono text-xs">
                <label className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md">
                  <Upload className="w-4 h-4" />
                  <span>{uploadingMain ? 'Upload en cours...' : 'Téléverser photo principale'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingMain}
                    onChange={handleUploadMain}
                  />
                </label>

                <div className="pt-1">
                  <label className="text-[10px] text-stone-400 block mb-1">Ou coller l'URL de l'image :</label>
                  <input
                    type="text"
                    value={mainImage}
                    placeholder="https://... ou /assets/images/..."
                    onChange={(e) => setMainImage(e.target.value)}
                    className="w-full bg-stone-900 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            {/* 1.2 LES 2 PHOTOS SECONDAIRES (GALERIE) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-stone-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-stone-400" />
                  <span>2 Photos Secondaires (Galerie / Angles)</span>
                </span>
                <span className="text-[10px] font-mono text-stone-500">
                  Affichez la vue dos, le détail du tissu ou le modèle porté
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PHOTO 2 */}
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-stone-300">
                      Photo 2 (Vue dos / détails)
                    </span>
                    {galleryImage1 && (
                      <button
                        type="button"
                        onClick={() => setGalleryImage1('')}
                        className="text-red-400 hover:text-red-300 p-1 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Effacer</span>
                      </button>
                    )}
                  </div>

                  <div className="h-40 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {galleryImage1 ? (
                      <img
                        src={galleryImage1}
                        alt="Photo 2"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-stone-600 font-mono text-[11px]">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span>Emplacement Photo 2</span>
                      </div>
                    )}
                    {uploadingG1 && (
                      <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono text-xs text-amber-300">
                        Upload...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingG1 ? 'Téléversement...' : 'Téléverser Photo 2'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingG1}
                        onChange={handleUploadGallery1}
                      />
                    </label>

                    <input
                      type="text"
                      value={galleryImage1}
                      placeholder="URL directe de la photo 2"
                      onChange={(e) => setGalleryImage1(e.target.value)}
                      className="w-full bg-stone-900 text-stone-200 border border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* PHOTO 3 */}
                <div className="bg-stone-950 border border-stone-800 rounded-2xl p-4 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-stone-300">
                      Photo 3 (Vue portée / zoom)
                    </span>
                    {galleryImage2 && (
                      <button
                        type="button"
                        onClick={() => setGalleryImage2('')}
                        className="text-red-400 hover:text-red-300 p-1 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                        title="Supprimer cette photo"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Effacer</span>
                      </button>
                    )}
                  </div>

                  <div className="h-40 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden relative flex items-center justify-center">
                    {galleryImage2 ? (
                      <img
                        src={galleryImage2}
                        alt="Photo 3"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="text-center p-2 text-stone-600 font-mono text-[11px]">
                        <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                        <span>Emplacement Photo 3</span>
                      </div>
                    )}
                    {uploadingG2 && (
                      <div className="absolute inset-0 bg-stone-950/80 flex items-center justify-center font-mono text-xs text-amber-300">
                        Upload...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 font-mono text-xs">
                    <label className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingG2 ? 'Téléversement...' : 'Téléverser Photo 3'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingG2}
                        onChange={handleUploadGallery2}
                      />
                    </label>

                    <input
                      type="text"
                      value={galleryImage2}
                      placeholder="URL directe de la photo 3"
                      onChange={(e) => setGalleryImage2(e.target.value)}
                      className="w-full bg-stone-900 text-stone-200 border border-stone-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* 1.3 VIDÉO DU PRODUIT */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 space-y-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-amber-300 flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-amber-400" />
                    <span>Vidéo de Présentation (1 Vidéo - Optionnelle)</span>
                  </span>
                  {videoUrl && (
                    <button
                      type="button"
                      onClick={() => setVideoUrl('')}
                      className="text-red-400 hover:text-red-300 p-1 text-[10px] font-mono flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Supprimer la vidéo</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div className="space-y-2 font-mono text-xs">
                    <label className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>{uploadingVid ? 'Upload vidéo...' : 'Téléverser fichier vidéo (.mp4)'}</span>
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        disabled={uploadingVid}
                        onChange={handleUploadVideo}
                      />
                    </label>

                    <div>
                      <label className="text-[10px] text-stone-400 block mb-1">
                        Ou lien YouTube / URL vidéo directe :
                      </label>
                      <input
                        type="text"
                        value={videoUrl}
                        placeholder="Ex: https://youtube.com/watch?v=... ou https://.../video.mp4"
                        onChange={(e) => setVideoUrl(e.target.value)}
                        className="w-full bg-stone-900 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Video Player Preview */}
                  <div className="h-36 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                    {videoUrl ? (
                      isYouTube && getYouTubeEmbed(videoUrl) ? (
                        <iframe
                          src={getYouTubeEmbed(videoUrl)!}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Vidéo produit YouTube"
                        />
                      ) : (
                        <video
                          src={videoUrl}
                          controls
                          className="w-full h-full object-contain bg-black"
                        />
                      )
                    ) : (
                      <div className="text-center p-3 text-stone-600 font-mono text-xs">
                        <Film className="w-6 h-6 mx-auto mb-1 opacity-50 text-stone-500" />
                        <span>Aperçu vidéo disponible après ajout</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 2: INFORMATIONS GÉNÉRALES, CATÉGORIE & PRIX */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 pb-4 border-b border-stone-800">
            <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-100">
                2. Informations Générales & Tarifs
              </h3>
              <p className="text-xs font-mono text-stone-400">
                Nom officiel du t-shirt, catégorie de la collection et prix en FCFA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Nom du produit */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-stone-200 font-bold uppercase tracking-wider">
                Nom du T-shirt / Produit *
              </label>
              <input
                type="text"
                required
                value={name}
                placeholder="Ex: T-shirt WISDOM Signature Noir & Or"
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-950 text-stone-100 font-serif text-lg font-bold border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Prix en FCFA */}
            <div className="space-y-1.5">
              <label className="block text-stone-200 font-bold uppercase tracking-wider">
                Prix Unitaire (FCFA) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={500}
                  step={100}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-stone-950 text-amber-300 font-serif text-xl font-black border border-stone-700 rounded-xl pl-4 pr-16 py-3 focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-amber-400 select-none">
                  FCFA
                </span>
              </div>
            </div>

            {/* Badge Promotionnel */}
            <div className="space-y-1.5">
              <label className="block text-stone-200 font-bold uppercase tracking-wider">
                Badge Promotionnel (Optionnel)
              </label>
              <input
                type="text"
                value={badge}
                placeholder="Ex: NOUVEAU, BESTSELLER, TENDANCE"
                onChange={(e) => setBadge(e.target.value)}
                className="w-full bg-stone-950 text-amber-300 font-bold border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-400"
              />
              {/* Preset badges */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBadge(b)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      badge === b
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'bg-stone-800 text-stone-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
                {badge && (
                  <button
                    type="button"
                    onClick={() => setBadge('')}
                    className="px-2 py-0.5 rounded text-[10px] font-mono text-red-400 hover:bg-red-950/40 cursor-pointer"
                  >
                    Aucun badge
                  </button>
                )}
              </div>
            </div>

            {/* Catégorie */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-stone-200 font-bold uppercase tracking-wider">
                Catégorie de la Collection *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      category === cat.id
                        ? 'bg-amber-400/10 border-amber-400 text-stone-100 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                        category === cat.id
                          ? 'border-amber-400 bg-amber-400 text-stone-950'
                          : 'border-stone-700'
                      }`}
                    >
                      {category === cat.id && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-stone-100">{cat.label}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5">{cat.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mots-clés */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-stone-200 font-bold uppercase tracking-wider">
                Mots-Clés de Recherche (Facilite la recherche client)
              </label>
              <input
                type="text"
                value={keyword}
                placeholder="Ex: signature or coton noir broderie prestige luxe"
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-stone-950 text-stone-200 border border-stone-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 3: DESCRIPTION DU PRODUIT */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              3. Description & Finitions
            </h3>
            <span className="text-[11px] font-mono text-stone-400">
              Matières, grammage, coupe & finitions
            </span>
          </div>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Détails sur la confection, coupe, grammage du tissu, finitions..."
            className="w-full bg-stone-950 text-stone-200 border border-stone-700 rounded-2xl p-4 font-mono text-xs focus:outline-none focus:border-amber-400 leading-relaxed"
          />
        </div>

        {/* ========================================================================= */}
        {/* SECTION 4: TAILLES & COULEURS DISPONIBLES */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              4. Tailles & Couleurs Disponibles
            </h3>
            <p className="text-xs font-mono text-stone-400 mt-1">
              Sélectionnez les options que vos clients peuvent choisir lors de leur commande.
            </p>
          </div>

          <div className="space-y-6">
            {/* TAILLES */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold uppercase text-stone-300 tracking-wider">
                  Tailles Disponibles ({sizes.length}) :
                </label>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSizes([...AVAILABLE_SIZES])}
                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Toutes
                  </button>
                  <span className="text-stone-600">·</span>
                  <button
                    type="button"
                    onClick={() => setSizes(['S', 'M', 'L', 'XL'])}
                    className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    Standard (S-XL)
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {AVAILABLE_SIZES.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`w-14 h-12 rounded-xl font-mono font-bold text-sm transition-all flex items-center justify-center cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-400 text-stone-950 border-amber-400 shadow-md shadow-amber-400/20 scale-105'
                          : 'bg-stone-950 text-stone-400 border-stone-800 hover:border-stone-600 hover:text-stone-200'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* COULEURS */}
            <div className="space-y-3 pt-4 border-t border-stone-800">
              <div className="flex items-center justify-between">
                <label className="font-mono text-xs font-bold uppercase text-stone-300 tracking-wider">
                  Couleurs Disponibles ({colors.length}) :
                </label>
                <span className="text-[11px] font-mono text-stone-400">
                  {colors.join(', ')}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {PRESET_COLORS.map((col) => {
                  const isSelected = colors.includes(col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() => toggleColor(col.name)}
                      className={`p-3 rounded-xl border font-mono text-xs transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-stone-800 border-amber-400 text-stone-100 shadow-md ring-1 ring-amber-400/30'
                          : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: col.hex, borderColor: col.border }}
                      />
                      <span className="font-bold flex-1 text-left truncate">{col.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SECTION 5: DISPONIBILITÉ & OPTIONS MAGASIN */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="pb-3 border-b border-stone-800">
            <h3 className="font-serif text-xl font-bold text-stone-100">
              5. Statut & Visibilité en Boutique
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            {/* Stock */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                inStock
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-stone-950 border-stone-800 text-stone-400'
              }`}
            >
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500"
              />
              <div>
                <div className="font-bold text-stone-100">Produit en Stock</div>
                <div className="text-[10px] text-stone-400">Disponible à l'achat immédiat</div>
              </div>
            </label>

            {/* Top Vedette */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                top
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-stone-950 border-stone-800 text-stone-400'
              }`}
            >
              <input
                type="checkbox"
                checked={top}
                onChange={(e) => setTop(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-400"
              />
              <div>
                <div className="font-bold text-stone-100">Mettre en Vedette (Top)</div>
                <div className="text-[10px] text-stone-400">En tête du catalogue & accueil</div>
              </div>
            </label>

            {/* Wisdom Lab Personnalisable */}
            <label
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                customisable
                  ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200'
                  : 'bg-stone-950 border-stone-800 text-stone-400'
              }`}
            >
              <input
                type="checkbox"
                checked={customisable}
                onChange={(e) => setCustomisable(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-400"
              />
              <div>
                <div className="font-bold text-stone-100">Personnalisable (Lab)</div>
                <div className="text-[10px] text-stone-400">Disponible dans l'atelier 2D</div>
              </div>
            </label>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BOTTOM ACTION BAR */}
        {/* ========================================================================= */}
        <div className="bg-stone-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl">
          <div className="text-center sm:text-left space-y-1">
            <h4 className="font-serif text-lg font-bold text-stone-100 flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle2 className="w-5 h-5 text-amber-400" />
              <span>Prêt à enregistrer ce produit ?</span>
            </h4>
            <p className="text-xs font-mono text-stone-400">
              L'enregistrement insère directement les données dans votre base Supabase et les applique sur tout le site.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-6 py-3.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-mono text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial px-8 py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-mono text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xl shadow-amber-500/25 scale-[1.02]"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'ENREGISTREMENT...' : '🚀 ENREGISTRER SUR SUPABASE'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
