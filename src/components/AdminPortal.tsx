import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Plus,
  Trash2,
  Save,
  Image as ImageIcon,
  Video,
  Film,
  Users,
  ShoppingBag,
  Settings,
  CheckCircle2,
  Clock,
  Upload,
  AlertCircle,
  RefreshCw,
  Terminal,
  Activity,
  Copy,
  ExternalLink,
  Sparkles,
  FileCode,
  FolderOpen,
  Eye,
  RotateCcw,
  Check,
  Search,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Download,
  LayoutGrid,
  List,
  MessageSquare,
  Filter,
  ArrowUpDown,
  X,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Product, Order, User, StoreSettings } from '../types';
import { BENIN_CITIES } from '../data/initialData';
import { LogoImage } from './LogoImage';
import { ProductEditor } from './ProductEditor';
import { autoCropLogo } from '../utils/imageCropper';
import {
  testSupabaseDiagnostic,
  DiagnosticResult,
  LogEntry,
  subscribeToLogs,
  clearSupabaseLogs,
  addSupabaseLog,
  uploadMediaToSupabase,
  syncSettingsToSupabase,
  syncProductsToSupabase,
  insertProductToSupabase,
  deleteProductFromSupabase,
} from '../utils/supabaseService';
import {
  updateUserRoleInSupabase,
  deleteUserFromSupabase,
  signUpWithSupabase,
  fetchAllRegisteredUsers,
} from '../utils/supabaseAuthService';
import { isSupabaseConfigured } from '../lib/supabase';

interface AdminPortalProps {
  products: Product[];
  orders: Order[];
  usersList: User[];
  settings: StoreSettings;
  onSaveProducts: (updatedProducts: Product[]) => void;
  onSaveOrders: (updatedOrders: Order[]) => void;
  onSaveUsers?: (updatedUsers: User[]) => void;
  onSaveSettings: (updatedSettings: StoreSettings) => void;
  onShowToast: (msg: string) => void;
}

// Client-side Image Compression Helper using Canvas
const compressImage = (file: File, maxWidth = 1200, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new document.defaultView!.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const AdminPortal: React.FC<AdminPortalProps> = ({
  products,
  orders,
  usersList,
  settings,
  onSaveProducts,
  onSaveOrders,
  onSaveUsers,
  onSaveSettings,
  onShowToast,
}) => {
  const [adminTab, setAdminTab] = useState<
    'products' | 'banner' | 'logo' | 'files' | 'debug' | 'orders' | 'users' | 'settings'
  >('products');

  // Local products working state
  const [localProducts, setLocalProducts] = useState<Product[]>([...products]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  // Dedicated Product Page & Management State
  const [productSubView, setProductSubView] = useState<'list' | 'editor'>('list');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<'all' | 'wisdom' | 'neutre' | 'perso' | 'evenement'>('all');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // User Management State
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [isRefreshingUsers, setIsRefreshingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'client'>('all');
  const [userOrderFilter, setUserOrderFilter] = useState<'all' | 'with_orders' | 'no_orders'>('all');
  const [userSortBy, setUserSortBy] = useState<'newest' | 'name' | 'orders'>('newest');
  const [userViewMode, setUserViewMode] = useState<'table' | 'cards'>('table');
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null);

  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: 'Cotonou',
    address: '',
    isAdmin: false,
  });

  // Modal confirmation states (100% iframe-safe without window.confirm)
  const [productToDelete, setProductToDelete] = useState<{ index: number; product: Product } | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToDemote, setUserToDemote] = useState<string | null>(null);

  // Sync from props if external updates happen and no unsaved local changes
  useEffect(() => {
    if (!hasUnsavedChanges) {
      setLocalProducts(products);
    }
  }, [products, hasUnsavedChanges]);

  // Local settings state
  const [localSettings, setLocalSettings] = useState<StoreSettings>({ ...settings });
  const [isSavingLogo, setIsSavingLogo] = useState<boolean>(false);
  const [logoSavedSuccess, setLogoSavedSuccess] = useState<boolean>(false);
  const [isSavingBanner, setIsSavingBanner] = useState<boolean>(false);
  const [bannerSavedSuccess, setBannerSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    setLocalSettings((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  // Supabase Debugger & Logs State
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'success' | 'info'>('all');
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isTestingConn, setIsTestingConn] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string; date: string; isRemote: boolean }>>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const logTerminalRef = useRef<HTMLDivElement>(null);

  // Subscribe to live log stream
  useEffect(() => {
    const unsubscribe = subscribeToLogs((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  // Run auto diagnostic on mount if Supabase is active
  useEffect(() => {
    if (isSupabaseConfigured && !diagnosticResult) {
      handleRunDiagnostic();
    }
  }, []);

  // Run Diagnostic Tool
  const handleRunDiagnostic = async () => {
    setIsTestingConn(true);
    try {
      const result = await testSupabaseDiagnostic();
      setDiagnosticResult(result);
      if (result.status === 'connected') {
        onShowToast(`Connexion Supabase validée (${result.latencyMs}ms) ✓`);
      } else if (result.status === 'warning') {
        onShowToast(`Supabase partiel : certaines tables nécessitent initialisation SQL`);
      } else {
        onShowToast(`Erreur de connexion Supabase`);
      }
    } catch (e: any) {
      onShowToast(`Erreur diagnostic: ${e.message}`);
    } finally {
      setIsTestingConn(false);
    }
  };

  // Copy URL Helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    onShowToast(`Lien ${label} copié dans le presse-papier ✓`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // Handle Logo Upload from local file with automatic whitespace trimming
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingLogo(true);
    setLogoSavedSuccess(false);
    onShowToast('Recadrage haute précision et préparation du logo...');

    try {
      // 1. Automatically crop transparent margins so the logo is crisp and fills the container
      const { dataUrl: croppedDataUrl, croppedFile } = await autoCropLogo(file, 0.03);
      const fileToUpload = croppedFile || file;

      // 2. Upload to Supabase Storage
      let targetUrl = croppedDataUrl;
      try {
        const { url: sbUrl, isRemote } = await uploadMediaToSupabase(fileToUpload, 'brand');
        if (sbUrl && isRemote) {
          targetUrl = sbUrl;
        }
      } catch (sbErr) {
        console.warn('Supabase media upload fallback:', sbErr);
      }

      // 3. Persist directly to backend server disk (/public/logo-wisdom.png & wisdom-db.json)
      try {
        const res = await fetch('/api/upload-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl: croppedDataUrl, logoUrl: targetUrl }),
        });
        if (res.ok) {
          const sJson = await res.json();
          if (sJson.logoUrl) {
            targetUrl = sJson.logoUrl;
          }
        }
      } catch (srvErr) {
        console.warn('Server upload-logo fallback:', srvErr);
      }

      const updated = { ...localSettings, logoUrl: targetUrl };
      // Update local state immediately
      setLocalSettings(updated);
      // Update application state immediately (updates header, footer, modals live on the page)
      onSaveSettings(updated);
      // Persist in database (Supabase & backend server)
      await syncSettingsToSupabase(updated);

      setUploadedFiles((prev) => [
        { name: file.name, url: targetUrl, date: new Date().toLocaleTimeString('fr-FR'), isRemote: targetUrl.startsWith('http') },
        ...prev,
      ]);

      setLogoSavedSuccess(true);
      addSupabaseLog('success', `💾 Nouveau logo officiel recadré, enregistré dans la base et appliqué en direct sur le site : ${file.name}`);
      onShowToast('✨ Logo recadré, appliqué sur la page et enregistré dans la base de données !');
      setTimeout(() => setLogoSavedSuccess(false), 5000);
    } catch (err: any) {
      onShowToast(`Erreur logo: ${err.message}`);
      addSupabaseLog('error', `Erreur téléversement logo: ${err.message}`);
    } finally {
      setIsSavingLogo(false);
      // reset file input value to allow re-selecting the same file if needed
      e.target.value = '';
    }
  };

  // Explicitly Save Logo to Database and Update Live Site
  const handleSaveLogoToDatabase = async () => {
    setIsSavingLogo(true);
    setLogoSavedSuccess(false);
    try {
      let activeLogo = localSettings.logoUrl || '/logo-wisdom.png';

      // If it's a data url, ensure it is persisted to disk and database
      if (activeLogo.startsWith('data:image')) {
        try {
          const res = await fetch('/api/upload-logo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl: activeLogo }),
          });
          if (res.ok) {
            const sJson = await res.json();
            if (sJson.logoUrl) activeLogo = sJson.logoUrl;
          }
        } catch (e) {}
      }

      const updated = { ...localSettings, logoUrl: activeLogo };
      setLocalSettings(updated);
      // Update application-wide state instantly (Header, Footer, Cart, Modals)
      onSaveSettings(updated);
      // Persist to Supabase Database (store_settings & settings tables)
      await syncSettingsToSupabase(updated);

      setLogoSavedSuccess(true);
      addSupabaseLog('success', `💾 Logo enregistré avec succès dans la base de données : ${updated.logoUrl}`);
      onShowToast('✨ Logo enregistré dans la base de données et mis à jour sur tout le site !');
      setTimeout(() => setLogoSavedSuccess(false), 5000);
    } catch (err: any) {
      onShowToast(`Erreur d'enregistrement : ${err.message}`);
      addSupabaseLog('error', `Erreur enregistrement logo: ${err.message}`);
    } finally {
      setIsSavingLogo(false);
    }
  };

  // Reset to default Logo
  const handleResetLogo = async () => {
    const updated = { ...localSettings, logoUrl: '/logo-wisdom.png' };
    setLocalSettings(updated);
    onSaveSettings(updated);
    await syncSettingsToSupabase(updated);
    setLogoSavedSuccess(true);
    addSupabaseLog('info', 'Logo réinitialisé au visuel officiel standard /logo-wisdom.png');
    onShowToast('Logo réinitialisé au visuel officiel standard (/logo-wisdom.png) et sauvegardé dans la base');
    setTimeout(() => setLogoSavedSuccess(false), 3000);
  };

  // Handle Product Image Upload
  const handleProductImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productIdx: number,
    isMainImage: boolean,
    galleryIdx?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { url, isRemote } = await uploadMediaToSupabase(file, 'products');
      const updated = [...localProducts];
      if (isMainImage) {
        updated[productIdx].image = url;
      } else if (galleryIdx !== undefined) {
        if (!updated[productIdx].gallery) updated[productIdx].gallery = [];
        updated[productIdx].gallery[galleryIdx] = url;
      }
      setLocalProducts(updated);
      setHasUnsavedChanges(true);

      setUploadedFiles((prev) => [
        { name: file.name, url, date: new Date().toLocaleTimeString('fr-FR'), isRemote },
        ...prev,
      ]);

      onShowToast('Photo ajoutée ✓ Cliquez sur PUBLIER pour enregistrer sur Supabase et le serveur');
    } catch (err: any) {
      console.error('Image upload error:', err);
      onShowToast('Erreur lors du téléversement de la photo');
    }
  };

  // Handle General File Upload to Media Manager
  const handleGeneralFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    onShowToast(`Téléversement de ${file.name}...`);
    try {
      const { url, isRemote } = await uploadMediaToSupabase(file, 'assets');
      setUploadedFiles((prev) => [
        { name: file.name, url, date: new Date().toLocaleTimeString('fr-FR'), isRemote },
        ...prev,
      ]);
      onShowToast(`Fichier '${file.name}' disponible dans vos médias ✓`);
    } catch (err: any) {
      onShowToast(`Échec upload: ${err.message}`);
    }
  };

  // Open Dedicated Product Page (Create Mode)
  const handleOpenAddProduct = () => {
    setSelectedProductForEdit(null);
    setProductSubView('editor');
  };

  // Open Dedicated Product Page (Edit Mode)
  const handleOpenEditProduct = (prod: Product) => {
    setSelectedProductForEdit(prod);
    setProductSubView('editor');
  };

  // Save Product from Dedicated Product Editor (Direct Supabase + Live Shop Sync)
  const handleSaveProductFromEditor = async (savedProduct: Product) => {
    setIsSubmittingProduct(true);
    try {
      // 1. Direct Supabase Table Insert/Update
      const res = await insertProductToSupabase(savedProduct);

      // 2. Update local state and global App state
      const exists = localProducts.some((p) => p.id === savedProduct.id);
      let updated: Product[];
      if (exists) {
        updated = localProducts.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      } else {
        updated = [savedProduct, ...localProducts];
      }

      setLocalProducts(updated);
      onSaveProducts(updated);

      // 3. Background Sync full list for absolute persistence
      try {
        await syncProductsToSupabase(updated);
      } catch (e) {}

      if (res.success) {
        onShowToast(`✅ Produit "${savedProduct.name}" enregistré sur Supabase et la boutique !`);
        addSupabaseLog('success', `💾 Produit enregistré : ${savedProduct.name} (${savedProduct.price} FCFA)`);
      } else {
        onShowToast(`✅ Produit "${savedProduct.name}" enregistré sur la boutique !`);
      }

      setProductSubView('list');
      setSelectedProductForEdit(null);
    } catch (err: any) {
      onShowToast(`Erreur lors de l'enregistrement: ${err.message}`);
      addSupabaseLog('error', `Erreur enregistrement produit: ${err.message}`);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Save / Update a Single Product directly to Supabase
  const handleSaveSingleProduct = async (idx: number) => {
    const prod = localProducts[idx];
    if (!prod) return;

    onShowToast(`Enregistrement du produit "${prod.name}" sur Supabase...`);
    try {
      const res = await insertProductToSupabase(prod);
      onSaveProducts(localProducts);
      if (res.success) {
        onShowToast(`✅ Produit "${prod.name}" mis à jour sur Supabase !`);
      } else {
        onShowToast(`Mis à jour localement (Erreur Supabase: ${res.error})`);
      }
    } catch (err: any) {
      onShowToast(`Erreur: ${err.message}`);
    }
  };

  // Update Product Field
  const handleProductChange = (idx: number, field: keyof Product, value: any) => {
    const updated = [...localProducts];
    (updated[idx] as any)[field] = value;
    setLocalProducts(updated);
    setHasUnsavedChanges(true);
  };

  // Delete Product Trigger (Opens in-app confirmation modal)
  const handleDeleteProduct = (idx: number) => {
    const prod = localProducts[idx];
    if (!prod) return;
    setProductToDelete({ index: idx, product: prod });
  };

  // Confirm Product Delete Execution
  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const { index, product } = productToDelete;
    setIsDeletingProduct(true);
    try {
      onShowToast(`🗑️ Suppression de "${product.name}" en cours...`);

      // 1. Delete on Supabase
      try {
        await deleteProductFromSupabase(product.id);
      } catch (sbErr) {
        console.warn('Supabase delete warning:', sbErr);
      }

      // 2. Remove locally
      const updated = localProducts.filter((_, i) => i !== index);
      setLocalProducts(updated);
      onSaveProducts(updated);

      // 3. Sync remaining products to Supabase for absolute data integrity
      try {
        syncProductsToSupabase(updated);
      } catch (e) {}

      onShowToast(`🗑️ Produit "${product.name}" supprimé définitivement du catalogue et de Supabase ✓`);
      setProductToDelete(null);
    } catch (err: any) {
      onShowToast(`Erreur suppression: ${err.message}`);
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // User Stats & Filtering Helper
  const getUserStats = (email: string) => {
    const clean = (email || '').toLowerCase().trim();
    const userOrders = orders.filter((o) => (o.userEmail || '').toLowerCase().trim() === clean);
    const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return {
      orderCount: userOrders.length,
      totalSpent,
      orders: userOrders,
    };
  };

  // Real-time Refresh of Users across Supabase & Server
  const handleRefreshUsers = async () => {
    setIsRefreshingUsers(true);
    try {
      const refreshed = await fetchAllRegisteredUsers();
      if (onSaveUsers) onSaveUsers(refreshed);
      onShowToast(`👥 ${refreshed.length} compte(s) utilisateur(s) synchronisé(s) en temps réel !`);
    } catch (err: any) {
      onShowToast(`Erreur d'actualisation: ${err.message}`);
    } finally {
      setIsRefreshingUsers(false);
    }
  };

  // Export Users to CSV file
  const handleExportUsersCSV = () => {
    if (!usersList.length) {
      onShowToast('Aucun utilisateur à exporter');
      return;
    }
    const headers = [
      'Nom',
      'Email',
      'Telephone',
      'Ville',
      'Adresse',
      'Role',
      'Admin',
      'Nombre de commandes',
      'Total Depense (FCFA)',
    ];
    const rows = usersList.map((u) => {
      const stats = getUserStats(u.email);
      return [
        `"${(u.name || '').replace(/"/g, '""')}"`,
        `"${(u.email || '').replace(/"/g, '""')}"`,
        `"${(u.phone || '').replace(/"/g, '""')}"`,
        `"${(u.city || '').replace(/"/g, '""')}"`,
        `"${(u.address || '').replace(/"/g, '""')}"`,
        `"${u.isAdmin || u.role === 'admin' ? 'ADMINISTRATEUR' : 'CLIENT'}"`,
        `"${u.isAdmin || u.role === 'admin' ? 'OUI' : 'NON'}"`,
        `"${stats.orderCount}"`,
        `"${stats.totalSpent}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `utilisateurs_wisdom_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Export CSV de ${usersList.length} utilisateur(s) téléchargé ✓`);
  };

  // User Role Management Handlers
  const handlePromoteUser = async (userEmail: string) => {
    onShowToast(`Attribution des droits Administrateur à ${userEmail}...`);
    const res = await updateUserRoleInSupabase(userEmail, true, 'admin');
    if (res.success) {
      const updated = usersList.map((u) =>
        u.email.toLowerCase() === userEmail.toLowerCase()
          ? { ...u, isAdmin: true, role: 'admin' }
          : u
      );
      if (onSaveUsers) onSaveUsers(updated);
      onShowToast(`👑 ${userEmail} est maintenant Administrateur ✓`);
    } else {
      onShowToast(`Échec: ${res.error}`);
    }
  };

  const handleDemoteUser = (userEmail: string) => {
    setUserToDemote(userEmail);
  };

  const handleConfirmDemoteUser = async () => {
    if (!userToDemote) return;
    const userEmail = userToDemote;
    onShowToast(`Rétrogradation de ${userEmail}...`);
    try {
      const res = await updateUserRoleInSupabase(userEmail, false, 'client');
      if (res.success) {
        const updated = usersList.map((u) =>
          u.email.toLowerCase() === userEmail.toLowerCase()
            ? { ...u, isAdmin: false, role: 'client' }
            : u
        );
        if (onSaveUsers) onSaveUsers(updated);
        onShowToast(`👤 ${userEmail} est maintenant Client standard ✓`);
      } else {
        onShowToast(`Échec: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Erreur: ${err.message}`);
    } finally {
      setUserToDemote(null);
    }
  };

  const handleDeleteUser = (userEmail: string) => {
    setUserToDelete(userEmail);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const userEmail = userToDelete;
    onShowToast(`Suppression du compte ${userEmail}...`);
    try {
      const res = await deleteUserFromSupabase(userEmail);
      if (res.success) {
        const updated = usersList.filter((u) => u.email.toLowerCase() !== userEmail.toLowerCase());
        if (onSaveUsers) onSaveUsers(updated);
        onShowToast(`Compte de ${userEmail} supprimé ✓`);
      } else {
        onShowToast(`Échec: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Erreur: ${err.message}`);
    } finally {
      setUserToDelete(null);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email || !newUserForm.password || !newUserForm.name) {
      onShowToast('Veuillez remplir le nom, l\'e-mail et le mot de passe');
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await signUpWithSupabase(
        newUserForm.name,
        newUserForm.email,
        newUserForm.password,
        newUserForm.phone,
        newUserForm.city,
        newUserForm.address,
        newUserForm.isAdmin
      );

      if (res.success && res.user) {
        const updated = [res.user, ...usersList.filter((u) => u.email.toLowerCase() !== res.user!.email.toLowerCase())];
        if (onSaveUsers) onSaveUsers(updated);
        onShowToast(`🎉 Compte "${res.user.email}" (${res.user.isAdmin ? 'ADMIN' : 'CLIENT'}) créé sur Supabase !`);
        setIsCreateUserModalOpen(false);
        setNewUserForm({
          name: '',
          email: '',
          password: '',
          phone: '',
          city: 'Cotonou',
          address: '',
          isAdmin: false,
        });
      } else {
        onShowToast(`Erreur: ${res.error}`);
      }
    } catch (err: any) {
      onShowToast(`Erreur: ${err.message}`);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle Hero Image Upload
  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onShowToast(`Téléversement de l'image "${file.name}"...`);
      const { url, isRemote } = await uploadMediaToSupabase(file, 'banner');
      const updatedSettings = { ...localSettings, heroImageUrl: url, heroBgType: 'image' as const };
      setLocalSettings(updatedSettings);
      setHasUnsavedChanges(true);
      onSaveSettings(updatedSettings);
      setUploadedFiles((prev) => [
        { name: file.name, url, date: new Date().toLocaleTimeString('fr-FR'), isRemote },
        ...prev,
      ]);
      onShowToast('🖼️ Image de fond du Header téléversée et activée ✓');
    } catch (err: any) {
      console.error('Header image upload error:', err);
      onShowToast(`Erreur lors du traitement de l'image de fond: ${err.message || ''}`);
    }
  };

  // Handle Hero Video Upload
  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 60 * 1024 * 1024) {
      onShowToast('⚠️ La vidéo dépasse 60 Mo. Veuillez utiliser une vidéo plus légère ou coller une URL directe.');
      return;
    }
    try {
      onShowToast(`Téléversement de la vidéo "${file.name}"...`);
      const { url, isRemote } = await uploadMediaToSupabase(file, 'videos');
      const updatedSettings = { ...localSettings, heroVideoUrl: url, heroBgType: 'video' as const };
      setLocalSettings(updatedSettings);
      setHasUnsavedChanges(true);
      onSaveSettings(updatedSettings);
      setUploadedFiles((prev) => [
        { name: file.name, url, date: new Date().toLocaleTimeString('fr-FR'), isRemote },
        ...prev,
      ]);
      onShowToast('🎥 Vidéo de fond du Header téléversée et activée ✓');
    } catch (err: any) {
      onShowToast(`Erreur vidéo: ${err.message}`);
    }
  };

  // Direct Banner Save & Sync to Supabase & Backend Server
  const handleSaveBannerSettings = async () => {
    setIsSavingBanner(true);
    setBannerSavedSuccess(false);
    try {
      onSaveSettings(localSettings);
      await syncSettingsToSupabase(localSettings);
      setBannerSavedSuccess(true);
      addSupabaseLog('success', `💾 Réglages de la bannière (${localSettings.heroBgType === 'video' ? 'Mode Vidéo' : 'Mode Photo'}) enregistrés sur Supabase`);
      onShowToast('✨ Bannière (Photo / Vidéo) enregistrée sur Supabase et appliquée sur la boutique !');
      setTimeout(() => setBannerSavedSuccess(false), 5000);
    } catch (err: any) {
      onShowToast(`Erreur enregistrement bannière: ${err.message}`);
    } finally {
      setIsSavingBanner(false);
    }
  };

  // Publish All Products & Settings to Server & All Users & Supabase
  const handlePublishAll = () => {
    setIsPublishing(true);
    addSupabaseLog('info', '🚀 Lancement de la publication globale vers le backend et Supabase...');
    onSaveProducts(localProducts);
    onSaveSettings(localSettings);
    setHasUnsavedChanges(false);

    setTimeout(() => {
      setIsPublishing(false);
      onShowToast('🚀 TOUTES LES MODIFICATIONS (PRODUITS, LOGO, BANNIÈRE, RÉGLAGES) ONT ÉTÉ PUBLIÉES SUR SUPABASE & SERVEUR !');
    }, 450);
  };

  // Update Order Status
  const handleOrderStatusChange = (orderId: string, status: Order['status']) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status } : o));
    onSaveOrders(updated);
    onShowToast('Statut de la commande mis à jour ✓');
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Top Header Card */}
      <div className="bg-stone-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <LogoImage
            src={localSettings.logoUrl}
            alt="WISDOM"
            className="h-10 w-auto object-contain drop-shadow brightness-105"
          />
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-widest font-bold">
              <Shield className="w-4 h-4" />
              <span>Panneau d'Administration officiel</span>
              <span className="bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded text-[10px]">
                Supabase v2 Sync
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-100 mt-0.5">
              Gestion de la Boutique WISDOM
            </h2>
          </div>
        </div>

        {/* Action Fast-bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Diagnostic status pill / trigger */}
          <button
            onClick={handleRunDiagnostic}
            disabled={isTestingConn}
            className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              diagnosticResult?.status === 'connected'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                : diagnosticResult?.status === 'warning'
                ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/60'
                : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
            }`}
            title="Tester la connexion Supabase"
          >
            <Activity className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin text-amber-400' : ''}`} />
            <span>
              {isTestingConn
                ? 'Test DB...'
                : diagnosticResult?.status === 'connected'
                ? `🟢 Supabase OK (${diagnosticResult.latencyMs}ms)`
                : diagnosticResult?.status === 'warning'
                ? `🟡 Supabase (${diagnosticResult.latencyMs}ms)`
                : '🔍 Tester Connexion'}
            </span>
          </button>

          {/* Quick Publish CTA if changes pending */}
          {hasUnsavedChanges && (
            <button
              onClick={handlePublishAll}
              disabled={isPublishing}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 rounded-xl font-mono text-xs font-black shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center gap-1.5 animate-pulse cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Publier ({localProducts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Navigation Bar */}
      <div className="flex flex-wrap gap-2 mb-8 bg-stone-900/80 p-2 rounded-2xl border border-stone-800 backdrop-blur-sm">
        <button
          onClick={() => setAdminTab('products')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'products'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Produits ({localProducts.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('logo')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'logo'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Logo de la Boutique</span>
        </button>

        <button
          onClick={() => setAdminTab('banner')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'banner'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Bannière & Accueil</span>
        </button>

        <button
          onClick={() => setAdminTab('files')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'files'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Médias & Fichiers</span>
        </button>

        <button
          onClick={() => setAdminTab('debug')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'debug'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Logs & Débogage Supabase</span>
        </button>

        <button
          onClick={() => setAdminTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'orders'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Commandes ({orders.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'users'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clients ({usersList.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('settings')}
          className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            adminTab === 'settings'
              ? 'bg-amber-400 text-stone-950 shadow-md'
              : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Réglages Système</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB: LOGO DE LA BOUTIQUE (Requested by user) */}
      {/* ========================================================================= */}
      {adminTab === 'logo' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-serif text-2xl font-bold text-stone-100 flex items-center gap-2.5">
                    <Sparkles className="w-6 h-6 text-amber-400" />
                    <span>Gestion du Logo Officiel WISDOM</span>
                  </h3>
                  <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Direct Live
                  </span>
                </div>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Téléversez votre logo ou modifiez son URL. Il est instantanément appliqué sur l'en-tête, le menu, le footer, les modales et sauvegardé dans la base de données.
                </p>
              </div>

              <button
                onClick={handleResetLogo}
                className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-mono text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors border border-stone-700 w-fit"
                title="Rétablir le logo officiel standard"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rétablir /logo-wisdom.png</span>
              </button>
            </div>

            {/* Success feedback notification */}
            {logoSavedSuccess && (
              <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex items-center gap-3 text-emerald-300 font-mono text-xs animate-in fade-in slide-in-from-top-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-emerald-200">Logo enregistré et synchronisé avec succès !</p>
                  <p className="text-[11px] text-emerald-400/90">
                    Le fichier a été enregistré dans la base de données Supabase, le serveur et mis à jour automatiquement sur toute la boutique.
                  </p>
                </div>
              </div>
            )}

            {/* Logo Preview Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Dark Theme Header Preview */}
              <div className="bg-stone-950 border border-stone-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
                  1. En-tête & Barre de Navigation
                </span>
                <div className="h-20 w-full flex items-center justify-center bg-stone-900/80 rounded-xl border border-stone-800 p-3">
                  <LogoImage
                    src={localSettings.logoUrl}
                    alt="Aperçu Logo"
                    className="h-10 w-auto max-w-[160px] object-contain drop-shadow brightness-105"
                  />
                </div>
                <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Affiché en direct sur le site</span>
                </p>
              </div>

              {/* App Icon Home Screen Format (Black Background) */}
              <div className="bg-stone-950 border border-amber-400/30 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3 shadow-lg shadow-amber-400/5">
                <span className="text-[11px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                  2. Icône Application (Écran d'Accueil)
                </span>
                <div className="h-20 w-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-[18px] bg-black border border-stone-800 shadow-xl flex items-center justify-center p-2.5 ring-1 ring-white/10">
                    <LogoImage
                      src={localSettings.logoUrl}
                      alt="Icône Application"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
                <p className="text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Format mobile fond noir PWA</span>
                </p>
              </div>

              {/* Light Theme Preview */}
              <div className="bg-stone-100 text-stone-900 border border-stone-300 rounded-2xl p-5 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-mono text-stone-600 uppercase tracking-wider font-semibold">
                  3. Fond Clair (Factures & Docs)
                </span>
                <div className="h-20 w-full flex items-center justify-center bg-white rounded-xl border border-stone-200 p-3 shadow-inner">
                  <LogoImage
                    src={localSettings.logoUrl}
                    alt="Aperçu Logo Clair"
                    className="h-10 w-auto max-w-[160px] object-contain"
                  />
                </div>
                <p className="text-[10px] font-mono text-stone-600">
                  Rendu haute définition optimisé
                </p>
              </div>
            </div>

            {/* Upload Zone & Action Controls */}
            <div className="p-6 bg-stone-950/70 border-2 border-dashed border-amber-400/40 rounded-2xl space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="font-serif font-bold text-stone-100 text-base">
                  Téléverser ou modifier le fichier logo (PNG, SVG, JPG, WEBP)
                </p>
                <p className="text-xs font-mono text-stone-400">
                  Dès sélection, le logo est préparé, mis à jour sur la page et sauvegardé dans la base de données.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                {/* File picker button */}
                <label className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-amber-400/20 active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{isSavingLogo ? 'Téléversement en cours...' : '1. Choisir un fichier logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSavingLogo}
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                </label>

                {/* Explicit Save to DB Button */}
                <button
                  onClick={handleSaveLogoToDatabase}
                  disabled={isSavingLogo}
                  className="px-5 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-mono text-xs font-black rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                  title="Sauvegarder le logo actuel dans la base de données Supabase"
                >
                  {isSavingLogo ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>2. Enregistrer le Logo dans la Base</span>
                </button>
              </div>

              {/* Editable URL Input */}
              <div className="pt-3 border-t border-stone-800 text-left bg-stone-900/80 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-stone-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    URL / Fichier du Logo actuel :
                  </span>
                  <span className="text-[10px] font-mono text-stone-500">
                    Modifiable directement ci-dessous
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={localSettings.logoUrl || ''}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      const updated = { ...localSettings, logoUrl: newUrl };
                      setLocalSettings(updated);
                      // Update live page immediately as user types or pastes
                      onSaveSettings(updated);
                    }}
                    placeholder="Ex: /logo-wisdom.png ou https://.../mon-logo.png"
                    className="flex-1 bg-stone-950 text-amber-300 text-xs font-mono px-3.5 py-2.5 rounded-lg border border-stone-700 focus:border-amber-400 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveLogoToDatabase}
                      disabled={isSavingLogo}
                      className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-mono font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Enregistrer cette URL dans la base de données"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </button>
                    <button
                      onClick={() => handleCopy(localSettings.logoUrl || '', 'du logo')}
                      className="px-3.5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono rounded-lg cursor-pointer transition-colors"
                      title="Copier le lien du logo"
                    >
                      Copier
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: BANNIÈRE, VIDÉO & TEXTES ACCUEIL (Choix Photo ou Vidéo) */}
      {/* ========================================================================= */}
      {adminTab === 'banner' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-100 flex items-center gap-2.5">
                  <ImageIcon className="w-6 h-6 text-amber-400" />
                  <span>Gestion de la Bannière (Hero Accueil)</span>
                </h3>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Choisissez librement entre une <strong>Photo / Image haute définition</strong> ou une <strong>Vidéo MP4 en boucle</strong> pour le fond du header.
                </p>
              </div>

              {/* Mode Toggle Photo vs Video */}
              <div className="flex bg-stone-950 p-1.5 rounded-2xl border border-stone-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...localSettings, heroBgType: 'image' as const };
                    setLocalSettings(updated);
                    setHasUnsavedChanges(true);
                    onSaveSettings(updated);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    (localSettings.heroBgType || 'image') === 'image'
                      ? 'bg-amber-400 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>🖼️ Mode Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...localSettings, heroBgType: 'video' as const };
                    setLocalSettings(updated);
                    setHasUnsavedChanges(true);
                    onSaveSettings(updated);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    localSettings.heroBgType === 'video'
                      ? 'bg-amber-400 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>🎥 Mode Vidéo</span>
                </button>
              </div>
            </div>

            {/* Banner Live Preview */}
            <div className="relative h-64 sm:h-80 w-full bg-stone-950 rounded-2xl overflow-hidden border border-stone-800 flex items-center justify-center text-center p-6 shadow-inner">
              {localSettings.heroBgType === 'video' && localSettings.heroVideoUrl ? (
                <video
                  src={localSettings.heroVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
              ) : localSettings.heroImageUrl ? (
                <img
                  src={localSettings.heroImageUrl}
                  alt="Bannière Hero"
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
              ) : null}

              <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-stone-950/70" />

              <div className="relative z-10 max-w-xl">
                <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                  {localSettings.heroBgType === 'video' ? (
                    <>
                      <Video className="w-3 h-3 text-amber-400" />
                      <span>Mode Vidéo Actif (En boucle)</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span>Mode Photo / Image Actif</span>
                    </>
                  )}
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-black text-stone-100 leading-tight">
                  {localSettings.heroTitle || 'La sagesse se porte au quotidien.'}
                </h2>
                <p className="mt-2 text-stone-300 text-xs sm:text-sm font-light">
                  {localSettings.heroSubtitle || 'WISDOM habille les gens simples et les esprits réveillés.'}
                </p>
              </div>
            </div>

            {/* Media Upload & URL Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-stone-800">
              {/* Media selection */}
              <div className="space-y-4">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  1. Médias de Fond ({localSettings.heroBgType === 'video' ? 'Vidéo MP4' : 'Photo / Image'})
                </label>

                {/* Conditional upload button depending on mode */}
                {localSettings.heroBgType === 'video' ? (
                  <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                        <Video className="w-4 h-4" />
                        Option Vidéo (MP4 / WEBM)
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">Max 60 Mo</span>
                    </div>

                    <label className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all shadow">
                      <Upload className="w-4 h-4" />
                      <span>Téléverser un fichier Vidéo MP4</span>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/*"
                        className="hidden"
                        onChange={handleHeroVideoUpload}
                      />
                    </label>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-stone-400 block">Ou entrez une URL de vidéo MP4 directe :</label>
                      <input
                        type="text"
                        value={localSettings.heroVideoUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...localSettings, heroVideoUrl: val, heroBgType: 'video' as const };
                          setLocalSettings(updated);
                          setHasUnsavedChanges(true);
                          onSaveSettings(updated);
                        }}
                        placeholder="https://.../video.mp4"
                        className="w-full bg-stone-900 text-amber-300 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Ready to use video presets */}
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-mono text-stone-400 block">Exemples de vidéos prêtes à l'emploi :</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...localSettings,
                              heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-a-studio-lighting-42407-large.mp4',
                              heroBgType: 'video' as const,
                            };
                            setLocalSettings(updated);
                            setHasUnsavedChanges(true);
                            onSaveSettings(updated);
                            onShowToast('Vidéo Défilé Mode sélectionnée ✓');
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-mono cursor-pointer border border-stone-700"
                        >
                          🎥 Mode & Défilé
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...localSettings,
                              heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-of-a-seamstress-sewing-a-fabric-42007-large.mp4',
                              heroBgType: 'video' as const,
                            };
                            setLocalSettings(updated);
                            setHasUnsavedChanges(true);
                            onSaveSettings(updated);
                            onShowToast('Vidéo Atelier Coton sélectionnée ✓');
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-mono cursor-pointer border border-stone-700"
                        >
                          🧵 Atelier Coton
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...localSettings,
                              heroVideoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-golden-particles-in-the-dark-41718-large.mp4',
                              heroBgType: 'video' as const,
                            };
                            setLocalSettings(updated);
                            setHasUnsavedChanges(true);
                            onSaveSettings(updated);
                            onShowToast('Vidéo Particules Dorées sélectionnée ✓');
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-mono cursor-pointer border border-stone-700"
                        >
                          ✨ Particules Or
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 bg-stone-950 p-4 rounded-2xl border border-stone-800">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4" />
                        Option Photo (JPG / PNG / WEBP)
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">Haute Définition</span>
                    </div>

                    <label className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-black cursor-pointer flex items-center justify-center gap-2 transition-all shadow">
                      <Upload className="w-4 h-4" />
                      <span>Téléverser une Photo de Fond</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleHeroImageUpload}
                      />
                    </label>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-stone-400 block">Ou entrez une URL d'image directe :</label>
                      <input
                        type="text"
                        value={localSettings.heroImageUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...localSettings, heroImageUrl: val, heroBgType: 'image' as const };
                          setLocalSettings(updated);
                          setHasUnsavedChanges(true);
                          onSaveSettings(updated);
                        }}
                        placeholder="https://.../photo.jpg ou /assets/images/..."
                        className="w-full bg-stone-900 text-amber-300 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Ready to use photo presets */}
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-mono text-stone-400 block">Photos de collection WISDOM :</span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...localSettings,
                              heroImageUrl: '/assets/images/wisdom_black_shirt_1786398483035.jpg',
                              heroBgType: 'image' as const,
                            };
                            setLocalSettings(updated);
                            setHasUnsavedChanges(true);
                            onSaveSettings(updated);
                            onShowToast('Photo Collection Noire sélectionnée ✓');
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-mono cursor-pointer border border-stone-700"
                        >
                          🖤 T-Shirt Noir Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = {
                              ...localSettings,
                              heroImageUrl: '/assets/images/wisdom_white_shirt_1786398484196.jpg',
                              heroBgType: 'image' as const,
                            };
                            setLocalSettings(updated);
                            setHasUnsavedChanges(true);
                            onSaveSettings(updated);
                            onShowToast('Photo Coton Blanc sélectionnée ✓');
                          }}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-[10px] font-mono cursor-pointer border border-stone-700"
                        >
                          🤍 T-Shirt Blanc Élite
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Text Slogans */}
              <div className="space-y-4">
                <label className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  2. Textes & Slogans
                </label>

                <div>
                  <label className="text-[11px] font-mono text-stone-400 block mb-1">
                    Titre Principal (Slogan) :
                  </label>
                  <input
                    type="text"
                    value={localSettings.heroTitle || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, heroTitle: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="La sagesse se porte au quotidien."
                    className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs font-serif font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-stone-400 block mb-1">
                    Sous-titre explicatif :
                  </label>
                  <textarea
                    rows={2}
                    value={localSettings.heroSubtitle || ''}
                    onChange={(e) => {
                      setLocalSettings({ ...localSettings, heroSubtitle: e.target.value });
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="WISDOM habille les gens simples et les esprits réveillés..."
                    className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>État actuel : {localSettings.heroBgType === 'video' ? 'Vidéo MP4 en boucle' : 'Photo Haute Définition'}</span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-relaxed font-mono">
                    Les modifications sont immédiatement prévisualisées et peuvent être enregistrées en un clic dans Supabase.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-stone-800">
              <div className="flex items-center gap-2 text-xs font-mono">
                {bannerSavedSuccess && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Bannière enregistrée avec succès sur Supabase et le serveur !
                  </span>
                )}
              </div>

              <button
                onClick={handleSaveBannerSettings}
                disabled={isSavingBanner}
                className="w-full sm:w-auto px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                {isSavingBanner ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>🚀 Enregistrer & Publier la Bannière</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: MÉDIAS & FICHIERS SUPABASE (Requested by user) */}
      {/* ========================================================================= */}
      {adminTab === 'files' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-100 flex items-center gap-2.5">
                  <FolderOpen className="w-6 h-6 text-amber-400" />
                  <span>Gestionnaire de Fichiers & Médias Supabase</span>
                </h3>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Téléversez vos photos de vêtements, bannières et logos pour obtenir instantanément des URLs publiques prêtes à l'emploi.
                </p>
              </div>

              <label className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md">
                <Upload className="w-4 h-4" />
                <span>+ Téléverser un fichier</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleGeneralFileUpload}
                />
              </label>
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="p-10 text-center bg-stone-950 border border-stone-800 rounded-2xl space-y-3">
                <FolderOpen className="w-10 h-10 text-stone-600 mx-auto" />
                <p className="font-serif text-base text-stone-300">
                  Aucun fichier téléversé dans cette session.
                </p>
                <p className="text-xs font-mono text-stone-500 max-w-md mx-auto">
                  Utilisez le bouton ci-dessus ou téléversez directement vos photos depuis les onglets Produits et Logo.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-3 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-stone-900 border border-stone-800 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                        {file.url.startsWith('data:video') || file.url.endsWith('.mp4') ? (
                          <Video className="w-6 h-6 text-amber-400" />
                        ) : (
                          <img
                            src={file.url}
                            alt=""
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-mono text-stone-200 font-bold truncate">
                          {file.name}
                        </p>
                        <p className="text-[10px] font-mono text-stone-500">
                          {file.date} · {file.isRemote ? 'Supabase Storage' : 'DataURL Local'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-stone-900">
                      <button
                        onClick={() => handleCopy(file.url, 'du fichier')}
                        className="flex-1 py-1.5 px-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer border border-stone-800"
                      >
                        {copiedUrl === file.url ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier URL</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const updated = { ...localSettings, logoUrl: file.url };
                          setLocalSettings(updated);
                          onSaveSettings(updated);
                          syncSettingsToSupabase(updated);
                          onShowToast('Logo mis à jour avec ce fichier !');
                        }}
                        className="py-1.5 px-2.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 rounded-lg text-[10px] font-mono font-bold cursor-pointer border border-amber-400/30"
                        title="Définir comme Logo officiel"
                      >
                        En Logo
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB: DIAGNOSTIC & TERMINAL DE LOGS SUPABASE (Requested by user) */}
      {/* ========================================================================= */}
      {adminTab === 'debug' && (
        <div className="space-y-6">
          {/* Diagnostic Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
              <div>
                <h3 className="font-serif text-2xl font-bold text-stone-100 flex items-center gap-2.5">
                  <Terminal className="w-6 h-6 text-amber-400" />
                  <span>Diagnostic & État de Connexion Supabase</span>
                </h3>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Vérification en temps réel de la liaison avec votre base de données Supabase ({'https://mkcyrtehlhfouvqhfhxe.supabase.co'}).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunDiagnostic}
                  disabled={isTestingConn}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
                  <span>{isTestingConn ? 'Vérification...' : 'Lancer le Test de Connexion'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Table Status Badges */}
            {diagnosticResult && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Products</span>
                    {diagnosticResult.tables.products.ok ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold text-stone-100">
                    {diagnosticResult.tables.products.ok ? `${diagnosticResult.tables.products.count ?? 0} articles` : 'Non initialisé'}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Orders</span>
                    {diagnosticResult.tables.orders.ok ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold text-stone-100">
                    {diagnosticResult.tables.orders.ok ? `${diagnosticResult.tables.orders.count ?? 0} commandes` : 'Non initialisé'}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Settings</span>
                    {diagnosticResult.tables.settings.ok ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold text-stone-100">
                    {diagnosticResult.tables.settings.ok ? 'Logo & Banner OK' : 'Par défaut'}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Users</span>
                    {diagnosticResult.tables.users.ok ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold text-stone-100">
                    {diagnosticResult.tables.users.ok ? `${diagnosticResult.tables.users.count ?? 0} clients` : 'OK'}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Reviews</span>
                    {diagnosticResult.tables.reviews.ok ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <p className="font-mono text-xs font-bold text-stone-100">
                    {diagnosticResult.tables.reviews.ok ? `${diagnosticResult.tables.reviews.count ?? 0} avis` : 'OK'}
                  </p>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 mb-1">
                    <span>Latence</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="font-mono text-xs font-bold text-amber-400">
                    {diagnosticResult.latencyMs} ms
                  </p>
                </div>
              </div>
            )}

            {/* SQL Script Quick-Access Reminder */}
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono">
              <div className="space-y-1">
                <p className="text-amber-300 font-bold flex items-center gap-1.5">
                  <FileCode className="w-4 h-4" />
                  <span>Schéma SQL Supabase inclus dans le projet</span>
                </p>
                <p className="text-stone-400 text-[11px]">
                  Le fichier <strong className="text-stone-200">supabase-schema.sql</strong> est disponible à la racine du projet avec toutes les tables et politiques RLS pré-configurées.
                </p>
              </div>

              <button
                onClick={() => {
                  onShowToast('Schéma SQL prêt à être exécuté dans l\'éditeur Supabase !');
                }}
                className="px-3 py-1.5 bg-stone-800 text-stone-300 rounded-lg hover:bg-stone-700 text-[11px] cursor-pointer whitespace-nowrap"
              >
                supabase-schema.sql
              </button>
            </div>

            {/* Live Logs Terminal Console */}
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-300 font-bold">
                    Console des Logs en Direct ({filteredLogs.length})
                  </span>
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <button
                      onClick={() => setLogFilter('all')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        logFilter === 'all' ? 'bg-amber-400 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      TOUT
                    </button>
                    <button
                      onClick={() => setLogFilter('success')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        logFilter === 'success' ? 'bg-emerald-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      SUCCÈS
                    </button>
                    <button
                      onClick={() => setLogFilter('warn')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        logFilter === 'warn' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      AVIS
                    </button>
                    <button
                      onClick={() => setLogFilter('error')}
                      className={`px-2 py-0.5 rounded cursor-pointer ${
                        logFilter === 'error' ? 'bg-red-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      ERREURS
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const text = logs.map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
                      handleCopy(text, 'des logs');
                    }}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-mono flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copier les Logs</span>
                  </button>

                  <button
                    onClick={clearSupabaseLogs}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-[11px] font-mono cursor-pointer"
                  >
                    Vider
                  </button>
                </div>
              </div>

              {/* Terminal Box */}
              <div
                ref={logTerminalRef}
                className="h-80 bg-stone-950 border border-stone-800 rounded-2xl p-4 font-mono text-xs overflow-y-auto space-y-1.5 shadow-inner"
              >
                {filteredLogs.length === 0 ? (
                  <p className="text-stone-600 italic">Aucun événement enregistré.</p>
                ) : (
                  filteredLogs.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-stone-500 select-none text-[10px]">[{entry.timestamp}]</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1 rounded select-none ${
                          entry.level === 'success'
                            ? 'bg-emerald-950 text-emerald-400'
                            : entry.level === 'warn'
                            ? 'bg-amber-950 text-amber-400'
                            : entry.level === 'error'
                            ? 'bg-red-950 text-red-400'
                            : 'bg-stone-800 text-stone-400'
                        }`}
                      >
                        {entry.level}
                      </span>
                      <span
                        className={`break-all ${
                          entry.level === 'success'
                            ? 'text-emerald-300'
                            : entry.level === 'warn'
                            ? 'text-amber-300'
                            : entry.level === 'error'
                            ? 'text-red-300'
                            : 'text-stone-300'
                        }`}
                      >
                        {entry.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS MANAGEMENT (DEDICATED PAGE & ERGONOMIC LIST) */}
      {/* ========================================================================= */}
      {adminTab === 'products' && (
        <>
          {productSubView === 'editor' ? (
            <ProductEditor
              initialProduct={selectedProductForEdit}
              onSave={handleSaveProductFromEditor}
              onCancel={() => {
                setProductSubView('list');
                setSelectedProductForEdit(null);
              }}
              onUploadMedia={async (file, folder) => {
                const res = await uploadMediaToSupabase(file, folder);
                setUploadedFiles((prev) => [
                  { name: file.name, url: res.url, date: new Date().toLocaleTimeString('fr-FR'), isRemote: res.isRemote },
                  ...prev,
                ]);
                return res;
              }}
              onShowToast={onShowToast}
              isSubmitting={isSubmittingProduct}
            />
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Top Header Bar & Actions */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold text-stone-100">
                      Catalogue des Produits ({localProducts.length})
                    </h3>
                    {hasUnsavedChanges ? (
                      <span className="bg-amber-500/20 text-amber-400 text-[11px] font-mono px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Modifications en attente de publication</span>
                      </span>
                    ) : (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[11px] font-mono px-3 py-1 rounded-full border border-emerald-500/40 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Synchronisé avec Supabase</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-stone-400">
                    Gérez vos t-shirts avec une ergonomie claire. Cliquez sur "Ajouter un produit" ou "Modifier la fiche" pour accéder à la page dédiée (1 image principale, 2 photos galerie, 1 vidéo, prix et caractéristiques).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <button
                    onClick={handleOpenAddProduct}
                    className="flex-1 lg:flex-initial px-6 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-mono text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20 scale-[1.02]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ AJOUTER UN PRODUIT (PAGE DÉDIÉE)</span>
                  </button>

                  <button
                    onClick={handlePublishAll}
                    disabled={isPublishing}
                    className={`flex-1 lg:flex-initial px-6 py-3.5 rounded-xl font-mono text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      hasUnsavedChanges
                        ? 'bg-amber-400 text-stone-950 shadow-amber-500/20 animate-pulse'
                        : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700'
                    }`}
                  >
                    <Save className="w-4 h-4 text-amber-400" />
                    <span>{isPublishing ? 'PUBLICATION...' : '🚀 PUBLIER SUR SUPABASE'}</span>
                  </button>
                </div>
              </div>

              {/* Stats & Filtering Bar */}
              <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 space-y-4 shadow-lg">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-center">
                    <div className="text-xl font-serif font-black text-amber-400">{localProducts.length}</div>
                    <div className="text-[11px] font-mono text-stone-400 uppercase">Total Produits</div>
                  </div>
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-center">
                    <div className="text-xl font-serif font-black text-emerald-400">
                      {localProducts.filter((p) => p.inStock).length}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 uppercase">En Stock</div>
                  </div>
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-center">
                    <div className="text-xl font-serif font-black text-amber-300">
                      {localProducts.filter((p) => p.top).length}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 uppercase">Vedettes (Top)</div>
                  </div>
                  <div className="bg-stone-950 border border-stone-800 rounded-2xl p-3.5 text-center">
                    <div className="text-xl font-serif font-black text-indigo-400">
                      {localProducts.filter((p) => p.customisable).length}
                    </div>
                    <div className="text-[11px] font-mono text-stone-400 uppercase">Wisdom Lab</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  {/* Search bar */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, mot-clé ou description..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full bg-stone-950 text-stone-200 border border-stone-800 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                    {productSearchQuery && (
                      <button
                        onClick={() => setProductSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 font-mono text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 font-mono text-xs">
                    {[
                      { id: 'all', label: 'Toutes' },
                      { id: 'wisdom', label: 'Signature WISDOM' },
                      { id: 'neutre', label: 'Neutres' },
                      { id: 'perso', label: 'Wisdom Lab' },
                      { id: 'evenement', label: 'Événement' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setProductCategoryFilter(cat.id as any)}
                        className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          productCategoryFilter === cat.id
                            ? 'bg-amber-400 text-stone-950 font-bold shadow'
                            : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Cards List */}
              {(() => {
                const filtered = localProducts.filter((p) => {
                  const matchesSearch =
                    !productSearchQuery ||
                    p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    (p.keyword || '').toLowerCase().includes(productSearchQuery.toLowerCase()) ||
                    (p.description || '').toLowerCase().includes(productSearchQuery.toLowerCase());
                  const matchesCategory =
                    productCategoryFilter === 'all' || p.category === productCategoryFilter;
                  return matchesSearch && matchesCategory;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="bg-stone-900 border border-stone-800 rounded-3xl p-12 text-center space-y-4">
                      <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
                      <h4 className="font-serif text-xl font-bold text-stone-200">
                        Aucun produit ne correspond à votre filtre
                      </h4>
                      <p className="text-xs font-mono text-stone-400">
                        Essayez de réinitialiser la recherche ou ajoutez un nouveau produit.
                      </p>
                      <button
                        onClick={handleOpenAddProduct}
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter un nouveau produit</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-4">
                    {filtered.map((p) => {
                      const realIndex = localProducts.findIndex((lp) => lp.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className="bg-stone-900 border border-stone-800 hover:border-stone-700 transition-all rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 group"
                        >
                          {/* Media Preview & Details */}
                          <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
                            {/* Main Image Thumbnail */}
                            <div className="w-20 h-24 sm:w-24 sm:h-28 bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex-shrink-0 relative">
                              <img
                                src={p.image}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                referrerPolicy="no-referrer"
                              />
                              {p.badge && (
                                <span className="absolute top-1 left-1 bg-amber-400 text-stone-950 font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                                  {p.badge}
                                </span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700">
                                  {p.category === 'wisdom'
                                    ? 'Signature WISDOM'
                                    : p.category === 'neutre'
                                    ? 'Basique Neutre'
                                    : p.category === 'perso'
                                    ? 'Wisdom Lab'
                                    : 'Événementiel'}
                                </span>

                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                    p.inStock
                                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                  }`}
                                >
                                  {p.inStock ? '● En Stock' : '● Rupture'}
                                </span>

                                {p.top && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                                    ★ Top Vedette
                                  </span>
                                )}

                                {p.customisable && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                    🎨 Wisdom Lab
                                  </span>
                                )}
                              </div>

                              <h4 className="font-serif text-lg sm:text-xl font-bold text-stone-100 truncate">
                                {p.name}
                              </h4>

                              <div className="flex items-center gap-3 font-mono text-xs text-stone-400 flex-wrap">
                                <span className="font-serif text-base font-black text-amber-300">
                                  {Number(p.price).toLocaleString()} FCFA
                                </span>
                                <span className="text-stone-600">·</span>
                                <span className="flex items-center gap-1 text-[11px] text-stone-300">
                                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                                  <span>1 principale + {p.gallery?.length || 0}/2 galerie</span>
                                </span>
                                <span className="text-stone-600">·</span>
                                <span className="flex items-center gap-1 text-[11px]">
                                  <Film className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{p.videoUrl ? 'Vidéo active' : 'Pas de vidéo'}</span>
                                </span>
                              </div>

                              <p className="text-xs font-mono text-stone-400 line-clamp-1">
                                {p.description || 'Aucune description spécifiée.'}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-stone-800">
                            <button
                              onClick={() => handleOpenEditProduct(p)}
                              className="flex-1 md:flex-initial px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            >
                              <span>✏️ MODIFIER (PAGE DÉDIÉE)</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(realIndex)}
                              className="p-2.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-900/60 rounded-xl transition-colors cursor-pointer"
                              title="Supprimer définitivement ce produit"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Bottom Publish Bar */}
              <div className="bg-stone-900 border border-amber-400/40 rounded-3xl p-6 sm:p-8 mt-8 text-center space-y-4 shadow-2xl">
                <div className="max-w-xl mx-auto space-y-2">
                  <h4 className="font-serif text-xl font-bold text-stone-100 flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5 text-amber-400" />
                    <span>Synchroniser le catalogue sur Supabase & Boutique</span>
                  </h4>
                  <p className="text-xs font-mono text-stone-400">
                    Appliquez instantanément toutes vos modifications sur le serveur et chez tous les clients connectés.
                  </p>
                </div>

                <button
                  onClick={handlePublishAll}
                  disabled={isPublishing}
                  className={`w-full sm:w-auto px-8 py-4 rounded-2xl font-mono text-sm font-black transition-all cursor-pointer shadow-xl flex items-center justify-center gap-3 mx-auto ${
                    hasUnsavedChanges
                      ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:scale-105 text-stone-950 shadow-amber-500/25 ring-4 ring-amber-400/20'
                      : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  <span>
                    {isPublishing
                      ? 'PUBLICATION EN COURS...'
                      : '🚀 PUBLIER LES MODIFICATIONS SUR SUPABASE'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORDERS MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === 'orders' && (
        <div className="space-y-6">
          <h3 className="font-serif text-2xl font-bold text-stone-100 pb-4 border-b border-stone-800">
            Historique des commandes client ({orders.length})
          </h3>

          {orders.length === 0 ? (
            <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl">
              <p className="font-serif text-lg text-stone-300">Aucune commande enregistrée pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord.id} className="p-6 bg-stone-900 border border-stone-800 rounded-3xl space-y-3 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-800">
                    <div>
                      <span className="text-xs font-mono text-amber-400 font-bold">
                        COMMANDE #{ord.id}
                      </span>
                      <span className="text-xs font-mono text-stone-400 ml-3">
                        {new Date(ord.date).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-stone-950 text-stone-300 px-3 py-1 rounded-full border border-stone-800">
                        Moyen: {ord.method === 'fedapay' ? 'FedaPay Mobile Money' : 'WhatsApp Express'}
                      </span>

                      <select
                        value={ord.status}
                        onChange={(e) => handleOrderStatusChange(ord.id, e.target.value as any)}
                        className="bg-stone-950 text-amber-300 border border-stone-700 text-xs font-mono rounded-xl px-3 py-1 focus:outline-none"
                      >
                        <option value="en_attente">En attente</option>
                        <option value="en_cours">En cours de livraison</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div>
                      <p className="text-stone-400">Client: <strong className="text-stone-100">{ord.userName}</strong> ({ord.userEmail})</p>
                      <p className="text-stone-400">Téléphone: <strong className="text-stone-100">{ord.userPhone || 'N/A'}</strong></p>
                      <p className="text-stone-400">Adresse: <strong className="text-stone-100">{ord.deliveryAddress || 'Non spécifiée'}</strong> ({ord.userCity})</p>
                    </div>

                    <div>
                      <p className="text-stone-400 font-bold mb-1">Articles:</p>
                      <ul className="space-y-1">
                        {ord.items.map((it, i) => (
                          <li key={i} className="text-stone-200">
                            • {it.name} x{it.quantity} — {(it.price * it.quantity).toLocaleString('fr-FR')} FCFA
                          </li>
                        ))}
                      </ul>
                      <p className="font-serif font-black text-amber-300 text-base mt-2">
                        Total Final: {ord.total.toLocaleString('fr-FR')} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ALL REGISTERED USERS & ROLES MANAGEMENT */}
      {/* ========================================================================= */}
      {adminTab === 'users' && (() => {
        const totalAdmins = usersList.filter((u) => u.isAdmin || u.role === 'admin').length;
        const totalClients = usersList.length - totalAdmins;
        const usersWithOrders = usersList.filter((u) => getUserStats(u.email).orderCount > 0).length;

        const filteredUsers = usersList
          .filter((u) => {
            const q = userSearchQuery.toLowerCase().trim();
            const matchesSearch =
              !q ||
              (u.name && u.name.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q)) ||
              (u.phone && u.phone.toLowerCase().includes(q)) ||
              (u.city && u.city.toLowerCase().includes(q)) ||
              (u.address && u.address.toLowerCase().includes(q));

            const isAdmin = u.isAdmin === true || u.role === 'admin';
            const matchesRole =
              userRoleFilter === 'all' ||
              (userRoleFilter === 'admin' && isAdmin) ||
              (userRoleFilter === 'client' && !isAdmin);

            const stats = getUserStats(u.email);
            const matchesOrder =
              userOrderFilter === 'all' ||
              (userOrderFilter === 'with_orders' && stats.orderCount > 0) ||
              (userOrderFilter === 'no_orders' && stats.orderCount === 0);

            return matchesSearch && matchesRole && matchesOrder;
          })
          .sort((a, b) => {
            if (userSortBy === 'name') {
              return (a.name || '').localeCompare(b.name || '');
            }
            if (userSortBy === 'orders') {
              const statsA = getUserStats(a.email);
              const statsB = getUserStats(b.email);
              return statsB.orderCount - statsA.orderCount;
            }
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          });

        return (
          <div className="space-y-6">
            {/* Header Card with Fast Action Buttons */}
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-serif text-2xl font-bold text-stone-100 flex items-center gap-2">
                    <Users className="w-6 h-6 text-amber-400" />
                    <span>Tous les Utilisateurs Inscrits</span>
                  </h3>
                  <span className="bg-amber-500/20 text-amber-300 text-xs font-mono px-3 py-1 rounded-full border border-amber-500/30 font-bold">
                    {usersList.length} compte{usersList.length > 1 ? 's' : ''} au total
                  </span>
                </div>
                <p className="text-xs font-mono text-stone-400 mt-1">
                  Consultez, recherchez et gérez l'ensemble des comptes enregistrés sur la boutique WISDOM (Clients & Administrateurs).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Live Sync / Refresh button */}
                <button
                  onClick={handleRefreshUsers}
                  disabled={isRefreshingUsers}
                  className="px-3.5 py-2.5 bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Synchroniser la liste des utilisateurs depuis Supabase et le serveur"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshingUsers ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingUsers ? 'Actualisation...' : 'Actualiser'}</span>
                </button>

                {/* CSV Export button */}
                <button
                  onClick={handleExportUsersCSV}
                  className="px-3.5 py-2.5 bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-700 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                  title="Télécharger la liste complète au format CSV"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Exporter CSV</span>
                </button>

                {/* Create User button */}
                <button
                  onClick={() => setIsCreateUserModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nouveau Compte</span>
                </button>
              </div>
            </div>

            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                  <span>Total Inscrits</span>
                  <Users className="w-4 h-4 text-amber-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-stone-100">{usersList.length}</p>
                <p className="text-[10px] font-mono text-stone-500 mt-1">Tous les comptes actifs</p>
              </div>

              <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                  <span>Clients WISDOM</span>
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-emerald-400">{totalClients}</p>
                <p className="text-[10px] font-mono text-stone-500 mt-1">Comptes acheteurs standards</p>
              </div>

              <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                  <span>Administrateurs</span>
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-amber-400">{totalAdmins}</p>
                <p className="text-[10px] font-mono text-stone-500 mt-1">Accès gestion boutique</p>
              </div>

              <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
                <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1">
                  <span>Ayant Commandé</span>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                </div>
                <p className="font-serif text-2xl font-bold text-sky-400">{usersWithOrders}</p>
                <p className="text-[10px] font-mono text-stone-500 mt-1">Avec historique d'achat</p>
              </div>
            </div>

            {/* Search, Filter & Controls Bar */}
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, e-mail, téléphone, ville..."
                    className="w-full pl-10 pr-9 py-2.5 bg-stone-950 border border-stone-700 rounded-xl font-mono text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  {userSearchQuery && (
                    <button
                      onClick={() => setUserSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Role Filter Pills */}
                <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-mono">
                  <button
                    onClick={() => setUserRoleFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      userRoleFilter === 'all'
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Tous ({usersList.length})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('client')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      userRoleFilter === 'client'
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Clients ({totalClients})
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('admin')}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      userRoleFilter === 'admin'
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Admins ({totalAdmins})
                  </button>
                </div>
              </div>

              {/* Secondary Filters: Orders, Sort & View Mode */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-stone-400">
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Commandes :</span>
                  </div>
                  <select
                    value={userOrderFilter}
                    onChange={(e) => setUserOrderFilter(e.target.value as any)}
                    className="bg-stone-950 text-stone-200 border border-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    <option value="all">Tous les comptes</option>
                    <option value="with_orders">Avec commandes passées</option>
                    <option value="no_orders">Sans commande pour le moment</option>
                  </select>

                  <div className="flex items-center gap-1.5 text-stone-400 ml-2">
                    <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Trier par :</span>
                  </div>
                  <select
                    value={userSortBy}
                    onChange={(e) => setUserSortBy(e.target.value as any)}
                    className="bg-stone-950 text-stone-200 border border-stone-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-amber-400"
                  >
                    <option value="newest">Plus récents d'abord</option>
                    <option value="name">Nom (A - Z)</option>
                    <option value="orders">Nombre de commandes</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800">
                  <button
                    onClick={() => setUserViewMode('table')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      userViewMode === 'table' ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                    }`}
                    title="Vue Tableau structuré"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setUserViewMode('cards')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      userViewMode === 'cards' ? 'bg-amber-400 text-stone-950' : 'text-stone-400 hover:text-stone-200'
                    }`}
                    title="Vue Grille de fiches"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Users List Result */}
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center bg-stone-900 border border-stone-800 rounded-3xl space-y-3">
                <Users className="w-10 h-10 text-stone-600 mx-auto" />
                <p className="font-serif text-lg text-stone-300">Aucun utilisateur ne correspond à vos critères.</p>
                <p className="text-xs font-mono text-stone-500">
                  Essayez de modifier votre recherche ou réinitialisez les filtres.
                </p>
                {(userSearchQuery || userRoleFilter !== 'all' || userOrderFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setUserSearchQuery('');
                      setUserRoleFilter('all');
                      setUserOrderFilter('all');
                    }}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 rounded-xl font-mono text-xs font-bold cursor-pointer"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : userViewMode === 'table' ? (
              /* ================= TABLE VIEW ================= */
              <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-stone-950 text-stone-400 border-b border-stone-800 uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3.5 px-4 font-bold">Utilisateur</th>
                        <th className="py-3.5 px-4 font-bold">E-mail</th>
                        <th className="py-3.5 px-4 font-bold">Téléphone & Ville</th>
                        <th className="py-3.5 px-4 font-bold text-center">Rôle</th>
                        <th className="py-3.5 px-4 font-bold text-center">Commandes</th>
                        <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/80">
                      {filteredUsers.map((u, i) => {
                        const isAdmin = u.isAdmin || u.role === 'admin';
                        const stats = getUserStats(u.email);

                        return (
                          <tr
                            key={u.id || u.email || i}
                            className="hover:bg-stone-800/40 transition-colors"
                          >
                            {/* User name & avatar */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs font-mono flex-shrink-0 ${
                                    isAdmin
                                      ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-400/30 font-black'
                                      : 'bg-stone-800 text-stone-300 border border-stone-700'
                                  }`}
                                >
                                  {u.name?.slice(0, 2).toUpperCase() || 'US'}
                                </div>
                                <div>
                                  <p className="font-serif font-bold text-stone-100 text-sm">{u.name}</p>
                                  {u.createdAt ? (
                                    <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
                                      <Calendar className="w-3 h-3 text-stone-500" />
                                      <span>Inscrit le {new Date(u.createdAt).toLocaleDateString('fr-FR')}</span>
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-stone-500">Compte enregistré</p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Email with copy button */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-stone-300 select-all">{u.email}</span>
                                <button
                                  onClick={() => handleCopy(u.email, 'email')}
                                  className="text-stone-500 hover:text-amber-400 transition-colors p-1"
                                  title="Copier l'e-mail"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Phone & Location */}
                            <td className="py-3.5 px-4">
                              <div className="space-y-1">
                                {u.phone ? (
                                  <div className="flex items-center gap-2">
                                    <a
                                      href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
                                      title="Ouvrir discussion WhatsApp"
                                    >
                                      <MessageSquare className="w-3 h-3 text-emerald-400" />
                                      <span>{u.phone}</span>
                                    </a>
                                  </div>
                                ) : (
                                  <span className="text-stone-500 text-[11px]">—</span>
                                )}
                                {u.city && (
                                  <p className="text-[11px] text-stone-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-stone-500" />
                                    <span>{u.city}</span>
                                    {u.address && <span className="text-stone-500">({u.address})</span>}
                                  </p>
                                )}
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="py-3.5 px-4 text-center">
                              {isAdmin ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                  <Shield className="w-3 h-3 text-amber-400" />
                                  <span>ADMIN</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700">
                                  <Users className="w-3 h-3 text-stone-400" />
                                  <span>CLIENT</span>
                                </span>
                              )}
                            </td>

                            {/* Order count & total spent */}
                            <td className="py-3.5 px-4 text-center">
                              {stats.orderCount > 0 ? (
                                <div>
                                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                                    {stats.orderCount} commande{stats.orderCount > 1 ? 's' : ''}
                                  </span>
                                  <p className="text-[10px] text-stone-400 mt-0.5">
                                    {stats.totalSpent.toLocaleString('fr-FR')} FCFA
                                  </p>
                                </div>
                              ) : (
                                <span className="text-stone-500 text-[11px]">0 commande</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* View User details & orders */}
                                <button
                                  onClick={() => setSelectedUserForDetails(u)}
                                  className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                  title="Voir le profil complet et les commandes"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="hidden sm:inline">Détails</span>
                                </button>

                                {/* Promote / Demote */}
                                {isAdmin ? (
                                  <button
                                    onClick={() => handleDemoteUser(u.email)}
                                    className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 border border-stone-700 rounded-lg text-[11px] transition-colors cursor-pointer"
                                    title="Rétrograder en Client standard"
                                  >
                                    En Client
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handlePromoteUser(u.email)}
                                    className="px-2.5 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                    title="Promouvoir Administrateur"
                                  >
                                    <Shield className="w-3 h-3 text-amber-400" />
                                    <span>En Admin</span>
                                  </button>
                                )}

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteUser(u.email)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                                  title="Supprimer définitivement le compte"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ================= GRID / CARDS VIEW ================= */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((u, i) => {
                  const isAdmin = u.isAdmin || u.role === 'admin';
                  const stats = getUserStats(u.email);

                  return (
                    <div
                      key={u.id || u.email || i}
                      className={`p-5 bg-stone-900 border rounded-2xl flex flex-col justify-between gap-4 transition-all shadow-md ${
                        isAdmin ? 'border-amber-500/40 bg-stone-900/90' : 'border-stone-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm font-mono flex-shrink-0 ${
                              isAdmin
                                ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20 font-black'
                                : 'bg-stone-800 text-stone-300'
                            }`}
                          >
                            {u.name?.slice(0, 2).toUpperCase() || 'US'}
                          </div>
                          <div>
                            <h4 className="font-serif font-bold text-stone-100 text-base">{u.name}</h4>
                            <div className="flex items-center gap-1.5 text-xs font-mono text-stone-400">
                              <span>{u.email}</span>
                              <button
                                onClick={() => handleCopy(u.email, 'email')}
                                className="text-stone-500 hover:text-amber-400 transition-colors"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                            {u.phone && (
                              <p className="font-mono text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{u.phone}</span>
                              </p>
                            )}
                            {u.city && (
                              <p className="font-mono text-[11px] text-stone-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>{u.city}</span>
                                {u.address && <span>· {u.address}</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {isAdmin ? (
                            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full uppercase font-bold flex items-center gap-1">
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span>ADMIN</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700 px-2.5 py-1 rounded-full uppercase font-medium flex items-center gap-1">
                              <Users className="w-3 h-3 text-stone-400" />
                              <span>CLIENT</span>
                            </span>
                          )}

                          {stats.orderCount > 0 && (
                            <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                              {stats.orderCount} cmd ({stats.totalSpent.toLocaleString('fr-FR')} F)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions on User Card */}
                      <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2 text-xs font-mono">
                        <button
                          onClick={() => setSelectedUserForDetails(u)}
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Détails Profil</span>
                        </button>

                        <div className="flex items-center gap-2">
                          {isAdmin ? (
                            <button
                              onClick={() => handleDemoteUser(u.email)}
                              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-lg transition-colors cursor-pointer"
                            >
                              Rétrograder
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePromoteUser(u.email)}
                              className="px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1.5"
                            >
                              <Shield className="w-3.5 h-3.5 text-amber-400" />
                              <span>Promouvoir Admin</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteUser(u.email)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer le compte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* TAB 4: STORE SETTINGS */}
      {/* ========================================================================= */}
      {adminTab === 'settings' && (
        <div className="space-y-6 max-w-3xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8">
          <h3 className="font-serif text-2xl font-bold text-stone-100 pb-4 border-b border-stone-800">
            Réglages Généraux & Passerelles
          </h3>

          <div className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-stone-300 font-bold uppercase mb-1">
                Bandeau d'Annonce Supérieur (Texte déroulant)
              </label>
              <input
                type="text"
                value={localSettings.announcementText}
                onChange={(e) => setLocalSettings({ ...localSettings, announcementText: e.target.value })}
                className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Lien de Paiement FedaPay
                </label>
                <input
                  type="text"
                  value={localSettings.fedapayLink}
                  onChange={(e) => setLocalSettings({ ...localSettings, fedapayLink: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Numéro WhatsApp Commandes (Sans '+')
                </label>
                <input
                  type="text"
                  value={localSettings.whatsappNumber}
                  onChange={(e) => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Hero Banner / Background Section */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <label className="block text-stone-300 font-bold uppercase text-xs">
                Arrière-plan / Bannière de la page d'accueil (Fond Hero)
              </label>
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-32 h-20 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {localSettings.heroImageUrl ? (
                      <img
                        src={localSettings.heroImageUrl}
                        alt="Hero background preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-[10px] text-stone-500 font-mono">Fond par défaut</span>
                    )}
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <label className="inline-block px-3 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl font-mono text-xs font-bold cursor-pointer transition-colors">
                      📁 Téléverser une image de fond (PC/Mobile)
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          onShowToast('Téléversement de l\'arrière-plan en cours...');
                          try {
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              let finalUrl = base64;
                              try {
                                const res = await fetch('/api/upload-banner', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ dataUrl: base64 }),
                                });
                                if (res.ok) {
                                  const json = await res.json();
                                  if (json.imageUrl) finalUrl = json.imageUrl;
                                }
                              } catch (err) {}
                              const updated = { ...localSettings, heroImageUrl: finalUrl };
                              setLocalSettings(updated);
                              onSaveSettings(updated);
                              await syncSettingsToSupabase(updated);
                              onShowToast('✨ Arrière-plan mis à jour et synchronisé sur Supabase et le serveur !');
                            };
                            reader.readAsDataURL(file);
                          } catch (err: any) {
                            onShowToast(`Erreur: ${err.message}`);
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Ou collez une URL d'image directe (https://...)"
                        value={localSettings.heroImageUrl || ''}
                        onChange={(e) => setLocalSettings({ ...localSettings, heroImageUrl: e.target.value })}
                        className="flex-1 bg-stone-900 text-stone-200 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-amber-400"
                      />
                      {localSettings.heroImageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...localSettings, heroImageUrl: '' };
                            setLocalSettings(updated);
                            onSaveSettings(updated);
                            syncSettingsToSupabase(updated);
                            onShowToast('Arrière-plan réinitialisé');
                          }}
                          className="px-2 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] rounded-lg cursor-pointer"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-400">
                      L'arrière-plan sera automatiquement conservé sur tous les navigateurs et appareils.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Showcase Section Photos (Sleeve & Chest) */}
            <div className="pt-4 border-t border-stone-800 space-y-3">
              <label className="block text-stone-300 font-bold uppercase text-xs">
                Photos de Présentation Streetwear (Section Savoir-Faire / Certificats)
              </label>
              <p className="text-[11px] text-stone-400">
                Ces deux photos mettent en valeur les finitions (manche et poitrine) sur la page d'accueil. Seul l'administrateur peut les modifier.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Image Manche */}
                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase">1. Photo Manche (Écusson)</span>
                    {localSettings.showcaseSleeveImageUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...localSettings, showcaseSleeveImageUrl: '' };
                          setLocalSettings(updated);
                          onSaveSettings(updated);
                          await syncSettingsToSupabase(updated);
                          onShowToast('Photo manche réinitialisée par défaut');
                        }}
                        className="text-[10px] text-stone-400 hover:text-rose-400 font-mono underline cursor-pointer"
                      >
                        Par défaut
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-15 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {localSettings.showcaseSleeveImageUrl ? (
                        <img src={localSettings.showcaseSleeveImageUrl} alt="Aperçu manche" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-500 font-mono p-1 block text-center">Par défaut</span>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="inline-block px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors">
                        📁 Choisir une photo manche
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              let finalUrl = base64;

                              try {
                                const res = await fetch('/api/upload-showcase', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ dataUrl: base64, type: 'sleeve' }),
                                });
                                if (res.ok) {
                                  const json = await res.json();
                                  if (json.imageUrl) finalUrl = json.imageUrl;
                                }
                              } catch (err) {}

                              const updated = { ...localSettings, showcaseSleeveImageUrl: finalUrl };
                              setLocalSettings(updated);
                              onSaveSettings(updated);
                              await syncSettingsToSupabase(updated);
                              onShowToast('✅ Photo manche enregistrée dans la base de données !');
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ou URL image (https://...)"
                        value={localSettings.showcaseSleeveImageUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...localSettings, showcaseSleeveImageUrl: val };
                          setLocalSettings(updated);
                        }}
                        className="w-full bg-stone-900 text-stone-200 border border-stone-700 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Image Poitrine */}
                <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase">2. Photo Poitrine (Logo)</span>
                    {localSettings.showcaseChestImageUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = { ...localSettings, showcaseChestImageUrl: '' };
                          setLocalSettings(updated);
                          onSaveSettings(updated);
                          await syncSettingsToSupabase(updated);
                          onShowToast('Photo poitrine réinitialisée par défaut');
                        }}
                        className="text-[10px] text-stone-400 hover:text-rose-400 font-mono underline cursor-pointer"
                      >
                        Par défaut
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-24 h-15 bg-stone-900 border border-stone-800 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {localSettings.showcaseChestImageUrl ? (
                        <img src={localSettings.showcaseChestImageUrl} alt="Aperçu poitrine" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-stone-500 font-mono p-1 block text-center">Par défaut</span>
                      )}
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="inline-block px-3 py-1.5 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg font-mono text-[11px] font-bold cursor-pointer transition-colors">
                        📁 Choisir une photo poitrine
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = reader.result as string;
                              let finalUrl = base64;

                              try {
                                const res = await fetch('/api/upload-showcase', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ dataUrl: base64, type: 'chest' }),
                                });
                                if (res.ok) {
                                  const json = await res.json();
                                  if (json.imageUrl) finalUrl = json.imageUrl;
                                }
                              } catch (err) {}

                              const updated = { ...localSettings, showcaseChestImageUrl: finalUrl };
                              setLocalSettings(updated);
                              onSaveSettings(updated);
                              await syncSettingsToSupabase(updated);
                              onShowToast('✅ Photo poitrine enregistrée dans la base de données !');
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Ou URL image (https://...)"
                        value={localSettings.showcaseChestImageUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...localSettings, showcaseChestImageUrl: val };
                          setLocalSettings(updated);
                        }}
                        className="w-full bg-stone-900 text-stone-200 border border-stone-700 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Fees per City */}
            <div className="pt-4 border-t border-stone-800">
              <label className="block text-stone-300 font-bold uppercase mb-2 text-xs">
                Tarifs de Livraison par Ville (FCFA)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BENIN_CITIES.map((city) => (
                  <div key={city.name} className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                    <span className="text-[11px] text-stone-400 block truncate">{city.name}</span>
                    <input
                      type="number"
                      value={localSettings.deliveryFees?.[city.name] ?? city.fee}
                      onChange={(e) => {
                        const updatedFees = {
                          ...(localSettings.deliveryFees || {}),
                          [city.name]: Number(e.target.value),
                        };
                        setLocalSettings({ ...localSettings, deliveryFees: updatedFees });
                      }}
                      className="w-full bg-stone-900 text-amber-300 font-bold text-xs px-2 py-1 rounded border border-stone-700 mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                onSaveSettings(localSettings);
                syncSettingsToSupabase(localSettings);
                onShowToast('Réglages de la boutique enregistrés et synchronisés sur Supabase ✓');
              }}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20"
            >
              Enregistrer tous les réglages
            </button>
          </div>
        </div>
      )}



      {/* ========================================================================= */}
      {/* MODAL 2: CREATE USER ACCOUNT (SUPABASE AUTH & ROLES) */}
      {/* ========================================================================= */}
      {isCreateUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif text-xl font-bold text-stone-100">
                  Créer un Compte Supabase
                </h3>
              </div>
              <button
                onClick={() => setIsCreateUserModalOpen(false)}
                className="text-stone-400 hover:text-stone-100 text-xl font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Nom Complet *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean Kouassi"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Adresse E-mail *
                </label>
                <input
                  type="email"
                  required
                  placeholder="client@exemple.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Mot de Passe * (min. 6 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-300 font-bold uppercase mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    placeholder="97000000"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-stone-300 font-bold uppercase mb-1">
                    Ville
                  </label>
                  <select
                    value={newUserForm.city}
                    onChange={(e) => setNewUserForm({ ...newUserForm, city: e.target.value })}
                    className="w-full bg-stone-950 text-stone-200 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                  >
                    {BENIN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-300 font-bold uppercase mb-1">
                  Adresse de livraison (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Quartier, rue, repère..."
                  value={newUserForm.address}
                  onChange={(e) => setNewUserForm({ ...newUserForm, address: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Admin Checkbox */}
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-stone-200 font-bold">
                  <input
                    type="checkbox"
                    checked={newUserForm.isAdmin}
                    onChange={(e) => setNewUserForm({ ...newUserForm, isAdmin: e.target.checked })}
                    className="rounded accent-amber-400"
                  />
                  <span>Attribuer le Rôle Administrateur (Admin Portal)</span>
                </label>
                <p className="text-[10px] text-stone-500 mt-1 pl-5">
                  L'utilisateur aura accès à toutes les fonctions de gestion du magasin.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setIsCreateUserModalOpen(false)}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-400/20"
                >
                  <Users className="w-4 h-4" />
                  <span>{isSubmittingUser ? 'Création...' : '👤 Créer le Compte'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: USER FULL DETAILS & ORDER HISTORY MODAL */}
      {/* ========================================================================= */}
      {selectedUserForDetails && (() => {
        const u = selectedUserForDetails;
        const isAdmin = u.isAdmin || u.role === 'admin';
        const stats = getUserStats(u.email);

        return (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-stone-800">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base font-mono flex-shrink-0 ${
                      isAdmin
                        ? 'bg-amber-400 text-stone-950 ring-4 ring-amber-400/20 font-black'
                        : 'bg-stone-800 text-stone-200 border border-stone-700'
                    }`}
                  >
                    {u.name?.slice(0, 2).toUpperCase() || 'US'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-xl font-bold text-stone-100">{u.name}</h3>
                      {isAdmin ? (
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase font-bold flex items-center gap-1">
                          <Shield className="w-3 h-3 text-amber-400" />
                          <span>ADMINISTRATEUR</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono bg-stone-800 text-stone-300 border border-stone-700 px-2.5 py-0.5 rounded-full uppercase font-medium flex items-center gap-1">
                          <Users className="w-3 h-3 text-stone-400" />
                          <span>CLIENT STANDARD</span>
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-xs text-stone-400">{u.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUserForDetails(null)}
                  className="text-stone-400 hover:text-stone-100 text-xl font-mono cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Identifiant / ID</span>
                  <p className="text-stone-200 truncate select-all">{u.id || 'ID Local / Supabase'}</p>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Date d'inscription</span>
                  <p className="text-stone-200">
                    {u.createdAt ? new Date(u.createdAt).toLocaleString('fr-FR') : 'Enregistré sur la boutique'}
                  </p>
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Téléphone & WhatsApp</span>
                  {u.phone ? (
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-bold">{u.phone}</span>
                      <a
                        href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${u.name}, nous vous contactons depuis la boutique WISDOM.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors"
                        title="Ouvrir WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <p className="text-stone-500">Non renseigné</p>
                  )}
                </div>

                <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-1">
                  <span className="text-stone-500 text-[10px] uppercase font-bold">Localisation & Livraison</span>
                  <p className="text-stone-200">
                    {u.city || 'Cotonou'} {u.address ? `· ${u.address}` : ''}
                  </p>
                </div>
              </div>

              {/* Fast Contact Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {u.phone && (
                  <a
                    href={`https://wa.me/${u.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Bonjour ${u.name}, nous vous contactons depuis la boutique WISDOM.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Contacter sur WhatsApp</span>
                  </a>
                )}
                {u.phone && (
                  <a
                    href={`tel:${u.phone}`}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Appeler ({u.phone})</span>
                  </a>
                )}
                <button
                  onClick={() => handleCopy(u.email, 'email')}
                  className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copier E-mail</span>
                </button>
              </div>

              {/* Order History Section */}
              <div className="space-y-3 pt-4 border-t border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <h4 className="font-serif font-bold text-stone-100 text-base">
                      Historique des Commandes ({stats.orderCount})
                    </h4>
                  </div>
                  <span className="font-mono text-xs text-amber-400 font-bold">
                    Total dépensé : {stats.totalSpent.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>

                {stats.orderCount === 0 ? (
                  <div className="p-6 text-center bg-stone-950 border border-stone-800 rounded-2xl">
                    <p className="text-xs font-mono text-stone-500">
                      Cet utilisateur n'a pas encore validé de commande.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {stats.orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3.5 bg-stone-950 border border-stone-800 rounded-xl text-xs font-mono space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-stone-200">Commande #{ord.id.slice(0, 8)}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'Livrée'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                : ord.status === 'Payée' || ord.status === 'En préparation'
                                ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                : 'bg-stone-800 text-stone-400 border border-stone-700'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <p className="text-stone-500 text-[10px]">
                          {new Date(ord.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                        <div className="text-stone-300 text-[11px]">
                          {ord.items?.map((it, idx) => (
                            <span key={idx}>
                              {it.name} (x{it.quantity})
                              {idx < (ord.items?.length || 0) - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                        <div className="text-right pt-1 font-bold text-amber-400">
                          {ord.total?.toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-800">
                <div>
                  {isAdmin ? (
                    <button
                      onClick={() => {
                        handleDemoteUser(u.email);
                        setSelectedUserForDetails({ ...u, isAdmin: false, role: 'client' });
                      }}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 rounded-xl font-mono text-xs transition-colors cursor-pointer"
                    >
                      Rétrograder en Client
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handlePromoteUser(u.email);
                        setSelectedUserForDetails({ ...u, isAdmin: true, role: 'admin' });
                      }}
                      className="px-3 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span>Promouvoir Administrateur</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleDeleteUser(u.email);
                      setSelectedUserForDetails(null);
                    }}
                    className="px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-500/30 rounded-xl font-mono text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>

                  <button
                    onClick={() => setSelectedUserForDetails(null)}
                    className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl font-mono text-xs font-bold cursor-pointer"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 4: CONFIRM PRODUCT DELETION MODAL (100% Reliable & Non-Blocking) */}
      {/* ========================================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-500/30 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-stone-100">Supprimer le produit ?</h3>
                <p className="text-xs font-mono text-stone-400">Action irréversible</p>
              </div>
            </div>

            {/* Product Summary Card */}
            <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 flex items-center gap-4">
              <img
                src={productToDelete.product.image || '/assets/images/wisdom_black_shirt_1786398483035.jpg'}
                alt={productToDelete.product.name}
                className="w-16 h-16 rounded-xl object-cover border border-stone-800 flex-shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-sm font-bold text-stone-100 truncate">
                  {productToDelete.product.name}
                </h4>
                <p className="text-xs font-mono text-amber-400 font-bold mt-0.5">
                  {productToDelete.product.price?.toLocaleString('fr-FR')} FCFA
                </p>
                <span className="inline-block mt-1 text-[10px] font-mono bg-stone-800 text-stone-300 px-2 py-0.5 rounded uppercase">
                  Catégorie : {productToDelete.product.category}
                </span>
              </div>
            </div>

            <p className="text-xs font-mono text-stone-300 leading-relaxed">
              Ce produit sera retiré du catalogue en ligne et effacé définitivement de la base de données Supabase.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeletingProduct}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-mono text-xs cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                disabled={isDeletingProduct}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-red-600/30"
              >
                {isDeletingProduct ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                <span>{isDeletingProduct ? 'Suppression...' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM USER DELETION MODAL */}
      {/* ========================================================================= */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-2xl">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-100">Supprimer l'utilisateur ?</h3>
                <p className="text-xs font-mono text-stone-400">{userToDelete}</p>
              </div>
            </div>

            <p className="text-xs font-mono text-stone-300 leading-relaxed">
              Êtes-vous sûr de vouloir supprimer définitivement ce compte de la base de données Supabase ?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-mono text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-red-600/30"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer le compte</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CONFIRM USER DEMOTE MODAL */}
      {/* ========================================================================= */}
      {userToDemote && (
        <div className="fixed inset-0 z-50 bg-stone-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-stone-100">Rétrograder en Client ?</h3>
                <p className="text-xs font-mono text-stone-400">{userToDemote}</p>
              </div>
            </div>

            <p className="text-xs font-mono text-stone-300 leading-relaxed">
              Cet utilisateur perdra immédiatement ses privilèges d'administrateur et deviendra un client standard.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setUserToDemote(null)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl font-mono text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDemoteUser}
                className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-xl font-mono text-xs font-bold cursor-pointer shadow-lg shadow-amber-400/20"
              >
                Confirmer la rétrogradation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
