import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Palette, Award } from 'lucide-react';
import { StoreSettings } from '../types';

interface HeroProps {
  settings: StoreSettings;
  onExploreClick: () => void;
  onLabClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreClick, onLabClick }) => {
  const isVideo =
    settings.heroBgType === 'video'
      ? Boolean(settings.heroVideoUrl)
      : settings.heroBgType === 'image'
      ? false
      : Boolean(settings.heroVideoUrl);

  return (
    <div className="relative w-full overflow-hidden bg-stone-950 text-stone-100 border-b border-stone-800">
      {/* Hero Media Background */}
      <div className="relative h-[65vh] min-h-[440px] max-h-[700px] w-full overflow-hidden">
        {isVideo && settings.heroVideoUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <video
              key={settings.heroVideoUrl}
              src={settings.heroVideoUrl}
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
          </div>
        ) : settings.heroImageUrl ? (
          <div className="absolute inset-0 w-full h-full">
            <img
              src={settings.heroImageUrl}
              alt="Wisdom Banner"
              className="w-full h-full object-cover opacity-50 filter brightness-90 saturate-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full">
            <img
              src="/assets/images/wisdom_hero_banner_1786398469341.jpg"
              alt="Wisdom Banner"
              className="w-full h-full object-cover opacity-50 filter brightness-90 saturate-110"
              onError={(e) => {
                // If local path fails, fallback to elegant ambient background
                (e.target as HTMLElement).style.display = 'none';
              }}
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />
          </div>
        )}

        {/* Ambient Lighting Overlay */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-stone-950/80 pointer-events-none" />

        {/* Content Container */}
        <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center z-10">
          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-serif text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none text-stone-100 max-w-4xl"
          >
            {settings.heroTitle ? (
              settings.heroTitle
            ) : (
              <>
                La sagesse <br />
                <span className="italic font-normal bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent">
                  se porte au quotidien.
                </span>
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-stone-300 text-base sm:text-lg max-w-2xl font-light leading-relaxed"
          >
            {settings.heroSubtitle ||
              'WISDOM habille les gens simples et les esprits réveillés. Matière 100% Coton peigné, coupes unisexes et sérigraphie dorée haute tenue.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-8 flex flex-wrap justify-center gap-4"
          >
            <button
              onClick={onExploreClick}
              className="px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold font-mono text-sm rounded-full shadow-lg shadow-amber-400/20 transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <span>Voir la Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onLabClick}
              className="px-7 py-3.5 bg-stone-900/90 hover:bg-stone-800 text-stone-100 border border-stone-700 font-bold font-mono text-sm rounded-full backdrop-blur-sm transition-all duration-300 transform hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Personnaliser (Wisdom Lab)</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Trust & Guarantee Grid Bar */}
      <div className="bg-stone-900/90 border-t border-stone-800 py-6 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <Award className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-serif font-bold text-lg text-amber-300">1 500 FCFA</p>
              <p className="text-[11px] font-mono text-stone-400 uppercase">Prix dès / Qualité Coton</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <ShieldCheck className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-serif font-bold text-lg text-stone-100">100% Coton Bio</p>
              <p className="text-[11px] font-mono text-stone-400 uppercase">Peigné & Anti-rétrécissement</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Truck className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-serif font-bold text-lg text-stone-100">24h - 48h</p>
              <p className="text-[11px] font-mono text-stone-400 uppercase">Livraison Cotonou, Calavi, Bénin</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Palette className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="text-left">
              <p className="font-serif font-bold text-lg text-stone-100">Wisdom Lab</p>
              <p className="text-[11px] font-mono text-stone-400 uppercase">Aperçu direct de votre texte</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
