import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";

interface Props {
  products: Product[];
}

const AUTO_PLAY_DELAY = 4500;
const SWIPE_THRESHOLD = 45;

const NewArrivalsCarousel: React.FC<Props> = ({ products }) => {
  const canSlide = products.length > 2;
  const [currentIndex, setCurrentIndex] = useState(canSlide ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const resetTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);

  const slides = useMemo(() => {
    if (!canSlide) return products;
    return [products[products.length - 1], ...products, products[0]];
  }, [canSlide, products]);

  useEffect(() => {
    setCurrentIndex(canSlide ? 1 : 0);
    setIsTransitioning(false);
    const frame = window.requestAnimationFrame(() => setIsTransitioning(true));
    return () => window.cancelAnimationFrame(frame);
  }, [canSlide, products.length]);

  useEffect(() => {
    if (!canSlide || isDragging) return undefined;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => index + 1);
    }, AUTO_PLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [canSlide, isDragging]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
      if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    };
  }, []);

  const move = (direction: -1 | 1) => {
    if (!canSlide) return;
    setIsTransitioning(true);
    setCurrentIndex((index) => index + direction);
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!canSlide) return;
    const touch = event.touches[0];
    setIsDragging(true);
    setIsTransitioning(false);
    setDragOffset(0);
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    if (!start || !canSlide) return;

    const touch = event.touches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    setDragOffset(deltaX);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || !canSlide) {
      setIsDragging(false);
      return;
    }

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY)) {
      setDragOffset(0);
      setIsDragging(false);
      setIsTransitioning(true);
      return;
    }

    event.preventDefault();
    setDragOffset(0);
    setIsDragging(false);
    suppressClickRef.current = true;
    if (suppressClickTimerRef.current !== null) window.clearTimeout(suppressClickTimerRef.current);
    suppressClickTimerRef.current = window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 500);
    move(deltaX < 0 ? 1 : -1);
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleTransitionEnd = (event: React.TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (!canSlide) return;

    const isAfterLastProduct = currentIndex === slides.length - 1;
    const isBeforeFirstProduct = currentIndex === 0;
    if (!isAfterLastProduct && !isBeforeFirstProduct) return;

    setIsTransitioning(false);
    setCurrentIndex(isAfterLastProduct ? 1 : products.length);

    resetTimerRef.current = window.setTimeout(() => {
      setIsTransitioning(true);
    }, 30);
  };

  if (products.length === 0) return null;

  return (
    <div className="new-arrivals-carousel">
      <div
        className="new-arrivals-carousel__viewport"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
      >
        <div
          className={`new-arrivals-carousel__track${isTransitioning && !isDragging ? " is-transitioning" : ""}${isDragging ? " is-dragging" : ""}`}
          style={{
            "--new-arrivals-index": currentIndex,
            "--new-arrivals-drag": `${dragOffset}px`,
          } as React.CSSProperties}
          onTransitionEnd={handleTransitionEnd}
        >
          {slides.map((product, index) => (
            <div className="new-arrivals-carousel__slide" key={`${product.id}-${index}`}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {canSlide && (
        <div className="new-arrivals-carousel__controls" aria-label="Navigation des nouveautés">
          <button type="button" onClick={() => move(-1)} aria-label="Produit précédent">
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <button type="button" onClick={() => move(1)} aria-label="Produit suivant">
            <ArrowRight size={16} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
};

export default NewArrivalsCarousel;
