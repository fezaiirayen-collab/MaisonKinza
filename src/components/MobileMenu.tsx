import React from "react";
import { X, Search, Heart, User, ArrowRight, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import { useCart } from "@/context/CartContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  links?: { label: string; href: string }[];
}

const defaultLinks = [
  { label: "Nouveautés", href: "/nouveautes" },
  { label: "Collection", href: "/collection" },
  { label: "Caftans", href: "/caftans" },
  { label: "Robes", href: "/robes" },
  { label: "Jebbas", href: "/jebbas" },
  { label: "Accessoires", href: "/accessoires" },
];

const MobileMenu: React.FC<Props> = ({ isOpen, onClose, links = defaultLinks }) => {
  const { openSearch, favorites } = useCart();
  const isHomePage = useLocation().pathname === "/";
  const contactEmail = "contact@kenza.tn";
  const phone = isHomePage ? "+216 52 374 459" : "+216 71 000 000";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Slide Drawer */}
      <div className="fixed inset-y-0 left-0 w-[88vw] max-w-[320px] bg-white border-r border-black flex flex-col justify-between p-5 sm:p-6 overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-black/10">
            <Logo size="sm" />
            <button
              onClick={onClose}
              className="p-1.5 text-black hover:opacity-60 transition-opacity"
              aria-label="Fermer le menu"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Search Trigger */}
          <button
            onClick={() => {
              onClose();
              openSearch();
            }}
            className="w-full flex items-center justify-between py-3 px-3.5 my-5 border border-black/20 text-[11px] uppercase tracking-[0.12em] text-stone hover:border-black hover:text-black transition-colors text-left"
          >
            <span className="flex items-center gap-2.5">
              <Search size={14} strokeWidth={1.5} /> Rechercher une pièce...
            </span>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col py-1">
            {links.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                onClick={onClose}
                className="text-[12px] uppercase tracking-[0.14em] font-medium text-black hover:pl-2 transition-all flex items-center justify-between py-3 border-b border-black/5"
              >
                <span>{item.label}</span>
                <ArrowRight size={13} strokeWidth={1.2} className="text-stone/60" />
              </Link>
            ))}
          </nav>
        </div>

        {/* Footer info in Mobile Menu */}
        <div className="pt-6 border-t border-black/10 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-[11px] tracking-[0.1em] uppercase">
            <Link
              to="/compte"
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 border border-black/20 hover:border-black transition-colors"
            >
              <User size={14} strokeWidth={1.5} /> Compte
            </Link>
            <Link
              to="/favoris"
              onClick={onClose}
              className="flex items-center justify-center gap-2 py-3 border border-black/20 hover:border-black transition-colors"
            >
              <Heart size={14} strokeWidth={1.5} /> Favoris ({favorites.length})
            </Link>
          </div>

          <div className="text-[11px] text-stone space-y-1">
            <p className="flex items-center gap-1.5 font-normal">
              <MapPin size={12} strokeWidth={1.5} className="text-black" /> Livraison partout en Tunisie
            </p>
            <p className="text-[10px] text-stone">{contactEmail} • {phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
