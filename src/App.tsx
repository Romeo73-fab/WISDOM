import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order, User, StoreSettings, Review, PromoCode } from './types';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SETTINGS,
  DEFAULT_PROMOS,
  INITIAL_REVIEWS,
  DEFAULT_WHATSAPP,
} from './data/initialData';
import {
  getItem,
  setItem,
  fetchServerStoreData,
  saveServerProducts,
  saveServerOrders,
  saveServerUsers,
  saveServerSettings,
  saveServerReviews,
  saveServerPromos,
  sha256,
  PRODUCTS_KEY,
  USERS_KEY,
  ORDERS_KEY,
  SETTINGS_KEY,
  WISHLIST_KEY,
  CART_KEY,
  PROMOS_KEY,
} from './utils/storage';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductCatalog } from './components/ProductCatalog';
import { ProductPage } from './components/ProductPage';
import { WisdomLab } from './components/WisdomLab';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { AuthModal } from './components/AuthModal';
import { AdminPortal } from './components/AdminPortal';
import { FAQSection } from './components/FAQSection';
import { ContactSection } from './components/ContactSection';
import { AboutSection } from './components/AboutSection';
import { BrandShowcaseSection } from './components/BrandShowcaseSection';
import { SizeGuideModal } from './components/SizeGuideModal';
import { UserProfile } from './components/UserProfile';
import { Footer } from './components/Footer';
import { Toast } from './components/Toast';
import { InstallNotificationBar } from './components/InstallNotificationBar';
import { InstallAppModal } from './components/InstallAppModal';
import {
  getCurrentActiveUser,
  signOutFromSupabase,
} from './utils/supabaseAuthService';
import { getSupabase } from './lib/supabase';
import { updateAppIconsAndManifest } from './utils/dynamicIconService';

export default function App() {
  // Main Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [promos, setPromos] = useState<PromoCode[]>(DEFAULT_PROMOS);

  // Sync browser favicon and web app manifest whenever logoUrl or appIconUrl is updated
  useEffect(() => {
    updateAppIconsAndManifest(settings.logoUrl, settings.appIconUrl);
  }, [settings.logoUrl, settings.appIconUrl]);

  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Navigation & Search
  const [activeTab, setActiveTab] = useState<string>('shop');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg(msg);
    setToastType(type);
  };

  // Initial Load from Server Database & Persistent Storage Fallback
  useEffect(() => {
    async function loadAllData() {
      // 1. Try fetching live database from server API
      const serverData = await fetchServerStoreData();
      if (serverData) {
        if (serverData.products && serverData.products.length > 0) {
          setProducts(serverData.products);
          setItem(PRODUCTS_KEY, serverData.products);
        }
        if (serverData.orders) {
          setOrders(serverData.orders);
          setItem(ORDERS_KEY, serverData.orders);
        }
        if (serverData.users) {
          setUsersList(serverData.users);
          setItem(USERS_KEY, serverData.users);
        }
        if (serverData.settings) {
          setSettings(serverData.settings);
          setItem(SETTINGS_KEY, serverData.settings);
        }
        if (serverData.reviews) {
          setReviews(serverData.reviews);
        }
        if (serverData.promos && serverData.promos.length > 0) {
          setPromos(serverData.promos);
          setItem(PROMOS_KEY, serverData.promos);
        }
      } else {
        // Fallback to local storage if offline
        const loadedProds = await getItem<Product[]>(PRODUCTS_KEY, DEFAULT_PRODUCTS);
        setProducts(loadedProds);

        const loadedOrders = await getItem<Order[]>(ORDERS_KEY, []);
        setOrders(loadedOrders);

        const loadedUsers = await getItem<User[]>(USERS_KEY, []);
        setUsersList(loadedUsers);

        const loadedSettings = await getItem<StoreSettings>(SETTINGS_KEY, DEFAULT_SETTINGS);
        setSettings(loadedSettings);

        const loadedPromos = await getItem<PromoCode[]>(PROMOS_KEY, DEFAULT_PROMOS);
        setPromos(loadedPromos);
      }

      const loadedWishlist = await getItem<string[]>(WISHLIST_KEY, []);
      const sanitizedWishlist = Array.isArray(loadedWishlist)
        ? Array.from(new Set(loadedWishlist.filter((id) => typeof id === 'string' && id.trim().length > 0)))
        : [];
      setWishlist(sanitizedWishlist);

      const loadedCart = await getItem<CartItem[]>(CART_KEY, []);
      const sanitizedCart = Array.isArray(loadedCart)
        ? loadedCart
            .filter(
              (item) => item && typeof item === 'object' && typeof item.productId === 'string' && Number(item.quantity) > 0
            )
            .map((item) => ({ ...item, quantity: Number(item.quantity) || 1 }))
        : [];
      setCart(sanitizedCart);
    }

    loadAllData();

    // Restore active Supabase session
    getCurrentActiveUser().then((activeUser) => {
      if (activeUser) {
        setCurrentUser(activeUser);
      }
    });

    const supabase = getSupabase();
    let authUnsubscribe: (() => void) | undefined;
    if (supabase) {
      const { data: authData } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const userProfile = await getCurrentActiveUser();
          if (userProfile) setCurrentUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      });
      authUnsubscribe = () => authData.subscription.unsubscribe();
    }

    return () => {
      if (authUnsubscribe) authUnsubscribe();
    };
  }, []);

  // Save changes to storage and server API
  const saveProductsToStorage = (updatedProds: Product[]) => {
    setProducts(updatedProds);
    setItem(PRODUCTS_KEY, updatedProds);
    saveServerProducts(updatedProds);
  };

  const saveOrdersToStorage = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    setItem(ORDERS_KEY, updatedOrders);
    saveServerOrders(updatedOrders);
  };

  const saveUsersToStorage = (updatedUsers: User[]) => {
    setUsersList(updatedUsers);
    setItem(USERS_KEY, updatedUsers);
    saveServerUsers(updatedUsers);
  };

  const saveSettingsToStorage = (updatedSettings: StoreSettings) => {
    setSettings(updatedSettings);
    setItem(SETTINGS_KEY, updatedSettings);
    saveServerSettings(updatedSettings);
  };

  // Wishlist Logic - Bulletproof against double increments
  const handleToggleWishlist = (productId: string) => {
    if (!productId || typeof productId !== 'string') return;
    setWishlist((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      setItem(WISHLIST_KEY, next);
      showToast(exists ? 'Retiré de vos favoris' : 'Ajouté à vos favoris ♡');
      return next;
    });
  };

  // Cart Logic - Pure immutable updates, no phantom counts
  const handleAddToCart = (
    product: Product,
    size: string = 'L',
    color: string = 'Noir',
    qty: number = 1
  ) => {
    if (!product || !product.id) return;
    const validQty = Math.max(1, Number(qty) || 1);

    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.productId === product.id && item.size === size && item.color === color
      );

      let nextCart: CartItem[];
      if (existingIdx > -1) {
        nextCart = prev.map((item, idx) =>
          idx === existingIdx ? { ...item, quantity: item.quantity + validQty } : item
        );
      } else {
        const newItem: CartItem = {
          id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
          productId: product.id,
          quantity: validQty,
          size,
          color,
        };
        nextCart = [...prev, newItem];
      }

      setItem(CART_KEY, nextCart);
      showToast(`${product.name} ajouté au panier !`);
      return nextCart;
    });
  };

  // Custom Lab Add to Cart
  const handleAddCustomToCart = (customData: {
    product: Product;
    size: string;
    color: string;
    customText: string;
    customFont: string;
    customColor: string;
    customPrintSide: 'front' | 'back';
    customZipName?: string;
    quantity?: number;
  }) => {
    if (!customData || !customData.product) return;
    const qty = Math.max(1, Number(customData.quantity) || 1);
    const newItem: CartItem = {
      id: 'custom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      productId: customData.product.id,
      quantity: qty,
      size: customData.size,
      color: customData.color,
      customText: customData.customText,
      customFont: customData.customFont,
      customTextColor: customData.customColor,
      customPrintSide: customData.customPrintSide,
    };

    setCart((prev) => {
      const nextCart = [...prev, newItem];
      setItem(CART_KEY, nextCart);
      return nextCart;
    });

    showToast('Création personnalisée ajoutée au panier !');
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCart((prev) => {
      const next = prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item));
      setItem(CART_KEY, next);
      return next;
    });
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCart((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      setItem(CART_KEY, next);
      return next;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setItem(CART_KEY, []);
  };

  // Record Order
  const handleRecordOrder = (
    method: 'whatsapp' | 'fedapay',
    deliveryCity: string,
    deliveryAddress: string,
    phone: string,
    deliveryFee: number,
    total: number
  ) => {
    if (!currentUser) return;

    const newOrder: Order = {
      id: 'o' + Date.now(),
      userEmail: currentUser.email,
      userName: currentUser.name,
      userPhone: phone,
      userCity: deliveryCity,
      deliveryAddress,
      items: cart.map((c) => {
        const p = products.find((pr) => pr.id === c.productId);
        return {
          name: p ? p.name : 'Tee-shirt Custom',
          quantity: c.quantity,
          price: p ? p.price : 5000,
          size: c.size,
          color: c.color,
          customDetails: c.customText ? `Texte: ${c.customText}` : undefined,
        };
      }),
      total,
      deliveryFee,
      method,
      status: 'en_attente',
      date: new Date().toISOString(),
    };

    saveOrdersToStorage([newOrder, ...orders]);
  };

  // Direct 1-click WhatsApp Order from Product Modal
  const handleOpenWhatsAppOrder = (
    product: Product,
    size: string,
    color: string,
    qty: number
  ) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      showToast('Veuillez vous connecter pour valider votre commande', 'info');
      return;
    }

    const total = product.price * qty + 1000;
    let msg = `Bonjour WISDOM,\n\nJe souhaite commander :\n`;
    msg += `• ${product.name} (Taille: ${size}, Couleur: ${color}) x${qty}\n`;
    msg += `Client: ${currentUser.name}\n`;
    msg += `Email: ${currentUser.email}\n`;
    msg += `Total approximatif : ${total.toLocaleString('fr-FR')} FCFA (livraison Cotonou incluses).\n\nMerci !`;

    const singleOrder: Order = {
      id: 'o' + Date.now(),
      userEmail: currentUser.email,
      userName: currentUser.name,
      items: [
        {
          name: product.name,
          quantity: qty,
          price: product.price,
          size,
          color,
        },
      ],
      total,
      deliveryFee: 1000,
      method: 'whatsapp',
      status: 'en_attente',
      date: new Date().toISOString(),
    };

    saveOrdersToStorage([singleOrder, ...orders]);
    window.open(`https://wa.me/${settings.whatsappNumber || DEFAULT_WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Add Review
  const handleAddReview = (
    productId: string,
    rating: number,
    comment: string,
    userName: string
  ) => {
    const newRev: Review = {
      id: 'rev-' + Date.now(),
      productId,
      userName,
      rating,
      comment,
      date: 'Aujourd\'hui',
      verifiedPurchase: true,
    };
    setReviews([newRev, ...reviews]);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* Toast Notification Container */}
      <Toast message={toastMsg} type={toastType} onClose={() => setToastMsg(null)} />

      {/* Top PWA Application Installation Notification Banner */}
      <InstallNotificationBar
        logoUrl={settings.logoUrl}
        appIconUrl={settings.appIconUrl}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        onShowToast={showToast}
      />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        logoUrl={settings.logoUrl}
        appIconUrl={settings.appIconUrl}
        wishlistCount={wishlist.length}
        cartCount={cart.reduce((s, c) => s + (Number(c.quantity) || 0), 0)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedProduct(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={() => {
          setCurrentUser(null);
          showToast('Déconnexion effectuée');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onScrollToAdmin={() => {
          setSelectedProduct(null);
          setActiveTab('shop');
          setTimeout(() => {
            const el = document.getElementById('admin-panel');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Main App Body */}
      <main className="flex-1">
        {/* Dedicated Full Product Page Presentation */}
        {selectedProduct ? (
          <ProductPage
            product={selectedProduct}
            allProducts={products}
            reviews={reviews}
            isWishlisted={wishlist.includes(selectedProduct.id)}
            onBack={() => {
              setSelectedProduct(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={(prod, size, color, qty) => {
              handleAddToCart(prod, size, color, qty);
            }}
            onOpenWhatsAppOrder={(prod, size, color, qty) => {
              handleOpenWhatsAppOrder(prod, size, color, qty);
            }}
            onOpenSizeGuide={() => setIsSizeGuideOpen(true)}
            onAddReview={handleAddReview}
          />
        ) : (
          <>
            {/* Tab 1: Main Shop */}
            {activeTab === 'shop' && (
              <>
                <Hero
                  settings={settings}
                  onExploreClick={() => {
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  onLabClick={() => setActiveTab('lab')}
                />

                {/* Admin Panel (If Logged In as Admin) */}
                {currentUser?.isAdmin && (
                  <AdminPortal
                    products={products}
                    orders={orders}
                    usersList={usersList}
                    settings={settings}
                    onSaveProducts={saveProductsToStorage}
                    onSaveOrders={saveOrdersToStorage}
                    onSaveUsers={saveUsersToStorage}
                    onSaveSettings={saveSettingsToStorage}
                    onShowToast={showToast}
                  />
                )}

                <ProductCatalog
                  products={products}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={(p) => handleAddToCart(p)}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  searchQuery={searchQuery}
                  onOpenLab={() => setActiveTab('lab')}
                />

                <BrandShowcaseSection
                  settings={settings}
                  onExploreClick={() => {
                    const el = document.getElementById('catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                />

                <AboutSection />
              </>
            )}

            {/* Tab 2: Wisdom Lab Studio */}
            {activeTab === 'lab' && <WisdomLab onAddToCart={handleAddCustomToCart} />}

            {/* Tab 3: About / History */}
            {activeTab === 'about' && (
              <>
                <BrandShowcaseSection
                  settings={settings}
                  onExploreClick={() => {
                    setActiveTab('shop');
                    setTimeout(() => {
                      const el = document.getElementById('catalog');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                />
                <AboutSection />
              </>
            )}

            {/* Tab 4: FAQ */}
            {activeTab === 'faq' && <FAQSection />}

            {/* Tab 5: Contact */}
            {activeTab === 'contact' && <ContactSection onShowToast={showToast} />}

            {/* Tab 6: User Profile */}
            {activeTab === 'profil' && (
              <UserProfile
                currentUser={currentUser}
                orders={orders}
                onOpenAuth={() => setIsAuthOpen(true)}
                onLogout={async () => {
                  await signOutFromSupabase();
                  setCurrentUser(null);
                  showToast('Déconnexion effectuée');
                }}
                onUpdatePasswordSuccess={async (newPass) => {
                  if (currentUser) {
                    const newHash = await sha256(newPass);
                    const updated = usersList.map((u) =>
                      u.email.toLowerCase() === currentUser.email.toLowerCase()
                        ? { ...u, passwordHash: newHash }
                        : u
                    );
                    saveUsersToStorage(updated);
                    showToast('Mot de passe mis à jour avec succès');
                  }
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        logoUrl={settings.logoUrl}
        onNavigateTab={(tab) => {
          setSelectedProduct(null);
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Drawers & Modals */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        products={products}
        currentUser={currentUser}
        promos={promos}
        fedapayLink={settings.fedapayLink}
        whatsappNumber={settings.whatsappNumber}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
        onRecordOrder={handleRecordOrder}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        wishlistIds={wishlist}
        products={products}
        onClose={() => setIsWishlistOpen(false)}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={(p) => handleAddToCart(p)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        logoUrl={settings.logoUrl}
        usersList={usersList}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Bienvenue ${user.name} !`);
        }}
        onRegisterUser={(newUser) => {
          saveUsersToStorage([...usersList, newUser]);
          showToast('Compte créé avec succès ✓');
        }}
        onUpdateUsersList={(updatedUsers) => {
          saveUsersToStorage(updatedUsers);
          showToast('Compte mis à jour avec succès');
        }}
      />

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
      />

      <InstallAppModal
        isOpen={isInstallModalOpen}
        logoUrl={settings.logoUrl}
        appIconUrl={settings.appIconUrl}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
}
