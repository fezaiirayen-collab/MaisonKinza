// src/router.tsx
import React, { lazy, useEffect } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

const HomePage = lazy(() => import("@/pages/HomePage"));
const CollectionPage = lazy(() => import("@/pages/CollectionPage"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CartPage = lazy(() => import("@/pages/CartPage"));
const FavoritesPage = lazy(() => import("@/pages/FavoritesPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const AboutPage = lazy(() => import("@/pages/AboutPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const TrackOrderPage = lazy(() => import("@/pages/TrackOrderPage"));

const LocalAdminRedirect: React.FC = () => {
  useEffect(() => {
    if (import.meta.env.DEV) window.location.replace("http://localhost:5174/");
  }, []);

  if (!import.meta.env.DEV) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2ee] text-[12px] uppercase tracking-[0.14em] text-stone">
      Ouverture du tableau de bord…
    </div>
  );
};

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <MainLayout />,
      children: [
      { index: true, element: <HomePage /> },
      { path: "collection", element: <CollectionPage /> },
      { path: "nouveautes", element: <CollectionPage /> },
      { path: "product/:id", element: <ProductPage /> },

      // Cart & Checkout
      { path: "panier", element: <CartPage /> },
      { path: "cart", element: <Navigate to="/panier" replace /> },
      { path: "checkout", element: <CheckoutPage /> },
      { path: "suivi-commande", element: <TrackOrderPage /> },
      { path: "track-order", element: <TrackOrderPage /> },

      // Favorites
      { path: "favoris", element: <FavoritesPage /> },
      { path: "favorites", element: <Navigate to="/favoris" replace /> },

      // Account
      { path: "compte", element: <AccountPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "reinitialiser-mot-de-passe", element: <ResetPasswordPage /> },
      { path: "account", element: <Navigate to="/compte" replace /> },

      // Categories
      { path: "caftans", element: <CategoryPage category="Caftan" /> },
      { path: "robes", element: <CategoryPage category="Robe" /> },
      { path: "jebbas", element: <CategoryPage category="Jebba" /> },
      { path: "accessoires", element: <CategoryPage category="Accessoire" /> },
      { path: ":categorySlug", element: <CategoryPage /> },

      // Brand pages
      { path: "a-propos", element: <AboutPage /> },
      { path: "about", element: <Navigate to="/a-propos" replace /> },
      { path: "contact", element: <ContactPage /> },
      { path: "faq", element: <FaqPage /> },

      // Raccourci local vers le dashboard de gestion séparé.
      { path: "vrai-admin", element: <LocalAdminRedirect /> },

      // Fallback
      { path: "*", element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, "") || "/" },
);

export default router;
