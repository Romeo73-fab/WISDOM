import React, { useState } from 'react';
import { User as UserType, Order } from '../types';
import {
  User,
  ShoppingBag,
  Clock,
  CheckCircle,
  LogOut,
  Shield,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { updateUserPasswordInDatabase } from '../utils/supabaseAuthService';
import { sha256 } from '../utils/storage';

interface UserProfileProps {
  currentUser: UserType | null;
  orders: Order[];
  onOpenAuth: () => void;
  onLogout: () => void;
  onUpdatePasswordSuccess?: (newPassword: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  orders,
  onOpenAuth,
  onLogout,
  onUpdatePasswordSuccess,
}) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="p-4 bg-stone-900 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-400 border border-stone-800">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-extrabold text-stone-100">Espace Mon Compte</h2>
        <p className="text-stone-400 text-sm max-w-sm mx-auto">
          Connectez-vous pour suivre vos commandes en cours, accéder à vos adresses enregistrées et gérer votre profil.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono text-xs font-bold rounded-full transition-colors cursor-pointer shadow-lg shadow-amber-400/20"
        >
          Se connecter / S'inscrire
        </button>
      </div>
    );
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Les deux mots de passe ne sont pas identiques.' });
      return;
    }

    setIsLoading(true);

    try {
      await updateUserPasswordInDatabase(currentUser.email, newPassword);
      if (onUpdatePasswordSuccess) {
        onUpdatePasswordSuccess(newPassword);
      }
      setStatusMsg({ type: 'success', text: '✅ Votre mot de passe a été mis à jour avec succès !' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setIsChangingPassword(false);
      }, 2500);
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Erreur lors de la mise à jour.' });
    } finally {
      setIsLoading(false);
    }
  };

  const userOrders = orders
    .filter((o) => o.userEmail.toLowerCase() === currentUser.email.toLowerCase())
    .reverse();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Account Info Card */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl text-amber-400">
            <User className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-bold text-stone-100">{currentUser.name}</h2>
              {currentUser.isAdmin && (
                <span className="text-[10px] font-mono bg-amber-400 text-stone-950 font-extrabold px-2 py-0.5 rounded uppercase">
                  ADMINISTRATEUR
                </span>
              )}
            </div>
            <p className="font-mono text-xs text-stone-400">{currentUser.email}</p>
            {currentUser.phone && (
              <p className="font-mono text-xs text-amber-400 mt-0.5">Tel: {currentUser.phone}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsChangingPassword(!isChangingPassword);
              setStatusMsg(null);
            }}
            className="px-4 py-2.5 bg-stone-950 text-stone-300 border border-stone-800 hover:border-amber-400/50 hover:text-amber-300 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{isChangingPassword ? 'Fermer' : 'Changer mot de passe'}</span>
          </button>

          <button
            onClick={onLogout}
            className="px-5 py-2.5 bg-red-950/40 text-red-400 border border-red-900/60 hover:bg-red-900/50 rounded-xl font-mono text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* Expandable Password Change Form */}
      {isChangingPassword && (
        <div className="bg-stone-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl animate-in fade-in space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm">
            <KeyRound className="w-4 h-4" />
            <span>Modifier votre mot de passe</span>
          </div>

          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-mono flex items-start gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/60 border border-red-800 text-red-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <p>{statusMsg.text}</p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1.5">
                Nouveau mot de passe * (min 6 car.)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl pl-10 pr-10 py-2.5 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 p-1 cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="px-4 py-2 bg-stone-950 text-stone-400 hover:text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <span>Enregistrer le nouveau mot de passe</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Orders History */}
      <div className="space-y-4">
        <h3 className="font-serif text-xl font-bold text-stone-100 flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-amber-400" />
          <span>Mes Commandes ({userOrders.length})</span>
        </h3>

        {userOrders.length === 0 ? (
          <div className="p-8 text-center bg-stone-900/50 border border-stone-800 rounded-2xl">
            <p className="text-xs font-mono text-stone-400">
              Vous n'avez pas encore passé de commande.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((ord) => (
              <div key={ord.id} className="p-5 bg-stone-900 border border-stone-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-stone-800">
                  <div>
                    <span className="text-amber-400 font-bold">Commande #{ord.id}</span>
                    <span className="text-stone-500 ml-2">
                      {new Date(ord.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-stone-950 text-stone-300 font-bold uppercase text-[10px] border border-stone-800">
                    {ord.status === 'livree' ? 'Livrée ✓' : 'En traitement'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-stone-300 font-mono">
                  {ord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>• {it.name} x{it.quantity}</span>
                      <span>{(it.price * it.quantity).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-stone-800/60 flex justify-between font-serif font-black text-amber-300 text-sm">
                  <span>Total Payé:</span>
                  <span>{ord.total.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

