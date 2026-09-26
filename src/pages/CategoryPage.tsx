import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import ProductGrid from "@/components/ProductGrid";
import ProductImage from "@/components/ProductImage";
import { useProducts } from "@/context/ProductContext";
import { categoryNavigationLabel } from "@/lib/categories";
import { Category } from "@/types";

interface Props {
  category?: Category;
}

const descriptions: Record<string, string> = {
  Caftan:
    "Des caftans d’apparat, brodés avec patience dans des étoffes choisies pour leur tombé noble et leur lumière.",
  Jebba:
    "Lins naturels, soies sauvages et coupes épurées : la jebba tunisienne pensée pour une élégance quotidienne.",
  Robe:
    "Des silhouettes fluides et précises, imaginées pour les réceptions, cocktails et instants précieux.",
  Accessoire:
    "Ceintures mdamma, étoles en soie sauvage et bijoux chichkhan pour sublimer chaque tenue.",
};

const categoryMap: Record<string, Category> = {
  caftans: "Caftan",
  jebbas: "Jebba",
  robes: "Robe",
  accessoires: "Accessoire",
};

const CategoryPage: React.FC<Props> = ({ category: propCategory }) => {
  const { products, categories } = useProducts();
  const location = useLocation();
  const slug = location.pathname.replace(/^\//, "").toLowerCase();
  const categoryRecord = categories.find((item) => item.slug.toLowerCase() === slug);
  const activeCategory =
    propCategory || categoryRecord?.name || categoryMap[slug] || slug.replace(/-/g, " ");

  const [size, setSize] = useState("");
  const [sort, setSort] = useState("newest");

  const categoryProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.category.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [activeCategory, products]);

  const availableSizes = useMemo(() => {
    return Array.from(
      new Set(categoryProducts.flatMap((product) => product.sizes))
    );
  }, [categoryProducts]);

  const visibleProducts = useMemo(() => {
    const result = categoryProducts.filter(
      (product) => !size || product.sizes.includes(size)
    );
    if (sort === "price-asc") return [...result].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...result].sort((a, b) => b.price - a.price);
    return [...result].sort((a, b) => Number(Boolean(b.new)) - Number(Boolean(a.new)));
  }, [categoryProducts, size, sort]);

  const heroImage =
    categoryRecord?.imageUrl || (activeCategory.toLowerCase() === "caftan"
      ? "/caftans-banner.png"
      : activeCategory.toLowerCase() === "accessoire"
        ? "/accessoires-banner.png"
        : activeCategory.toLowerCase() === "robe"
          ? "/robes-banner.png"
          : activeCategory.toLowerCase() === "jebba"
            ? "/jebbas-banner.png"
            : categoryProducts[0]?.images[0] || "/hero-model.jpg");

  const displayName = categoryNavigationLabel(activeCategory).toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* Editorial Category Banner */}
      <section className="asala-container pt-6 sm:pt-8 lg:pt-10">
        <div className="relative aspect-[16/9] min-h-[180px] overflow-hidden bg-[#f4f2ee] sm:aspect-[3/1] sm:min-h-[240px] lg:min-h-[320px]">
          <ProductImage
            src={heroImage}
            alt={activeCategory}
            className="absolute inset-0 h-full w-full object-cover object-[65%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

          <div className="absolute inset-0 flex items-end p-5 text-white sm:p-8 lg:p-12">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 sm:text-[11px]">
                KENZA — Collection {activeCategory}
              </p>
              <h1
                className="mt-2 text-[32px] font-normal leading-none tracking-tight text-white sm:text-[48px] lg:text-[64px]"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                {displayName}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Products Section */}
      <section className="asala-container py-8 lg:py-14">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-5 border-b border-black/15">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-3 text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
              <span className="text-black font-semibold">{visibleProducts.length}</span> pièces
            </span>
            {availableSizes.map((item) => (
              <button
                key={item}
                onClick={() => setSize(size === item ? "" : item)}
                className={`min-w-9 h-8 border px-2.5 text-[11px] font-medium transition-colors cursor-pointer ${
                  size === item
                    ? "bg-black border-black text-white"
                    : "border-black/20 text-black hover:border-black bg-transparent"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em]">
            <span className="text-stone">Trier par</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border-b border-black pb-1 bg-transparent outline-none cursor-pointer"
            >
              <option value="newest">Nouveautés</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="pt-10">
          {visibleProducts.length > 0 ? (
            <ProductGrid products={visibleProducts} columns={4} />
          ) : (
            <div className="py-20 text-center border border-black/10 p-8">
              <p className="text-[14px] text-stone">
                Aucune création ne correspond à la taille sélectionnée.
              </p>
              <button
                onClick={() => setSize("")}
                className="asala-btn mt-6"
              >
                Afficher toutes les tailles
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default CategoryPage;
