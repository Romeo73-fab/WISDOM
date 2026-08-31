import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, RotateCcw, Check, Type, MoveVertical, Palette } from 'lucide-react';
import { COLOR_SWATCHES, ALL_SIZES } from '../data/initialData';
import { Product } from '../types';

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
  }) => void;
}

export const WisdomLab: React.FC<WisdomLabProps> = ({ onAddToCart }) => {
  const [shirtColor, setShirtColor] = useState('Noir');
  const [selectedSize, setSelectedSize] = useState('L');
  const [customText, setCustomText] = useState('WISDOM STREETWEAR');
  const [selectedFont, setSelectedFont] = useState<'serif' | 'mono' | 'sans' | 'display'>('serif');
  const [printColor, setPrintColor] = useState('Or');
  const [printSide, setPrintSide] = useState<'front' | 'back'>('front');
  const [quantity, setQuantity] = useState(1);

  // ZIP File upload state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipError, setZipError] = useState<string>('');

  const MAX_ZIP_SIZE = 15 * 1024 * 1024; // Strict limit: 15 MB

  const handleZipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZipError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file format (.zip)
    const isZip = file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip');
    if (!isZip) {
      setZipError('Format non valide ! Seuls les fichiers .ZIP sont acceptés.');
      setZipFile(null);
      return;
    }

    // Check strict size limit (Max 15MB)
    if (file.size > MAX_ZIP_SIZE) {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
      setZipError(`Taille dépassée (${sizeInMb} Mo) ! La taille maximale autorisée est de 15 Mo.`);
      setZipFile(null);
      return;
    }

    setZipFile(file);
  };

  const printColors = [
    { name: 'Or', hex: '#D9A441', textClass: 'text-amber-400' },
    { name: 'Blanc', hex: '#FFFFFF', textClass: 'text-white' },
    { name: 'Noir', hex: '#111111', textClass: 'text-stone-900' },
    { name: 'Rouge', hex: '#B23A2E', textClass: 'text-red-500' },
  ];

  const fonts = [
    { id: 'serif', label: 'Fraunces Serif', cssClass: 'font-serif' },
    { id: 'sans', label: 'Work Sans', cssClass: 'font-sans' },
    { id: 'mono', label: 'Work Sans (Capitaine)', cssClass: 'font-mono uppercase' },
    { id: 'display', label: 'Cursive Display', cssClass: 'italic font-serif' },
  ];

  const currentShirtSwatch = COLOR_SWATCHES.find((c) => c.name === shirtColor) || COLOR_SWATCHES[0];
  const currentPrintSwatch = printColors.find((p) => p.name === printColor) || printColors[0];

  const handleAddToCart = () => {
    if (!customText.trim()) {
      alert('Veuillez saisir votre texte personnalisé.');
      return;
    }

    const customProduct: Product = {
      id: 'custom-lab-' + Date.now(),
      name: `Tee-shirt Personnalisé WISDOM LAB ("${customText.slice(0, 15)}...")`,
      price: 5000,
      category: 'perso',
      description: `Création sur mesure - Couleur: ${shirtColor}, Taille: ${selectedSize}, Impression: ${printColor} (${printSide === 'front' ? 'Devant' : 'Au Dos'})${zipFile ? ` [Fichier ZIP joint: ${zipFile.name}]` : ''}.`,
      image: '',
      gallery: [],
      sizes: [selectedSize],
      colors: [shirtColor],
      customisable: true,
    };

    for (let i = 0; i < quantity; i++) {
      onAddToCart({
        product: customProduct,
        size: selectedSize,
        color: shirtColor,
        customText,
        customFont: selectedFont,
        customColor: printColor,
        customPrintSide: printSide,
        customZipName: zipFile ? zipFile.name : undefined,
      });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Studio Header */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          <span>WISDOM LAB · Studio de Personnalisation</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-black text-stone-100 leading-tight mb-4">
          Personnalisez Votre T-Shirt
        </h2>
        <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
          Composez votre propre t-shirt en direct. Choisissez la couleur du tissu, votre proverbe ou prénom, la police et l'impression sérigraphique.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* T-Shirt Canvas Live Preview (Left / Center) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="text-[10px] font-mono bg-stone-950 text-amber-400 border border-stone-800 px-3 py-1 rounded-full">
              Position: {printSide === 'front' ? 'Devant (Poitrine)' : 'Au Dos (Grand Format)'}
            </span>
          </div>

          <button
            onClick={() => setPrintSide(printSide === 'front' ? 'back' : 'front')}
            className="absolute top-4 right-4 text-xs font-mono bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-200 border border-stone-700 px-3 py-1.5 rounded-full transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Basculer {printSide === 'front' ? 'Au Dos' : 'Devant'}</span>
          </button>

          {/* Mannequin Torso T-Shirt Live Preview */}
          <div className="relative w-full max-w-sm sm:max-w-md aspect-[4/5] flex items-center justify-center my-2 sm:my-4 select-none">
            <svg
              viewBox="0 0 500 600"
              className="w-full h-full filter drop-shadow-2xl transition-all duration-300"
            >
              <defs>
                {/* Fabric Shading Gradients */}
                <linearGradient id="mannequinNeck" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1c1917" />
                  <stop offset="100%" stopColor="#292524" />
                </linearGradient>
                <linearGradient id="torsoShadow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#000000" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
                </linearGradient>
              </defs>

              {/* Mannequin Neck Headpiece Stand */}
              <ellipse cx="250" cy="40" rx="36" ry="16" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <path d="M214 40 L214 85 Q250 102 286 85 L286 40 Z" fill="url(#mannequinNeck)" stroke="#3f3f46" strokeWidth="1.5" />
              <ellipse cx="250" cy="85" rx="36" ry="12" fill="#27272a" stroke="#3f3f46" strokeWidth="1" />

              {/* Dressed Mannequin T-shirt Torso Silhouette */}
              <path
                d="M140 105 Q250 82 360 105 L475 175 L410 270 L375 240 L375 560 Q375 570 365 570 L135 570 Q125 570 125 560 L125 240 L90 270 L25 175 Z"
                fill={currentShirtSwatch.hex}
                stroke="#1c1917"
                strokeWidth="3.5"
              />

              {/* Fabric Shading & Contours Over Shirt */}
              <path
                d="M140 105 Q250 82 360 105 L475 175 L410 270 L375 240 L375 560 Q375 570 365 570 L135 570 Q125 570 125 560 L125 240 L90 270 L25 175 Z"
                fill="url(#torsoShadow)"
              />

              {/* T-Shirt Neckband / Ribbed Collar */}
              <path
                d="M175 105 Q250 145 325 105"
                fill="none"
                stroke="#18181b"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M180 105 Q250 142 320 105"
                fill="none"
                stroke="#3f3f46"
                strokeWidth="1.5"
              />

              {/* Shoulder & Sleeve Contour Seams */}
              <path d="M140 105 L175 240" fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="2" />
              <path d="M360 105 L325 240" fill="none" stroke="#000000" strokeOpacity="0.25" strokeWidth="2" />

              {/* Woven Neck Brand Label */}
              <rect x="230" y="112" width="40" height="18" rx="3" fill="#e17a2d" />
              <text x="250" y="124" fontSize="8" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold">
                WISDOM
              </text>
            </svg>

            {/* Live Custom Design Overlay - Strictly Constrained on the Chest / Upper Back (NEVER Overflows) */}
            <div
              className={`absolute flex flex-col items-center justify-center text-center overflow-hidden pointer-events-none transition-all duration-300 z-10 px-3 py-2 rounded-xl border border-dashed border-stone-500/20 ${
                printSide === 'front'
                  ? 'top-[33%] sm:top-[35%] w-[50%] max-w-[200px] h-[30%] max-h-[140px]'
                  : 'top-[30%] sm:top-[32%] w-[58%] max-w-[230px] h-[38%] max-h-[170px]'
              }`}
            >
              <div
                className={`w-full max-w-full break-words leading-tight tracking-wider uppercase transition-all flex items-center justify-center ${
                  selectedFont === 'serif' ? 'font-serif font-black' : ''
                } ${selectedFont === 'mono' ? 'font-mono font-bold' : ''} ${
                  selectedFont === 'sans' ? 'font-sans font-extrabold' : ''
                } ${selectedFont === 'display' ? 'italic font-serif font-bold' : ''}`}
                style={{
                  color: currentPrintSwatch.hex,
                  fontSize:
                    customText.length > 30
                      ? '11px'
                      : customText.length > 20
                      ? '13px'
                      : customText.length > 12
                      ? '15px'
                      : '18px',
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                  maxHeight: '100%',
                }}
              >
                {customText || 'VOTRE TEXTE ICI'}
              </div>

              <div className="mt-2 flex items-center gap-1 opacity-80 flex-shrink-0">
                <span
                  className="text-[8px] sm:text-[9px] font-mono tracking-widest font-semibold"
                  style={{ color: currentPrintSwatch.hex }}
                >
                  — WISDOM BENIN —
                </span>
              </div>
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-xs font-mono text-stone-400">
              Aperçu Mannequin HD · Impression sérigraphie haut de gamme
            </p>
          </div>
        </div>

        {/* Customization Options Panel (Right) */}
        <div className="lg:col-span-5 bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-6">
          <div className="pb-4 border-b border-stone-800">
            <h3 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
              <Type className="w-5 h-5 text-amber-400" />
              <span>Configurez votre modèle</span>
            </h3>
            <p className="text-xs text-stone-400 mt-1">Prix fixe : 5 000 FCFA / unité</p>
          </div>

          {/* 1. Custom Text Input */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              1. Votre Texte ou Proverbe
            </label>
            <input
              type="text"
              maxLength={45}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ex: LA SAGESSE SE PORTE, SAGACITE 2026..."
              className="w-full bg-stone-950 text-stone-100 placeholder-stone-500 border border-stone-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400 font-mono"
            />
            <p className="text-[10px] font-mono text-stone-500 mt-1 flex justify-between">
              <span>Rendu sur t-shirt immédiat</span>
              <span>{customText.length}/45 caractères</span>
            </p>
          </div>

          {/* 2. Font Style */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              2. Style Typographique
            </label>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFont(f.id as any)}
                  className={`p-2.5 rounded-xl border text-xs text-center transition-all cursor-pointer ${
                    selectedFont === f.id
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-bold'
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
              3. Couleur du T-shirt
            </label>
            <div className="flex flex-wrap gap-3">
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setShirtColor(c.name)}
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                    shirtColor === c.name
                      ? 'border-amber-400 scale-110 shadow-lg shadow-amber-400/20'
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

          {/* 4. Print Color */}
          <div>
            <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
              4. Couleur d'Impression
            </label>
            <div className="flex flex-wrap gap-3">
              {printColors.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setPrintColor(p.name)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-mono font-bold flex items-center gap-2 cursor-pointer ${
                    printColor === p.name
                      ? 'bg-stone-800 border-amber-400 text-amber-300'
                      : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-stone-600"
                    style={{ backgroundColor: p.hex }}
                  />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Size & Quantity */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
                5. Taille
              </label>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(e.target.value)}
                className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400"
              >
                {ALL_SIZES.map((size) => (
                  <option key={size} value={size}>
                    Taille {size}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
                Quantité
              </label>
              <div className="flex items-center bg-stone-950 border border-stone-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-stone-300 hover:bg-stone-800 text-sm font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="flex-1 text-center font-mono text-xs font-bold text-stone-100">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3 py-2 text-stone-300 hover:bg-stone-800 text-sm font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-stone-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-stone-400">Total personnalisation:</span>
              <span className="font-serif text-2xl font-black text-amber-300">
                {(5000 * quantity).toLocaleString('fr-FR')} FCFA
              </span>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer"
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
