import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Product } from "@/types";

interface Props {
  products: Product[];
}

const AUTO_PLAY_DELAY = 4500;

const NewArrivalsCarousel: React.FC<Props> = ({ products }) => {
  const canSlide = products.length > 2;
  const [currentIndex, setCurrentIndex] = useState(canSlide ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

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
    if (!canSlide || isPaused) return undefined;

    const timer = window.setInterval(() => {
      setCurrentIndex((index) => index + 1);
    }, AUTO_PLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [canSlide, isPaused]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  const move = (direction: -1 | 1) => {
    if (!canSlide) return;
    setIsTransitioning(true);
    setCurrentIndex((index) => index + direction);
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
    <div
      className="new-arrivals-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsPaused(false);
      }}
    >
      <div className="new-arrivals-carousel__viewport">
        <div
          className={`new-arrivals-carousel__track${isTransitioning ? " is-transitioning" : ""}`}
          style={{ "--new-arrivals-index": currentIndex } as React.CSSProperties}
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
