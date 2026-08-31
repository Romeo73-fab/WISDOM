import React from 'react';
import sleeveDefaultImg from '../assets/images/wisdom_sleeve_patch_1787825766441.jpg';
import chestDefaultImg from '../assets/images/wisdom_chest_logo_1787825785711.jpg';
import { StoreSettings } from '../types';

interface BrandShowcaseSectionProps {
  settings?: StoreSettings;
  onExploreClick?: () => void;
}

export const BrandShowcaseSection: React.FC<BrandShowcaseSectionProps> = ({
  settings,
  onExploreClick,
}) => {
  const sleeveImg = settings?.showcaseSleeveImageUrl || sleeveDefaultImg;
  const chestImg = settings?.showcaseChestImageUrl || chestDefaultImg;

  return (
    <section className="bg-stone-950 border-t border-stone-800/80 py-12 sm:py-16 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content Grid: Left Text + Compact Certificates + Right Images */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline, Value Proposition & Compact Certificates */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                <span>SAVOIR-FAIRE & ATELIER BÉNIN</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black text-stone-100 tracking-tight leading-[1.15]">
                Choisir une mode responsable et locale n'a jamais été aussi simple.
              </h2>
            </div>

            <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed max-w-xl">
              Chez <strong className="text-stone-100 font-semibold">WISDOM</strong>, chaque pièce est taillée dans un coton lourd de qualité supérieure. Une confection soignée associant confort streetwear moderne et authenticité locale.
            </p>

            {/* Zone Certificats Sans Boîte Englobante - Plus Grands et Rapprochés */}
            <div className="pt-2">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider block mb-3">
                Labels et certifications
              </span>
              
              <div className="flex items-center gap-6 sm:gap-8 flex-wrap">
                
                {/* 1. ORIGINE WISDOM GARANTIE */}
                <div className="flex items-center gap-2 select-none">
                  <div className="flex flex-col items-center">
                    <div className="flex gap-1 mb-1">
                      <span className="w-1 h-2.5 bg-amber-400 transform -skew-x-12 inline-block"></span>
                      <span className="w-1 h-2.5 bg-amber-400 transform -skew-x-12 inline-block"></span>
                    </div>
                    <div className="border-t-2 border-b-2 border-stone-500 py-1 px-2 text-center">
                      <span className="text-[7.5px] font-mono tracking-widest block text-stone-400 leading-tight">ORIGINE</span>
                      <span className="text-sm sm:text-base font-serif font-black tracking-wider block text-stone-100 uppercase leading-none my-0.5">WISDOM®</span>
                      <span className="text-[7.5px] font-mono tracking-widest block text-amber-400 font-bold leading-tight">GARANTIE</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <span className="w-1 h-2.5 bg-amber-400 transform -skew-x-12 inline-block"></span>
                      <span className="w-1 h-2.5 bg-amber-400 transform -skew-x-12 inline-block"></span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-stone-400 [writing-mode:vertical-rl] transform rotate-180 tracking-tight leading-none">
                    Cotonou · BJ
                  </span>
                </div>

                {/* 2. BOUTIQUE AU BÉNIN */}
                <div className="flex flex-col items-center text-center select-none">
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <svg className="w-7 h-7 text-stone-200" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono font-bold tracking-tight text-stone-300 uppercase leading-none">
                      BOUTIQUE
                    </p>
                    <p className="text-[11px] font-mono font-extrabold tracking-wider text-amber-400 uppercase leading-tight mt-0.5">
                      AU BÉNIN
                    </p>
                  </div>
                  <span className="text-[8px] font-mono text-stone-400 mt-1 block">
                    Atelier Local
                  </span>
                </div>

                {/* 3. ORGANIC 100 COTON STANDARD - Clear & Legible Design */}
                <div className="flex items-center gap-2.5 select-none">
                  <div className="w-11 h-11 rounded-full border-2 border-amber-400 bg-stone-900 flex flex-col items-center justify-center p-1 shadow-md flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
                    </svg>
                    <span className="text-[7px] font-mono font-black text-stone-100 tracking-tight leading-none mt-0.5">
                      100%
                    </span>
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wide leading-tight">
                      ORGANIC 100
                    </span>
                    <span className="text-xs font-serif font-black text-stone-100 uppercase tracking-tight leading-tight">
                      COTON BIO
                    </span>
                    <span className="text-[9px] font-mono text-stone-400 tracking-tight leading-tight">
                      240g/m² · Standard
                    </span>
                  </div>
                </div>

              </div>
            </div>

            {onExploreClick && (
              <div className="pt-2">
                <button
                  onClick={onExploreClick}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <span>Voir tous les modèles</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: 2 Miniature Horizontal Rectangle Logo Cards */}
          <div className="lg:col-span-6 flex flex-col justify-center items-center lg:items-end">
            <div className="w-full max-w-md space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-0.5 bg-amber-400"></span>
                <span className="text-[11px] font-mono font-bold text-stone-300 uppercase tracking-widest">
                  Signatures & Logos WISDOM®
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mini Card 1: Logo Manche */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg group hover:border-amber-400/50 transition-all">
                  <div className="w-full aspect-[16/9] bg-stone-950 overflow-hidden relative">
                    <img
                      src={sleeveImg}
                      alt="Logo Manche WISDOM"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-stone-950/85 backdrop-blur-sm border border-stone-700/60 text-[9px] font-mono text-amber-400 font-bold uppercase">
                      Manche
                    </div>
                  </div>
                  <div className="px-2.5 py-2 bg-stone-950 border-t border-stone-800/80">
                    <p className="text-[11px] font-mono font-bold text-stone-200 leading-tight">
                      Écusson Brodé
                    </p>
                    <p className="text-[9px] font-mono text-stone-400 mt-0.5">
                      Finition manche
                    </p>
                  </div>
                </div>

                {/* Mini Card 2: Logo Poitrine */}
                <div className="bg-stone-900/90 border border-stone-800 rounded-xl overflow-hidden shadow-lg group hover:border-amber-400/50 transition-all">
                  <div className="w-full aspect-[16/9] bg-stone-950 overflow-hidden relative">
                    <img
                      src={chestImg}
                      alt="Logo Poitrine WISDOM"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-stone-950/85 backdrop-blur-sm border border-stone-700/60 text-[9px] font-mono text-amber-400 font-bold uppercase">
                      Poitrine
                    </div>
                  </div>
                  <div className="px-2.5 py-2 bg-stone-950 border-t border-stone-800/80">
                    <p className="text-[11px] font-mono font-bold text-stone-200 leading-tight">
                      Signature WISDOM
                    </p>
                    <p className="text-[9px] font-mono text-stone-400 mt-0.5">
                      Logo poitrine
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
