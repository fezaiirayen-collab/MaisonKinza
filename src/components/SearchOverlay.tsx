import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useProducts } from "@/context/ProductContext";
import ProductImage from "@/components/ProductImage";

const SearchOverlay: React.FC = () => {
  const { isSearchOpen, closeSearch } = useCart();
  const { products } = useProducts();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  const filtered = query.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.category.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 select-none flex flex-col justify-start"
      onClick={closeSearch}
      role="presentation"
    >
      {/* Top Search Drawer Panel */}
      <div
        className="bg-white border-b border-black w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="asala-container py-6">
          {/* Top Label and Close */}
          <div className="flex items-center justify-between pb-6">
            <span className="text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
              Recherche Éditoriale KENZA
            </span>
            <button
              onClick={closeSearch}
              aria-label="Fermer la recherche"
              className="p-1.5 text-black hover:opacity-60 transition-opacity cursor-pointer"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Search Input Line */}
          <div className="flex items-center border-b border-black pb-3">
            <Search size={22} strokeWidth={1.5} className="text-black mr-4 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un caftan, une jebba, une robe..."
              className="w-full bg-transparent text-[18px] lg:text-[22px] font-normal text-black outline-none placeholder:text-stone/60 border-none p-0"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[11px] uppercase tracking-wider text-stone hover:text-black ml-3 shrink-0 cursor-pointer"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap items-center gap-2 mt-4 text-[11px]">
            <span className="text-stone uppercase tracking-wider mr-2">Suggestions :</span>
            {["Caftan", "Jebba", "Robe", "Soie", "Or"].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="border border-black/20 px-3 py-1 text-black hover:border-black transition-colors uppercase tracking-wider cursor-pointer"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Container */}
      <div
        className="flex-1 overflow-y-auto w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {query.trim() && (
          <div className="asala-container py-8">
          <div className="bg-white border border-black p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-black/10">
              <span className="text-[12px] uppercase tracking-[0.14em] text-black font-semibold">
                {filtered.length} Résultat{filtered.length > 1 ? "s" : ""} pour « {query} »
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-[14px] text-stone mb-6 font-normal">
                  Aucune création ne correspond exactement à votre recherche.
                </p>
                <Link
                  to="/collection"
                  onClick={closeSearch}
                  className="asala-btn inline-flex"
                >
                  Explorer toute la collection
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {filtered.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    onClick={closeSearch}
                    className="group flex flex-col"
                  >
                    <div className="aspect-[3/4] overflow-hidden bg-[#f4f2ee] mb-3">
                      <ProductImage
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <span className="text-[12px] uppercase tracking-wide font-medium text-black group-hover:text-stone transition-colors truncate">
                      {product.name}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-stone mt-0.5">
                      {product.category}
                    </span>
                    <span className="text-[13px] text-black font-medium mt-1">
                      {product.price} TND
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
