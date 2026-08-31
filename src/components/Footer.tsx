import React from 'react';
import { Heart, Sparkles, Shield, ArrowUp } from 'lucide-react';
import { LogoImage } from './LogoImage';

interface FooterProps {
  logoUrl?: string;
  onNavigateTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ logoUrl, onNavigateTab }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-stone-950 border-t border-stone-800 text-stone-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Identity Column */}
          <div className="space-y-4">
            <div className="flex items-center">
              <LogoImage
                src={logoUrl}
                alt="Logo WISDOM"
                className="h-10 sm:h-11 w-auto max-w-[200px] object-contain drop-shadow-sm brightness-105"
              />
            </div>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Marque béninoise de vêtements engagée. La sagesse se porte au quotidien à travers des pièces 100% Coton peigné haute finition.
            </p>
            <div className="flex items-center gap-2 text-[11px] font-mono text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conçu & Imprimé à Cotonou, Bénin</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Boutique
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('shop');
                    scrollToTop();
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Tous les Tee-shirts
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('lab');
                    scrollToTop();
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>Wisdom Lab (Personnaliser)</span>
                  <span className="text-[9px] bg-amber-400 text-stone-950 font-bold px-1.5 py-0.2 rounded">
                    NEW
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('shop');
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Collections Signature
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & FAQ */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Aide & Informations
            </h4>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('faq');
                    scrollToTop();
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Foire Aux Questions (FAQ)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('contact');
                    scrollToTop();
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Livraisons & Tarifs Bénin
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    onNavigateTab('contact');
                    scrollToTop();
                  }}
                  className="hover:text-amber-300 transition-colors cursor-pointer"
                >
                  Contact WhatsApp Direct
                </button>
              </li>
            </ul>
          </div>

          {/* Payment & Security */}
          <div className="space-y-3">
            <h4 className="font-mono text-xs font-bold text-amber-400 uppercase tracking-widest">
              Paiements Sécurisés
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed font-light">
              Paiement à la livraison par WhatsApp ou en ligne par Mobile Money (MTN Moov, Wave) via FedaPay.
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] font-mono text-stone-300 font-bold">
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg">MTN Mobile Money</span>
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg">Moov Money</span>
              <span className="px-2.5 py-1 bg-stone-900 border border-stone-800 rounded-lg">FedaPay</span>
            </div>
          </div>
        </div>

        {/* Bottom Rights */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-stone-500">
          <p>© 2026 WISDOM — Tous droits réservés. Boutique officielle Bénin.</p>

          <button
            onClick={scrollToTop}
            className="p-2.5 bg-stone-900 hover:bg-amber-400 hover:text-stone-950 text-stone-300 rounded-full border border-stone-800 transition-all cursor-pointer flex items-center gap-1.5"
            title="Retour en haut"
          >
            <ArrowUp className="w-4 h-4" />
            <span>Haut de page</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
