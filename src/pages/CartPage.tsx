import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, ArrowLeft, Tag, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useSiteContent } from "@/context/SiteContentContext";
import ProductImage from "@/components/ProductImage";
import Button, { ButtonLink } from "@/components/Button";
import { calculateShippingFee } from "@/lib/shipping";

const CartPage: React.FC = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    cartTotal,
    cartCount,
    promoCode,
    discountPercentage,
    promoDiscount,
    applyPromoCode,
    removePromoCode,
  } = useCart();

  const { content } = useSiteContent();
  const [inputCode, setInputCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  const discountAmount = cartTotal * promoDiscount;
  const shippingFee = calculateShippingFee({
    subtotal: cartTotal,
    cartIsEmpty: cart.length === 0,
    announcement: content.announcement,
    shippingFee: content.shipping_fee,
    freeShippingThreshold: content.free_shipping_threshold,
  });
  const finalTotal = Math.max(0, cartTotal - discountAmount + shippingFee);

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setIsApplyingPromo(true);
    const success = await applyPromoCode(inputCode);
    setIsApplyingPromo(false);
    if (!success) {
      setPromoError("Ce code promotionnel est invalide ou désactivé.");
    } else {
      setInputCode("");
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Header Section */}
      <section className="border-b border-black/10 bg-[#faf9f6] py-10 lg:py-14">
        <div className="asala-container text-center">
          <span className="text-[11px] uppercase tracking-[0.2em] text-stone font-medium block mb-2">
            Votre Sélection
          </span>
          <h1
            className="text-[34px] sm:text-[44px] font-normal text-black"
            style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
          >
            PANIER D'ACHATS
          </h1>
          <p className="text-[12px] text-stone mt-2">
            {cartCount} article{cartCount > 1 ? "s" : ""} dans votre sélection
          </p>
        </div>
      </section>

      <div className="asala-container py-10 lg:py-16">
        {cart.length === 0 ? (
          /* 29. ÉTATS VIDES PROFESSIONNELS */
          <div className="text-center py-20 border border-black/10 bg-[#faf9f6] max-w-lg mx-auto p-8 sm:p-12">
            <ShoppingBag size={44} strokeWidth={1} className="mx-auto text-stone mb-5" />
            <h2
              className="text-[26px] font-normal text-black uppercase mb-3"
              style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
            >
              Votre Panier est Vide
            </h2>
            <p className="text-[14px] text-stone mb-8 leading-relaxed font-normal">
              Découvrez nos collections d'exception et ajoutez vos pièces de mode traditionnelle tunisienne préférées.
            </p>
            <ButtonLink to="/collection" variant="primary">
              Découvrir la collection
            </ButtonLink>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Left Items Column (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Delivery information */}
              <div className="border border-black/15 p-4 bg-[#faf9f6] text-[11px] text-stone">
                {content.announcement}
              </div>
              {/* Items List */}
              <div className="border-t border-black/10 divide-y divide-black/10">
                {cart.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}-${item.color}`}
                    className="py-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
                  >
                    <div className="flex gap-3 sm:gap-4 items-center">
                      <div className="w-16 h-[84px] sm:w-20 sm:h-[104px] bg-[#f4f2ee] shrink-0 overflow-hidden">
                        <ProductImage
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="!h-full !w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.product.id}`}
                          className="text-[12px] sm:text-[13px] uppercase tracking-wide font-medium text-black hover:text-stone transition-colors truncate block"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-[10px] sm:text-[11px] text-stone uppercase tracking-wider mt-0.5">
                          {item.product.category} {item.size ? `• T: ${item.size}` : ""} {item.color ? `• ${item.color}` : ""}
                        </p>
                        {item.sizeMode === "custom" && (
                          <p className="mt-1 max-w-[280px] text-[10px] leading-relaxed text-stone">
                            Sur mesure · +2 jours · {item.customDetails}
                          </p>
                        )}
                        <p className="text-[12px] sm:text-[13px] text-black font-semibold mt-1">
                          {item.product.price} TND
                        </p>
                      </div>
                    </div>

                    {/* Quantity and Line Total */}
                    <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:gap-6 pt-2 sm:pt-0">
                      {/* Controls */}
                      <div className="flex h-9 items-center border border-black/20">
                        <button
                          onClick={() =>
                            updateQuantity(
                              String(item.product.id),
                              item.quantity - 1,
                              item.size,
                              item.color
                            )
                          }
                          className="w-8 h-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                          aria-label="Diminuer"
                        >
                          <Minus size={11} strokeWidth={1.5} />
                        </button>
                        <span className="w-9 text-center text-[12px] font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              String(item.product.id),
                              item.quantity + 1,
                              item.size,
                              item.color
                            )
                          }
                          className="w-8 h-full flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                          aria-label="Augmenter"
                        >
                          <Plus size={11} strokeWidth={1.5} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <span className="text-[14px] font-semibold text-black min-w-[70px] text-right">
                        {item.product.price * item.quantity} TND
                      </span>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(String(item.product.id), item.size, item.color)}
                        className="text-stone hover:text-black transition-colors cursor-pointer p-1"
                        aria-label="Supprimer l'article"
                      >
                        <Trash2 size={15} strokeWidth={1.4} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Continue Shopping Link */}
              <div className="pt-4">
                <Link
                  to="/collection"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] font-medium text-black hover:text-stone transition-colors"
                >
                  <ArrowLeft size={13} strokeWidth={1.5} />
                  <span>Continuer mes achats</span>
                </Link>
              </div>
            </div>

            {/* Right Summary Column (5 cols) */}
            <div className="lg:col-span-5">
              <div className="border border-black p-4 sm:p-6 lg:p-8 bg-[#faf9f6]">
                <h2 className="text-[12px] uppercase tracking-[0.18em] font-semibold text-black mb-6 pb-3 border-b border-black/10">
                  Récapitulatif de Commande
                </h2>

                {/* Promo Code Form */}
                <div className="mb-6 pb-6 border-b border-black/10">
                  <span className="text-[11px] uppercase tracking-[0.12em] font-medium text-black block mb-2">
                    Code Privilège
                  </span>
                  {promoCode ? (
                    <div className="flex items-center justify-between p-3 border border-black bg-white text-[12px]">
                      <span className="flex items-center gap-2 text-black font-medium">
                        <Tag size={13} /> {promoCode} (-{discountPercentage}%)
                      </span>
                      <button
                        onClick={removePromoCode}
                        className="text-[10px] uppercase tracking-wider text-stone hover:text-black underline cursor-pointer"
                      >
                        Retirer
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        placeholder="Ex: PROMO10"
                        className="flex-1 min-w-0 bg-white border border-black px-3 py-2 sm:px-3.5 sm:py-2.5 text-[12px] uppercase tracking-wider placeholder:normal-case placeholder:tracking-normal placeholder:text-stone/60 outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isApplyingPromo}
                        className="asala-btn shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 disabled:opacity-50"
                      >
                        {isApplyingPromo ? "Vérification…" : "Appliquer"}
                      </button>
                    </form>
                  )}
                  {promoError && (
                    <p className="text-[11px] text-black/70 mt-1.5 font-normal">
                      {promoError}
                    </p>
                  )}
                </div>

                {/* Calculation Rows */}
                <div className="space-y-3 text-[13px] pb-6 border-b border-black/10">
                  <div className="flex justify-between text-stone font-normal">
                    <span>Sous-total articles</span>
                    <span className="text-black font-medium">{cartTotal} TND</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-black font-normal">
                      <span>Réduction ({promoCode})</span>
                      <span>-{Math.round(discountAmount)} TND</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone font-normal">
                    <span>Livraison estimée</span>
                    <span className="text-black font-medium">
                      {shippingFee === 0 ? "Offerte" : `${shippingFee} TND`}
                    </span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-baseline pt-5 mb-8">
                  <span className="text-[13px] uppercase tracking-[0.16em] font-semibold text-black">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="text-[22px] font-semibold text-black">
                      {Math.round(finalTotal)} TND
                    </span>
                    <p className="text-[10px] text-stone tracking-wider mt-0.5">
                      TVA incluse
                    </p>
                  </div>
                </div>

                {/* Checkout CTA Button */}
                <Link
                  to="/checkout"
                  className="asala-btn-solid w-full justify-center py-4"
                >
                  <span>Passer la commande</span>
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>

                <p className="text-[10px] text-stone text-center mt-4 tracking-wide">
                  Paiement sécurisé • Livraison en 24h-48h partout en Tunisie
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
