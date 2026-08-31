import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { INITIAL_FAQS } from '../data/initialData';

export const FAQSection: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq-section" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center flex flex-col items-center mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Foire Aux Questions</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-100 leading-tight mb-4">
          Questions Fréquentes (FAQ)
        </h2>
        <p className="text-stone-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
          Tout ce que vous devez savoir sur la commande, la qualité de nos t-shirts et les livraisons au Bénin.
        </p>
      </div>

      <div className="space-y-4">
        {INITIAL_FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden transition-all duration-200"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-5 text-left font-serif font-bold text-stone-100 text-base sm:text-lg flex items-center justify-between gap-4 cursor-pointer hover:text-amber-300 transition-colors"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-amber-400 transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm font-light text-stone-300 border-t border-stone-800/60 leading-relaxed font-sans">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
