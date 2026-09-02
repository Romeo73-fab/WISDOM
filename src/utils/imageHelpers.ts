import React from 'react';

// Robust Image Helpers & Bulletproof Fallbacks for Cross-Device Presentation

export const DEFAULT_BLACK_SHIRT = '/wisdom_black_shirt_1786398483035.webp';
export const DEFAULT_WHITE_SHIRT = '/wisdom_white_shirt_1786398496994.webp';
export const DEFAULT_HERO_BANNER = '/wisdom_hero_banner_1786398469341.webp';
export const DEFAULT_SLEEVE_PATCH = '/wisdom_sleeve_patch_1787825766441.webp';
export const DEFAULT_CHEST_LOGO = '/wisdom_chest_logo_1787825785711.webp';
export const DEFAULT_LOGO = '/logo-wisdom.png';

// Elegant SVG data URI fallback if an image fails to load
export const FALLBACK_SVG_PRODUCT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 750" width="600" height="750">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14120e"/>
      <stop offset="100%" stop-color="#0a0907"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>
  <rect width="600" height="750" fill="url(#bg)"/>
  <!-- T-shirt silhouette -->
  <path d="M190 120 C 250 180, 350 180, 410 120 L 530 200 L 460 300 L 420 270 L 420 630 C 420 645, 410 655, 395 655 L 205 655 C 190 655, 180 645, 180 630 L 180 270 L 140 300 L 70 200 Z" fill="#1c1917" stroke="#292524" stroke-width="3"/>
  <path d="M240 120 C 270 170, 330 170, 360 120" fill="none" stroke="#44403c" stroke-width="4"/>
  <!-- Brand logo mark -->
  <text x="300" y="360" text-anchor="middle" fill="url(#gold)" font-family="Cinzel, Georgia, serif" font-size="34" font-weight="900" letter-spacing="8">WISDOM</text>
  <text x="300" y="395" text-anchor="middle" fill="#a8a29e" font-family="monospace" font-size="12" letter-spacing="4">PRESTIGE COTONOU</text>
</svg>
`);

/**
 * Sanitizes any image URL (handles raw base64, missing data prefixes, broken paths)
 */
export function sanitizeImageUrl(url?: string | null, fallback = DEFAULT_BLACK_SHIRT): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }

  const clean = url.trim();

  // If starts with raw base64 data without data:image prefix
  if (
    clean.startsWith('/9j/') ||
    clean.startsWith('iVBOR') ||
    clean.startsWith('ZEyvc') ||
    clean.startsWith('UklGR') ||
    clean.startsWith('PHN2Zy')
  ) {
    if (clean.startsWith('iVBOR')) {
      return `data:image/png;base64,${clean}`;
    }
    if (clean.startsWith('PHN2Zy')) {
      return `data:image/svg+xml;base64,${clean}`;
    }
    return `data:image/jpeg;base64,${clean}`;
  }

  // If path starts with src/assets/images/...
  if (clean.startsWith('src/assets/images/')) {
    return clean.replace('src/assets/images/', '/assets/images/');
  }

  // If relative path without leading slash
  if (clean.startsWith('assets/images/')) {
    return `/${clean}`;
  }

  return clean;
}

/**
 * Safe onError event handler for <img> elements to prevent broken links across devices
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  customFallback?: string
) {
  const target = e.currentTarget;
  // Prevent infinite error loop if fallback also fails
  if (target.dataset.hasFailedFallback === 'true') {
    target.src = FALLBACK_SVG_PRODUCT;
    return;
  }
  target.dataset.hasFailedFallback = 'true';
  target.src = customFallback || DEFAULT_BLACK_SHIRT;
}
