import {
  fetchSupabaseStoreData,
  syncProductsToSupabase,
  syncOrderToSupabase,
  syncUserToSupabase,
  syncSettingsToSupabase,
  syncReviewToSupabase,
} from './supabaseService';

// Storage and API wrapper with persistent backend & LocalStorage fallback
export const PRODUCTS_KEY = 'wisdom-products-v3';
export const USERS_KEY = 'wisdom-users-v3';
export const ORDERS_KEY = 'wisdom-orders-v1';
export const SETTINGS_KEY = 'wisdom-settings-v1';
export const WISHLIST_KEY = 'wisdom-wishlist-v1';
export const CART_KEY = 'wisdom-cart-v1';
export const PROMOS_KEY = 'wisdom-promos-v1';

export async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Server API & Supabase persistence helpers
export async function fetchServerStoreData(isBackground = false) {
  let serverResult: any = null;
  let supabaseResult: any = null;

  // 1. Fetch server database from Node API (/api/store-data -> wisdom-db.json)
  try {
    const res = await fetch('/api/store-data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        serverResult = json.data;
      }
    }
  } catch (err) {
    if (!isBackground) {
      console.warn('Unable to fetch local server API, falling back to Supabase/LocalStorage:', err);
    }
  }

  // 2. Fetch live data from Supabase
  try {
    const sbData = await fetchSupabaseStoreData(isBackground);
    if (sbData && Object.keys(sbData).length > 0) {
      supabaseResult = sbData;
    }
  } catch (supabaseErr) {
    if (!isBackground) {
      console.warn('Supabase fetch failed or uninitialized:', supabaseErr);
    }
  }

  // If neither returned, fallback to null (which triggers localStorage in App.tsx)
  if (!serverResult && !supabaseResult) {
    return null;
  }

  // 3. Merge products, orders, users, reviews
  const finalProducts =
    supabaseResult?.products && supabaseResult.products.length > 0
      ? supabaseResult.products
      : serverResult?.products && serverResult.products.length > 0
      ? serverResult.products
      : undefined;

  const finalOrders =
    supabaseResult?.orders && supabaseResult.orders.length > 0
      ? supabaseResult.orders
      : serverResult?.orders;

  // Merge users across Supabase, Server and LocalStorage by lowercase email
  const userMap = new Map<string, any>();
  if (typeof window !== 'undefined') {
    try {
      const rawUsers = localStorage.getItem(USERS_KEY);
      if (rawUsers) {
        const parsed = JSON.parse(rawUsers);
        if (Array.isArray(parsed)) {
          parsed.forEach((u) => {
            if (u?.email) userMap.set(u.email.toLowerCase().trim(), u);
          });
        }
      }
    } catch (e) {}
  }
  if (Array.isArray(serverResult?.users)) {
    serverResult.users.forEach((u: any) => {
      if (u?.email) {
        const key = u.email.toLowerCase().trim();
        const existing = userMap.get(key) || {};
        userMap.set(key, { ...existing, ...u });
      }
    });
  }
  if (Array.isArray(supabaseResult?.users)) {
    supabaseResult.users.forEach((u: any) => {
      if (u?.email) {
        const key = u.email.toLowerCase().trim();
        const existing = userMap.get(key) || {};
        userMap.set(key, { ...existing, ...u });
      }
    });
  }
  const finalUsers = userMap.size > 0 ? Array.from(userMap.values()) : (supabaseResult?.users || serverResult?.users);

  const finalReviews =
    supabaseResult?.reviews && supabaseResult.reviews.length > 0
      ? supabaseResult.reviews
      : serverResult?.reviews;

  const finalPromos =
    serverResult?.promos && serverResult.promos.length > 0
      ? serverResult.promos
      : undefined;

  // 4. Robust logo and settings resolution
  // Check cached settings in localStorage as well
  let cachedSettings: any = null;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) cachedSettings = JSON.parse(raw);
    } catch (e) {}
  }

  const serverSettings = serverResult?.settings;
  const supabaseSettings = supabaseResult?.settings;

  const serverLogo = serverSettings?.logoUrl;
  const supabaseLogo = supabaseSettings?.logoUrl;
  const cachedLogo = cachedSettings?.logoUrl;

  const isCustomLogo = (url?: string) =>
    Boolean(url && typeof url === 'string' && url.trim() !== '' && url !== '/logo-wisdom.png');

  // Determine the authoritative logo:
  // If the server DB has a custom logo (e.g. data:image/... or remote url), use it.
  // Else if Supabase has a custom logo, use it.
  // Else if local storage has a custom logo, use it.
  // Else default to '/logo-wisdom.png'.
  let chosenLogo = '/logo-wisdom.png';
  if (isCustomLogo(serverLogo)) {
    chosenLogo = serverLogo;
  } else if (isCustomLogo(supabaseLogo)) {
    chosenLogo = supabaseLogo;
  } else if (isCustomLogo(cachedLogo)) {
    chosenLogo = cachedLogo;
  }

  const baseSettings = {
    ...(cachedSettings || {}),
    ...(serverSettings || {}),
    ...(supabaseSettings || {}),
  };

  const finalSettings = {
    ...baseSettings,
    logoUrl: chosenLogo,
    showcaseSleeveImageUrl:
      supabaseSettings?.showcaseSleeveImageUrl ||
      serverSettings?.showcaseSleeveImageUrl ||
      cachedSettings?.showcaseSleeveImageUrl ||
      baseSettings.showcaseSleeveImageUrl,
    showcaseChestImageUrl:
      supabaseSettings?.showcaseChestImageUrl ||
      serverSettings?.showcaseChestImageUrl ||
      cachedSettings?.showcaseChestImageUrl ||
      baseSettings.showcaseChestImageUrl,
  };

  // Sync to Supabase in background if Supabase didn't have the custom logo yet
  if (isCustomLogo(chosenLogo) && (!isCustomLogo(supabaseLogo) || supabaseLogo !== chosenLogo)) {
    syncSettingsToSupabase(finalSettings);
  }

  return {
    products: finalProducts,
    orders: finalOrders,
    users: finalUsers,
    settings: finalSettings,
    reviews: finalReviews,
    promos: finalPromos,
  };
}

export async function saveServerPromos(promos: any[]) {
  try {
    await fetch('/api/promos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ promos }),
    });
  } catch (err) {
    console.error('Failed to sync promos to server API:', err);
  }
}

export async function saveServerProducts(products: any[]) {
  // Sync to Supabase
  syncProductsToSupabase(products);

  // Sync to local server API
  try {
    await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products }),
    });
  } catch (err) {
    console.error('Failed to sync products to server API:', err);
  }
}

export async function saveServerOrders(orders: any[]) {
  // Sync latest order or orders to Supabase
  if (Array.isArray(orders) && orders.length > 0) {
    syncOrderToSupabase(orders[0]);
  }

  try {
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orders }),
    });
  } catch (err) {
    console.error('Failed to sync orders to server API:', err);
  }
}

export async function saveServerUsers(users: any[]) {
  if (Array.isArray(users) && users.length > 0) {
    syncUserToSupabase(users[users.length - 1]);
  }

  try {
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    });
  } catch (err) {
    console.error('Failed to sync users to server API:', err);
  }
}

export async function saveServerSettings(settings: any) {
  if (settings) {
    syncSettingsToSupabase(settings);
  }

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
  } catch (err) {
    console.error('Failed to sync settings to server API:', err);
  }
}

export async function saveServerReviews(reviews: any[]) {
  if (Array.isArray(reviews) && reviews.length > 0) {
    syncReviewToSupabase(reviews[reviews.length - 1]);
  }

  try {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviews }),
    });
  } catch (err) {
    console.error('Failed to sync reviews to server API:', err);
  }
}


export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    }
  } catch (e) {
    console.error(`Failed to load ${key} from storage:`, e);
  }

  return defaultValue;
}

export async function setItem<T>(key: string, value: T): Promise<boolean> {
  const serialized = JSON.stringify(value);
  try {
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.error(`localStorage set failed for ${key}:`, e);
    return false;
  }
}
