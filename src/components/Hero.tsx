import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSiteContent } from "@/context/SiteContentContext";
import { publicAsset } from "@/lib/publicAsset";
 
interface Slide {
  id: string;
  tagline: string;
  arabicTitle: string;
  titleLines: string[];
  description: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}
 
const slides: Slide[] = [
  {
    id: "01",
    tagline: "TRADITION — ÉLÉGANCE — INTEMPORALITÉ",
    arabicTitle: "كنزة",
    titleLines: ["L'ART DU", "TRADITIONNEL"],
    description:
      "Des pièces intemporelles, pensées pour aujourd’hui.\nL’héritage de la couture tunisienne sublimé dans une esthétique contemporaine.",
    ctaText: "Découvrir la collection",
    ctaLink: "/collection",
    image: "/hero-slide-01.png",
  },
  {
    id: "02",
    tagline: "ÉDITION JEBBA — HAUTE COUTURE",
    arabicTitle: "كنزة",
    titleLines: ["SPLENDEUR", "& MAJESTÉ"],
    description:
      "L’art de la jebba et du caftan d’apparat.\nBroderies au fil d'or et soies d'art pour vos célébrations les plus précieuses.",
    ctaText: "Explorer les jebbas",
    ctaLink: "/jebbas",
    image: "/hero-slide-02-kenza.jpg",
  },
  {
    id: "03",
    tagline: "L'ESSENCE DU LIN — CRÉATION ARTISANALE",
    arabicTitle: "كنزة",
    titleLines: ["LA JEBBA", "RÉINVENTÉE"],
    description:
      "Lignes fluides, pureté des matières et finitions cousues main.\nLa noblesse de la jebba tunisienne dans son expression moderne.",
    ctaText: "Voir les nouveautés",
    ctaLink: "/nouveautes",
    image: "/hero-slide-03.png",
  },
];
 
const Hero: React.FC = () => {
  const { content } = useSiteContent();
  const [current, setCurrent] = useState(0);

  const editableSlides: Slide[] = slides.map((slide) => {
    const prefix = `home_hero_${slide.id}`;
    return {
      ...slide,
      tagline: content[`${prefix}_tagline`] || slide.tagline,
      arabicTitle: content[`${prefix}_arabic_title`] || slide.arabicTitle,
      titleLines: [
        content[`${prefix}_title_line_1`] || slide.titleLines[0],
        content[`${prefix}_title_line_2`] || slide.titleLines[1],
      ],
      description: content[`${prefix}_description`] || slide.description,
      ctaText: content[`${prefix}_button_label`] || slide.ctaText,
      ctaLink: content[`${prefix}_button_url`] || slide.ctaLink,
      image: content[`${prefix}_image`] || slide.image,
    };
  });
 
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % editableSlides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [editableSlides.length]);
 
  const slide = editableSlides[current] || editableSlides[0];
 
  return (
    <section className="asala-container">
      {/* .hero-frame = conteneur de référence pour les tailles en cqw (voir index.css) */}
      <div className="hero-frame relative w-full overflow-hidden border-b border-black/10 bg-[#f4f2ee] aspect-[4/5] min-h-[420px] sm:aspect-[4/3] sm:min-h-0 lg:min-h-0 lg:aspect-[2/1]">
        {/* Image partagée par tous les slides */}
        <div className="absolute inset-0 z-0 h-full w-full overflow-hidden">
          <img
            key={slide.image}
            src={publicAsset(slide.image)}
            alt="Collection KENZA Mode Traditionnelle"
            fetchPriority="high"
            decoding="async"
            className={`hero-slide-image hero-slide-${slide.id} absolute inset-0 !h-full !w-full object-cover transition-opacity duration-700`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = publicAsset("/hero-main.jpg");
            }}
          />
        </div>
 
        {/* Voile de lisibilité */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#fbfaf8]/75 via-[#fbfaf8]/20 to-transparent pointer-events-none" />
 
        {/* Contenu éditorial */}
        <div className="hero-content">
          <div className="hero-inner">
            {/* 1. En-tête */}
            <header className="hero-header">
              <p className="hero-tagline">{slide.tagline}</p>
              <div className="hero-mark">KENZA</div>
              <h1 className="hero-title">
                {slide.titleLines[0]}
                <br />
                {slide.titleLines[1]}
              </h1>
            </header>
 
            {/* 2. Corps */}
            <div className="hero-body">
              <div className="hero-rule" />
              <p className="hero-desc">{slide.description}</p>
            </div>
 
            {/* 3. Actions */}
            <div className="hero-actions">
              <Link to={slide.ctaLink} className="asala-btn group justify-center text-center">
                <span>{slide.ctaText}</span>
                <ArrowRight
                  strokeWidth={1.5}
                  className="w-[1.3em] h-[1.3em] group-hover:translate-x-1 transition-transform"
                />
              </Link>
 
              <div className="hero-pager">
                {editableSlides.map((s, idx) => {
                  const isActive = idx === current;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setCurrent(idx)}
                      className="group cursor-pointer"
                      aria-label={`Aller au slide ${s.id}`}
                      aria-current={isActive}
                    >
                      <span
                        className={`transition-colors ${
                          isActive
                            ? "text-black font-semibold"
                            : "text-stone/60 group-hover:text-black"
                        }`}
                      >
                        {s.id}
                      </span>
                      {isActive && <span className="hero-pager-line" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
 
export default Hero;
 

