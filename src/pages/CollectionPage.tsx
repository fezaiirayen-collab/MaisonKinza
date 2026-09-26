import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link, useLocation } from "react-router-dom";
import { Grid2X2, Grid3X3, SlidersHorizontal, X } from "lucide-react";
import ProductGrid from "@/components/ProductGrid";
import FilterSidebar from "@/components/FilterSidebar";
import Button from "@/components/Button";
import { useProducts } from "@/context/ProductContext";
import { publicAsset } from "@/lib/publicAsset";

const categories = ["Caftan", "Jebba", "Robe", "Accessoire"];
const sizes = ["36", "38", "40", "42", "44", "S", "M", "L", "XL"];
/* const legacyColors = [
  "Ivoire Doré",
  "Blanc Pur",
  "Noir Onyx",
  "Sable",
  "Émeraude",
  "Bleu Nuit",
  "Bordeaux",
  "Turquoise",
  "Lilas Poudré",
  "Doré",
]; */

const CollectionPage: React.FC = () => {
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const isNewArrivals = location.pathname === "/nouveautes";
  const bannerImage = isNewArrivals ? "/nouveautes-banner.png" : "/collection-banner.png";
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [sort, setSort] = useState(
    isNewArrivals || searchParams.get("filter") === "new" ? "newest" : "relevance"
  );
  const [columns, setColumns] = useState<2 | 3 | 4>(3);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Les couleurs proposées correspondent uniquement à celles utilisées par les produits.
  const colors = useMemo(() => {
    const uniqueColors = new Map<string, string>();

    products.forEach((product) => {
      [...product.colors, ...Object.keys(product.colorImages || {})].forEach((value) => {
        const trimmed = value.trim();
        const normalized = trimmed.toLocaleLowerCase();
        if (trimmed && !uniqueColors.has(normalized)) {
          uniqueColors.set(normalized, trimmed);
        }
      });
    });

    return [...uniqueColors.values()].sort((a, b) => a.localeCompare(b, "fr"));
  }, [products]);

  const priceBounds = useMemo(() => {
    const prices = products
      .map((product) => Number(product.price))
      .filter((price) => Number.isFinite(price));

    if (prices.length === 0) {
      return { min: 0, max: 1000 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  useEffect(() => {
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
  }, [priceBounds.min, priceBounds.max]);

  const listedProducts = useMemo(() => {
    const result = products.filter((product) => {
      if (category && product.category.toLowerCase() !== category.toLowerCase()) {
        return false;
      }
      if (size && !product.sizes.includes(size)) {
        return false;
      }
      if (
        color &&
        ![
          ...product.colors,
          ...Object.keys(product.colorImages || {}),
        ].some((c) => c.toLowerCase() === color.toLowerCase())
      ) {
        return false;
      }
      if (product.price < minPrice || product.price > maxPrice) {
        return false;
      }
      if ((isNewArrivals || searchParams.get("filter") === "new") && !product.new) {
        return false;
      }
      return true;
    });

    if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
    if (sort === "newest") {
      return [...result].sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)));
    }
    return result;
  }, [category, size, color, minPrice, maxPrice, sort, searchParams, isNewArrivals]);

  const activeCount =
    Number(Boolean(category)) +
    Number(Boolean(size)) +
    Number(Boolean(color)) +
    Number(minPrice > priceBounds.min || maxPrice < priceBounds.max);

  const resetFilters = () => {
    setCategory("");
    setSize("");
    setColor("");
    setMinPrice(priceBounds.min);
    setMaxPrice(priceBounds.max);
    setSort("relevance");
    setSearchParams({});
  };

  const filterProps = {
    categories,
    sizes,
    colors,
    category,
    size,
    color,
    priceMin: priceBounds.min,
    priceMax: priceBounds.max,
    minPrice,
    maxPrice,
    onCategory: setCategory,
    onSize: setSize,
    onColor: setColor,
    onMinPrice: (value: number) => setMinPrice(Math.min(Math.max(value, priceBounds.min), maxPrice)),
    onMaxPrice: (value: number) => setMaxPrice(Math.max(Math.min(value, priceBounds.max), minPrice)),
    onReset: resetFilters,
    activeCount,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Panoramic editorial banner for each catalogue page */}
      <section className="asala-container pt-6 sm:pt-8 lg:pt-10">
        <div className="relative aspect-[16/9] min-h-[180px] overflow-hidden bg-[#f4f2ee] sm:aspect-[3/1] sm:min-h-[240px] lg:min-h-[320px]">
          <img
            src={publicAsset(bannerImage)}
            alt={isNewArrivals ? "Nouveautés KENZA" : "Collection KENZA"}
            className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />
          <div className="absolute inset-0 flex items-end p-5 text-white sm:p-8 lg:p-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 sm:text-[11px]">
                KENZA — {isNewArrivals ? "Nouvelles créations" : "L'art du traditionnel"}
              </p>
              <h1
                className="mt-2 text-[28px] font-normal leading-none sm:text-[42px] lg:text-[58px]"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                {isNewArrivals ? "LES NOUVEAUTÉS" : "LA COLLECTION"}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Editorial Header Section with Breadcrumb */}
      <section className="border-b border-black/10 bg-[#faf9f6]">
        <div className="asala-container pt-8 pb-12 lg:pt-10 lg:pb-16">
          {/* Breadcrumb */}
          <nav className="text-[10px] uppercase tracking-[0.14em] text-stone mb-8 flex items-center gap-2">
            <Link to="/" className="text-black hover:text-stone transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <span className="text-stone">{isNewArrivals ? "Nouveautés" : "Collection"}</span>
          </nav>

          <div className="max-w-2xl">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-stone font-medium mb-2 sm:mb-3">
              Catalogue Complet
            </p>
            <h1
              className="text-[28px] xs:text-[36px] sm:text-[48px] lg:text-[58px] font-normal leading-[1.02] text-black tracking-tight"
              style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
            >
              {isNewArrivals ? "LES NOUVEAUTÉS KENZA" : "LA COLLECTION KENZA"}
            </h1>
            <p className="mt-3 sm:mt-4 text-[12px] sm:text-[14px] leading-relaxed text-stone max-w-xl">
              Des pièces d'exception pensées pour accompagner les instants qui comptent : caftans brodés d'or, jebbas contemporaines, robes fluides et parures artisanales.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="asala-container py-6 sm:py-8 lg:py-12">
        {/* Horizontal Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 border-b border-black/15 pb-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsFiltersOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-medium border border-black/20 px-3 py-2 hover:border-black transition-colors cursor-pointer"
            >
              <SlidersHorizontal size={15} strokeWidth={1.4} />
              <span>Filtres {activeCount > 0 && `(${activeCount})`}</span>
            </button>
            <p className="text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
              <span className="text-black font-semibold">{listedProducts.length}</span> PIÈCES
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
              <span className="hidden sm:inline text-stone">Trier par</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border-b border-black pb-1 text-[11px] uppercase tracking-wider bg-transparent outline-none cursor-pointer"
              >
                <option value="relevance">Pertinence</option>
                <option value="newest">Nouveautés</option>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
              </select>
            </div>

            {/* Grid Column Switcher (desktop) */}
            <div className="hidden md:flex items-center gap-2 border-l border-black/15 pl-4">
              <button
                onClick={() => setColumns(2)}
                className={`p-1 cursor-pointer transition-opacity ${
                  columns === 2 ? "opacity-100 text-black" : "opacity-35 hover:opacity-100"
                }`}
                aria-label="Afficher en 2 colonnes"
              >
                <Grid2X2 size={18} strokeWidth={1.4} />
              </button>
              <button
                onClick={() => setColumns(3)}
                className={`p-1 cursor-pointer transition-opacity ${
                  columns === 3 ? "opacity-100 text-black" : "opacity-35 hover:opacity-100"
                }`}
                aria-label="Afficher en 3 colonnes"
              >
                <Grid3X3 size={18} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>

        {/* Layout: Sidebar + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
          {/* Desktop Filter Sidebar */}
          <FilterSidebar {...filterProps} className="hidden lg:block sticky top-28" />

          {/* Product Grid Area */}
          <div>
            {listedProducts.length > 0 ? (
              <ProductGrid products={listedProducts} columns={columns} />
            ) : (
              <div className="py-24 text-center border border-black/10 p-8">
                <h2
                  className="text-[28px] font-normal text-black"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  Aucune pièce trouvée
                </h2>
                <p className="mt-3 text-[13px] text-stone">
                  Aucun article ne correspond exactement à vos critères de sélection.
                </p>
                <div className="mt-6">
                  <Button onClick={resetFilters} variant="primary">
                    Réinitialiser les filtres
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Mobile Filters Slide-over Modal */}
      {isFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setIsFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 w-[88vw] max-w-xs bg-white p-5 sm:p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-black/10 mb-6">
                <span className="text-[12px] uppercase tracking-[0.16em] font-medium">
                  Filtres
                </span>
                <button
                  onClick={() => setIsFiltersOpen(false)}
                  aria-label="Fermer les filtres"
                  className="p-1 hover:opacity-60 cursor-pointer"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
              <FilterSidebar {...filterProps} />
            </div>
            <div className="pt-6 border-t border-black/10 mt-6">
              <Button
                variant="solid"
                onClick={() => setIsFiltersOpen(false)}
                className="w-full justify-center"
              >
                Voir les {listedProducts.length} pièces
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
