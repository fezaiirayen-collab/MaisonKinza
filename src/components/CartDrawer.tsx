import React from "react";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useSiteContent } from "@/context/SiteContentContext";
import ProductImage from "@/components/ProductImage";
import { getProductImageForColor } from "@/lib/product-images";
import { calculateShippingFee } from "@/lib/shipping";

const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    closeCart,
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
  } = useCart();

  const { content } = useSiteContent();
  const shippingFee = calculateShippingFee({
    subtotal: cartTotal,
    cartIsEmpty: cart.length === 0,
    announcement: content.announcement,
    shippingFee: content.shipping_fee,
    freeShippingThreshold: content.free_shipping_threshold,
  });

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer Panel */}
      <div className="fixed inset-y-0 right-0 flex h-full max-w-full items-stretch pl-0 sm:pl-10">
        <div className="flex h-full w-screen max-w-md flex-col border-l border-black bg-white">
          
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-black/10 p-4 sm:p-6">
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={18} strokeWidth={1.5} className="text-black" />
              <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black">
                Votre Panier ({cartCount})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1 text-black hover:opacity-60 transition-opacity cursor-pointer"
              aria-label="Fermer le panier"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Delivery information */}
          <div className="shrink-0 border-b border-black/10 bg-[#f9f8f6] p-3 text-[11px] text-stone sm:p-4">
            {content.announcement}
          </div>
          {/* Items List */}
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-6 sm:p-6">
            {cart.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag
                  size={40}
                  strokeWidth={1}
                  className="mx-auto text-stone mb-4"
                />
                <p className="text-[14px] text-stone mb-6 font-normal">
                  Votre panier est actuellement vide.
                </p>
                <Link
                  to="/collection"
                  onClick={closeCart}
                  className="asala-btn inline-flex"
                >
                  <span>Découvrir la collection</span>
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.product.id}-${item.size}-${item.color}`}
                  className="flex gap-3 border-b border-black/10 pb-4 last:border-b-0 sm:gap-4 sm:pb-6"
                >
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#f4f2ee]">
                    <ProductImage
                      src={getProductImageForColor(item.product, item.color)}
                      alt={item.product.name}
                      className="!h-full !w-full object-cover object-center"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <Link
                          to={`/product/${item.product.id}`}
                          onClick={closeCart}
                          className="text-[12px] uppercase tracking-[0.08em] font-medium text-black hover:text-stone transition-colors truncate"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(String(item.product.id), item.size, item.color)}
                          className="text-stone hover:text-black transition-colors cursor-pointer p-0.5"
                          aria-label="Supprimer cet article"
                        >
                          <Trash2 size={14} strokeWidth={1.5} />
                        </button>
                      </div>

                      <p className="text-[11px] text-stone uppercase tracking-wider mt-0.5">
                        {item.product.category} {item.size ? `• Taille ${item.size}` : ""}
                      </p>
                      {item.sizeMode === "custom" && (
                        <p className="mt-1 text-[10px] leading-relaxed text-stone">Sur mesure · +2 jours</p>
                      )}
                      <p className="text-[13px] text-black font-medium mt-1">
                        {item.product.price} TND
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between gap-3 mt-3">
                      <div className="flex items-center border border-black/20">
                        <button
                          onClick={() =>
                            updateQuantity(
                              String(item.product.id),
                              item.quantity - 1,
                              item.size,
                              item.color
                            )
                          }
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                          aria-label="Diminuer la quantité"
                        >
                          <Minus size={11} strokeWidth={1.5} />
                        </button>
                        <span className="w-8 text-center text-[11px] font-medium">
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
                          className="w-7 h-7 flex items-center justify-center hover:bg-black/5 transition-colors cursor-pointer"
                          aria-label="Augmenter la quantité"
                        >
                          <Plus size={11} strokeWidth={1.5} />
                        </button>
                      </div>

                      <span className="text-[13px] font-semibold text-black">
                        {item.product.price * item.quantity} TND
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with totals */}
          {cart.length > 0 && (
            <div className="shrink-0 space-y-4 border-t border-black bg-white p-4 sm:p-6">
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between text-stone">
                  <span>Sous-total</span>
                  <span className="text-black font-medium">{cartTotal} TND</span>
                </div>
                <div className="flex justify-between text-stone">
                  <span>Livraison</span>
                  <span>{shippingFee === 0 ? "Offerte" : `${shippingFee} TND`}</span>
                </div>
                <div className="flex justify-between text-[14px] font-semibold text-black pt-2 border-t border-black/10">
                  <span className="uppercase tracking-wider">TOTAL</span>
                  <span>
                    {cartTotal + shippingFee} TND
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <Link
                  to="/panier"
                  onClick={closeCart}
                  className="asala-btn text-center"
                >
                  Voir Panier
                </Link>
                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="asala-btn-solid text-center"
                >
                  Commander
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
