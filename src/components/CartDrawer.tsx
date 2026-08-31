import React, { useState } from 'react';
import {
  X,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Truck,
  CheckCircle,
  Tag,
  Gift,
  Sparkles,
  Percent,
  Check,
  AlertCircle,
  Coins,
} from 'lucide-react';
import { CartItem, Product, User, PromoCode } from '../types';
import { BENIN_CITIES, LOYALTY_RULES } from '../data/initialData';

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  products: Product[];
  currentUser: User | null;
  promos: PromoCode[];
  fedapayLink: string;
  whatsappNumber: string;
  onClose: () => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onOpenAuth: () => void;
  onRecordOrder: (
    method: 'whatsapp' | 'fedapay',
    deliveryCity: string,
    deliveryAddress: string,
    phone: string,
    deliveryFee: number,
    total: number,
    subtotal: number,
    discountAmount: number,
    appliedPromoCode?: string,
    loyaltyPointsUsed?: number,
    loyaltyPointsEarned?: number
  ) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cart,
  products,
  currentUser,
  promos,
  fedapayLink,
  whatsappNumber,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOpenAuth,
  onRecordOrder,
}) => {
  if (!isOpen) return null;

  const [selectedCity, setSelectedCity] = useState(BENIN_CITIES[0].name);
  const [deliveryAddress, setDeliveryAddress] = useState(currentUser?.address || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'checkout_info'>('cart');
  const [paymentMode, setPaymentMode] = useState<'whatsapp' | 'fedapay'>('whatsapp');

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // Loyalty Points State
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const currentCityObj = BENIN_CITIES.find((c) => c.name === selectedCity) || BENIN_CITIES[0];
  let baseDeliveryFee = currentCityObj.fee;

  // Calculate items subtotal
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    const price = product ? product.price : 5000;
    return sum + price * item.quantity;
  }, 0);

  // Calculate promo discount
  let promoDiscount = 0;
  let effectiveDeliveryFee = baseDeliveryFee;

  if (appliedPromo && appliedPromo.active) {
    if (appliedPromo.discountType === 'percentage') {
      promoDiscount = Math.round((subtotal * appliedPromo.discountValue) / 100);
    } else if (appliedPromo.discountType === 'fixed') {
      promoDiscount = Math.min(subtotal, appliedPromo.discountValue);
    } else if (appliedPromo.discountType === 'free_shipping') {
      effectiveDeliveryFee = 0;
    }
  }

  // Calculate available loyalty points discount
  const userPoints = currentUser?.loyaltyPoints || 0;
  const maxPointsFcfaValue = Math.floor(userPoints / 10) * 100;
  const loyaltyDiscount = useLoyaltyPoints ? Math.min(subtotal - promoDiscount, maxPointsFcfaValue) : 0;
  const pointsToRedeem = useLoyaltyPoints ? Math.floor(loyaltyDiscount / 10) : 0;

  // Points that will be earned on this order (1 pt per 100 FCFA)
  const pointsEarned = Math.max(0, Math.floor(subtotal / 100));

  const totalDiscount = promoDiscount + loyaltyDiscount;
  const grandTotal = Math.max(0, subtotal - totalDiscount) + (cart.length > 0 ? effectiveDeliveryFee : 0);

  // Apply promo code handler
  const handleApplyPromo = (codeToApply?: string) => {
    setPromoError(null);
    setPromoSuccess(null);
    const targetCode = (codeToApply || promoInput).trim().toUpperCase();

    if (!targetCode) {
      setPromoError('Veuillez saisir un code promo.');
      return;
    }

    const found = promos.find((p) => p.code.toUpperCase() === targetCode && p.active);
    if (!found) {
      setPromoError('Code promo introuvable ou inactif.');
      return;
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      setPromoError(`Ce code exige un panier minimum de ${found.minOrderAmount.toLocaleString('fr-FR')} FCFA.`);
      return;
    }

    setAppliedPromo(found);
    setPromoInput(found.code);
    setPromoSuccess(`🎉 Code ${found.code} appliqué avec succès !`);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoError(null);
    setPromoSuccess(null);
  };

  const handleProceedToCheckout = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    setCheckoutStep('checkout_info');
  };

  const handleFinalSubmit = () => {
    if (!phone.trim()) {
      alert('Veuillez renseigner votre numéro de téléphone (WhatsApp / Moov / MTN).');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('Veuillez indiquer votre quartier ou adresse de livraison.');
      return;
    }

    if (paymentMode === 'whatsapp') {
      // Build detailed WhatsApp message with promo & loyalty
      let msg = `*COMMANDE WISDOM BENIN*\n\n`;
      msg += `*Client:* ${customerName || currentUser?.name}\n`;
      msg += `*Email:* ${currentUser?.email}\n`;
      msg += `*Téléphone:* ${phone}\n`;
      msg += `*Ville:* ${selectedCity}\n`;
      msg += `*Adresse:* ${deliveryAddress}\n\n`;
      msg += `*Articles Commandés:*\n`;

      cart.forEach((item, idx) => {
        const p = products.find((pr) => pr.id === item.productId);
        const name = p ? p.name : 'Tee-shirt Custom';
        const price = p ? p.price : 5000;
        msg += `${idx + 1}. ${name} (Taille: ${item.size}, Couleur: ${item.color}) x${item.quantity} = ${(price * item.quantity).toLocaleString('fr-FR')} FCFA\n`;
        if (item.customText) {
          msg += `   └ Texte: "${item.customText}" (Font: ${item.customFont || 'Par défaut'})\n`;
        }
      });

      msg += `\n*Sous-total articles:* ${subtotal.toLocaleString('fr-FR')} FCFA\n`;

      if (appliedPromo) {
        msg += `*Code Promo:* ${appliedPromo.code} (-${appliedPromo.discountType === 'free_shipping' ? 'Livraison Offerte' : `${promoDiscount.toLocaleString('fr-FR')} FCFA`})\n`;
      }

      if (useLoyaltyPoints && pointsToRedeem > 0) {
        msg += `*Points Fidélité Utilisés:* ${pointsToRedeem} pts (-${loyaltyDiscount.toLocaleString('fr-FR')} FCFA)\n`;
      }

      msg += `*Livraison (${selectedCity}):* ${effectiveDeliveryFee.toLocaleString('fr-FR')} FCFA\n`;
      msg += `*TOTAL A PAYER:* ${grandTotal.toLocaleString('fr-FR')} FCFA\n`;
      msg += `*Points Fidélité Gagnés:* +${pointsEarned} points\n\n`;
      msg += `Merci de confirmer la prise en charge de ma commande !`;

      onRecordOrder(
        'whatsapp',
        selectedCity,
        deliveryAddress,
        phone,
        effectiveDeliveryFee,
        grandTotal,
        subtotal,
        totalDiscount,
        appliedPromo?.code,
        pointsToRedeem,
        pointsEarned
      );
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, '_blank');
      onClearCart();
      onClose();
    } else {
      // FedaPay / Mobile Money Payment
      onRecordOrder(
        'fedapay',
        selectedCity,
        deliveryAddress,
        phone,
        effectiveDeliveryFee,
        grandTotal,
        subtotal,
        totalDiscount,
        appliedPromo?.code,
        pointsToRedeem,
        pointsEarned
      );
      window.open(fedapayLink || 'https://fedapay.com', '_blank');
      onClearCart();
      onClose();
    }
  };

  const publicPromos = promos.filter((p) => p.active && p.isPublicBanner);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-md bg-stone-900 border-l border-stone-800 text-stone-100 flex flex-col justify-between shadow-2xl">
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h2 className="font-serif text-lg sm:text-xl font-bold">Votre Panier WISDOM</h2>
              <span className="font-mono text-xs bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                {cart.reduce((s, c) => s + c.quantity, 0)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
            {checkoutStep === 'cart' ? (
              <>
                {cart.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
                    <p className="font-serif text-lg font-bold text-stone-300">
                      Votre panier est vide
                    </p>
                    <p className="text-xs text-stone-400 max-w-xs mx-auto">
                      Découvrez nos tee-shirts signature et personnalisés pour remplir votre panier.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-amber-400 text-stone-950 font-mono text-xs font-bold rounded-full cursor-pointer hover:bg-amber-300 transition-colors"
                    >
                      Explorer la boutique
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Cart Items List */}
                    <div className="space-y-3">
                      {cart.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        const name = product ? product.name : 'Tee-shirt Personnalisé';
                        const price = product ? product.price : 5000;
                        const image =
                          product?.image ||
                          '/assets/images/wisdom_black_shirt_1786398483035.jpg';

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 bg-stone-950 border border-stone-800 rounded-2xl flex gap-3.5 items-start relative group"
                          >
                            <img
                              src={image}
                              alt=""
                              className="w-14 h-18 object-cover rounded-xl bg-stone-900 flex-shrink-0"
                              referrerPolicy="no-referrer"
                            />

                            <div className="flex-1 space-y-1">
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-stone-100 line-clamp-1">
                                {name}
                              </h4>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400">
                                <span>Taille: <strong className="text-stone-200">{item.size}</strong></span>
                                <span>•</span>
                                <span>Couleur: <strong className="text-stone-200">{item.color}</strong></span>
                              </div>

                              {item.customText && (
                                <p className="text-[10px] font-mono bg-amber-400/10 text-amber-300 px-2 py-0.5 rounded border border-amber-400/20 inline-block line-clamp-1">
                                  Texte: "{item.customText}"
                                </p>
                              )}

                              <div className="flex items-center justify-between pt-1.5">
                                <div className="inline-flex items-center bg-stone-900 border border-stone-800 rounded-lg">
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                    className="px-2 py-0.5 text-xs text-stone-400 hover:text-white cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-2 font-mono text-xs font-bold text-stone-200">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                    className="px-2 py-0.5 text-xs text-stone-400 hover:text-white cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <span className="font-serif font-bold text-amber-300 text-xs sm:text-sm">
                                  {(price * item.quantity).toLocaleString('fr-FR')} FCFA
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1 text-stone-500 hover:text-red-400 cursor-pointer"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Delivery City Selector */}
                    <div className="p-3.5 bg-stone-950/90 border border-stone-800 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400">
                        <div className="flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Destination de Livraison :</span>
                        </div>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {appliedPromo?.discountType === 'free_shipping' ? 'Offerte !' : `${baseDeliveryFee.toLocaleString('fr-FR')} FCFA`}
                        </span>
                      </div>
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full bg-stone-900 text-stone-100 border border-stone-700 text-xs font-mono rounded-xl p-2.5 focus:outline-none focus:border-amber-400 cursor-pointer"
                      >
                        {BENIN_CITIES.map((city) => (
                          <option key={city.name} value={city.name}>
                            {city.name} — {city.fee.toLocaleString('fr-FR')} FCFA ({city.delay})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* ========================================================================= */}
                    {/* PROMO CODE SECTION */}
                    {/* ========================================================================= */}
                    <div className="p-4 bg-stone-950/90 border border-stone-800 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-stone-200">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>Code Promo / Bon de Réduction</span>
                        </div>
                        {appliedPromo && (
                          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                            Actif
                          </span>
                        )}
                      </div>

                      {appliedPromo ? (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-emerald-400">
                                {appliedPromo.code}
                              </span>
                              <span className="text-[10px] text-stone-400">
                                {appliedPromo.description}
                              </span>
                            </div>
                            <p className="text-[11px] font-mono text-emerald-300 font-bold">
                              Remise déduite :{' '}
                              {appliedPromo.discountType === 'free_shipping'
                                ? 'Livraison 100% Offerte'
                                : `-${promoDiscount.toLocaleString('fr-FR')} FCFA`}
                            </p>
                          </div>
                          <button
                            onClick={handleRemovePromo}
                            className="p-1 text-stone-400 hover:text-red-400 cursor-pointer"
                            title="Retirer le code promo"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={promoInput}
                              onChange={(e) => {
                                setPromoInput(e.target.value.toUpperCase());
                                setPromoError(null);
                              }}
                              placeholder="Ex: BIENVENUE10"
                              className="flex-1 bg-stone-900 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-amber-400 placeholder:normal-case placeholder:text-stone-500"
                            />
                            <button
                              onClick={() => handleApplyPromo()}
                              className="px-4 py-2 bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-200 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer border border-stone-700 hover:border-amber-400"
                            >
                              Appliquer
                            </button>
                          </div>

                          {promoError && (
                            <p className="text-[11px] font-mono text-red-400 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{promoError}</span>
                            </p>
                          )}
                          {promoSuccess && (
                            <p className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{promoSuccess}</span>
                            </p>
                          )}

                          {/* Quick Suggestion Chips */}
                          {publicPromos.length > 0 && (
                            <div className="pt-1 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-mono text-stone-500">Offres disponibles :</span>
                              {publicPromos.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => handleApplyPromo(p.code)}
                                  className="text-[10px] font-mono bg-stone-900 hover:bg-amber-400/20 text-amber-300 border border-stone-800 hover:border-amber-400/40 px-2 py-0.5 rounded-full transition-all cursor-pointer flex items-center gap-1"
                                >
                                  <Sparkles className="w-2.5 h-2.5" />
                                  <span>{p.code} ({p.discountType === 'percentage' ? `-${p.discountValue}%` : p.discountType === 'free_shipping' ? 'Livraison Offerte' : `-${p.discountValue}F`})</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ========================================================================= */}
                    {/* LOYALTY PROGRAM (WISDOM CLUB) */}
                    {/* ========================================================================= */}
                    <div className="p-4 bg-gradient-to-br from-stone-950 to-stone-900 border border-amber-500/20 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
                          <Coins className="w-3.5 h-3.5" />
                          <span>WISDOM Club Fidélité</span>
                        </div>
                        <span className="text-[10px] font-mono bg-amber-400/10 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                          +{pointsEarned} pts offerts
                        </span>
                      </div>

                      {currentUser ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="text-stone-400">Votre solde :</span>
                            <span className="text-amber-300 font-bold">
                              {userPoints} points ({maxPointsFcfaValue.toLocaleString('fr-FR')} FCFA)
                            </span>
                          </div>

                          {userPoints >= LOYALTY_RULES.minPointsToRedeem ? (
                            <label className="p-2.5 bg-stone-900/90 border border-amber-500/30 rounded-xl flex items-center justify-between cursor-pointer hover:bg-stone-900 transition-colors">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={useLoyaltyPoints}
                                  onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                                  className="rounded accent-amber-400 cursor-pointer"
                                />
                                <span className="text-xs font-mono text-stone-200">
                                  Déduire mes points (-{loyaltyDiscount.toLocaleString('fr-FR')} FCFA)
                                </span>
                              </div>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                -{pointsToRedeem} pts
                              </span>
                            </label>
                          ) : (
                            <p className="text-[11px] font-mono text-stone-400">
                              💡 Cumulez {LOYALTY_RULES.minPointsToRedeem - userPoints} points de plus pour débloquer votre 1ère réduction fidélité !
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <p className="text-[11px] font-mono text-stone-400">
                            Connectez-vous pour cumuler des points et débloquer des remises exclusives.
                          </p>
                          <button
                            onClick={onOpenAuth}
                            className="text-[10px] font-mono font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer"
                          >
                            Se connecter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Step 2: Checkout Info Form */
              <div className="space-y-4">
                <button
                  onClick={() => setCheckoutStep('cart')}
                  className="text-xs font-mono text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>← Retour au panier</span>
                </button>

                <h3 className="font-serif text-lg font-bold text-stone-100">
                  Coordonnées de Livraison
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Votre nom et prénom"
                      className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                      Téléphone (WhatsApp / MTN / Moov)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+229 90000000"
                      className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                      Quartier / Adresse exacte de livraison
                    </label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ex: Akpakpa, près de la pharmacie, Cotonou..."
                      className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* Payment Choice */}
                  <div>
                    <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-2">
                      Mode de paiement :
                    </label>
                    <div className="space-y-2">
                      <label
                        onClick={() => setPaymentMode('whatsapp')}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          paymentMode === 'whatsapp'
                            ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                            : 'bg-stone-950 border-stone-800 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                          <span>📱 WhatsApp Express (Paiement à la livraison)</span>
                        </div>
                        {paymentMode === 'whatsapp' && <CheckCircle className="w-4 h-4 text-amber-400" />}
                      </label>

                      <label
                        onClick={() => setPaymentMode('fedapay')}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          paymentMode === 'fedapay'
                            ? 'bg-amber-400/10 border-amber-400 text-amber-300'
                            : 'bg-stone-950 border-stone-800 text-stone-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-mono font-bold">
                          <span>💳 FedaPay / Mobile Money (MTN, Moov, Wave)</span>
                        </div>
                        {paymentMode === 'fedapay' && <CheckCircle className="w-4 h-4 text-amber-400" />}
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Calculations */}
          {cart.length > 0 && (
            <div className="p-5 sm:p-6 border-t border-stone-800 bg-stone-950 space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Sous-total articles:</span>
                  <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
                </div>

                {appliedPromo && promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Remise Code ({appliedPromo.code}):</span>
                    <span>-{promoDiscount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                {useLoyaltyPoints && loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-400 font-bold">
                    <span>Remise Fidélité ({pointsToRedeem} pts):</span>
                    <span>-{loyaltyDiscount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-400">
                  <span>Frais de livraison ({selectedCity}):</span>
                  {appliedPromo?.discountType === 'free_shipping' ? (
                    <span className="text-emerald-400 font-bold">OFFERT (0 FCFA)</span>
                  ) : (
                    <span>{effectiveDeliveryFee.toLocaleString('fr-FR')} FCFA</span>
                  )}
                </div>

                <div className="flex justify-between items-center font-serif font-black text-lg text-amber-300 pt-2 border-t border-stone-800">
                  <span>TOTAL FINAL:</span>
                  <span>{grandTotal.toLocaleString('fr-FR')} FCFA</span>
                </div>
              </div>

              {checkoutStep === 'cart' ? (
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
                >
                  <span>Valider ma commande</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  className="w-full py-3.5 sm:py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
                >
                  <span>Confirmer & Commander ({grandTotal.toLocaleString('fr-FR')} FCFA)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
