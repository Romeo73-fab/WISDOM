import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sizeChart = [
    { size: 'S', width: '48 cm', length: '68 cm', height: '155 - 165 cm' },
    { size: 'M', width: '51 cm', length: '71 cm', height: '165 - 175 cm' },
    { size: 'L', width: '54 cm', length: '74 cm', height: '175 - 182 cm' },
    { size: 'XL', width: '57 cm', length: '77 cm', height: '182 - 190 cm' },
    { size: 'XXL', width: '60 cm', length: '80 cm', height: '190 cm +' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase mb-2">
          <Ruler className="w-4 h-4" />
          <span>Guide des Tailles Officiel</span>
        </div>

        <h3 className="font-serif text-2xl font-bold text-stone-100 mb-4">
          Comment choisir la bonne taille ?
        </h3>

        <p className="text-xs text-stone-300 font-light mb-6">
          Nos t-shirts WISDOM ont une coupe mixte moderne légèrement ample. Si vous hésitez entre deux tailles, nous vous conseillons de prendre la taille au-dessus.
        </p>

        {/* Size Table */}
        <div className="overflow-x-auto border border-stone-800 rounded-2xl bg-stone-950">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-stone-900 text-amber-300 uppercase border-b border-stone-800">
              <tr>
                <th className="p-3">Taille</th>
                <th className="p-3">Largeur (A)</th>
                <th className="p-3">Longueur (B)</th>
                <th className="p-3">Stature recommandée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800 text-stone-300">
              {sizeChart.map((row) => (
                <tr key={row.size} className="hover:bg-stone-900/50">
                  <td className="p-3 font-bold text-amber-400">{row.size}</td>
                  <td className="p-3">{row.width}</td>
                  <td className="p-3">{row.length}</td>
                  <td className="p-3">{row.height}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 p-4 bg-stone-950/80 border border-stone-800 rounded-2xl text-[11px] font-mono text-stone-400">
          💡 <strong>Garantie Échange Facile:</strong> Si la taille ne vous convient pas à la réception, nous vous l'échangeons sous 48h sur simple message WhatsApp !
        </div>
      </div>
    </div>
  );
};
