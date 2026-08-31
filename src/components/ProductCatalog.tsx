import React, { useState, useMemo } from 'react';
import { SlidersHorizontal, ArrowUpDown, X } from 'lucide-react';
import { Product } from '../types';
import { ProductCard } from './ProductCard';
import { COLOR_SWATCHES, ALL_SIZES } from '../data/initialData';

interface ProductCatalogProps {
  products: Product[];
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onAddToCart: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  searchQuery: string;
  onOpenLab: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  products,
  wishlist,
  onToggleWishlist,
  onAddToCart,
  onSelectProduct,
  searchQuery,
  onOpenLab,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'Tous les tee-shirts' },
    { id: 'wisdom', label: 'Signature WISDOM' },
    { id: 'neutre', label: 'Basiques Neutres' },
    { id: 'perso', label: 'Personnalisés (Lab)' },
  ];

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category match
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Sizes match
      if (
        selectedSizes.length > 0 &&
        !p.sizes.some((size) => selectedSizes.includes(size))
      ) {
        return false;
      }
      // Colors match
      if (
        selectedColors.length > 0 &&
        !p.colors.some((color) => selectedColors.includes(color))
      ) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesKeyword = p.keyword?.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        if (!matchesName && !matchesKeyword && !matchesDesc) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else {
      // featured
      result.sort((a, b) => (b.top ? 1 : 0) - (a.top ? 1 : 0));
    }

    return result;
  }, [products, selectedCategory, selectedSizes, selectedColors, searchQuery, sortBy]);

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  return (
    <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Catalog Title & Category Pills */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-stone-800">
        <div>
          <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shadow-sm shadow-amber-400/50" />
            <span className="font-semibold text-stone-300">Collection Officielle · Prêt-à-Porter</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-stone-100 mt-1 tracking-tight">
            Nos Tee-shirts WISDOM
          </h2>
        </div>

        {/* Categories Scrollable Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full font-mono text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800 hover:text-white border border-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar: Filters & Sorting */}
      <div className="py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              showFilters || selectedSizes.length > 0 || selectedColors.length > 0
                ? 'bg-amber-400/10 border-amber-400 text-amber-400'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrer ({selectedSizes.length + selectedColors.length})</span>
          </button>

          {(selectedSizes.length > 0 || selectedColors.length > 0 || selectedCategory !== 'all') && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-mono text-stone-400 hover:text-amber-400 underline cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-stone-400">
            {filteredProducts.length} {filteredProducts.length > 1 ? 'résultats' : 'résultat'}
          </span>

          <div className="relative inline-flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-900 text-stone-200 border border-stone-800 text-xs font-mono font-semibold rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-amber-400 cursor-pointer appearance-none"
            >
              <option value="featured">En vedette</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expandable Filter Drawer Box */}
      {showFilters && (
        <div className="mb-8 p-5 bg-stone-900/90 border border-amber-400/30 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h4 className="font-mono text-xs font-bold text-amber-300 uppercase tracking-wider">
              Options de filtrage avancées
            </h4>
            <button
              onClick={() => setShowFilters(false)}
              className="text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sizes */}
            <div>
              <p className="text-xs font-mono text-stone-400 mb-2">Tailles disponibles :</p>
              <div className="flex flex-wrap gap-2">
                {ALL_SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                      selectedSizes.includes(size)
                        ? 'bg-amber-400 text-stone-950 font-black'
                        : 'bg-stone-950 text-stone-300 border border-stone-800 hover:border-stone-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <p className="text-xs font-mono text-stone-400 mb-2">Couleurs :</p>
              <div className="flex flex-wrap gap-2">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => toggleColor(color.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-2 border transition-colors cursor-pointer ${
                      selectedColors.includes(color.name)
                        ? 'bg-stone-800 border-amber-400 text-amber-300 font-bold'
                        : 'bg-stone-950 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-stone-600"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span>{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-20 text-center bg-stone-900/50 border border-stone-800 rounded-3xl p-8 max-w-xl mx-auto my-8">
          <p className="font-serif text-2xl font-bold text-stone-200">Aucun produit trouvé</p>
          <p className="text-sm text-stone-400 mt-2">
            Essayez de modifier votre recherche ou de réinitialiser vos filtres.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-6 px-6 py-2.5 bg-amber-400 text-stone-950 font-mono text-xs font-bold rounded-full hover:bg-amber-300 transition-colors cursor-pointer"
          >
            Voir tous les produits
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 sm:gap-8 mt-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlisted={wishlist.includes(product.id)}
              onToggleWishlist={onToggleWishlist}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          ))}
        </div>
      )}

      {/* Customizer Banner Teaser */}
      <div className="mt-16 sm:mt-20 bg-gradient-to-r from-stone-900 via-stone-950 to-stone-900 border border-amber-400/30 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 font-mono text-xs font-bold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span>WISDOM LAB STUDIO</span>
          </div>
          <h3 className="font-serif text-3xl sm:text-4xl font-bold text-stone-100 leading-tight mb-4">
            Envie d'un t-shirt 100% personnalisé ?
          </h3>
          <p className="text-stone-300 text-sm font-light leading-relaxed mb-8 max-w-xl">
            Tapez votre nom, verset, ou citation préférée. Choisissez votre couleur et prévisualisez votre création en direct avant de commander.
          </p>
          <button
            onClick={onOpenLab}
            className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-amber-400 text-stone-950 font-mono font-bold text-sm rounded-full hover:bg-amber-300 transition-all cursor-pointer shadow-lg shadow-amber-400/20 transform hover:-translate-y-0.5"
          >
            <span>Ouvrir le Studio de Personnalisation</span>
          </button>
        </div>
      </div>
    </section>
  );
};
