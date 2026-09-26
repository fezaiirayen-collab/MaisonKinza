import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, Minus, Plus, Ruler, ShoppingBag, Truck, RotateCcw, ShieldCheck } from "lucide-react";
import { useProducts } from "@/context/ProductContext";
import { useCart } from "@/context/CartContext";
import ProductGallery from "@/components/ProductGallery";
import ProductGrid from "@/components/ProductGrid";
import Accordion from "@/components/Accordion";
import Button, { ButtonLink } from "@/components/Button";
import type { Product } from "@/types";

const categoryPath: Record<string, string> = {
  Caftan: "/caftans",
  Jebba: "/jebbas",
  Robe: "/robes",
  Accessoire: "/accessoires",
};

const getImagesForColor = (product: Product, color: string) => {
  const matchingEntry = Object.entries(product.colorImages || {}).find(
    ([name]) => name.toLowerCase() === color.toLowerCase(),
  );
  return matchingEntry?.[1]?.length ? matchingEntry[1] : product.images;
};

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products } = useProducts();
  const product = products.find((item) => String(item.id) === String(id));
  const { addToCart, toggleFavorite, isFavorite, openSizeGuide } = useCart();

  const [size, setSize] = useState("");
  const [sizeMode, setSizeMode] = useState<"standard" | "custom">("standard");
  const [customDetails, setCustomDetails] = useState("");
  const [customSizeError, setCustomSizeError] = useState("");
  const [color, setColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState("craft");

  if (!product) {
    return (
      <div className="asala-container py-28 text-center">
        <h1
          className="text-[36px] font-normal text-black"
          style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
        >
          Pièce introuvable
        </h1>
        <p className="mt-4 text-[14px] text-stone">
          Cette création n’est plus disponible ou a été déplacée.
        </p>
        <div className="mt-8">
          <ButtonLink to="/collection" variant="primary">
            Retour à la collection
          </ButtonLink>
        </div>
      </div>
    );
  }

  const canCustomize = product.category.trim().toLowerCase() !== "accessoire" && product.category.trim().toLowerCase() !== "accessoires";
  const selectedSize = sizeMode === "custom" ? "Sur mesure" : (size || product.sizes[0] || "Standard");
  const selectedColor = color || product.colors[0] || "Naturel";
  const selectedColorImages = getImagesForColor(product, selectedColor);
  const fav = isFavorite(String(product.id));
  const related = products
    .filter((item) => String(item.id) !== String(product.id) && item.category === product.category)
    .slice(0, 4);

  const toggleAccordion = (key: string) => {
    setOpenAccordion(openAccordion === key ? "" : key);
  };

  const handleAddToCart = () => {
    if (sizeMode === "custom" && customDetails.trim().length < 10) {
      setCustomSizeError("Ajoutez vos mesures ou vos précisions (10 caractères minimum).");
      return;
    }
    setCustomSizeError("");
    addToCart(product, quantity, selectedSize, selectedColor, sizeMode, customDetails);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="border-b border-black/10">
        <div className="asala-container py-3 sm:py-4 text-[10px] uppercase tracking-[0.14em] text-stone flex flex-wrap items-center gap-1.5 sm:gap-2">
          <Link to="/" className="text-black hover:text-stone transition-colors">
            Accueil
          </Link>
          <span>/</span>
          <Link to="/collection" className="text-black hover:text-stone transition-colors">
            Collection
          </Link>
          <span>/</span>
          <Link
            to={categoryPath[product.category] || "/collection"}
            className="text-black hover:text-stone transition-colors"
          >
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-stone truncate max-w-[200px] sm:max-w-none">{product.name}</span>
        </div>
      </div>

      {/* Main Product Layout (55% Gallery / 45% Info with generous gap) */}
      <main className="asala-container py-6 sm:py-10 lg:py-16">
        <div className="grid min-w-0 grid-cols-1 items-start gap-8 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(320px,1fr)] lg:gap-12 xl:grid-cols-[minmax(620px,0.72fr)_minmax(320px,1.28fr)] xl:gap-16">
          
          {/* LEFT: 55% GALLERY */}
          <div className="w-full">
            <ProductGallery
              key={selectedColor}
              images={selectedColorImages}
              name={product.name}
              isNew={product.new}
            />
          </div>

          {/* RIGHT: 45% PRODUCT INFORMATION */}
          <div className="flex min-w-0 w-full flex-col lg:sticky lg:top-28">
            {/* 1. Catégorie (spacing 16px) */}
            <p className="text-[11px] uppercase tracking-[0.18em] text-stone font-medium mb-3 sm:mb-4">
              {product.category}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mb-3 inline-flex w-fit bg-red-600 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white">
                En promotion
              </span>
            )}

            {/* 2. Nom du produit (36-48px) (spacing 12px) */}
            <div className="flex min-w-0 items-start justify-between gap-3 mb-3">
              <h1
                className="min-w-0 flex-1 text-[26px] xs:text-[32px] sm:text-[40px] xl:text-[44px] font-normal leading-[1.05] tracking-tight text-black"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                {product.name}
              </h1>
              <button
                onClick={() => toggleFavorite(product)}
                aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
                className="mt-1.5 p-1 text-black hover:opacity-60 transition-opacity cursor-pointer shrink-0"
              >
                <Heart
                  size={22}
                  strokeWidth={1.5}
                  className={fav ? "fill-black text-black" : "text-black"}
                />
              </button>
            </div>

            {/* 3. Prix (spacing 20px) */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-5">
              <span className="text-[21px] sm:text-[22px] font-normal text-black">
                {product.price} TND
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[14px] text-stone line-through font-normal">
                  {product.originalPrice} TND
                </span>
              )}
              <span className="text-[10px] sm:text-[11px] text-stone uppercase tracking-widest sm:pl-2 sm:border-l sm:border-black/15">
                TVA incluse
              </span>
            </div>

            {/* 4. Description courte (spacing 28px) */}
            <p className="max-w-2xl text-[13px] sm:text-[14px] leading-relaxed text-stone font-normal mb-7">
              {product.description}
            </p>

            {/* 5. Sélection Taille + Guide des tailles (spacing 28px) */}
            <div className="border-t border-black/10 pt-6 mb-7">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-black">
                  Taille <span className="text-stone ml-1">({selectedSize})</span>
                </span>
                <button
                  onClick={openSizeGuide}
                  className="inline-flex items-center gap-1.5 text-[11px] text-stone hover:text-black underline underline-offset-4 transition-colors cursor-pointer"
                >
                  <Ruler size={13} strokeWidth={1.4} />
                  <span>Guide des tailles</span>
                </button>
              </div>

              {canCustomize && (
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setSizeMode("standard"); setCustomSizeError(""); }}
                    className={`border px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      sizeMode === "standard" ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                    }`}
                  >
                    Taille standard
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSizeMode("custom"); setCustomSizeError(""); }}
                    className={`border px-3 py-2.5 text-left text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      sizeMode === "custom" ? "border-black bg-black text-white" : "border-black/20 hover:border-black"
                    }`}
                  >
                    Sur mesure <span className="block pt-0.5 text-[9px] normal-case tracking-normal opacity-70">+2 jours</span>
                  </button>
                </div>
              )}

              {sizeMode === "standard" ? (
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const isSelected = selectedSize === s;
                    return (
                      <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`min-w-12 h-11 border px-3 text-[11px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "border-black/20 text-black hover:border-black bg-transparent"
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    value={customDetails}
                    onChange={(event) => { setCustomDetails(event.target.value); setCustomSizeError(""); }}
                    rows={3}
                    maxLength={1000}
                    placeholder="Indiquez vos mesures et précisions : poitrine, taille, hanches, longueur…"
                    className="w-full resize-y border border-black/25 px-3 py-2.5 text-[12px] outline-none focus:border-black"
                  />
                  <p className="text-[10px] leading-relaxed text-stone">Notre atelier vous contactera pour confirmer les mesures. Le sur-mesure ajoute 2 jours au délai de livraison.</p>
                  {customSizeError && <p className="text-[11px] text-red-700">{customSizeError}</p>}
                </div>
              )}
            </div>

            {/* 6. Couleurs */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-7">
                <p className="text-[11px] uppercase tracking-[0.16em] font-medium text-black mb-3">
                  Couleur <span className="text-stone ml-1 font-normal">({selectedColor})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => {
                    const isSelected = selectedColor === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`h-9 border px-3.5 text-[11px] transition-colors cursor-pointer ${
                          isSelected
                            ? "border-black text-black font-medium bg-black/5"
                            : "border-black/20 text-stone hover:border-black hover:text-black"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. Quantité */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-7">
              <span className="text-[11px] uppercase tracking-[0.16em] font-medium text-black">
                Quantité
              </span>
              <div className="flex h-11 items-center border border-black/20">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Diminuer la quantité"
                >
                  <Minus size={13} strokeWidth={1.5} />
                </button>
                <span className="w-10 text-center text-[12px] font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                  aria-label="Augmenter la quantité"
                >
                  <Plus size={13} strokeWidth={1.5} />
                </button>
              </div>
              <span className={`text-[11px] ${product.inStock === false ? "text-red-700" : "text-stone"}`}>
                {product.inStock === false ? "Épuisé" : "Disponible"}
              </span>
            </div>

            {/* 8. Boutons d'action (CTA) (spacing 24px) */}
            <div className="space-y-3 mb-8">
              <Button
                variant="solid"
                onClick={handleAddToCart}
                className="w-full h-[52px] text-[11px] tracking-[0.16em]"
              >
                <ShoppingBag size={16} strokeWidth={1.5} />
                <span>Ajouter au panier</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => toggleFavorite(product)}
                className="w-full h-[52px] text-[11px] tracking-[0.16em]"
              >
                <Heart
                  size={16}
                  strokeWidth={1.5}
                  className={fav ? "fill-black" : ""}
                />
                <span>{fav ? "Dans vos favoris" : "Ajouter aux favoris"}</span>
              </Button>
            </div>

            {/* 9. Informations de réassurance */}
            <div className="grid grid-cols-3 gap-1 sm:gap-3 border-y border-black/10 py-4 sm:py-5 mb-6 text-center text-[9px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.12em] text-stone">
              <div className="flex flex-col items-center gap-1.5">
                <Truck size={17} strokeWidth={1.3} className="text-black" />
                <span>Livraison partout</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 border-x border-black/10">
                <RotateCcw size={17} strokeWidth={1.3} className="text-black" />
                <span>Retours sous 14 j</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck size={17} strokeWidth={1.3} className="text-black" />
                <span>Paiement sécurisé</span>
              </div>
            </div>

            {/* 10. Accordéons (spacing 20px) */}
            <div className="border-t border-black/10">
              <Accordion
                title="Matières & Savoir-Faire"
                open={openAccordion === "craft"}
                onToggle={() => toggleAccordion("craft")}
              >
                <div className="space-y-2 text-[13px] text-stone">
                  <p>
                    <strong className="text-black font-medium">Étoffe :</strong>{" "}
                    {product.fabric || "Soie et fibres nobles artisanales"}
                  </p>
                  <p>
                    <strong className="text-black font-medium">Entretien :</strong>{" "}
                    {product.care || "Nettoyage à sec spécialisé recommandé"}
                  </p>
                  {product.details && product.details.length > 0 && (
                    <ul className="mt-3 space-y-1 list-disc pl-4">
                      {product.details.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </Accordion>

              <Accordion
                title="Livraison en Tunisie"
                open={openAccordion === "delivery"}
                onToggle={() => toggleAccordion("delivery")}
              >
                <p className="text-[13px] text-stone leading-relaxed">
                  Livraison partout en Tunisie à 7 TND. Expédition soignée dans son coffret protecteur KENZA. Délais moyens : 24 à 48h sur le Grand Tunis, 48 à 72h sur le reste du pays.
                </p>
              </Accordion>

              <Accordion
                title="Retours & Échanges"
                open={openAccordion === "returns"}
                onToggle={() => toggleAccordion("returns")}
              >
                <p className="text-[13px] text-stone leading-relaxed">
                  Vous disposez d'un délai de 14 jours à compter de la réception de votre colis pour effectuer un retour ou demander un échange de taille. Les pièces doivent être retournées neuves, non portées et avec leurs étiquettes d'origine.
                </p>
              </Accordion>
            </div>
          </div>
        </div>
      </main>

      {/* Related Products: Vous aimerez aussi */}
      {related.length > 0 && (
        <section className="border-t border-black/10 py-16 lg:py-24 bg-[#faf9f6]">
          <div className="asala-container">
            <div className="flex items-end justify-between mb-10 pb-4 border-b border-black/15">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
                  Dans le même univers
                </p>
                <h2
                  className="text-[28px] sm:text-[36px] font-normal text-black mt-1"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  VOUS AIMEREZ AUSSI
                </h2>
              </div>
              <Link
                to={categoryPath[product.category] || "/collection"}
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-medium text-black hover:text-stone transition-colors"
              >
                Voir toute la collection
              </Link>
            </div>
            <ProductGrid products={related} columns={4} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductPage;
