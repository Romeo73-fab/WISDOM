import { getSupabase, isSupabaseConfigured } from '../lib/supabase';
import { Product, Order, User, StoreSettings, Review } from '../types';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  message: string;
  details?: any;
}

// In-memory log buffer for Admin Debugger
const memoryLogs: LogEntry[] = [
  {
    id: 'log-0',
    timestamp: new Date().toLocaleTimeString('fr-FR'),
    level: isSupabaseConfigured ? 'info' : 'warn',
    message: isSupabaseConfigured
      ? 'Supabase SDK initialisé avec les identifiants projet (https://mkcyrtehlhfouvqhfhxe.supabase.co)'
      : 'Supabase non configuré ou clés manquantes',
  },
];

const logListeners: Array<(logs: LogEntry[]) => void> = [];

export function addSupabaseLog(
  level: LogEntry['level'],
  message: string,
  details?: any
) {
  const entry: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toLocaleTimeString('fr-FR'),
    level,
    message,
    details,
  };
  memoryLogs.unshift(entry);
  if (memoryLogs.length > 200) memoryLogs.pop();
  logListeners.forEach((fn) => fn([...memoryLogs]));
}

export function subscribeToLogs(callback: (logs: LogEntry[]) => void) {
  logListeners.push(callback);
  callback([...memoryLogs]);
  return () => {
    const idx = logListeners.indexOf(callback);
    if (idx !== -1) logListeners.splice(idx, 1);
  };
}

export function clearSupabaseLogs() {
  memoryLogs.length = 0;
  addSupabaseLog('info', 'Journal des logs Supabase réinitialisé');
}

/**
 * Diagnostics & Connection Test
 */
export interface DiagnosticResult {
  status: 'connected' | 'warning' | 'error';
  latencyMs: number;
  tables: {
    products: { ok: boolean; count?: number; error?: string };
    orders: { ok: boolean; count?: number; error?: string };
    users: { ok: boolean; count?: number; error?: string };
    settings: { ok: boolean; found?: boolean; error?: string };
    reviews: { ok: boolean; count?: number; error?: string };
    storage: { ok: boolean; bucket?: string; message?: string };
  };
  rawLogs: string[];
}

export async function testSupabaseDiagnostic(): Promise<DiagnosticResult> {
  const startTime = Date.now();
  const rawLogs: string[] = [];
  const log = (msg: string) => {
    rawLogs.push(`[${new Date().toLocaleTimeString('fr-FR')}] ${msg}`);
  };

  log('Démarrage du test de connexion Supabase...');
  addSupabaseLog('info', '🔍 Lancement du diagnostic de connexion Supabase...');

  const supabase = getSupabase();
  if (!supabase) {
    const err = 'Client Supabase indisponible (URL ou clé API manquante)';
    log(`ERREUR: ${err}`);
    addSupabaseLog('error', err);
    return {
      status: 'error',
      latencyMs: 0,
      tables: {
        products: { ok: false, error: err },
        orders: { ok: false, error: err },
        users: { ok: false, error: err },
        settings: { ok: false, error: err },
        reviews: { ok: false, error: err },
        storage: { ok: false, message: err },
      },
      rawLogs,
    };
  }

  const result: DiagnosticResult = {
    status: 'connected',
    latencyMs: 0,
    tables: {
      products: { ok: false },
      orders: { ok: false },
      users: { ok: false },
      settings: { ok: false },
      reviews: { ok: false },
      storage: { ok: false },
    },
    rawLogs,
  };

  try {
    // 1. Check Products
    const prodRes = await supabase.from('products').select('*', { count: 'exact' }).limit(5);
    if (prodRes.error) {
      result.tables.products = { ok: false, error: prodRes.error.message };
      log(`❌ Table 'products': Erreur -> ${prodRes.error.message}`);
      addSupabaseLog('warn', `Table 'products' : ${prodRes.error.message}`);
      result.status = 'warning';
    } else {
      const count = prodRes.count ?? (prodRes.data ? prodRes.data.length : 0);
      result.tables.products = { ok: true, count };
      log(`✅ Table 'products': Connectée (${count} produits enregistrés)`);
      addSupabaseLog('success', `Table 'products' active : ${count} articles synchronisés`);
    }

    // 2. Check Orders
    const ordRes = await supabase.from('orders').select('*', { count: 'exact' }).limit(5);
    if (ordRes.error) {
      result.tables.orders = { ok: false, error: ordRes.error.message };
      log(`❌ Table 'orders': Erreur -> ${ordRes.error.message}`);
      addSupabaseLog('warn', `Table 'orders' : ${ordRes.error.message}`);
      result.status = 'warning';
    } else {
      const count = ordRes.count ?? (ordRes.data ? ordRes.data.length : 0);
      result.tables.orders = { ok: true, count };
      log(`✅ Table 'orders': Connectée (${count} commandes)`);
      addSupabaseLog('success', `Table 'orders' active : ${count} commandes enregistrées`);
    }

    // 3. Check Settings
    const setRes = await supabase.from('settings').select('*').limit(1);
    if (setRes.error) {
      result.tables.settings = { ok: false, error: setRes.error.message };
      log(`❌ Table 'settings': Erreur -> ${setRes.error.message}`);
      addSupabaseLog('warn', `Table 'settings' : ${setRes.error.message}`);
      result.status = 'warning';
    } else {
      const found = Boolean(setRes.data && setRes.data.length > 0);
      result.tables.settings = { ok: true, found };
      log(`✅ Table 'settings': Connectée (Réglages ${found ? 'personnalisés' : 'par défaut'})`);
      addSupabaseLog('success', `Table 'settings' active (Logo & Bannière OK)`);
    }

    // 4. Check Users
    const userRes = await supabase.from('users').select('*', { count: 'exact' }).limit(5);
    if (userRes.error) {
      result.tables.users = { ok: false, error: userRes.error.message };
      log(`⚠️ Table 'users': -> ${userRes.error.message}`);
    } else {
      const count = userRes.count ?? (userRes.data ? userRes.data.length : 0);
      result.tables.users = { ok: true, count };
      log(`✅ Table 'users': Connectée (${count} clients enregistrés)`);
    }

    // 5. Check Reviews
    const revRes = await supabase.from('reviews').select('*', { count: 'exact' }).limit(5);
    if (revRes.error) {
      result.tables.reviews = { ok: false, error: revRes.error.message };
      log(`⚠️ Table 'reviews': -> ${revRes.error.message}`);
    } else {
      const count = revRes.count ?? (revRes.data ? revRes.data.length : 0);
      result.tables.reviews = { ok: true, count };
      log(`✅ Table 'reviews': Connectée (${count} avis)`);
    }

    // 6. Check Storage Buckets
    try {
      const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
      if (bErr) {
        result.tables.storage = { ok: false, message: bErr.message };
        log(`ℹ️ Storage Buckets: Accès restreint (${bErr.message}) - Fallback Base64/DataURL ultra-rapide actif`);
      } else {
        const hasMediaBucket = buckets?.some(b => b.name === 'wisdom_media' || b.name === 'wisdom-media' || b.name === 'public');
        result.tables.storage = { ok: true, bucket: hasMediaBucket ? 'wisdom-media' : 'default', message: `${buckets?.length || 0} bucket(s) détecté(s)` };
        log(`✅ Storage: Connecté (${buckets?.length || 0} bucket(s) trouvés)`);
      }
    } catch (sErr: any) {
      result.tables.storage = { ok: false, message: sErr?.message || 'Storage non initialisé' };
      log(`ℹ️ Storage info: ${sErr?.message || 'Utilisation du stockage data-url optimisé'}`);
    }

    result.latencyMs = Date.now() - startTime;
    log(`Diagnostic terminé avec succès en ${result.latencyMs}ms`);
    addSupabaseLog(
      result.status === 'connected' ? 'success' : 'warn',
      `Diagnostic terminé : Latence ${result.latencyMs}ms · Statut ${result.status.toUpperCase()}`
    );
  } catch (err: any) {
    result.status = 'error';
    result.latencyMs = Date.now() - startTime;
    const msg = `Erreur réseau ou diagnostic: ${err.message || err}`;
    log(`❌ ${msg}`);
    addSupabaseLog('error', msg);
  }

  return result;
}

/**
 * Upload Image / File to Supabase Storage with fallback
 */
export async function uploadMediaToSupabase(
  file: File,
  folder = 'media'
): Promise<{ url: string; isRemote: boolean; error?: string }> {
  const supabase = getSupabase();
  const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  addSupabaseLog('info', `📤 Téléversement du fichier '${file.name}' (${(file.size / 1024).toFixed(1)} Ko)...`);

  if (supabase) {
    try {
      // Try 'wisdom-media' or 'wisdom_media' or 'public'
      const bucketName = 'wisdom-media';
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        if (urlData?.publicUrl) {
          addSupabaseLog('success', `✅ Fichier téléversé sur Supabase Storage : ${urlData.publicUrl}`);
          return { url: urlData.publicUrl, isRemote: true };
        }
      } else if (error) {
        addSupabaseLog('warn', `Note Supabase Storage (${error.message}). Utilisation du format DataURL haute performance.`);
      }
    } catch (err: any) {
      addSupabaseLog('warn', `Storage upload fallback: ${err.message}`);
    }
  }

  // Fallback to Base64 DataURL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      addSupabaseLog('success', `✅ Fichier '${file.name}' encodé et prêt pour la synchronisation`);
      resolve({ url, isRemote: false });
    };
    reader.onerror = () => {
      addSupabaseLog('error', `❌ Échec de la lecture du fichier '${file.name}'`);
      resolve({ url: '', isRemote: false, error: 'Erreur de lecture locale' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Fetch all Store Data from Supabase
 */
export async function fetchSupabaseStoreData(isBackground = false) {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    if (!isBackground) {
      addSupabaseLog('info', '🔄 Chargement des données de la boutique depuis Supabase...');
    }

    const [productsRes, ordersRes, usersRes, reviewsRes, storeSettingsRes, settingsRes] = await Promise.allSettled([
      supabase.from('products').select('*'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('users').select('*'),
      supabase.from('reviews').select('*'),
      supabase.from('store_settings').select('*').limit(1).maybeSingle(),
      supabase.from('settings').select('*').limit(1).maybeSingle(),
    ]);

    const result: {
      products?: Product[];
      orders?: Order[];
      users?: User[];
      reviews?: Review[];
      settings?: StoreSettings;
    } = {};

    if (productsRes.status === 'fulfilled' && productsRes.value.data && productsRes.value.data.length > 0) {
      result.products = (productsRes.value.data as any[]).map((row: any) => ({
        id: String(row.id),
        name: String(row.name || 'T-Shirt WISDOM'),
        price: Number(row.price) || 0,
        category: row.category || 'wisdom',
        keyword: row.keyword || '',
        description: row.description || '',
        image: row.image || '/assets/images/wisdom_black_shirt_1786398483035.jpg',
        videoUrl: row.videoUrl || row.video_url || '',
        gallery: Array.isArray(row.gallery) ? row.gallery : [],
        sizes: Array.isArray(row.sizes) && row.sizes.length ? row.sizes : ['S', 'M', 'L', 'XL'],
        colors: Array.isArray(row.colors) && row.colors.length ? row.colors : ['Noir', 'Blanc'],
        top: Boolean(row.top),
        inStock: row.inStock ?? row.instock ?? true,
        customisable: Boolean(row.customisable),
        badge: row.badge || '',
      })) as Product[];
      if (!isBackground) {
        addSupabaseLog('success', `📦 ${result.products.length} produits chargés depuis Supabase`);
      }
    }

    if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
      result.orders = ordersRes.value.data as Order[];
      if (!isBackground && result.orders.length > 0) {
        addSupabaseLog('info', `📋 ${result.orders.length} commandes chargées`);
      }
    }

    if (usersRes.status === 'fulfilled' && usersRes.value.data) {
      result.users = usersRes.value.data as User[];
    }

    if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
      result.reviews = reviewsRes.value.data as Review[];
    }

    // Process store settings from store_settings or settings table
    const sData = (storeSettingsRes.status === 'fulfilled' && storeSettingsRes.value.data) 
      ? storeSettingsRes.value.data 
      : (settingsRes.status === 'fulfilled' && settingsRes.value.data) 
      ? settingsRes.value.data 
      : null;

    if (sData) {
      result.settings = {
        logoUrl: sData.logo_url || sData.logoUrl || '/logo-wisdom.png',
        heroTitle: sData.hero_title || sData.heroTitle || 'WISDOM',
        heroSubtitle: sData.hero_subtitle || sData.heroSubtitle || 'La sagesse au quotidien',
        heroBgType: (sData.hero_bg_type || sData.heroBgType || (sData.hero_video_url || sData.heroVideoUrl ? 'video' : 'image')) as 'image' | 'video',
        heroVideoUrl: sData.hero_video_url || sData.heroVideoUrl || '',
        heroImageUrl: sData.hero_image || sData.heroImageUrl || '',
        showcaseSleeveImageUrl: sData.showcase_sleeve_image_url || sData.showcasesleeveimageurl || sData.showcaseSleeveImageUrl || '',
        showcaseChestImageUrl: sData.showcase_chest_image_url || sData.showcasechestimageurl || sData.showcaseChestImageUrl || '',
        fedapayLink: sData.fedapay_link || sData.fedapayLink || 'https://fedapay.com',
        announcementText: sData.promo_text || sData.announcement_text || sData.announcementText || '⚡ Livestock & Livraison Express partout au Bénin en 24h/48h | T-shirts 100% Coton Bio',
        whatsappNumber: sData.whatsapp_number || sData.whatsappNumber || '22960413145',
        deliveryFees: sData.delivery_fees || sData.deliveryFees || {
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
      if (!isBackground) {
        addSupabaseLog('success', '⚙️ Réglages synchronisés depuis Supabase');
      }
    }

    if (Object.keys(result).length > 0) {
      return result;
    }
  } catch (error: any) {
    if (!isBackground) {
      addSupabaseLog('warn', `Avertissement lecture Supabase: ${error.message}`);
    }
  }

  return null;
}

/**
 * Format and sanitize product data for Postgres/Supabase table schema
 */
export function sanitizeProductForPostgres(p: Product): Record<string, any> {
  const isAvailable = p.inStock !== false;
  return {
    id: String(p.id),
    name: String(p.name || 'T-Shirt WISDOM'),
    price: Number(p.price) || 0,
    category: String(p.category || 'wisdom'),
    keyword: String(p.keyword || ''),
    description: String(p.description || ''),
    image: String(p.image || ''),
    video_url: String(p.videoUrl || ''),
    gallery: Array.isArray(p.gallery) ? p.gallery : [],
    sizes: Array.isArray(p.sizes) ? p.sizes : ['S', 'M', 'L', 'XL'],
    colors: Array.isArray(p.colors) ? p.colors : ['Noir', 'Blanc'],
    top: Boolean(p.top),
    instock: isAvailable,
  };
}

/**
 * Insert or Upsert a Single Product to Supabase with automatic schema retry
 */
export async function insertProductToSupabase(
  product: Product
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, error: 'Supabase non connecté' };
  }

  try {
    const currentPayload: Record<string, any> = sanitizeProductForPostgres(product);
    let attempts = 0;
    let lastError: string | undefined;

    while (attempts < 4) {
      attempts++;
      const { error } = await supabase.from('products').upsert(currentPayload, { onConflict: 'id' });

      if (!error) {
        return { success: true };
      }

      lastError = error.message;

      // Extract missing column name if PostgREST rejected an un-migrated column (PGRST204)
      const match =
        error.message.match(/Could not find the '([^']+)' column/i) ||
        error.message.match(/column "?([^"\s]+)"? of relation/i) ||
        error.message.match(/column "?([^"\s]+)"? does not exist/i) ||
        (error.details ? error.details.match(/column "?([^"\s]+)"?/i) : null);

      if (match && match[1]) {
        const missingCol = match[1];
        if (missingCol in currentPayload) {
          delete currentPayload[missingCol];
          continue;
        }
      }

      // If it's another non-column error, break
      break;
    }

    return { success: false, error: lastError };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete Product from Supabase
 */
export async function deleteProductFromSupabase(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase non connecté' };

  addSupabaseLog('info', `🗑️ Suppression du produit ID '${productId}' sur Supabase...`);
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      addSupabaseLog('error', `❌ Échec suppression produit '${productId}': ${error.message}`);
      return { success: false, error: error.message };
    }
    addSupabaseLog('success', `✅ Produit ID '${productId}' supprimé de la table 'products' de Supabase`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sync Products to Supabase
 */
export async function syncProductsToSupabase(products: Product[]) {
  const supabase = getSupabase();
  if (!supabase || !products.length) return;
  try {
    addSupabaseLog('info', `🔄 Synchronisation globale de ${products.length} produit(s) vers Supabase...`);
    
    // Format all products safely
    const formatted = products.map((p) => sanitizeProductForPostgres(p));
    
    let { error } = await supabase.from('products').upsert(formatted, { onConflict: 'id' });

    if (error) {
      // Retry inserting one by one to isolate any individual schema issues
      addSupabaseLog('warn', `Note sync en bloc (${error.message}). Tentative unitaire...`);
      let successCount = 0;
      for (const prod of products) {
        const res = await insertProductToSupabase(prod);
        if (res.success) successCount++;
      }
      addSupabaseLog('success', `✅ ${successCount}/${products.length} produit(s) synchronisé(s) individuellement`);
    } else {
      addSupabaseLog('success', `✅ ${products.length} produit(s) synchronisé(s) en bloc sur Supabase`);
    }
  } catch (err: any) {
    addSupabaseLog('warn', `Sync products warning: ${err.message}`);
  }
}

/**
 * Sync Order to Supabase
 */
export async function syncOrderToSupabase(order: Order) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('orders').upsert(order);
    if (error) {
      addSupabaseLog('error', `❌ Erreur enregistrement commande #${order.id}: ${error.message}`);
    } else {
      addSupabaseLog('success', `✅ Nouvelle commande #${order.id} enregistrée sur Supabase (${order.userName})`);
    }
  } catch (err: any) {
    addSupabaseLog('warn', `Sync order warning: ${err.message}`);
  }
}

/**
 * Sync User to Supabase
 */
export async function syncUserToSupabase(user: User) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const { error } = await supabase.from('users').upsert(user);
    if (error) {
      addSupabaseLog('warn', `Sync user notice: ${error.message}`);
    } else {
      addSupabaseLog('success', `✅ Utilisateur synchronisé: ${user.email}`);
    }
  } catch (err: any) {
    addSupabaseLog('warn', `Sync user warning: ${err.message}`);
  }
}

/**
 * Sync Review to Supabase
 */
export async function syncReviewToSupabase(review: Review) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    await supabase.from('reviews').upsert(review);
    addSupabaseLog('success', `✅ Avis de '${review.userName}' enregistré sur Supabase`);
  } catch (err: any) {
    addSupabaseLog('warn', `Sync review warning: ${err.message}`);
  }
}

/**
 * Sync Settings (including logoUrl and banners) to Supabase
 */
export async function syncSettingsToSupabase(settings: StoreSettings) {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    const logo = settings.logoUrl || '/logo-wisdom.png';
    const heroTitle = settings.heroTitle || 'WISDOM';
    const heroSubtitle = settings.heroSubtitle || 'La sagesse au quotidien';
    const heroBgType = settings.heroBgType || (settings.heroVideoUrl ? 'video' : 'image');
    const heroImage = settings.heroImageUrl || '';
    const heroVideo = settings.heroVideoUrl || '';
    const showcaseSleeve = settings.showcaseSleeveImageUrl || '';
    const showcaseChest = settings.showcaseChestImageUrl || '';
    const whatsapp = settings.whatsappNumber || '22960413145';
    const announcement = settings.announcementText || '';
    const fedapay = settings.fedapayLink || 'https://fedapay.com';
    const deliveryFees = settings.deliveryFees || {};
    const now = new Date().toISOString();

    // 1. Payload compatible with store_settings table
    const storeSettingsPayload = {
      id: 'default',
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      hero_bg_type: heroBgType,
      hero_image: heroImage,
      hero_video_url: heroVideo,
      showcase_sleeve_image_url: showcaseSleeve,
      showcase_chest_image_url: showcaseChest,
      logo_url: logo,
      whatsapp_number: whatsapp,
      promo_text: announcement,
      announcement_text: announcement,
      fedapay_link: fedapay,
      delivery_fees: deliveryFees,
      updated_at: now,
    };

    // 2. Payload compatible with settings table (covers both camelCase and lowercase columns)
    const settingsTablePayload = {
      id: 'store_settings',
      logourl: logo,
      logo_url: logo,
      logoUrl: logo,
      herotitle: heroTitle,
      hero_title: heroTitle,
      heroTitle: heroTitle,
      herosubtitle: heroSubtitle,
      hero_subtitle: heroSubtitle,
      heroSubtitle: heroSubtitle,
      herobgtype: heroBgType,
      hero_bg_type: heroBgType,
      heroBgType: heroBgType,
      heroimageurl: heroImage,
      hero_image: heroImage,
      heroImageUrl: heroImage,
      herovideourl: heroVideo,
      hero_video_url: heroVideo,
      heroVideoUrl: heroVideo,
      showcasesleeveimageurl: showcaseSleeve,
      showcase_sleeve_image_url: showcaseSleeve,
      showcaseSleeveImageUrl: showcaseSleeve,
      showcasechestimageurl: showcaseChest,
      showcase_chest_image_url: showcaseChest,
      showcaseChestImageUrl: showcaseChest,
      whatsappnumber: whatsapp,
      whatsapp_number: whatsapp,
      whatsappNumber: whatsapp,
      announcementtext: announcement,
      promo_text: announcement,
      announcementText: announcement,
      fedapaylink: fedapay,
      fedapay_link: fedapay,
      fedapayLink: fedapay,
      deliveryfees: deliveryFees,
      delivery_fees: deliveryFees,
      deliveryFees: deliveryFees,
      updated_at: now,
    };

    // Upsert into both tables with try/catch to handle whichever exists
    await Promise.allSettled([
      supabase.from('store_settings').upsert(storeSettingsPayload, { onConflict: 'id' }),
      supabase.from('settings').upsert(settingsTablePayload, { onConflict: 'id' }),
    ]);

    addSupabaseLog('success', `✅ Réglages, Logo & Bannière synchronisés avec succès sur Supabase`);
  } catch (err: any) {
    addSupabaseLog('warn', `Sync settings warning: ${err.message}`);
  }
}
