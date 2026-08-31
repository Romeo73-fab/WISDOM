import React, { useState } from 'react';
import { MessageCircle, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { DEFAULT_WHATSAPP } from '../data/initialData';

interface ContactSectionProps {
  onShowToast: (msg: string) => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ onShowToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !name.trim()) return;

    // Build WhatsApp message for direct contact
    const text = `Bonjour WISDOM,\n\nMon nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    window.open(`https://wa.me/${DEFAULT_WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank');

    setSent(true);
    onShowToast('Message envoyé via WhatsApp ✓');
  };

  return (
    <section id="contact-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center flex flex-col items-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
          <span>CONTACT & ASSISTANCE</span>
        </div>
        <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-100 leading-tight mb-4">
          Une Question ? Contactez-nous
        </h2>
        <p className="text-stone-300 text-sm max-w-xl mx-auto font-light leading-relaxed">
          Notre équipe est basée à Cotonou et vous répond sous quelques minutes par WhatsApp ou e-mail.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Info & Socials (Left Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl space-y-4">
            <h3 className="font-serif text-xl font-bold text-stone-100">Canaux Directs</h3>

            <a
              href={`https://wa.me/${DEFAULT_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
              className="p-4 bg-emerald-950/40 border border-emerald-800/80 hover:bg-emerald-900/50 rounded-2xl flex items-center gap-3 transition-colors text-emerald-300 group"
            >
              <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-stone-100 group-hover:text-emerald-300">
                  WhatsApp Direct Bénin
                </p>
                <p className="text-xs font-mono text-emerald-400/90">+229 60 41 31 45</p>
              </div>
            </a>

            <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex items-center gap-3 text-stone-300">
              <div className="p-2.5 bg-stone-800 rounded-xl text-amber-400">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-stone-100">Siège & Showroom</p>
                <p className="text-xs font-mono text-stone-400">Cotonou, Bénin</p>
              </div>
            </div>

            <div className="p-4 bg-stone-950 border border-stone-800 rounded-2xl flex items-center gap-3 text-stone-300">
              <div className="p-2.5 bg-stone-800 rounded-xl text-amber-400">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <p className="font-serif font-bold text-sm text-stone-100">Adresse E-mail</p>
                <p className="text-xs font-mono text-stone-400">contact@wisdom-benin.com</p>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="p-6 bg-stone-900 border border-stone-800 rounded-3xl space-y-3">
            <h4 className="font-mono text-xs font-bold text-stone-300 uppercase tracking-wider">
              Suivez-nous sur les Réseaux
            </h4>
            <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl font-bold text-stone-200 transition-colors"
              >
                Facebook
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl font-bold text-amber-300 transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-stone-950 hover:bg-stone-800 border border-stone-800 rounded-xl font-bold text-stone-200 transition-colors"
              >
                TikTok
              </a>
            </div>
          </div>
        </div>

        {/* Interactive Contact Form (Right Column) */}
        <div className="lg:col-span-7 bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h3 className="font-serif text-2xl font-bold text-stone-100">
            Envoyez un message rapide
          </h3>

          {sent ? (
            <div className="p-8 text-center bg-stone-950 border border-stone-800 rounded-2xl space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="font-serif text-xl font-bold text-stone-100">Message Transmis !</p>
              <p className="text-xs font-mono text-stone-400 max-w-sm mx-auto">
                Votre conversation s'est ouverte sur WhatsApp. Notre équipe vous répond immédiatement.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 px-6 py-2 bg-stone-800 hover:bg-stone-700 text-xs font-mono text-stone-200 rounded-xl cursor-pointer"
              >
                Nouveau message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                  Votre Nom
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Fabrice Koudjra"
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                  E-mail ou Téléphone
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com ou +229..."
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-stone-300 uppercase mb-1">
                  Votre Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Bonjour, je souhaiterais en savoir plus sur les livraisons à Parakou / sur un t-shirt personnalisé..."
                  className="w-full bg-stone-950 text-stone-100 border border-stone-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-mono font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Envoyer par WhatsApp Express</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
