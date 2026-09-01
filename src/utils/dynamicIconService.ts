/**
 * Dynamically updates document favicon, Apple touch icons, and Web App Manifest
 * so that any custom logo uploaded by the user is immediately reflected:
 * 1. In the browser tab / navigation bar next to the URL / title
 * 2. On the mobile / desktop home screen icon when installed as a PWA (on a black background)
 */

export function updateAppIconsAndManifest(logoUrl?: string, appIconUrl?: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const resolvedIcon = appIconUrl && appIconUrl.trim() ? appIconUrl.trim() : (logoUrl && logoUrl.trim() ? logoUrl.trim() : '/logo-wisdom.png');
  const resolvedLogo = logoUrl && logoUrl.trim() ? logoUrl.trim() : '/logo-wisdom.png';

  // 1. Update or create Favicon & Touch Icon elements
  const iconRelList = ['icon', 'shortcut icon', 'apple-touch-icon', 'apple-touch-icon-precomposed'];

  iconRelList.forEach((rel) => {
    let link = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = rel;
      document.head.appendChild(link);
    }
    link.href = resolvedIcon;
  });

  // Also specifically update any sizes-based apple-touch-icon
  const appleTouchIcons = document.querySelectorAll<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  appleTouchIcons.forEach((iconLink) => {
    iconLink.href = resolvedIcon;
  });

  // 2. Dynamically update or create Web App Manifest
  try {
    const manifestData = {
      short_name: 'WISDOM',
      name: 'WISDOM — Application Officielle',
      icons: [
        {
          src: resolvedIcon,
          sizes: '192x192',
          type: resolvedIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any',
        },
        {
          src: resolvedIcon,
          sizes: '192x192',
          type: resolvedIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'maskable',
        },
        {
          src: resolvedIcon,
          sizes: '512x512',
          type: resolvedIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any',
        },
        {
          src: resolvedIcon,
          sizes: '512x512',
          type: resolvedIcon.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'maskable',
        },
        {
          src: resolvedLogo,
          sizes: '512x512',
          type: resolvedLogo.endsWith('.svg') ? 'image/svg+xml' : 'image/png',
          purpose: 'any',
        },
      ],
      id: '/',
      start_url: '/',
      scope: '/',
      background_color: '#0C0A09',
      theme_color: '#0C0A09',
      display: 'standalone',
      orientation: 'portrait',
      description: 'Application officielle de la marque WISDOM — Mode Streetwear Béninoise',
    };

    const stringManifest = JSON.stringify(manifestData);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestBlobUrl = URL.createObjectURL(blob);

    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestBlobUrl;
  } catch (err) {
    console.warn('Could not dynamically update Web App Manifest:', err);
  }
}
