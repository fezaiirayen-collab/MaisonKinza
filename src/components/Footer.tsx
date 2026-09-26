import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";
import { Instagram, Facebook, Check, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMobileSection, setOpenMobileSection] = useState<string | null>(null);
  const isHomePage = useLocation().pathname === "/";
  const brandName = "KENZA";
  const phone = isHomePage ? "+216 52 374 459" : "+216 71 000 000";
  const phoneHref = phone.replace(/\s/g, "");
  const contactEmail = "contact@kenza.tn";

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setIsSubmitting(true);
    setSubscriptionError("");
    const result = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
    setIsSubmitting(false);
    if (result.error && result.error.code !== "23505") setSubscriptionError("Inscription momentanément indisponible. Veuillez réessayer plus tard.");
    else { setSubscribed(true); setEmail(""); }
  };

  const toggleMobileSection = (section: string) => {
    setOpenMobileSection((current) => (current === section ? null : section));
  };

  return (
    <footer className="w-full select-none bg-white text-black md:bg-black md:pb-12 md:pt-16 md:text-white">
      <div className="asala-container">
        {/* Mobile footer accordions */}
        <div className="md:hidden">
          {[
            {
              id: "legal",
              title: "Conditions générales d'utilisation",
              content: (
                <div className="flex flex-col gap-3 pb-5 text-[12px] text-black/65">
                  <Link to="/faq">Mentions légales</Link>
                  <Link to="/faq">Politique de confidentialité</Link>
                  <Link to="/faq">Conditions générales de vente</Link>
                </div>
              ),
            },
            {
              id: "service",
              title: "Service client",
              content: (
                <div className="flex flex-col gap-3 pb-5 text-[12px] text-black/65">
                  <Link to="/faq">Questions fréquentes (FAQ)</Link>
                  <Link to="/faq">Retours & échanges</Link>
                  <Link to="/suivi-commande">Suivi de commande</Link>
                </div>
              ),
            },
            {
              id: "shipping",
              title: "Livraison et paiement",
              content: (
                <div className="flex flex-col gap-3 pb-5 text-[12px] text-black/65">
                  <Link to="/faq">Livraison en Tunisie</Link>
                  <Link to="/faq">Paiement à la livraison</Link>
                  <span>Livraison partout en Tunisie : 7 TND</span>
                </div>
              ),
            },
            {
              id: "contact",
              title: "Informations de Contact",
              content: (
                <div className="flex flex-col gap-3 pb-5 text-[12px] text-black/65">
                  <a href={`tel:${phoneHref}`}>{phone}</a>
                  <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                  <Link to="/contact">Nous contacter</Link>
                </div>
              ),
            },
          ].map((section) => {
            const isOpen = openMobileSection === section.id;
            return (
              <div key={section.id} className="border-b border-black/10 first:border-t">
                <button
                  type="button"
                  onClick={() => toggleMobileSection(section.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-semibold leading-tight sm:py-6 sm:text-[19px]"
                >
                  <span>{section.title}</span>
                  <ChevronDown
                    size={22}
                    strokeWidth={2.2}
                    className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && section.content}
              </div>
            );
          })}
        </div>

        {/* Main 5 columns grid */}
        <div className="hidden grid-cols-1 gap-10 border-b border-white/15 pb-16 md:grid md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          
          {/* Col 1: KENZA Brandmark & Vision */}
          <div className="lg:col-span-1">
            <div className="mb-5">
              <Logo size="md" inverted />
            </div>
            <p className="text-[12px] text-white/70 font-light leading-relaxed mb-4">
              Maison de haute couture et mode traditionnelle tunisienne féminine. L'alliance intemporelle de notre patrimoine et d'une esthétique contemporaine épurée.
            </p>
            <div className="text-[11px] text-white/60 space-y-1 font-normal">
              <p>• Livraison partout en Tunisie : 7 TND</p>
              <p>• Retours & échanges sous 14 jours</p>
              <p>• Ateliers de confection à Tunis</p>
            </div>
          </div>

          {/* Col 2: À PROPOS */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] font-medium text-white mb-5">
              À PROPOS
            </h4>
            <ul className="space-y-3 text-[12px] text-white/70 font-light">
              <li>
                <Link to="/a-propos" className="hover:text-white transition-colors">
                  La Maison {brandName}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="hover:text-white transition-colors">
                  Savoir-Faire Artisanal
                </Link>
              </li>
              <li>
                <Link to="/collection" className="hover:text-white transition-colors">
                  Catalogue Complet
                </Link>
              </li>
              <li>
                <Link to="/nouveautes" className="hover:text-white transition-colors">
                  Nouvelle Saison
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact & Ateliers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: SERVICE CLIENT */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] font-medium text-white mb-5">
              SERVICE CLIENT
            </h4>
            <ul className="space-y-3 text-[12px] text-white/70 font-light">
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Livraison en Tunisie
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Retours & Échanges
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Paiement à la Livraison
                </Link>
              </li>
              <li>
                <Link to="/suivi-commande" className="hover:text-white transition-colors">
                  Suivi de Commande
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-white transition-colors">
                  Questions Fréquentes (FAQ)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: SUIVEZ-NOUS */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] font-medium text-white mb-5">
              SUIVEZ-NOUS
            </h4>
            <ul className="space-y-3 text-[12px] text-white/70 font-light">
              <li>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Instagram size={14} strokeWidth={1.5} />
                  <span>Instagram</span>
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <Facebook size={14} strokeWidth={1.5} />
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href="https://pinterest.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-2"
                >
                  <span className="text-[13px] font-serif font-bold leading-none">P</span>
                  <span>Pinterest</span>
                </a>
              </li>
            </ul>

            <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-white/60 leading-relaxed">
              <p>Service Conciergerie :</p>
              <p className="text-white font-medium mt-0.5">{phone}</p>
              <p className="text-white/80">{contactEmail}</p>
            </div>
          </div>

          {/* Col 5: NEWSLETTER */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.16em] font-medium text-white mb-5">
              NEWSLETTER
            </h4>
            <p className="text-[12px] text-white/70 font-light leading-relaxed mb-4">
              Recevez en avant-première nos nouvelles collections, défilés et invitations privées.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-3 bg-white/10 border border-white/20 text-[11px] text-white">
                <Check size={14} />
                <span>Merci de votre inscription à la Maison {brandName}.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex border-b border-white pb-2">
                  <input
                    type="email"
                    required
                    placeholder="Votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent text-[12px] text-white outline-none placeholder:text-white/50 border-none p-0"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="text-[11px] uppercase font-medium tracking-wider text-white hover:text-white/70 pl-3 transition-colors shrink-0 cursor-pointer"
                  >
                    {isSubmitting ? "…" : "OK"}
                  </button>
                </div>
                {subscriptionError && <p className="text-[11px] text-red-300">{subscriptionError}</p>}
              </form>
            )}
          </div>
        </div>

        {/* Bottom copyright & legal */}
        <div className="hidden pt-8 flex-col items-center justify-between gap-4 text-[11px] font-light text-white/50 md:flex md:flex-row">
          <p>© {new Date().getFullYear()} {brandName} • Maison de Couture Traditionnelle Tunisienne. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-6">
            <Link to="/faq" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <Link to="/faq" className="hover:text-white transition-colors">
              Politique de Confidentialité
            </Link>
            <Link to="/faq" className="hover:text-white transition-colors">
              Conditions Générales de Vente
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
