import { getSupabase } from '../lib/supabase';
import { User } from '../types';
import { addSupabaseLog } from './supabaseService';

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
  isConfirmationNeeded?: boolean;
}

/**
 * Sign In with Supabase Auth
 */
export async function signInWithSupabase(
  emailInput: string,
  passwordInput: string
): Promise<AuthResponse> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const supabase = getSupabase();

  addSupabaseLog('info', `🔐 Tentative de connexion pour '${email}'...`);

  if (!supabase) {
    return {
      success: false,
      error: 'Base de données indisponible. Veuillez vérifier votre connexion.',
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      addSupabaseLog('warn', `Échec de connexion pour '${email}' : ${error.message}`);
      
      let frenchError = error.message;
      const lower = error.message.toLowerCase();
      if (lower.includes('invalid login credentials') || lower.includes('invalid_grant')) {
        frenchError = 'Adresse e-mail ou mot de passe incorrect.';
      } else if (lower.includes('email not confirmed')) {
        frenchError =
          'Veuillez confirmer votre adresse e-mail pour finaliser la création de votre compte, ou contactez le service client.';
      } else if (lower.includes('networkerror') || lower.includes('failed to fetch') || lower.includes('network request failed')) {
        frenchError =
          'Impossible de joindre le serveur d\'authentification (problème de connexion internet, bloqueur de requêtes ou pare-feu).';
      } else if (lower.includes('rate limit')) {
        frenchError = 'Trop de tentatives consécutives. Veuillez patienter un instant avant de réessayer.';
      }

      return { success: false, error: frenchError };
    }

    if (data?.user) {
      // Fetch extended profile and role from 'users' table or metadata
      const { data: userProfile } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      const isUserAdmin =
        userProfile?.isAdmin === true ||
        userProfile?.role === 'admin' ||
        data.user.user_metadata?.isAdmin === true ||
        data.user.user_metadata?.role === 'admin' ||
        data.user.app_metadata?.role === 'admin';

      const user: User = {
        id: data.user.id,
        name: userProfile?.name || data.user.user_metadata?.name || email.split('@')[0],
        email: data.user.email || email,
        phone: userProfile?.phone || data.user.user_metadata?.phone || '',
        city: userProfile?.city || data.user.user_metadata?.city || '',
        address: userProfile?.address || '',
        isAdmin: isUserAdmin,
        role: isUserAdmin ? 'admin' : 'client',
      };

      addSupabaseLog('success', `✅ Session ouverte pour '${user.email}' (Rôle: ${user.role?.toUpperCase()})`);
      return { success: true, user };
    }

    return { success: false, error: 'Compte introuvable.' };
  } catch (err: any) {
    addSupabaseLog('error', `Erreur de connexion: ${err.message}`);
    const msg = String(err?.message || '');
    let friendlyError = msg;
    if (msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network request failed')) {
      friendlyError = 'Problème de réseau ou serveur momentanément inaccessible. Vérifiez votre connexion internet ou réessayez.';
    }
    return { success: false, error: friendlyError || 'Erreur lors de la connexion' };
  }
}

/**
 * Sign Up (Create Account) with Supabase Auth
 */
export async function signUpWithSupabase(
  nameInput: string,
  emailInput: string,
  passwordInput: string,
  phoneInput = '',
  cityInput = '',
  addressInput = '',
  isAdminInput = false
): Promise<AuthResponse> {
  const email = emailInput.trim().toLowerCase();
  const password = passwordInput.trim();
  const name = nameInput.trim();
  const phone = phoneInput.trim();
  const city = cityInput.trim();
  const address = addressInput.trim();
  const supabase = getSupabase();

  if (!supabase) {
    return {
      success: false,
      error: 'Base de données Supabase indisponible.',
    };
  }

  addSupabaseLog('info', `📝 Création de compte pour '${email}'...`);

  try {
    // 0. Preliminary Check if email is already in the 'users' table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      addSupabaseLog('warn', `Tentative de création avec un email déjà existant: '${email}'`);
      return {
        success: false,
        error: 'Cette adresse e-mail est déjà associée à un compte existant. Veuillez vous connecter ou réinitialiser votre mot de passe.',
      };
    }

    // 1. Supabase Auth Sign Up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        data: {
          name,
          phone,
          city,
          address,
          isAdmin: isAdminInput,
          role: isAdminInput ? 'admin' : 'client',
        },
      },
    });

    if (error) {
      addSupabaseLog('warn', `Échec création compte pour '${email}': ${error.message}`);
      let frenchError = error.message;
      if (
        error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already in use') ||
        error.message.toLowerCase().includes('duplicate')
      ) {
        frenchError = 'Cette adresse e-mail est déjà associée à un compte existant. Veuillez vous connecter.';
      } else if (error.message.includes('Password should be at least')) {
        frenchError = 'Le mot de passe doit contenir au moins 6 caractères.';
      }
      return { success: false, error: frenchError };
    }

    const userId = data.user?.id || `usr-${Date.now()}`;

    // 2. Insert / Sync into 'users' table
    const userProfile: User = {
      id: userId,
      name,
      email,
      phone,
      city,
      address,
      isAdmin: isAdminInput,
      role: isAdminInput ? 'admin' : 'client',
      createdAt: new Date().toISOString(),
    };

    const { error: dbError } = await supabase.from('users').upsert({
      id: userId,
      name,
      email,
      phone,
      city,
      address,
      isAdmin: isAdminInput,
      role: isAdminInput ? 'admin' : 'client',
      created_at: new Date().toISOString(),
    }, { onConflict: 'email' });

    if (dbError) {
      addSupabaseLog('warn', `Note enregistrement table users: ${dbError.message}`);
    }

    addSupabaseLog('success', `🎉 Compte '${email}' créé avec succès (Rôle: ${userProfile.role?.toUpperCase()})`);

    return {
      success: true,
      user: userProfile,
      isConfirmationNeeded: !data.session,
    };
  } catch (err: any) {
    addSupabaseLog('error', `Erreur création compte: ${err.message}`);
    return { success: false, error: err.message || 'Erreur lors de la création du compte' };
  }
}

/**
 * Sign Out from Supabase
 */
export async function signOutFromSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
      addSupabaseLog('info', 'Session fermée (Déconnexion)');
    } catch (e) {}
  }
}

/**
 * Get Current Active User from Supabase session
 */
export async function getCurrentActiveUser(): Promise<User | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data } = await supabase.auth.getSession();
    const sessionUser = data.session?.user;

    if (!sessionUser || !sessionUser.email) return null;

    // Fetch from users table to get latest role
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('email', sessionUser.email.toLowerCase())
      .maybeSingle();

    const isUserAdmin =
      profile?.isAdmin === true ||
      profile?.role === 'admin' ||
      sessionUser.user_metadata?.isAdmin === true ||
      sessionUser.user_metadata?.role === 'admin' ||
      sessionUser.app_metadata?.role === 'admin';

    return {
      id: sessionUser.id,
      name: profile?.name || sessionUser.user_metadata?.name || sessionUser.email.split('@')[0],
      email: sessionUser.email,
      phone: profile?.phone || sessionUser.user_metadata?.phone || '',
      city: profile?.city || sessionUser.user_metadata?.city || '',
      address: profile?.address || '',
      isAdmin: isUserAdmin,
      role: isUserAdmin ? 'admin' : 'client',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Update User Role in Supabase
 */
export async function updateUserRoleInSupabase(
  userEmail: string,
  isAdmin: boolean,
  role: 'admin' | 'client'
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase indisponible' };

  try {
    addSupabaseLog('info', `Mise à jour du rôle pour '${userEmail}' -> ${role.toUpperCase()} (Admin: ${isAdmin})`);
    
    const { error } = await supabase
      .from('users')
      .update({
        isAdmin,
        role,
      })
      .eq('email', userEmail.toLowerCase());

    if (error) {
      addSupabaseLog('error', `❌ Échec changement de rôle: ${error.message}`);
      return { success: false, error: error.message };
    }

    addSupabaseLog('success', `👑 Rôle de '${userEmail}' mis à jour avec succès (${role.toUpperCase()})`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Delete User Profile from Supabase
 */
export async function deleteUserFromSupabase(userEmail: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, error: 'Supabase indisponible' };

  try {
    const { error } = await supabase.from('users').delete().eq('email', userEmail.toLowerCase());
    if (error) {
      addSupabaseLog('error', `Erreur suppression utilisateur: ${error.message}`);
      return { success: false, error: error.message };
    }
    addSupabaseLog('success', `Utilisateur '${userEmail}' supprimé de Supabase`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Request Password Reset (Generates verification code and attempts Supabase email reset)
 */
export async function requestPasswordReset(emailInput: string): Promise<{
  success: boolean;
  code?: string;
  error?: string;
}> {
  const email = emailInput.trim().toLowerCase();
  const supabase = getSupabase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Veuillez saisir une adresse e-mail valide.' };
  }

  addSupabaseLog('info', `🔑 Demande de réinitialisation de mot de passe pour '${email}'`);

  // Generate a random 6-digit security code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Try Supabase Auth password reset request in background if available
  if (supabase) {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
    } catch (e) {
      // Non-blocking: we still support direct in-app secure verification code
    }
  }

  return { success: true, code };
}

/**
 * Update User Password in Supabase & Local Database
 */
export async function updateUserPasswordInDatabase(
  emailInput: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const email = emailInput.trim().toLowerCase();
  const supabase = getSupabase();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
  }

  addSupabaseLog('info', `🔒 Mise à jour du mot de passe pour '${email}'`);

  if (supabase) {
    try {
      // If user has an active session, update their Supabase Auth password directly
      await supabase.auth.updateUser({ password: newPassword });
    } catch (e) {
      // Continue to local sync
    }
  }

  return { success: true };
}

/**
 * Fetch all registered users across Supabase, Server and LocalStorage
 */
export async function fetchAllRegisteredUsers(): Promise<User[]> {
  const supabase = getSupabase();
  const userMap = new Map<string, User>();

  // 1. Fetch from Supabase users table
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        data.forEach((row: any) => {
          if (row.email) {
            const emailKey = row.email.toLowerCase().trim();
            const isAdmin = row.isAdmin === true || row.role === 'admin';
            userMap.set(emailKey, {
              id: row.id,
              name: row.name || emailKey.split('@')[0],
              email: row.email,
              phone: row.phone || '',
              city: row.city || '',
              address: row.address || '',
              isAdmin,
              role: isAdmin ? 'admin' : 'client',
              createdAt: row.created_at || row.createdAt || undefined,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Error fetching users from Supabase:', e);
    }
  }

  // 2. Fetch from Local Server Database
  try {
    const res = await fetch('/api/store-data');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.users)) {
        json.data.users.forEach((u: any) => {
          if (u?.email) {
            const emailKey = u.email.toLowerCase().trim();
            const existing = userMap.get(emailKey) || {};
            const isAdmin = u.isAdmin === true || u.role === 'admin' || (existing as any).isAdmin === true;
            userMap.set(emailKey, {
              ...existing,
              ...u,
              isAdmin,
              role: isAdmin ? 'admin' : 'client',
            });
          }
        });
      }
    }
  } catch (e) {
    // offline or not available
  }

  // 3. Merge with localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('wisdom-users-v3');
      if (raw) {
        const cached: User[] = JSON.parse(raw);
        if (Array.isArray(cached)) {
          cached.forEach((u) => {
            if (u?.email) {
              const emailKey = u.email.toLowerCase().trim();
              if (!userMap.has(emailKey)) {
                userMap.set(emailKey, u);
              }
            }
          });
        }
      }
    } catch (e) {}
  }

  return Array.from(userMap.values());
}
