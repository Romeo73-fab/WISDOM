import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  RotateCcw, 
  Check, 
  Type, 
  Palette, 
  Upload, 
  Sparkles, 
  User, 
  Layers, 
  Maximize2,
  FileArchive
} from 'lucide-react';
import { COLOR_SWATCHES, ALL_SIZES } from '../data/initialData';
import { Product } from '../types';

// Professional Matching Ghost Mannequin Studio Assets (Exact Front & Back)
import boxyGhostWhiteFront from '../assets/images/boxy_ghost_white_front_1788348598318.jpg';
import boxyGhostWhiteBack from '../assets/images/boxy_ghost_white_back_1788348614965.jpg';
import boxyGhostBlackFront from '../assets/images/boxy_ghost_black_front_1788348630622.jpg';
import boxyGhostBlackBack from '../assets/images/boxy_ghost_black_back_1788348646050.jpg';

interface WisdomLabProps {
  onAddToCart: (customItem: {
    product: Product;
    size: string;
    color: string;
    customText: string;
    customFont: string;
    customColor: string;
    customPrintSide: 'front' | 'back';
    customZipName?: string;
    quantity?: number;
  }) => void;
}

const PROVERB_PRESETS = [
  "LA PATIENCE EST UN ARBRE DONT LA RACINE EST AMÈRE MAIS LE FRUIT EST DOUX",
  "LA SAGESSE NE S'ACHÈTE PAS, ELLE SE PORTE",
  "SEUL ON VA PLUS VITE, ENSEMBLE ON VA PLUS LOIN",
  "CONNAIS-TOI TOI-MÊME · WISDOM 2026",
  "L'ÉLÉGANCE EST LA SEULE BEAUTÉ QUI NE SE FANNE JAMAIS",
];

export const WisdomLab: React.FC<WisdomLabProps> = ({ onAddToCart }) => {
  const [shirtColor, setShirtColor] = useState('Noir');
  const [selectedSize, setSelectedSize] = useState('L');
  const [customText, setCustomText] = useState('WISDOM STREETWEAR');
  const [selectedFont, setSelectedFont] = useState<'serif' | 'mono' | 'sans' | 'display'>('serif');
  const [printColor, setPrintColor] = useState('Or');
  const [printSide, setPrintSide] = useState<'front' | 'back'>('front');
  const [customGraphic, setCustomGraphic] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Graphic Upload handler (Logo/Design PNG)
  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomGraphic(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // ZIP File upload state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipError, setZipError] = useState<string>('');

  const MAX_ZIP_SIZE = 15 * 1024 * 1024; // Limit: 15 MB

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');
    if (!isZip) {
      setZipError('Format non valide ! Seuls les fichiers .ZIP sont acceptés.');
      setZipFile(null);
      return;
    }

    if (file.size > MAX_ZIP_SIZE) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setZipError(`Taille dépassée (${sizeInMb} Mo) ! Maximum 15 Mo.`);
      setZipFile(null);
      return;
    }

    setZipFile(file);
  };

  const printColors = [
    { name: 'Or', hex: '#E5A93C', textClass: 'text-amber-400', style: 'text-amber-400 drop-shadow-[0_2px_10px_rgba(229,169,60,0.4)]' },
    { name: 'Blanc', hex: '#FFFFFF', textClass: 'text-white', style: 'text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]' },
    { name: 'Noir', hex: '#111111', textClass: 'text-stone-900', style: 'text-stone-950 drop-shadow-[0_1px_4px_rgba(255,255,255,0.2)]' },
    { name: 'Rouge', hex: '#DC2626', textClass: 'text-red-500', style: 'text-red-500 drop-shadow-[0_2px_8px_rgba(220,38,38,0.4)]' },
    { name: 'Argent', hex: '#CBD5E1', textClass: 'text-slate-300', style: 'text-slate-200 drop-shadow-[0_2px_8px_rgba(203,213,225,0.4)]' },
  ];

  const fonts = [
    { id: 'serif', label: 'Fraunces Serif (Prestige)', cssClass: 'font-serif font-black tracking-wider' },
    { id: 'sans', label: 'Work Sans (Moderne)', cssClass: 'font-sans font-black tracking-widest uppercase' },
    { id: 'mono', label: 'Monospace (Streetwear)', cssClass: 'font-mono font-bold tracking-widest uppercase' },
    { id: 'display', label: 'Cursive (Signature)', cssClass: 'italic font-serif font-bold tracking-normal' },
  ];

  const currentShirtSwatch = COLOR_SWATCHES.find((c) => c.name === shirtColor) || COLOR_SWATCHES[0];
  const currentPrintSwatch = printColors.find((p) => p.name === printColor) || printColors[0];

  // Determine which background mannequin render to use (Front and Back are matching pairs)
  const getMannequinImage = () => {
    if (printSide === 'back') {
      return shirtColor === 'Blanc' ? boxyGhostWhiteBack : boxyGhostBlackBack;
    }
    return shirtColor === 'Blanc' ? boxyGhostWhiteFront : boxyGhostBlackFront;
  };

  const handleAddToCart = () => {
    if (!customText.trim() && !customGraphic) {
      alert('Veuillez saisir votre texte ou importer un visuel.');
      return;
    }

    const currentImage = getMannequinImage();

    const customProduct: Product = {
      id: 'custom-lab-' + Date.now(),
      name: `Tee-shirt Personnalisé WISDOM LAB ("${(customText || 'Graphique').slice(0, 15)}...")`,
      price: 5000,
      category: 'perso',
      description: `Création sur mesure - Ghost Mannequin - Couleur: ${shirtColor}, Taille: ${selectedSize}, Impression: ${printColor} (${printSide === 'back' ? 'Au Dos' : 'Devant'})${zipFile ? ` [Fichier ZIP: ${zipFile.name}]` : ''}.`,
      image: currentImage,
      gallery: [
        shirtColor === 'Blanc' ? boxyGhostWhiteFront : boxyGhostBlackFront,
        shirtColor === 'Blanc' ? boxyGhostWhiteBack : boxyGhostBlackBack,
      ],
      sizes: [selectedSize],
      colors: [shirtColor],
      customisable: true,
    };

    onAddToCart({
      product: customProduct,
      size: selectedSize,
      color: shirtColor,
      customText: customText || 'Visuel Personnalisé',
      customFont: selectedFont,
      customColor: printColor,
      customPrintSide: printSide,
      customZipName: zipFile ? zipFile.name : undefined,
      quantity,
    });
  };

  // Color overlay tint calculation for realistic fabric blending for other swatches
  const getFabricOverlayStyle = () => {
    if (shirtColor === 'Noir' || shirtColor === 'Blanc') return {};
    return {
      backgroundColor: currentShirtSwatch.hex,
      mixBlendMode: 'color' as const,
      opacity: 0.82,
    };
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>WISDOM LAB · Studio de Personnalisation 3D Pro</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-black text-stone-100 leading-tight mb-3">
          Personnalisez Votre T-Shirt
        </h2>
        <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
          Visualisez votre création en temps réel sur notre mannequin professionnel haute définition. Sérigraphie premium garantie.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= T-SHIRT PRO MANNEQUIN CANVAS (Left / Center) ================= */}
        <div className="lg:col-span-7 bg-gradient-to-b from-stone-900 via-stone-925 to-stone-950 border border-stone-800 rounded-3xl p-4 sm:p-7 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          
          {/* Top Control Bar: Front / Back Direct Switcher */}
          <div className="w-full flex items-center justify-between gap-2 mb-4 z-20">
            {/* View Mode Toggle Buttons (Only Devant & Dos) */}
            <div className="flex items-center gap-1.5 bg-stone-950/90 backdrop-blur-md border border-stone-800 rounded-2xl p-1.5 shadow-lg">
              <button
                onClick={() => setPrintSide('front')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  printSide === 'front'
                    ? 'bg-amber-400 text-stone-950 shadow-md scale-105'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Devant (Face)</span>
              </button>

              <button
                onClick={() => setPrintSide('back')}
                className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  printSide === 'back'
                    ? 'bg-amber-400 text-stone-950 shadow-md scale-105'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Au Dos (Arrière)</span>
              </button>
            </div>

            {/* Visual indicator badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-stone-300 bg-stone-950/80 border border-stone-800 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Ghost Mannequin HD</span>
            </div>
          </div>

          {/* Mannequin Stage & Live Silk-Screen Overlay */}
          <div className="relative w-full max-w-[440px] aspect-[1/1] sm:aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-stone-800/80 bg-stone-950 select-none group flex items-center justify-center">
            
            {/* 1. Base Ghost Mannequin Render (Identical cut and lighting for Front & Back) */}
            <img
              src={getMannequinImage()}
              alt="Mannequin Streetwear WISDOM"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.01]"
            />

            {/* 2. Realistic Fabric Tint Overlay for Non-Black/Non-White Swatches */}
            {shirtColor !== 'Noir' && shirtColor !== 'Blanc' && (
              <div 
                className="absolute inset-0 pointer-events-none transition-all duration-500"
                style={getFabricOverlayStyle()}
              />
            )}

            {/* Subtle Lighting Accent */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-stone-950/10 pointer-events-none" />

            {/* 3. Live Custom Design Overlay (Perfect Straight Alignment: Chest for Front, Upper Back for Back) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${printSide}-${selectedFont}-${printColor}-${textSize}-${customGraphic ? 'hasGraphic' : 'noGraphic'}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`absolute flex flex-col items-center justify-center text-center overflow-hidden pointer-events-none z-10 px-2 py-2 left-1/2 -translate-x-1/2 ${
                  printSide === 'front'
                    ? 'top-[33%] sm:top-[35%] w-[56%] max-w-[220px]'
                    : 'top-[27%] sm:top-[29%] w-[64%] max-w-[250px]'
                }`}
              >
                {/* Optional Custom Uploaded Graphic Preview */}
                {customGraphic && (
                  <div className="mb-2 max-w-[85px] max-h-[85px] overflow-hidden drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                    <img 
                      src={customGraphic} 
                      alt="Custom Graphic" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Print Branding Mini Header */}
                {customText && (
                  <div className="flex items-center gap-1.5 opacity-90 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" style={{ color: currentPrintSwatch.hex }} />
                    <span
                      className="text-[8px] sm:text-[9px] font-mono tracking-[0.25em] font-extrabold uppercase"
                      style={{ color: currentPrintSwatch.hex }}
                    >
                      WISDOM BENIN
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" style={{ color: currentPrintSwatch.hex }} />
                  </div>
                )}

                {/* Main Custom Text with Authentic Silkscreen Look (Straight, Non-tilted) */}
                {customText && (
                  <div
                    className={`w-full max-w-full leading-[1.15] uppercase transition-all flex items-center justify-center text-center ${
                      selectedFont === 'serif' ? 'font-serif font-black' : ''
                    } ${selectedFont === 'mono' ? 'font-mono font-bold tracking-widest' : ''} ${
                      selectedFont === 'sans' ? 'font-sans font-black tracking-wider' : ''
                    } ${selectedFont === 'display' ? 'italic font-serif font-bold tracking-normal' : ''}`}
                    style={{
                      color: currentPrintSwatch.hex,
                      fontSize:
                        textSize === 'sm'
                          ? '11px'
                          : textSize === 'lg'
                          ? (customText.length > 25 ? '14px' : '17px')
                          : (customText.length > 30 ? '11px' : customText.length > 18 ? '13px' : '14px'),
                      textShadow:
                        printColor === 'Or'
                          ? '0 0 12px rgba(229,169,60,0.6), 0 2px 4px rgba(0,0,0,0.8)'
                          : printColor === 'Blanc'
                          ? '0 2px 6px rgba(0,0,0,0.9)'
                          : '0 1px 3px rgba(255,255,255,0.3)',
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {customText}
                  </div>
                )}

                {/* Bottom Authenticity Stamp */}
                {customText && (
                  <div className="mt-1 opacity-80">
                    <span
                      className="text-[7px] sm:text-[8px] font-mono tracking-widest font-semibold"
                      style={{ color: currentPrintSwatch.hex }}
                    >
                      — SÉRIE LIMITÉE —
                    </span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Corner Badge Info */}
            <div className="absolute bottom-3 left-3 bg-stone-950/85 backdrop-blur-md border border-stone-800 px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full border border-stone-600" style={{ backgroundColor: currentShirtSwatch.hex }} />
              <span className="text-[10px] font-mono text-stone-200">
                {shirtColor} · {selectedSize} · Sérigraphie {printColor}
              </span>
            </div>

            {/* View Mode Tag */}
            <div className="absolute top-3 right-3 bg-stone-950/85 backdrop-blur-md border border-stone-800/80 px-3 py-1 rounded-full text-[10px] font-mono text-amber-400 font-bold uppercase">
              {printSide === 'front' ? 'Vue Poitrine' : 'Vue Dos'}
            </div>
          </div>

          <div className="text-center mt-3">
            <p className="text-xs font-mono text-stone-400 flex items-center justify-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Mannequin Streetwear Oversized · Sérigraphie Directe Poitrine & Dos</span>
            </p>
          </div>
        </div>

        {/* ================= CUSTOMIZATION CONTROLS PANEL (Right) ================= */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="pb-3 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
                <Type className="w-5 h-5 text-amber-400" />
                <span>Atelier de Création</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">Personnalisation sur mesure 100% Coton Lourd</p>
            </div>
            <span className="font-serif text-xl font-black text-amber-300 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/20">
              5 000 F
            </span>
          </div>

          {/* 1. Custom Text Input & Proverb Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono font-bold text-stone-300 uppercase">
                1. Votre Texte ou Proverbe
              </label>
              <span className="text-[10px] font-mono text-stone-500">
                {customText.length}/55 car.
              </span>
            </div>
            <input
              type="text"
              maxLength={55}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ex: LA SAGESSE SE PORTE, SAGACITÉ 2026..."
              className="w-full bg-stone-950 text-stone-100 placeholder-stone-500 border border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono transition-colors"
            />

            {/* Quick Proverb Suggestions */}
            <div className="mt-2.5">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-1">
                Idées de proverbes rapides :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROVERB_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomText(p)}
                    className="text-[10px] font-mono bg-stone-950 hover:bg-stone-800 text-stone-300 border border-stone-800 hover:border-amber-400/40 px-2 py-1 rounded-lg transition-all cursor-pointer truncate max-w-full"
                    title={p}
                  >
                    "{p.slice(0, 24)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Direct Image / Logo Upload for live visual check */}
          <div className="p-3 bg-stone-950/60 border border-stone-800/80 rounded-2xl">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold text-stone-300 uppercase flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Importer un Logo / Visuel (PNG / JPG)</span>
              </label>
              {customGraphic && (
                <button
                  onClick={() => setCustomGraphic(null)}
                  className="text-[10px] font-mono text-red-400 hover:underline cursor-pointer"
                >
                  Supprimer
                </button>
              )}
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={handleGraphicUpload}
              className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-bold file:bg-stone-800 file:text-amber-400 hover:file:bg-stone-700 cursor-pointer"
            />
          </div>

          {/* 2. Font Style Selection */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              2. Style Typographique
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.id as any)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer flex flex-col justify-between ${
                    selectedFont === f.id
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-400/10'
                      : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                  }`}
                >
                  <span className={f.cssClass}>{f.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. T-shirt Base Color */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              3. Couleur du T-shirt ({shirtColor})
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setShirtColor(c.name)}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                    shirtColor === c.name
                      ? 'border-amber-400 scale-110 shadow-lg shadow-amber-400/30'
                      : 'border-stone-800 hover:border-stone-600'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {shirtColor === c.name && (
                    <Check
                      className={`w-4 h-4 ${
                        c.name === 'Blanc' ? 'text-stone-900' : 'text-amber-400'
                      }`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Print / Ink Color */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              4. Couleur de Sérigraphie ({printColor})
            </label>
            <div className="flex flex-wrap gap-2">
              {printColors.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setPrintColor(p.name)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer transition-all ${
                    printColor === p.name
                      ? 'bg-stone-800 border-amber-400 text-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-stone-600 shadow-sm"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Print Side & Text Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                5. Emplacement
              </label>
              <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800">
                <button
                  onClick={() => setPrintSide('front')}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    printSide === 'front'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Devant
                </button>
                <button
                  onClick={() => setPrintSide('back')}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    printSide === 'back'
                      ? 'bg-amber-400 text-stone-950 shadow-sm'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  Au Dos
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Taille Sérigraphie
              </label>
              <div className="flex rounded-xl bg-stone-950 p-1 border border-stone-800">
                {(['sm', 'md', 'lg'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setTextSize(s)}
                    className={`flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg transition-all cursor-pointer ${
                      textSize === s
                        ? 'bg-stone-800 text-amber-400 shadow-sm'
                        : 'text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {s === 'sm' ? 'S' : s === 'md' ? 'M' : 'L'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6. Size & Quantity Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                6. Taille
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {ALL_SIZES.map((size) => (
                  <option key={size} value={size}>
                    Taille {size} (Oversized)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Quantité
              </label>
              <div className="flex items-center bg-stone-950 border border-stone-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono text-xs font-bold text-stone-100">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-1.5 text-stone-300 hover:bg-stone-800 text-sm font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 7. Optional Design File (.ZIP, Max 15MB) */}
          <div className="pt-2 border-t border-stone-800">
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                <span>7. Archive maquette (.ZIP - Optionnel)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-normal">Max 15 Mo</span>
            </label>
            <input
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleZipUpload}
              className="w-full text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-bold file:bg-stone-950 file:text-amber-400 hover:file:bg-stone-800 cursor-pointer border border-stone-800 rounded-xl p-1 bg-stone-950"
            />
            {zipError && (
              <p className="text-red-400 text-xs font-mono mt-1.5">{zipError}</p>
            )}
            {zipFile && !zipError && (
              <p className="text-emerald-400 text-xs font-mono mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Fichier prêt : {zipFile.name} ({(zipFile.size / (1024 * 1024)).toFixed(1)} Mo)</span>
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <div className="pt-3 border-t border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-stone-400">Total Personnalisation :</span>
              <span className="font-serif text-2xl font-black text-amber-300">
                {(5000 * quantity).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Ajouter ma création au Panier</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
