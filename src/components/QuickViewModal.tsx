import React, { useState, useEffect } from "react";
import { X, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";

const QuickViewModal: React.FC = () => {
  const { quickViewProduct, closeQuickView, addToCart, toggleFavorite, isFavorite } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [sizeMode, setSizeMode] = useState<"standard" | "custom">("standard");
  const [customDetails, setCustomDetails] = useState("");
  const [customSizeError, setCustomSizeError] = useState("");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  // Reset state whenever the viewed product changes
  useEffect(() => {
    setSelectedSize("");
    setSizeMode("standard");
    setCustomDetails("");
    setCustomSizeError("");
    setSelectedImageIdx(0);
  }, [quickViewProduct?.id]);

  if (!quickViewProduct) return null;

  const fav = isFavorite(String(quickViewProduct.id));
  const currentSize = sizeMode === "custom" ? "Sur mesure" : (
    selectedSize ||
    (quickViewProduct.sizes && quickViewProduct.sizes.length > 0
      ? quickViewProduct.sizes[0]
      : "Standard"));
  const canCustomize = quickViewProduct.category.trim().toLowerCase() !== "accessoire" && quickViewProduct.category.trim().toLowerCase() !== "accessoires";

  const handleAddToCart = () => {
    if (sizeMode === "custom" && customDetails.trim().length < 10) {
      setCustomSizeError("Ajoutez vos mesures ou vos précisions.");
      return;
    }
    addToCart(quickViewProduct, 1, currentSize, undefined, sizeMode, customDetails);
    closeQuickView();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 select-none"
      onClick={closeQuickView}
      role="presentation"
    >
      <div
        className="relative bg-white border border-black max-w-3xl w-full flex flex-col md:flex-row shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeQuickView}
          className="absolute top-4 right-4 z-10 p-1.5 bg-white text-black border border-black/20 hover:border-black transition-colors cursor-pointer"
          aria-label="Fermer l'aperçu"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Gallery Column */}
        <div className="md:w-1/2 flex flex-col bg-[#f4f2ee]">
          <div className="aspect-[3/4] overflow-hidden relative">
            <ProductImage
              src={quickViewProduct.images[selectedImageIdx] || quickViewProduct.images[0]}
              alt={quickViewProduct.name}
              className="w-full h-full object-cover"
            />
          </div>
          {quickViewProduct.images.length > 1 && (
            <div className="flex gap-2 p-3 bg-white border-t border-black/10">
              {quickViewProduct.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-14 h-16 border overflow-hidden cursor-pointer ${
                    selectedImageIdx === idx ? "border-black" : "border-black/20 opacity-60"
                  }`}
                >
                  <ProductImage src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
              {quickViewProduct.category}
            </span>
            <h3
              className="text-[24px] font-normal leading-tight text-black mt-2 uppercase"
              style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
            >
              {quickViewProduct.name}
            </h3>
            <p className="text-[16px] text-black font-medium mt-2">
              {quickViewProduct.price} TND
            </p>

            <div className="h-px bg-black/10 my-4" />

            <p className="text-[13px] text-stone leading-relaxed font-normal mb-6">
              {quickViewProduct.description}
            </p>

            {/* Size Selector */}
            {(canCustomize || (quickViewProduct.sizes && quickViewProduct.sizes.length > 0)) && (
              <div className="mb-6">
                <span className="text-[11px] uppercase tracking-wider text-black font-medium block mb-2">
                  Taille : {currentSize}
                </span>
                {canCustomize && (
                  <div className="mb-3 grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => { setSizeMode("standard"); setCustomSizeError(""); }} className={`border px-2 py-2 text-[10px] uppercase ${sizeMode === "standard" ? "border-black bg-black text-white" : "border-black/20"}`}>Standard</button>
                    <button type="button" onClick={() => { setSizeMode("custom"); setCustomSizeError(""); }} className={`border px-2 py-2 text-[10px] uppercase ${sizeMode === "custom" ? "border-black bg-black text-white" : "border-black/20"}`}>Sur mesure (+2 j)</button>
                  </div>
                )}
                {sizeMode === "standard" ? (
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(s)}
                        className={`min-w-10 h-10 px-3 border text-[11px] uppercase font-medium transition-colors cursor-pointer ${
                          currentSize === s
                            ? "border-black bg-black text-white"
                            : "border-black/20 text-black hover:border-black"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea value={customDetails} onChange={(event) => { setCustomDetails(event.target.value); setCustomSizeError(""); }} rows={2} maxLength={1000} placeholder="Vos mesures et précisions" className="w-full resize-y border border-black/25 px-2.5 py-2 text-[11px] outline-none focus:border-black" />
                    {customSizeError && <p className="text-[10px] text-red-700">{customSizeError}</p>}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-black/10">
            <button
              onClick={handleAddToCart}
              className="w-full asala-btn-solid justify-center"
            >
              <ShoppingBag size={15} strokeWidth={1.5} />
              <span>Ajouter au panier</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => toggleFavorite(quickViewProduct)}
                className={`flex-1 border py-2.5 text-[11px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                  fav
                    ? "border-black bg-black/5 text-black"
                    : "border-black/20 hover:border-black text-black"
                }`}
              >
                <Heart size={14} strokeWidth={1.5} className={fav ? "fill-black" : ""} />
                <span>{fav ? "Dans les favoris" : "Favoris"}</span>
              </button>

              <Link
                to={`/product/${quickViewProduct.id}`}
                onClick={closeQuickView}
                className="flex-1 border border-black py-2.5 text-[11px] uppercase tracking-wider text-center hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Voir détails</span>
                <ArrowRight size={13} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;

