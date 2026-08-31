-- ==============================================================================
-- SCHEMA SQL COMPLET & SYNCHRONISÉ POUR LA BOUTIQUE WISDOM SUR SUPABASE
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor > New Query > Run)
-- ==============================================================================

-- 1. Table des Produits
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  category TEXT DEFAULT 'wisdom',
  keyword TEXT,
  description TEXT,
  image TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  sizes JSONB DEFAULT '["S", "M", "L", "XL"]'::jsonb,
  colors JSONB DEFAULT '["Noir", "Blanc"]'::jsonb,
  top BOOLEAN DEFAULT false,
  inStock BOOLEAN DEFAULT true,
  customisable BOOLEAN DEFAULT false,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table des Commandes
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  userEmail TEXT NOT NULL,
  userName TEXT NOT NULL,
  userPhone TEXT,
  userCity TEXT,
  deliveryAddress TEXT,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  deliveryFee NUMERIC DEFAULT 0,
  method TEXT DEFAULT 'whatsapp',
  status TEXT DEFAULT 'en_attente',
  date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Utilisateurs
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  isAdmin BOOLEAN DEFAULT false,
  passwordHash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table des Avis Clients
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  productId TEXT,
  userName TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT NOT NULL,
  date TEXT,
  verifiedPurchase BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table des Paramètres de la boutique (avec Logo et Bannière)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'store_settings',
  logoUrl TEXT,
  heroTitle TEXT,
  heroSubtitle TEXT,
  heroVideoUrl TEXT,
  heroImageUrl TEXT,
  fedapayLink TEXT,
  announcementText TEXT,
  whatsappNumber TEXT,
  deliveryFees JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Politiques RLS permissives pour la boutique
DROP POLICY IF EXISTS "Permissive on products" ON public.products;
CREATE POLICY "Permissive on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissive on orders" ON public.orders;
CREATE POLICY "Permissive on orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissive on users" ON public.users;
CREATE POLICY "Permissive on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissive on reviews" ON public.reviews;
CREATE POLICY "Permissive on reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permissive on settings" ON public.settings;
CREATE POLICY "Permissive on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);
