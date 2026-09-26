// src/context/CartContext.tsx
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Product, CartItem, Order } from "@/types";
import { useSiteContent } from "@/context/SiteContentContext";
import { calculateShippingFee } from "@/lib/shipping";
import { supabase } from "@/lib/supabase";

interface CartContextValue {
  cart: CartItem[];
  favorites: Product[];
  orders: Order[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  quickViewProduct: Product | null;
  isSizeGuideOpen: boolean;
  promoCode: string;
  discountPercentage: number;
  promoDiscount: number; // Decimal (e.g. 0.10)
  cartCount: number;
  cartTotal: number;
  finalTotal: number;

  // Actions
  openCart: () => void;
  closeCart: () => void;
  setIsCartOpen: (open: boolean) => void;
  openSearch: () => void;
  closeSearch: () => void;
  setIsSearchOpen: (open: boolean) => void;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  setQuickViewProduct: (product: Product | null) => void;
  openSizeGuide: () => void;
  closeSizeGuide: () => void;
  setIsSizeGuideOpen: (open: boolean) => void;

  addToCart: (product: Product, qty?: number, size?: string, color?: string, sizeMode?: "standard" | "custom", customDetails?: string) => void;
  removeFromCart: (productId: string, size?: string, color?: string) => void;
  updateQuantity: (productId: string, qty: number, size?: string, color?: string) => void;
  clearCart: () => void;
  toggleFavorite: (product: Product) => void;
  isFavorite: (productId: string) => boolean;
  applyPromoCode: (code: string) => Promise<boolean>;
  removePromoCode: () => void;
  addOrder: (order: Order) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "asala_cart";
const FAVORITES_STORAGE_KEY = "asala_favorites";
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { content } = useSiteContent();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [promoCode, setPromoCode] = useState<string>("");
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const storageHydrated = useRef(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      const storedFav = localStorage.getItem(FAVORITES_STORAGE_KEY);
      localStorage.removeItem("asala_orders");
      if (storedCart) setCart(JSON.parse(storedCart));
      if (storedFav) setFavorites(JSON.parse(storedFav));
    } catch (e) {
      console.error("Failed to parse storage", e);
    } finally {
      storageHydrated.current = true;
    }
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!storageHydrated.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error("Failed to persist cart", e);
    }
  }, [cart]);

  useEffect(() => {
    if (!storageHydrated.current) return;
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to persist favorites", e);
    }
  }, [favorites]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const openSearch = () => setIsSearchOpen(true);
  const closeSearch = () => setIsSearchOpen(false);

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const openSizeGuide = () => setIsSizeGuideOpen(true);
  const closeSizeGuide = () => setIsSizeGuideOpen(false);

  const addToCart = (product: Product, qty = 1, size?: string, color?: string, sizeMode: "standard" | "custom" = "standard", customDetails = "") => {
    const chosenSize = sizeMode === "custom" ? "Sur mesure" : (size || (product.sizes?.length > 0 ? product.sizes[0] : "Standard"));
    const chosenColor = color || (product.colors?.length > 0 ? product.colors[0] : "Naturel");
    const normalizedCustomDetails = sizeMode === "custom" ? customDetails.trim() : "";

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          String(i.product.id) === String(product.id) &&
          i.size === chosenSize &&
          i.color === chosenColor &&
          (i.sizeMode || "standard") === sizeMode &&
          (i.customDetails || "") === normalizedCustomDetails
      );
      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + (qty || 1) }
            : item
        );
      }
      return [...prev, {
        product,
        quantity: qty || 1,
        size: chosenSize,
        color: chosenColor,
        sizeMode,
        customDetails: normalizedCustomDetails || undefined,
      }];
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string, size?: string, color?: string) => {
    setCart((prev) =>
      prev.filter(
        (i) =>
          !(
            String(i.product.id) === String(productId) &&
            (size ? i.size === size : true) &&
            (color ? i.color === color : true)
          )
      )
    );
  };

  const updateQuantity = (productId: string, qty: number, size?: string, color?: string) => {
    if (qty <= 0) {
      removeFromCart(productId, size, color);
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        String(i.product.id) === String(productId) &&
        (size ? i.size === size : true) &&
        (color ? i.color === color : true)
          ? { ...i, quantity: qty }
          : i
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    setPromoCode("");
    setDiscountPercentage(0);
  };

  const toggleFavorite = (product: Product) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => String(p.id) === String(product.id));
      if (exists) {
        return prev.filter((p) => String(p.id) !== String(product.id));
      }
      return [...prev, product];
    });
  };

  const isFavorite = (productId: string) => {
    return favorites.some((p) => String(p.id) === String(productId));
  };

  const applyPromoCode = async (code: string): Promise<boolean> => {
    const clean = code.trim().toUpperCase();
    if (!clean || !supabase) return false;

    const { data, error } = await supabase.rpc("validate_promo_code", { p_code: clean });
    const promo = Array.isArray(data) ? data[0] : data;
    if (error || !promo) return false;

    setPromoCode(clean);
    setDiscountPercentage(Number(promo.discount_percentage) || 0);
    return true;
  };

  const removePromoCode = () => {
    setPromoCode("");
    setDiscountPercentage(0);
  };

  const addOrder = (order: Order) => {
    setOrders((prev) => [order, ...prev]);
    clearCart();
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const promoDiscount = discountPercentage / 100;
  const discountAmount = cartTotal * promoDiscount;
  const shippingFee = calculateShippingFee({
    subtotal: cartTotal,
    cartIsEmpty: cart.length === 0,
    announcement: content.announcement,
    shippingFee: content.shipping_fee,
    freeShippingThreshold: content.free_shipping_threshold,
  });
  const finalTotal = Math.max(0, cartTotal - discountAmount + shippingFee);

  const value: CartContextValue = {
    cart,
    favorites,
    orders,
    isCartOpen,
    isSearchOpen,
    quickViewProduct,
    isSizeGuideOpen,
    promoCode,
    discountPercentage,
    promoDiscount,
    cartCount,
    cartTotal,
    finalTotal,

    openCart,
    closeCart,
    setIsCartOpen,
    openSearch,
    closeSearch,
    setIsSearchOpen,
    openQuickView,
    closeQuickView,
    setQuickViewProduct,
    openSizeGuide,
    closeSizeGuide,
    setIsSizeGuideOpen,

    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleFavorite,
    isFavorite,
    applyPromoCode,
    removePromoCode,
    addOrder,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
