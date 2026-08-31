import React, { useState } from 'react';

interface LogoImageProps {
  src?: string;
  alt?: string;
  className?: string;
}

/**
 * Robust LogoImage component that preserves natural dimensions and aspect ratio,
 * preventing infinite reload loops with controlled graceful fallback.
 */
export const LogoImage: React.FC<LogoImageProps> = ({
  src,
  alt = 'WISDOM',
  className = 'h-9 sm:h-10 md:h-11 w-auto max-w-[220px] object-contain object-center drop-shadow-md brightness-105 transition-all',
}) => {
  const [useFallback, setUseFallback] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  // Reset error states when src prop changes
  React.useEffect(() => {
    setUseFallback(false);
    setIsFailed(false);
  }, [src]);

  // If both the custom logo and the standard logo file failed, render an elegant SVG / text badge
  if (isFailed) {
    return (
      <div className="flex items-center gap-2 select-none py-1">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-stone-950 text-sm shadow-sm">
          W
        </div>
        <span className="font-serif font-black tracking-widest text-amber-400 text-lg">
          WISDOM
        </span>
      </div>
    );
  }

  // Determine current image URL
  const currentUrl = useFallback || !src ? '/logo-wisdom.png' : src;

  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      loading="eager"
      referrerPolicy="no-referrer"
      onError={() => {
        // If we were trying a custom remote URL, fallback once to the local static logo
        if (!useFallback && src && src !== '/logo-wisdom.png') {
          setUseFallback(true);
        } else {
          // If the local static logo also fails, switch cleanly to vector badge without loop
          setIsFailed(true);
        }
      }}
    />
  );
};
