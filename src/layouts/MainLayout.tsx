// src/layouts/MainLayout.tsx
import React, { lazy, Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HubSpotPageViewTracker from "@/components/HubSpotPageViewTracker";
import { useCart } from "@/context/CartContext";

const SearchOverlay = lazy(() => import("@/components/SearchOverlay"));
const CartDrawer = lazy(() => import("@/components/CartDrawer"));
const QuickViewModal = lazy(() => import("@/components/QuickViewModal"));
const SizeGuideModal = lazy(() => import("@/components/SizeGuideModal"));

const MainLayout: React.FC = () => {
  const { isSearchOpen, isCartOpen, quickViewProduct, isSizeGuideOpen } = useCart();

  return (
    <div className="flex flex-col min-h-screen bg-white text-black selection:bg-black selection:text-white">
      <HubSpotPageViewTracker />
      <ScrollRestoration />

      {/* Top announcement bar */}
      <TopBar />

      {/* Main sticky header */}
      <Header />

      {/* Page content */}
      <main className="flex-1 bg-white">
        <Outlet />
      </main>

      {/* 5-column editorial footer */}
      <Footer />

      {/* Global interactive drawers & modals */}
      <Suspense fallback={null}>
        {isSearchOpen && <SearchOverlay />}
        {isCartOpen && <CartDrawer />}
        {quickViewProduct && <QuickViewModal />}
        {isSizeGuideOpen && <SizeGuideModal />}
      </Suspense>
    </div>
  );
};

export default MainLayout;
