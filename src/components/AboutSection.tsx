import React from 'react';
import { ShieldCheck, Heart, Award } from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section id="about-section" className="bg-stone-900 border-y border-stone-800 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span>NOTRE HISTOIRE & ENGAGEMENT</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-black text-stone-100 leading-tight mb-5">
            Née au Bénin, Portée par la Sagesse
          </h2>
          <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed max-w-2xl">
            WISDOM est une marque béninoise indépendante de vêtements pensée pour tous — croyants ou non, jeunes passionnés de streetwear ou esprits apaisés. Chaque t-shirt est confectionné pour durer, à des prix accessibles pour tous.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-stone-950 border border-stone-800 rounded-3xl space-y-3">
            <div className="p-3 bg-stone-900 rounded-2xl w-12 h-12 flex items-center justify-center text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">Coton Bio Peigné</h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Nous sélectionnons un coton peigné lourd de 240g/m², doux au toucher et traité anti-rétrécissement pour préserver sa coupe lavage après lavage.
            </p>
          </div>

          <div className="p-6 bg-stone-950 border border-stone-800 rounded-3xl space-y-3">
            <div className="p-3 bg-stone-900 rounded-2xl w-12 h-12 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">Sérigraphie Or & Métal</h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              Nos typographies et logos emblématiques sont imprimés avec des encres métalliques dorées haute fixation, résistantes aux frottements et au soleil tropical.
            </p>
          </div>

          <div className="p-6 bg-stone-950 border border-stone-800 rounded-3xl space-y-3">
            <div className="p-3 bg-stone-900 rounded-2xl w-12 h-12 flex items-center justify-center text-amber-400">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-stone-100">Prix Juste pour Tous</h3>
            <p className="text-xs text-stone-400 font-light leading-relaxed">
              De 1 500 FCFA pour le basique à 5 000 FCFA pour la pièce personnalisée, nous offrons une qualité haut de gamme accessible sans aucun intermédiaire inutile.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
