import { db } from './db';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'wisdom-db.json');

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS test');
    res.json({
      success: true,
      message: 'Connexion MySQL réussie',
      result: rows,
    });
  } catch (error: any) {
    console.error('Erreur MySQL:', error);
    res.status(500).json({
      success: false,
      message: 'Connexion MySQL échouée',
      error: error.message,
    });
  }
});

// Initial Default Data
const defaultData = {
  products: [
    {
      id: 'p1',
      name: 'Tee-shirt Neutre Col Rond Coton Bio',
      price: 1500,
      category: 'neutre',
      keyword: 'basique minimaliste',
      description: '100% Coton peigné haute qualité, coupe unisexe moderne et finitions renforcées aux col et emmanchures.',
      image: '/assets/images/wisdom_black_shirt_1786398483035.jpg',
      gallery: [
        '/assets/images/wisdom_black_shirt_1786398483035.jpg',
        '/assets/images/wisdom_white_shirt_1786398496994.jpg'
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Noir', 'Blanc', 'Indigo', 'Terracotta'],
      top: false,
      inStock: true,
      badge: 'Essentiel'
    },
    {
      id: 'p2',
      name: 'Tee-shirt Wisdom Signature Or',
      price: 4000,
      category: 'wisdom',
      keyword: 'signature or luxe',
      description: 'Modèle iconique de la marque avec la typographie WISDOM brodée / sérigraphiée à l\'encre or métallique sur la poitrine.',
      image: '/assets/images/wisdom_black_shirt_1786398483035.jpg',
      gallery: [
        '/assets/images/wisdom_black_shirt_1786398483035.jpg',
        '/assets/images/wisdom_white_shirt_1786398496994.jpg'
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Noir', 'Blanc', 'Or'],
      top: true,
      inStock: true,
      badge: 'Bestseller',
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    },
    {
      id: 'p3',
      name: 'Tee-shirt Personnalisé — WISDOM LAB',
      price: 5000,
      category: 'perso',
      keyword: 'personnalisation texte verset nom',
      description: 'Personnalisez entièrement votre tee-shirt avec votre proverbe, verset biblique, nom ou citation inspirante. Prévisualisation en direct!',
      image: '/assets/images/wisdom_white_shirt_1786398496994.jpg',
      gallery: [
        '/assets/images/wisdom_white_shirt_1786398496994.jpg',
        '/assets/images/wisdom_black_shirt_1786398483035.jpg'
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Noir', 'Blanc', 'Indigo', 'Terracotta', 'Vert Forêt'],
      top: true,
      inStock: true,
      customisable: true,
      badge: 'Sur-Mesure'
    },
    {
      id: 'p4',
      name: 'Tee-shirt WISDOM Masterpiece Streetwear',
      price: 4500,
      category: 'wisdom',
      keyword: 'wisdom streetwear marque premium',
      description: 'Graphisme exclusif à l\'arrière "WISDOM Streetwear Cotonou" avec détails dorés subtils sur coton lourd 240g/m².',
      image: '/assets/images/wisdom_black_shirt_1786398483035.jpg',
      gallery: ['/assets/images/wisdom_black_shirt_1786398483035.jpg'],
      sizes: ['M', 'L', 'XL', 'XXL'],
      colors: ['Noir', 'Terracotta', 'Indigo'],
      top: false,
      inStock: true,
      badge: 'Édition 2026'
    },
    {
      id: 'p5',
      name: 'Tee-shirt Oversized Cotonou Signature',
      price: 6000,
      category: 'wisdom',
      keyword: 'signature oversized street',
      description: 'Coupe streetwear oversize, broderie soignée sur la manche droite. Confection 100% coton peigné haut de gamme.',
      image: '/assets/images/wisdom_black_shirt_1786398483035.jpg',
      gallery: [
        '/assets/images/wisdom_black_shirt_1786398483035.jpg',
        '/assets/images/wisdom_white_shirt_1786398496994.jpg'
      ],
      sizes: ['M', 'L', 'XL'],
      colors: ['Noir', 'Vert Forêt'],
      top: true,
      inStock: true,
      badge: 'Signature'
    },
    {
      id: 'p6',
      name: 'Tee-shirt Minimalist Crest',
      price: 3500,
      category: 'wisdom',
      keyword: 'logo minimaliste ecusson',
      description: 'Écusson discret WISDOM brodé sur le cœur. Style épuré et élégant pour le bureau comme pour les sorties.',
      image: '/assets/images/wisdom_white_shirt_1786398496994.jpg',
      gallery: [
        '/assets/images/wisdom_white_shirt_1786398496994.jpg',
        '/assets/images/wisdom_black_shirt_1786398483035.jpg'
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blanc', 'Indigo', 'Noir'],
      top: false,
      inStock: true
    }
  ],
  orders: [],
  users: [
    {
      name: 'Administrateur WISDOM',
      email: 'Wisdom.com',
      isAdmin: true,
      phone: '22960413145',
      city: 'Cotonou'
    }
  ],
  settings: {
    logoUrl: '/logo-wisdom.png',
    heroVideoUrl: '',
    heroImageUrl: '/assets/images/wisdom_hero_banner_1786398469341.jpg',
    showcaseSleeveImageUrl: '/assets/images/wisdom_sleeve_patch_1787825766441.jpg',
    showcaseChestImageUrl: '/assets/images/wisdom_chest_logo_1787825785711.jpg',
    fedapayLink: 'https://fedapay.com',
    announcementText: '⚡ Livestock & Livraison Express partout au Bénin en 24h/48h | T-shirts 100% Coton Bio',
    whatsappNumber: '22960413145',
    deliveryFees: {
      'Cotonou': 1000,
      'Abomey-Calavi': 1200,
      'Porto-Novo': 1500,
      'Ouidah': 1500,
      'Bohicon / Abomey': 2000,
      'Parakou': 2500,
      'Natitingou': 3000,
      'Autre': 2500
    }
  },
  reviews: [],
  promos: [
    {
      id: 'promo_welcome',
      code: 'BIENVENUE10',
      description: '-10% sur votre commande dès 5 000 FCFA',
      discountType: 'percentage',
      discountValue: 10,
      minOrderAmount: 5000,
      usedCount: 0,
      active: true,
      isPublicBanner: true,
    },
    {
      id: 'promo_vip20',
      code: 'WISDOM20',
      description: '-20% de remise exclusive dès 15 000 FCFA d\'achats',
      discountType: 'percentage',
      discountValue: 20,
      minOrderAmount: 15000,
      usedCount: 0,
      active: true,
      isPublicBanner: false,
    },
    {
      id: 'promo_freeship',
      code: 'LIVRAISON_OFFERTE',
      description: 'Frais de livraison 100% offerts dès 10 000 FCFA d\'achats',
      discountType: 'free_shipping',
      discountValue: 0,
      minOrderAmount: 10000,
      usedCount: 0,
      active: true,
      isPublicBanner: true,
    },
  ]
};

// Database helper functions
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      return {
        products: parsed.products || defaultData.products,
        orders: parsed.orders || defaultData.orders,
        users: parsed.users || defaultData.users,
        settings: parsed.settings || defaultData.settings,
        reviews: parsed.reviews || defaultData.reviews,
        promos: parsed.promos || defaultData.promos,
      };
    }
  } catch (err) {
    console.error('Error reading database file, using defaults:', err);
  }
  saveDatabase(defaultData);
  return defaultData;
}

function saveDatabase(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// API ROUTES (Must precede Vite middleware)

// Get all store data
app.get('/api/store-data', (req, res) => {
  const data = loadDatabase();
  res.json({ success: true, data });
});

// Update Products
app.post('/api/products', (req, res) => {
  const db = loadDatabase();
  if (Array.isArray(req.body.products)) {
    db.products = req.body.products;
    saveDatabase(db);
    return res.json({ success: true, message: 'Products updated', products: db.products });
  }
  res.status(400).json({ success: false, error: 'Invalid products array' });
});

// Save or Update Orders
app.post('/api/orders', (req, res) => {
  const db = loadDatabase();
  if (Array.isArray(req.body.orders)) {
    db.orders = req.body.orders;
    saveDatabase(db);
    return res.json({ success: true, message: 'Orders updated', orders: db.orders });
  } else if (req.body.order) {
    db.orders = [req.body.order, ...db.orders];
    saveDatabase(db);
    return res.json({ success: true, message: 'Order created', orders: db.orders });
  }
  res.status(400).json({ success: false, error: 'Invalid order payload' });
});

// Save or Update Users
app.post('/api/users', (req, res) => {
  const db = loadDatabase();
  if (Array.isArray(req.body.users)) {
    db.users = req.body.users;
    saveDatabase(db);
    return res.json({ success: true, message: 'Users updated', users: db.users });
  } else if (req.body.user) {
    const existingIdx = db.users.findIndex((u: any) => u.email.toLowerCase() === req.body.user.email.toLowerCase());
    if (existingIdx >= 0) {
      db.users[existingIdx] = { ...db.users[existingIdx], ...req.body.user };
    } else {
      db.users.push(req.body.user);
    }
    saveDatabase(db);
    return res.json({ success: true, message: 'User saved', users: db.users });
  }
  res.status(400).json({ success: false, error: 'Invalid users payload' });
});

// Upload and Persist Showcase Images (Sleeve & Chest)
app.post('/api/upload-showcase', (req, res) => {
  const { dataUrl, imageUrl, type } = req.body; // type: 'sleeve' | 'chest'
  const db = loadDatabase();
  const fieldKey = type === 'sleeve' ? 'showcaseSleeveImageUrl' : 'showcaseChestImageUrl';
  const filePrefix = type === 'sleeve' ? 'showcase-sleeve' : 'showcase-chest';

  try {
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].includes('jpeg') || matches[1].includes('jpg') ? 'jpg' : 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const fileName = `${filePrefix}.${ext}`;
        fs.writeFileSync(path.join(publicDir, fileName), buffer);

        const versionedUrl = `/${fileName}?v=${Date.now()}`;
        db.settings = {
          ...db.settings,
          [fieldKey]: versionedUrl,
        };
        saveDatabase(db);

        return res.json({
          success: true,
          imageUrl: versionedUrl,
          message: `Photo ${type === 'sleeve' ? 'manche' : 'poitrine'} enregistrée avec succès`,
        });
      }
    }

    if (imageUrl && typeof imageUrl === 'string') {
      db.settings = {
        ...db.settings,
        [fieldKey]: imageUrl,
      };
      saveDatabase(db);
      return res.json({ success: true, imageUrl, message: 'URL enregistrée' });
    }

    res.status(400).json({ success: false, error: 'Aucune donnée d\'image reçue' });
  } catch (err: any) {
    console.error('Erreur upload showcase image:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Save Settings
app.post('/api/settings', (req, res) => {
  const db = loadDatabase();
  if (req.body.settings) {
    db.settings = { ...db.settings, ...req.body.settings };
    saveDatabase(db);
    return res.json({ success: true, message: 'Settings saved', settings: db.settings });
  }
  res.status(400).json({ success: false, error: 'Invalid settings payload' });
});

// Save or Update Promo Codes
app.post('/api/promos', (req, res) => {
  const db = loadDatabase();
  if (Array.isArray(req.body.promos)) {
    db.promos = req.body.promos;
    saveDatabase(db);
    return res.json({ success: true, message: 'Promos updated', promos: db.promos });
  }
  res.status(400).json({ success: false, error: 'Invalid promos array' });
});

// Upload and Persist Hero Banner Background Image to disk & DB
app.post('/api/upload-banner', (req, res) => {
  const { dataUrl, imageUrl } = req.body;
  const db = loadDatabase();

  try {
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1].includes('jpeg') || matches[1].includes('jpg') ? 'jpg' : 'png';
        const buffer = Buffer.from(matches[2], 'base64');
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const fileName = `hero-bg.${ext}`;
        fs.writeFileSync(path.join(publicDir, fileName), buffer);

        const versionedUrl = `/${fileName}?v=${Date.now()}`;
        db.settings = {
          ...db.settings,
          heroImageUrl: versionedUrl,
        };
        saveDatabase(db);

        return res.json({
          success: true,
          imageUrl: versionedUrl,
          message: 'Arrière-plan enregistré avec succès',
        });
      }
    }

    if (imageUrl && typeof imageUrl === 'string') {
      db.settings = {
        ...db.settings,
        heroImageUrl: imageUrl,
      };
      saveDatabase(db);
      return res.json({ success: true, imageUrl, message: 'URL d\'arrière-plan enregistrée' });
    }

    res.status(400).json({ success: false, error: 'Aucune donnée d\'image reçue' });
  } catch (err: any) {
    console.error('Erreur upload arrière-plan:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Upload and Persist Store Logo & App Icons
app.post('/api/upload-logo', (req, res) => {
  const { dataUrl, logoUrl } = req.body;
  const db = loadDatabase();

  try {
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        // Save as both primary logo-wisdom.png and timestamped asset
        fs.writeFileSync(path.join(publicDir, 'logo-wisdom.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'logo-cropped.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'favicon.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), buffer);

        const versionedUrl = `/logo-wisdom.png?v=${Date.now()}`;
        db.settings = {
          ...db.settings,
          logoUrl: versionedUrl,
          appIconUrl: db.settings?.appIconUrl || versionedUrl,
        };
        saveDatabase(db);

        return res.json({
          success: true,
          logoUrl: versionedUrl,
          message: 'Logo et icônes d\'application enregistrés avec succès sur le serveur et la base de données',
        });
      }
    }

    if (logoUrl && typeof logoUrl === 'string') {
      db.settings = {
        ...db.settings,
        logoUrl: logoUrl,
      };
      saveDatabase(db);
      return res.json({ success: true, logoUrl, message: 'Logo URL enregistrée' });
    }

    res.status(400).json({ success: false, error: 'Aucune donnée de logo valide reçue' });
  } catch (err: any) {
    console.error('Erreur upload logo:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Upload and Persist Dedicated PWA App Icon for Desktop & Mobile
app.post('/api/upload-app-icon', (req, res) => {
  const { dataUrl, appIconUrl } = req.body;
  const db = loadDatabase();

  try {
    if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:image')) {
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches) {
        const buffer = Buffer.from(matches[2], 'base64');
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        
        // Write all PWA icons for desktop and mobile home screens
        fs.writeFileSync(path.join(publicDir, 'app-icon.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'favicon.png'), buffer);
        fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), buffer);

        const versionedUrl = `/app-icon.png?v=${Date.now()}`;
        db.settings = {
          ...db.settings,
          appIconUrl: versionedUrl,
        };
        saveDatabase(db);

        return res.json({
          success: true,
          appIconUrl: versionedUrl,
          message: 'Icône d\'application (Bureau & Mobile PWA) enregistrée avec succès dans la base de données',
        });
      }
    }

    if (appIconUrl && typeof appIconUrl === 'string') {
      db.settings = {
        ...db.settings,
        appIconUrl: appIconUrl,
      };
      saveDatabase(db);
      return res.json({ success: true, appIconUrl, message: 'URL d\'icône d\'application enregistrée' });
    }

    res.status(400).json({ success: false, error: 'Aucune donnée d\'icône d\'application reçue' });
  } catch (err: any) {
    console.error('Erreur upload icône application:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Web App Manifest Endpoint
app.get('/manifest.json', (req, res) => {
  const db = loadDatabase();
  const iconUrl = db.settings?.appIconUrl || db.settings?.logoUrl || '/logo-wisdom.png';

  const manifest = {
    short_name: 'WISDOM',
    name: 'WISDOM — Application Officielle',
    icons: [
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: iconUrl,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      },
      {
        src: '/favicon.png',
        sizes: '64x64',
        type: 'image/png'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      }
    ],
    id: '/',
    start_url: '/',
    scope: '/',
    background_color: '#0C0A09',
    theme_color: '#0C0A09',
    display: 'standalone',
    orientation: 'portrait',
    description: 'Application officielle de la marque WISDOM — Mode Streetwear Béninoise'
  };

  res.setHeader('Content-Type', 'application/manifest+json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json(manifest);
});

// Save Reviews
app.post('/api/reviews', (req, res) => {
  const db = loadDatabase();
  if (Array.isArray(req.body.reviews)) {
    db.reviews = req.body.reviews;
    saveDatabase(db);
    return res.json({ success: true, message: 'Reviews saved', reviews: db.reviews });
  }
  res.status(400).json({ success: false, error: 'Invalid reviews payload' });
});

// Initialize Vite in Development mode or serve static files in Production
async function setupServer() {
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir, {
    maxAge: '7d',
    setHeaders: (res, filePath) => {
      if (/\.(jpg|jpeg|png|webp|svg|gif|ico|woff2|css|js)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  }));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '30d',
      setHeaders: (res, filePath) => {
        if (/\.(jpg|jpeg|png|webp|svg|gif|ico|woff2|css|js)$/i.test(filePath)) {
          res.setHeader('Cache-Control', 'public, max-age=2592000, immutable');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
