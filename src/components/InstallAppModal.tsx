import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, CheckCircle2 } from 'lucide-react';
import { LogoImage } from './LogoImage';

interface InstallAppModalProps {
  isOpen: boolean;
  logoUrl?: string;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, logoUrl, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(iosDevice);

    // Check if already in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    // Capture PWA install prompt for Android/Chrome/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-stone-900 border border-amber-500/30 rounded-2xl p-6 text-stone-100 shadow-2xl overflow-hidden">
        
        {/* Header decoration glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon Preview - Format Application sur Fond Noir */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="relative w-20 h-20 rounded-[22px] overflow-hidden border border-stone-800 shadow-2xl mb-3 bg-black flex items-center justify-center p-3 ring-1 ring-amber-400/20">
            <LogoImage
              src={logoUrl}
              alt="Logo Application WISDOM"
              className="w-full h-full object-contain"
            />
          </div>
          <h3 className="font-serif text-lg font-bold tracking-wide text-stone-100">
            Ajouter à l'écran d'accueil
          </h3>
        </div>

        {isInstalled ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center text-sm font-mono text-amber-300 flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-amber-400" />
            <p>L'application WISDOM est déjà installée sur votre appareil !</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-stone-300 text-center leading-relaxed font-sans">
              Ajoutez l'application <strong className="text-amber-400 font-semibold">WISDOM</strong> à l'écran d'accueil de votre téléphone ou ordinateur pour un accès instantané en 1-clic et une expérience fluide.
            </p>

            {deferredPrompt ? (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Installer l'application
              </button>
            ) : isIos ? (
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-3 text-xs font-sans text-stone-300">
                <p className="font-mono font-bold text-amber-400 uppercase text-center text-[11px]">
                  Instructions d'installation iPhone / iPad :
                </p>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-800 rounded-lg text-amber-400 shrink-0">
                    <Share className="w-5 h-5" />
                  </div>
                  <span>1. Appuyez sur le bouton <strong>Partager</strong> en bas de votre navigateur Safari.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-stone-800 rounded-lg text-amber-400 shrink-0">
                    <PlusSquare className="w-5 h-5" />
                  </div>
                  <span>2. Faites défiler et sélectionnez <strong>Sur l'écran d'accueil</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="bg-stone-950 border border-stone-800 rounded-xl p-4 space-y-2 text-xs font-sans text-stone-300 text-center">
                <p className="font-mono font-bold text-amber-400 uppercase">
                  Comment ajouter à l'écran d'accueil :
                </p>
                <p>
                  Ouvrez le menu de votre navigateur (3 petits points <Smartphone className="inline w-3.5 h-3.5 text-amber-400" />) puis cliquez sur <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-stone-800 text-center">
          <button
            onClick={onClose}
            className="text-xs font-mono text-stone-400 hover:text-stone-200 underline cursor-pointer"
          >
            Fermer et continuer vers la boutique
          </button>
        </div>

      </div>
    </div>
  );
};
