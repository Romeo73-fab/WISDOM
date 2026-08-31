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
      name: 'T-Shirt Signature WISDOM Or',
      price: 4000,
      category: 'wisdom',
      keyword: 'signature or',
      description: 'L\'iconique t-shirt WISDOM en 100% Coton peigné bio. Logo brodé au fil d\'or sur la poitrine avec finition haut de gamme.',
      image: '',
      gallery: [],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Noir', 'Or'],
      top: true,
      inStock: true,
      badge: 'BESTSELLER'
    },
    {
      id: 'p2',
      name: 'T-Shirt Blanc Pur Coton',
      price: 1500,
      category: 'neutre',
      keyword: 'basique blanc',
      description: 'Un t-shirt blanc minimaliste et intemporel. Coupe moderne, grammage épais 220g/m².',
      image: '',
      gallery: [],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Blanc'],
      top: true,
      inStock: true,
      badge: 'POPULAIRE'
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
    heroImageUrl: '',
    showcaseSleeveImageUrl: '',
    showcaseChestImageUrl: '',
    fedapayLink: 'https://fedapay.com',
    announcementText: '⚡ Livestock & Livraison Express partout au Bénin en 24h/48h | T-shirts 100% Coton Bio',
    whatsappNumber: '22960413145',
    deliveryFees: {
      'Cotonou': 1000,
      'Abomey-Calavi': 1200,
      'Porto-Novo': 1500
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

        const versionedUrl = `/logo-wisdom.png?v=${Date.now()}`;
        db.settings = {
          ...db.settings,
          logoUrl: versionedUrl,
        };
        saveDatabase(db);

        return res.json({
          success: true,
          logoUrl: versionedUrl,
          message: 'Logo enregistré avec succès sur le serveur et la base de données',
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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
