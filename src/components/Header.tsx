import React, { useState, useEffect } from 'react';
import { ShoppingBag, Heart, Menu, X, User, Shield, Download } from 'lucide-react';
import { User as UserType } from '../types';
import { InstallAppModal } from './InstallAppModal';
import { LogoImage } from './LogoImage';

interface HeaderProps {
  currentUser: UserType | null;
  logoUrl?: string;
  wishlistCount: number;
  cartCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  onScrollToAdmin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  logoUrl,
  wishlistCount,
  cartCount,
  activeTab,
  setActiveTab,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onLogout,
  onScrollToAdmin,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDrawerMenu, setShowDrawerMenu] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'shop', label: 'Boutique' },
    { id: 'lab', label: 'Wisdom Lab', badge: 'Personnaliser' },
    { id: 'about', label: 'Notre Histoire' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ];

  // Links visible directly in header top bar (without 'Notre Histoire')
  const headerTopLinks = navLinks.filter((link) => link.id === 'shop' || link.id === 'lab');

  return (
    <>
      <header className="sticky top-0 z-40 w-full transition-all duration-300">
        {/* Admin indicator bar */}
        {currentUser?.isAdmin && (
          <div className="bg-amber-400 border-b border-stone-900 py-1.5 px-4 text-xs font-mono font-bold text-stone-950 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>MODE ADMINISTRATEUR · Espace de Gestion WISDOM</span>
            </div>
            <button
              onClick={onScrollToAdmin}
              className="underline hover:text-stone-800 transition-colors cursor-pointer"
            >
              Gérer la boutique →
            </button>
          </div>
        )}

        {/* Main Navigation Bar */}
        <div
          className={`w-full transition-all duration-200 ${
            isScrolled
              ? 'bg-stone-950/95 backdrop-blur-md shadow-xl border-b border-stone-800/80 py-2 sm:py-2.5'
              : 'bg-stone-950/90 backdrop-blur-sm py-2.5 sm:py-3.5 border-b border-stone-900'
          }`}
        >
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative flex items-center justify-between min-h-[52px] sm:min-h-[58px]">
            
            {/* LEFT WING: Brand Logo on the far left, followed by Menu toggle & Nav links */}
            <div className="flex items-center gap-3 sm:gap-5 lg:gap-8">
              {/* Brand Logo - Far Left Wing */}
              <button
                onClick={() => {
                  setActiveTab('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group cursor-pointer flex items-center justify-start transition-transform hover:opacity-95 duration-200 py-0.5 flex-shrink-0"
                title="WISDOM - Accueil Boutique"
              >
                <LogoImage
                  src={logoUrl}
                  alt="WISDOM"
                  className="h-8 sm:h-9 md:h-11 w-auto max-w-[170px] sm:max-w-[210px] object-contain drop-shadow-md brightness-105"
                />
              </button>

              {/* Menu Button for Mobile/Drawer */}
              <button
                onClick={() => setShowDrawerMenu(true)}
                className="p-1.5 sm:p-2 text-stone-200 hover:text-amber-400 hover:bg-stone-900 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 border border-stone-800/60 lg:hidden"
                aria-label="Ouvrir le menu"
                title="Menu Navigation"
              >
                <Menu className="w-5 h-5 stroke-[2]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
                  Menu
                </span>
              </button>

              {/* Primary Navigation Links (Adjacent to Logo on desktop) */}
              <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
                {navLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => {
                      setActiveTab(link.id);
                      if (link.id === 'about') {
                        const el = document.getElementById('about-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={`text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 py-1.5 border-b-2 ${
                      activeTab === link.id
                        ? 'text-amber-400 border-amber-400 font-bold'
                        : 'text-stone-300 hover:text-white border-transparent hover:border-stone-700'
                    }`}
                  >
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="text-[9px] font-mono bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded font-black uppercase tracking-tight">
                        {link.badge}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* RIGHT WING: Wishlist + User Account + Cart */}
            <div className="flex items-center justify-end gap-1.5 sm:gap-3">
              {/* Quick Menu Button for Desktop if drawer preferred */}
              <button
                onClick={() => setShowDrawerMenu(true)}
                className="hidden xl:flex items-center gap-1.5 p-2 text-stone-400 hover:text-white rounded-lg hover:bg-stone-900 text-xs font-mono transition-colors cursor-pointer mr-1"
                title="Plus d'options"
              >
                <Menu className="w-4 h-4" />
                <span>Explorer</span>
              </button>

              {/* Wishlist Icon */}
              <button
                onClick={onOpenWishlist}
                className="relative p-2 text-stone-300 hover:text-red-400 transition-colors cursor-pointer rounded-full hover:bg-stone-900/60"
                title="Favoris"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Account / Connexion */}
              {currentUser ? (
                <button
                  onClick={() => setActiveTab('profil')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-stone-200 hover:border-amber-400 text-xs font-mono transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-amber-400" />
                  <span className="truncate max-w-[90px] font-semibold">{currentUser.name}</span>
                </button>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:flex items-center gap-1.5 text-xs font-mono font-bold text-stone-950 bg-stone-200 hover:bg-white px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-stone-950" />
                  <span>Connexion</span>
                </button>
              )}

              {/* CART / PANIER BUTTON */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 font-mono font-extrabold text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg shadow-amber-400/10 transition-all cursor-pointer ring-2 ring-amber-400/40"
                title="Panier"
                aria-label="Voir mon panier"
              >
                <ShoppingBag className="w-4 h-4 text-stone-950 stroke-[2.5]" />
                <span className="font-black uppercase tracking-tight text-stone-950">
                  Panier
                </span>
                {cartCount > 0 && (
                  <span className="bg-stone-950 text-amber-300 font-mono text-[11px] font-black px-1.5 py-0.2 rounded-full ml-0.5 min-w-[20px] text-center shadow">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Menu (Mobile, Tablet & Desktop Navigation Drawer) */}
        {showDrawerMenu && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setShowDrawerMenu(false)}
            />
            <div className="relative w-80 max-w-[85vw] bg-stone-950 border-r border-stone-800 text-stone-100 h-full p-6 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250 shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-stone-800">
                  <div className="flex items-center">
                    <LogoImage
                      src={logoUrl}
                      alt="WISDOM"
                      className="h-9 sm:h-10 w-auto max-w-[180px] object-contain"
                    />
                  </div>
                  <button
                    onClick={() => setShowDrawerMenu(false)}
                    className="p-2 text-stone-400 hover:text-white cursor-pointer rounded-full hover:bg-stone-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {currentUser && (
                  <div className="py-4 border-b border-stone-800 bg-stone-900/50 rounded-xl px-3 my-3">
                    <p className="text-[11px] font-mono text-stone-400 uppercase tracking-wider">Connecté sous :</p>
                    <p className="text-sm font-semibold text-amber-300">{currentUser.name}</p>
                    <p className="text-xs text-stone-400 truncate">{currentUser.email}</p>
                  </div>
                )}

                <div className="py-4 space-y-1.5">
                  {navLinks.map((link) => (
                    <button
                      key={link.id}
                      onClick={() => {
                        setActiveTab(link.id);
                        setShowDrawerMenu(false);
                        if (link.id === 'about') {
                          const el = document.getElementById('about-section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className={`w-full text-left py-3 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                        activeTab === link.id
                          ? 'bg-amber-400/10 text-amber-400 font-bold border border-amber-400/30'
                          : 'text-stone-300 hover:bg-stone-900 hover:text-white'
                      }`}
                    >
                      <span>{link.label}</span>
                      {link.badge && (
                        <span className="text-[10px] font-mono bg-amber-400 text-stone-950 px-2 py-0.5 rounded font-bold uppercase">
                          {link.badge}
                        </span>
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setActiveTab('profil');
                      setShowDrawerMenu(false);
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl text-sm font-medium text-stone-300 hover:bg-stone-900 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>Mon Compte / Profil</span>
                    <User className="w-4 h-4 text-amber-400" />
                  </button>

                  {/* Install App Link inside Drawer */}
                  <button
                    onClick={() => {
                      setShowInstallModal(true);
                      setShowDrawerMenu(false);
                    }}
                    className="w-full text-left py-3 px-4 rounded-xl text-sm font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors flex items-center justify-between cursor-pointer my-2"
                  >
                    <span className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Installer l'App sur écran d'accueil</span>
                    </span>
                    <span className="text-[10px] font-mono bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded font-bold uppercase">
                      PWA
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-stone-800">
                {currentUser ? (
                  <button
                    onClick={() => {
                      onLogout();
                      setShowDrawerMenu(false);
                    }}
                    className="w-full py-2.5 px-4 bg-red-950/40 text-red-400 border border-red-900/60 rounded-xl font-mono text-sm font-semibold hover:bg-red-900/50 transition-colors cursor-pointer text-center"
                  >
                    Déconnexion
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onOpenAuth();
                      setShowDrawerMenu(false);
                    }}
                    className="w-full py-3 px-4 bg-amber-400 text-stone-950 rounded-xl font-mono text-sm font-bold hover:bg-amber-300 transition-colors cursor-pointer text-center"
                  >
                    Se connecter / S'inscrire
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* PWA Install Modal */}
      <InstallAppModal
        isOpen={showInstallModal}
        logoUrl={logoUrl}
        onClose={() => setShowInstallModal(false)}
      />
    </>
  );
};
