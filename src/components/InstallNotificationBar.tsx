import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, Sparkles, CheckCircle2 } from 'lucide-react';
import { LogoImage } from './LogoImage';

interface InstallNotificationBarProps {
  logoUrl?: string;
  appIconUrl?: string;
  onOpenInstallModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const InstallNotificationBar: React.FC<InstallNotificationBarProps> = ({
  logoUrl,
  appIconUrl,
  onOpenInstallModal,
  onShowToast,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // Check if dismissed in this session
    try {
      const dismissed = sessionStorage.getItem('wisdom-install-banner-dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch (e) {}

    // Check if standalone PWA
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true)
    ) {
      setIsInstalled(true);
    }

    // Detect iOS
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      setIsIos(/iphone|ipad|ipod/.test(ua));
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('wisdom-install-banner-dismissed', 'true');
    } catch (e) {}
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          onShowToast('Installation de WISDOM confirmée ! Merci.', 'success');
        }
        setDeferredPrompt(null);
      } catch (err) {
        onOpenInstallModal();
      }
    } else {
      // Fallback for iOS or desktop where direct prompt is not emitted
      onOpenInstallModal();
    }
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  const iconToUse = appIconUrl || logoUrl;

  return (
    <aside 
      aria-label="Installation de l'application"
      className="relative z-50 w-full bg-stone-950/95 border-b border-amber-400/30 backdrop-blur-sm shadow-md"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between">
        {/* Far Left: Simple Clean "Installer" Button */}
        <button
          onClick={handleInstall}
          className="px-4 sm:px-5 py-1 sm:py-1.5 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-stone-950 rounded-full font-mono text-xs font-black tracking-wide uppercase transition-all duration-150 flex items-center gap-1.5 shadow-sm shadow-amber-400/20 active:scale-95 cursor-pointer ring-1 ring-amber-300/40"
          title="Installer l'application"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Installer</span>
        </button>

        {/* Far Right: Dismiss button */}
        <button
          onClick={handleDismiss}
          className="p-1 text-stone-400 hover:text-stone-200 hover:bg-stone-900 rounded-full transition-colors cursor-pointer"
          aria-label="Fermer"
          title="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
