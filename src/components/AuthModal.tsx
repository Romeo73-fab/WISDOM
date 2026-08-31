import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  Loader2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { User } from '../types';
import { BENIN_CITIES } from '../data/initialData';
import {
  signInWithSupabase,
  signUpWithSupabase,
  requestPasswordReset,
  updateUserPasswordInDatabase,
} from '../utils/supabaseAuthService';
import { sha256 } from '../utils/storage';
import { LogoImage } from './LogoImage';

interface AuthModalProps {
  isOpen: boolean;
  logoUrl?: string;
  usersList: User[];
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onRegisterUser: (newUser: User) => void;
  onUpdateUsersList?: (updatedUsers: User[]) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  logoUrl,
  usersList,
  onClose,
  onLoginSuccess,
  onRegisterUser,
  onUpdateUsersList,
}) => {
  if (!isOpen) return null;

  const [tab, setTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState(BENIN_CITIES[0].name);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailAlreadyExists, setEmailAlreadyExists] = useState(false);

  // Show/hide passwords
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password Recovery state
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify'>('request');
  const [generatedCode, setGeneratedCode] = useState('');
  const [inputCode, setInputCode] = useState('');

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setEmailAlreadyExists(false);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setErrorMsg('Veuillez renseigner votre adresse e-mail et votre mot de passe.');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide (ex: exemple@email.com).');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Try Supabase Auth Login
      let authRes: any = null;
      try {
        authRes = await signInWithSupabase(cleanEmail, password);
        if (authRes?.success && authRes.user) {
          onLoginSuccess(authRes.user);
          onClose();
          return;
        }
      } catch (sbErr) {
        console.warn('Supabase sign in network exception, trying local fallback:', sbErr);
      }

      // 2. Fallback to local users list if offline, blocked, or local user
      const enteredHash = await sha256(password);
      const found = usersList.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail &&
          (u.passwordHash === enteredHash || u.passwordHash === password.trim() || !u.passwordHash)
      );

      if (found) {
        onLoginSuccess(found);
        onClose();
        return;
      }

      // 3. User-friendly message for clients (no technical raw network jargon)
      if (authRes?.error && !authRes.error.toLowerCase().includes('networkerror') && !authRes.error.toLowerCase().includes('fetch')) {
        setErrorMsg(authRes.error);
      } else {
        setErrorMsg('Adresse e-mail ou mot de passe incorrect. Veuillez vérifier vos identifiants.');
      }
    } catch (err: any) {
      setErrorMsg('Adresse e-mail ou mot de passe incorrect.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setEmailAlreadyExists(false);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMsg('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide sous le format normal (ex: exemple@email.com).');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    // 🔒 STRICT CHECK: An email cannot be used twice to create an account
    const existingLocal = usersList.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existingLocal) {
      setEmailAlreadyExists(true);
      setErrorMsg(
        'Cette adresse e-mail est déjà utilisée pour un compte existant. Vous ne pouvez pas créer deux comptes avec le même e-mail.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // Create account in Supabase Auth and database
      const res = await signUpWithSupabase(
        cleanName,
        cleanEmail,
        password,
        phone.trim(),
        city,
        '',
        false
      );

      if (res.success && res.user) {
        onRegisterUser(res.user);
        onLoginSuccess(res.user);
        onClose();
      } else {
        const errorText = res.error || 'Impossible de créer le compte.';
        if (
          errorText.toLowerCase().includes('déjà') ||
          errorText.toLowerCase().includes('already') ||
          errorText.toLowerCase().includes('existe')
        ) {
          setEmailAlreadyExists(true);
        }
        setErrorMsg(errorText);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setErrorMsg('Veuillez saisir une adresse e-mail valide au format normal (ex: exemple@email.com).');
      return;
    }

    setIsLoading(true);

    try {
      const res = await requestPasswordReset(cleanEmail);
      if (res.success && res.code) {
        setGeneratedCode(res.code);
        setRecoveryStep('verify');
        setInfoMsg(`Code de sécurité généré pour ${cleanEmail} : ${res.code}`);
      } else {
        setErrorMsg(res.error || 'Impossible de générer le code de sécurité.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la demande de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (inputCode.trim() !== generatedCode.trim()) {
      setErrorMsg('Le code de sécurité à 6 chiffres saisi est incorrect.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const newHash = await sha256(newPassword);

      // 1. Update in local user list if found
      const userIndex = usersList.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (userIndex !== -1) {
        const updatedUsers = [...usersList];
        updatedUsers[userIndex] = {
          ...updatedUsers[userIndex],
          passwordHash: newHash,
        };

        if (onUpdateUsersList) {
          onUpdateUsersList(updatedUsers);
        }
      }

      // 2. Update in database
      await updateUserPasswordInDatabase(cleanEmail, newPassword);

      // Set password in login field ready to connect
      setPassword(newPassword);
      setInfoMsg('✅ Votre mot de passe a été modifié avec succès ! Vous pouvez maintenant vous connecter.');
      setRecoveryStep('request');
      setInputCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTab('login');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors du changement de mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-stone-950/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 z-10 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Logo Header */}
        <div className="flex flex-col items-center justify-center mb-5 pt-1">
          <LogoImage
            src={logoUrl}
            alt="WISDOM"
            className="h-10 sm:h-11 w-auto max-w-[200px] object-contain drop-shadow-md mb-2"
          />
          <div className="text-[11px] font-mono text-amber-400 uppercase tracking-widest font-semibold text-center">
            <span>
              {tab === 'login'
                ? 'Connexion Compte Client'
                : tab === 'signup'
                ? 'Création de Compte Client'
                : 'Changement de Mot de Passe'}
            </span>
          </div>
        </div>

        {/* Navigation Tab Buttons */}
        <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 mb-6">
          <button
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setInfoMsg('');
              setEmailAlreadyExists(false);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setErrorMsg('');
              setInfoMsg('');
              setEmailAlreadyExists(false);
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'signup'
                ? 'bg-amber-400 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Créer un compte
          </button>
        </div>

        {/* Error Notification with Duplicate Email quick switch */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-red-950/60 border border-red-800 text-red-300 rounded-2xl text-xs font-mono space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>

            {emailAlreadyExists && (
              <div className="pt-2 border-t border-red-900/60 flex items-center justify-between gap-2">
                <span className="text-[11px] text-stone-300">Vous avez déjà un compte ?</span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setErrorMsg('');
                    setEmailAlreadyExists(false);
                  }}
                  className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg text-[11px] font-mono cursor-pointer transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Se connecter</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info / Success Notification */}
        {infoMsg && (
          <div className="mb-4 p-3.5 bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 rounded-2xl text-xs font-mono flex items-start gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{infoMsg}</p>
          </div>
        )}

        {/* 1. LOGIN TAB */}
        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Adresse E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono mt-2.5">
                <span className="text-stone-400">Mot de passe oublié ?</span>
                <button
                  type="button"
                  onClick={() => {
                    setTab('forgot');
                    setRecoveryStep('request');
                    setErrorMsg('');
                    setInfoMsg('');
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer transition-colors"
                >
                  Changer le mot de passe →
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <span>Se connecter</span>
              )}
            </button>
          </form>
        ) : tab === 'signup' ? (
          /* 2. SIGNUP TAB */
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Nom complet *
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Entrez votre nom et prénom"
                  required
                  autoComplete="name"
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Adresse E-mail *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailAlreadyExists) setEmailAlreadyExists(false);
                  }}
                  placeholder="exemple@email.com"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <p className="text-[10px] font-mono text-stone-400 mt-1">
                Chaque compte doit avoir une adresse e-mail unique.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                  Téléphone
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+229 90000000"
                    className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-8 pr-2 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                  Ville (Bénin)
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-8 pr-2 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    {BENIN_CITIES.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Mot de passe * (min 6 caractères)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Création du compte...</span>
                </>
              ) : (
                <span>Créer mon compte</span>
              )}
            </button>
          </form>
        ) : recoveryStep === 'request' ? (
          /* 3. FORGOT PASSWORD - STEP 1 (REQUEST) */
          <form onSubmit={handleSendRecoveryCode} className="space-y-4">
            <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
                <KeyRound className="w-4 h-4" />
                <span>Changer votre mot de passe</span>
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed font-mono">
                Entrez votre adresse e-mail pour générer un code de sécurité à 6 chiffres et créer un nouveau mot de passe.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Votre Adresse E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemple@email.com"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération du code...</span>
                </>
              ) : (
                <span>Générer le code de sécurité</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-xs font-mono text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Retour à la connexion
              </button>
            </div>
          </form>
        ) : (
          /* 4. FORGOT PASSWORD - STEP 2 (VERIFY & SET NEW PASSWORD) */
          <form onSubmit={handleConfirmResetPassword} className="space-y-4">
            <div className="p-4 bg-stone-950 border border-amber-500/40 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Code de sécurité généré</span>
                </div>
                <button
                  type="button"
                  onClick={() => setInputCode(generatedCode)}
                  className="text-[10px] font-mono text-amber-300 underline font-bold hover:text-amber-200 cursor-pointer"
                >
                  Remplir automatiquement
                </button>
              </div>
              <div className="p-2.5 bg-stone-900 border border-stone-800 rounded-xl flex items-center justify-between">
                <span className="text-xs font-mono text-stone-400">Votre code :</span>
                <span className="font-mono text-base font-black text-amber-300 tracking-widest bg-stone-950 px-3 py-0.5 rounded-lg border border-amber-400/30">
                  {generatedCode}
                </span>
              </div>
              <p className="text-[10px] font-mono text-stone-400">
                Saisissez ce code ci-dessous et définissez votre nouveau mot de passe.
              </p>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Code de sécurité (6 chiffres) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Ex: 123456"
                required
                maxLength={6}
                className="w-full bg-stone-950 text-center text-amber-300 font-mono text-base font-bold tracking-widest border border-stone-700 rounded-xl py-2.5 focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Nouveau mot de passe * (min 6 car.)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                  title={showNewPassword ? 'Masquer' : 'Afficher'}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Confirmer le nouveau mot de passe *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                  title={showConfirmPassword ? 'Masquer' : 'Afficher'}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>Enregistrer le nouveau mot de passe</span>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setRecoveryStep('request');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
                className="text-xs font-mono text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                ← Recommencer avec un autre e-mail
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

