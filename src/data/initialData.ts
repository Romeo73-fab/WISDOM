import { Product, StoreSettings, Review, PromoCode } from '../types';
import heroBannerImg from '../assets/images/wisdom_hero_banner_1786398469341.jpg';
import blackShirtImg from '../assets/images/wisdom_black_shirt_1786398483035.jpg';
import whiteShirtImg from '../assets/images/wisdom_white_shirt_1786398496994.jpg';
import sleeveModelImg from '../assets/images/wisdom_sleeve_patch_1787825766441.jpg';
import chestModelImg from '../assets/images/wisdom_chest_logo_1787825785711.jpg';

export const DEFAULT_WHATSAPP = '22960413145';

export const BENIN_CITIES = [
  { name: 'Cotonou', fee: 1000, delay: '24h' },
  { name: 'Abomey-Calavi', fee: 1200, delay: '24h-48h' },
  { name: 'Porto-Novo', fee: 1500, delay: '24h-48h' },
  { name: 'Ouidah', fee: 1500, delay: '48h' },
  { name: 'Bohicon / Abomey', fee: 2000, delay: '48h-72h' },
  { name: 'Parakou', fee: 2500, delay: '48h-72h' },
  { name: 'Natitingou', fee: 3000, delay: '72h' },
  { name: 'Autre ville du Bénin', fee: 2500, delay: '48h-72h' },
  { name: 'Hors du Bénin (International / Afrique)', fee: 5000, delay: '3 à 5 jours (Expédition Internationale)' },
];

export const COLOR_SWATCHES = [
  { name: 'Noir', hex: '#1C1A16', textClass: 'text-white' },
  { name: 'Blanc', hex: '#F5F2E9', textClass: 'text-gray-900' },
  { name: 'Indigo', hex: '#223A66', textClass: 'text-white' },
  { name: 'Terracotta', hex: '#B23A2E', textClass: 'text-white' },
  { name: 'Or', hex: '#D9A441', textClass: 'text-gray-900' },
  { name: 'Vert Forêt', hex: '#4C6B4F', textClass: 'text-white' },
];

export const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const DEFAULT_SETTINGS: StoreSettings = {
  logoUrl: '/logo-wisdom.png',
  appIconUrl: '/logo-wisdom.png',
  heroVideoUrl: '',
  heroImageUrl: heroBannerImg,
  showcaseSleeveImageUrl: sleeveModelImg,
  showcaseChestImageUrl: chestModelImg,
  fedapayLink: 'https://fedapay.com',
  announcementText: '⚡ Livestock & Livraison Express partout au Bénin en 24h/48h | T-shirts 100% Coton Bio',
  whatsappNumber: DEFAULT_WHATSAPP,
  deliveryFees: {
    Cotonou: 1000,
    'Abomey-Calavi': 1200,
    'Porto-Novo': 1500,
    Ouidah: 1500,
    'Bohicon / Abomey': 2000,
    Parakou: 2500,
    Natitingou: 3000,
    Autre: 2500,
  },
};

export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Tee-shirt Neutre Col Rond Coton Bio',
    price: 1500,
    category: 'neutre',
    keyword: 'basique minimaliste',
    description: '100% Coton peigné haute qualité, coupe unisexe moderne et finitions renforcées aux col et emmanchures.',
    image: blackShirtImg,
    gallery: [blackShirtImg, whiteShirtImg],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Noir', 'Blanc', 'Indigo', 'Terracotta'],
    top: false,
    inStock: true,
    badge: 'Essentiel',
  },
  {
    id: 'p2',
    name: 'Tee-shirt Wisdom Signature Or',
    price: 4000,
    category: 'wisdom',
    keyword: 'signature or luxe',
    description: 'Modèle iconique de la marque avec la typographie WISDOM brodée / sérigraphiée à l\'encre or métallique sur la poitrine.',
    image: blackShirtImg,
    gallery: [blackShirtImg, whiteShirtImg],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Noir', 'Blanc', 'Or'],
    top: true,
    inStock: true,
    badge: 'Bestseller',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: 'p3',
    name: 'Tee-shirt Personnalisé — WISDOM LAB',
    price: 5000,
    category: 'perso',
    keyword: 'personnalisation texte verset nom',
    description: 'Personnalisez entièrement votre tee-shirt avec votre proverbe, verset biblique, nom ou citation inspirante. Prévisualisation en direct!',
    image: whiteShirtImg,
    gallery: [whiteShirtImg, blackShirtImg],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Noir', 'Blanc', 'Indigo', 'Terracotta', 'Vert Forêt'],
    top: true,
    inStock: true,
    customisable: true,
    badge: 'Sur-Mesure',
  },
  {
    id: 'p4',
    name: 'Tee-shirt WISDOM Masterpiece Streetwear',
    price: 4500,
    category: 'wisdom',
    keyword: 'wisdom streetwear marque premium',
    description: 'Graphisme exclusif à l\'arrière "WISDOM Streetwear Cotonou" avec détails dorés subtils sur coton lourd 240g/m².',
    image: blackShirtImg,
    gallery: [blackShirtImg],
    sizes: ['M', 'L', 'XL', 'XXL'],
    colors: ['Noir', 'Terracotta', 'Indigo'],
    top: false,
    inStock: true,
    badge: 'Édition 2026',
  },
  {
    id: 'p5',
    name: 'Tee-shirt Oversized Cotonou Signature',
    price: 6000,
    category: 'wisdom',
    keyword: 'signature oversized street',
    description: 'Coupe streetwear oversize, broderie soignée sur la manche droite. Confection 100% coton peigné haut de gamme.',
    image: blackShirtImg,
    gallery: [blackShirtImg, whiteShirtImg],
    sizes: ['M', 'L', 'XL'],
    colors: ['Noir', 'Vert Forêt'],
    top: true,
    inStock: true,
    badge: 'Signature',
  },
  {
    id: 'p6',
    name: 'Tee-shirt Minimalist Crest',
    price: 3500,
    category: 'wisdom',
    keyword: 'logo minimaliste ecusson',
    description: 'Écusson discret WISDOM brodé sur le cœur. Style épuré et élégant pour le bureau comme pour les sorties.',
    image: whiteShirtImg,
    gallery: [whiteShirtImg, blackShirtImg],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Blanc', 'Indigo', 'Noir'],
    top: false,
    inStock: true,
  },
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: 'r1',
    productId: 'p2',
    userName: 'Koffi M.',
    rating: 5,
    comment: 'Qualité du coton impressionnante ! Le sérigraphié or ne bouge pas au lavage. Reçu à Cotonou en moins de 24h.',
    date: '12 Juillet 2026',
    verifiedPurchase: true,
  },
  {
    id: 'r2',
    productId: 'p3',
    userName: 'Aïchatou D.',
    rating: 5,
    comment: 'J\'ai fait imprimer mon verset préféré dessus. Le rendu du texte en direct est super fidèle ! Bravo Wisdom !',
    date: '28 Juin 2026',
    verifiedPurchase: true,
  },
  {
    id: 'r3',
    productId: 'p1',
    userName: 'Rodrigue A.',
    rating: 5,
    comment: 'Pour 1500 FCFA c\'est imbattable au Bénin. Coton très doux et confortable.',
    date: '04 Août 2026',
    verifiedPurchase: true,
  },
];

export const DEFAULT_PROMOS: PromoCode[] = [
  {
    id: 'promo_welcome',
    code: 'BIENVENUE10',
    description: '-10% sur votre commande dès 5 000 FCFA',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 5000,
    usedCount: 0,
    active: true,
    isPublicBanner: true,
  },
  {
    id: 'promo_vip20',
    code: 'WISDOM20',
    description: '-20% de remise exclusive dès 15 000 FCFA d\'achats',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 15000,
    usedCount: 0,
    active: true,
    isPublicBanner: false,
  },
  {
    id: 'promo_freeship',
    code: 'LIVRAISON_OFFERTE',
    description: 'Frais de livraison 100% offerts dès 10 000 FCFA d\'achats',
    discountType: 'free_shipping',
    discountValue: 0,
    minOrderAmount: 10000,
    usedCount: 0,
    active: true,
    isPublicBanner: true,
  },
];

export const LOYALTY_RULES = {
  pointsPer100Fcfa: 1, // 1 point for every 100 FCFA spent (10 000 FCFA = 100 pts)
  fcfaPer10Points: 100, // 10 points = 100 FCFA discount (100 points = 1000 FCFA)
  minPointsToRedeem: 50, // Minimum 50 points to redeem (500 FCFA)
};

export function calculateLoyaltyTier(points: number = 0): {
  tier: 'bronze' | 'silver' | 'gold' | 'black';
  label: string;
  badgeColor: string;
  nextTierPoints: number;
  perk: string;
} {
  if (points >= 1000) {
    return {
      tier: 'black',
      label: '💎 VIP Black',
      badgeColor: 'bg-stone-900 text-amber-300 border border-amber-500/50 shadow-amber-500/10',
      nextTierPoints: 1000,
      perk: 'Accès exclusif illimité, personnalisation prioritaire & cadeaux sur-mesure',
    };
  }
  if (points >= 500) {
    return {
      tier: 'gold',
      label: '🥇 Membre Or',
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      nextTierPoints: 1000,
      perk: 'Livraison prioritaire + avant-premières sur chaque nouvelle collection',
    };
  }
  if (points >= 200) {
    return {
      tier: 'silver',
      label: '🥈 Membre Argent',
      badgeColor: 'bg-slate-500/20 text-slate-200 border border-slate-400/30',
      nextTierPoints: 500,
      perk: 'Points doublés sur les éditions limitées & offres exclusives par e-mail',
    };
  }
  return {
    tier: 'bronze',
    label: '🥉 Membre Bronze',
    badgeColor: 'bg-amber-900/30 text-amber-200/90 border border-amber-800/40',
    nextTierPoints: 200,
    perk: 'Cumulez 1 point tous les 100 FCFA dépensés et convertissez-les en remises',
  };
}

export const INITIAL_FAQS = [
  {
    question: 'Quels sont les délais et tarifs de livraison au Bénin et à l\'international ?',
    answer: 'Au Bénin : livraison en 24h/48h à Cotonou, Abomey-Calavi et Porto-Novo (1 000 à 1 500 FCFA), et 48h/72h pour les autres villes du Bénin (2 000 à 3 000 FCFA). Hors du Bénin (International & Afrique) : livraison sous 3 à 5 jours via nos partenaires d\'expédition internationale (5 000 FCFA).',
  },
  {
    question: 'Comment puis-je payer ma commande ?',
    answer: 'Vous pouvez payer en ligne par Mobile Money (MTN, Moov, Wave) via FedaPay, ou directement par WhatsApp avec possibilité de paiement à la livraison selon la destination.',
  },
  {
    question: 'Comment fonctionne la personnalisation (Wisdom Lab) et l\'envoi de fichiers ?',
    answer: 'Dans l\'onglet "Wisdom Lab", vous pouvez taper votre texte personnalisé et également joindre un fichier ZIP (taille strictement limitée à 15 Mo max) contenant l\'image ou le motif exact à imprimer. Notez que l\'aperçu 2D interactif est uniquement destiné à vous aider à visualiser globalement le modèle. Une fois votre commande passée, notre équipe vous contactera directement (par WhatsApp ou téléphone) pour discuter avec vous des détails précis (positionnement millimétré, dimensions exactes, épreuve d\'impression).',
  },
  {
    question: 'Comment fonctionne le programme de fidélité WISDOM Club et les codes promo ?',
    answer: 'Chaque achat vous rapporte 1 point par tranche de 100 FCFA dépensée. Dès 50 points (500 FCFA), vous pouvez convertir directement vos points en réduction immédiate dans votre panier ! De plus, profitez du code BIENVENUE10 pour obtenir 10% de réduction sur votre commande.',
  },
  {
    question: 'Puis-je échanger si la taille ne convient pas ?',
    answer: 'Absolument ! Les échanges de taille sont acceptés sous 48h après réception si le tee-shirt n\'a pas été porté ni lavé.',
  },
  {
    question: 'Comment entretenir mon t-shirt Wisdom ?',
    answer: 'Lavage recommandé à froid ou à 30°C, de préférence à l\'envers, pour garantir une tenue irréprochable des impressions dorées et de la matière.',
  },
];

