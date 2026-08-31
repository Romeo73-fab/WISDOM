export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'wisdom' | 'neutre' | 'perso' | string;
  keyword?: string;
  description: string;
  image: string;
  videoUrl?: string;
  gallery: string[];
  sizes: string[];
  colors: string[];
  top?: boolean;
  inStock?: boolean;
  customisable?: boolean;
  badge?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number; // percentage value (e.g. 10) or fixed amount in FCFA (e.g. 1500)
  minOrderAmount: number; // minimum cart subtotal in FCFA
  expiresAt?: string;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  isPublicBanner?: boolean;
}

export interface CartItem {
  id: string; // product id or custom item id
  productId: string;
  quantity: number;
  size: string;
  color: string;
  customText?: string;
  customFont?: string;
  customTextColor?: string;
  customPrintSide?: 'front' | 'back';
  customZipName?: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  customDetails?: string;
}

export interface Order {
  id: string;
  userEmail: string;
  userName: string;
  userPhone?: string;
  userCity?: string;
  deliveryAddress?: string;
  items: OrderItem[];
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string;
  loyaltyPointsUsed?: number;
  loyaltyPointsEarned?: number;
  total: number;
  deliveryFee: number;
  method: 'whatsapp' | 'fedapay' | 'cash';
  status: 'en_attente' | 'en_cours' | 'livree' | 'annulee';
  date: string;
}

export interface User {
  id?: string;
  name: string;
  email: string;
  passwordHash?: string;
  phone?: string;
  city?: string;
  address?: string;
  isAdmin?: boolean;
  role?: 'admin' | 'client' | string;
  createdAt?: string;
  loyaltyPoints?: number;
  totalSpent?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'black';
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
}

export interface StoreSettings {
  logoUrl?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBgType?: 'image' | 'video';
  heroVideoUrl: string;
  heroImageUrl: string;
  showcaseSleeveImageUrl?: string;
  showcaseChestImageUrl?: string;
  fedapayLink: string;
  announcementText: string;
  whatsappNumber: string;
  deliveryFees: Record<string, number>;
}
