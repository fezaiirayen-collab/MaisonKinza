import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import Hero from "@/components/Hero";
import ServiceBar from "@/components/ServiceBar";
import ProductGrid from "@/components/ProductGrid";
import ProductImage from "@/components/ProductImage";
import { useProducts } from "@/context/ProductContext";
import { useSiteContent } from "@/context/SiteContentContext";
import { supabase } from "@/lib/supabase";

const HomePage: React.FC = () => {
  const { products } = useProducts();
  const { content, homeSections, collectionTiles } = useSiteContent();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Products filters
  const newPieces = products.filter((p) => p.new).slice(0, 4);
  const caftans = products.filter((p) => p.category === "Caftan").slice(0, 4);
  const jebbas = products.filter((p) => p.category === "Jebba").slice(0, 4);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setIsSubmitting(true);
    setSubscriptionError("");
    const result = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
    setIsSubmitting(false);
    if (result.error && result.error.code !== "23505") setSubscriptionError("Inscription momentanément indisponible. Veuillez réessayer plus tard.");
    else { setSubscribed(true); setEmail(""); }
  };

  return (
    <div className="w-full bg-white">
      {/* 1. HERO & SERVICE BAR */}
      <Hero />
      <ServiceBar />

      {/* 2. NOUVEAUTÉS — SECTION ÉDITORIALE (ITEM 10) */}
      <section className="home-section py-14 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="asala-container">
          {/* Editorial Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12 pb-5 sm:pb-6 border-b border-black/15">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
                Édition Saisonnière
              </p>
              <h2
                className="text-[26px] xs:text-[32px] sm:text-[42px] lg:text-[48px] font-normal leading-[1.05] tracking-tight text-black mt-2"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                LES NOUVELLES PIÈCES
              </h2>
            </div>
            <Link
              to="/nouveautes"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] font-medium text-black hover:text-stone transition-colors group"
            >
              <span>Voir toutes les nouveautés</span>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          {/* 4-column Product Grid */}
          <ProductGrid products={newPieces} columns={4} />
        </div>
      </section>

      {/* 3. SECTION COLLECTIONS — COMPOSITION ASYMÉTRIQUE (ITEM 36) */}
      <section className="home-section py-14 sm:py-20 lg:py-24 bg-[#faf9f6] border-b border-black/10">
        <div className="asala-container">
          <div className="max-w-[520px] mb-10 sm:mb-12 lg:mb-16">
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
              {content.home_collections_eyebrow || "Panorama des Savoir-Faire"}
            </p>
            <h2
              className="text-[26px] xs:text-[34px] sm:text-[44px] lg:text-[52px] font-normal leading-[1.05] tracking-tight text-black mt-2"
              style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
            >
              {content.home_collections_title || "NOS LIGNES DE CRÉATION"}
            </h2>
            <p className="mt-3 sm:mt-4 text-[12px] sm:text-[14px] leading-relaxed text-stone">
              {content.home_collections_description || "Une garde-robe tunisienne contemporaine où la rigueur des broderies d'or rencontre la fluidité des lignes modernes."}
            </p>
          </div>

          {/* Cartes de collections administrables */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {collectionTiles.map((tile) => (
              <Link
                key={tile.id}
                to={tile.categorySlug ? `/${tile.categorySlug}` : "/collection"}
                className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f2ee]"
              >
                <ProductImage
                  src={tile.imageUrl}
                  alt={tile.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">{tile.eyebrow}</p>
                  <h3 className="mt-1 text-[28px] font-normal leading-tight sm:text-[38px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{tile.title}</h3>
                  <span className="mt-4 inline-flex items-center gap-2 border-b border-white pb-0.5 text-[10px] font-medium uppercase tracking-[0.16em]">{tile.buttonLabel}<ArrowRight size={13} strokeWidth={1.5} /></span>
                </div>
              </Link>
            ))}
          </div>

          {/* Legacy cards kept as a fallback in source; the dynamic cards above are displayed. */}
          <div className="hidden grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            <Link
              to="/caftans"
              className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f2ee]"
            >
              <ProductImage
                src="/home-caftans.jpg"
                alt="Collection Caftans KENZA"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-white">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-medium">
                  La Signature KENZA
                </p>
                <h3
                  className="text-[28px] sm:text-[38px] font-normal leading-tight mt-1"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  CAFTANS
                </h3>
                <span className="mt-4 inline-flex items-center gap-2 border-b border-white pb-0.5 text-[10px] uppercase tracking-[0.16em] font-medium">
                  Découvrir <ArrowRight size={13} strokeWidth={1.5} />
                </span>
              </div>
            </Link>

            {/* Lower Tiles: JEBBAS and ROBES */}
            <Link
              to="/jebbas"
              className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f2ee]"
            >
              <ProductImage
                src="/home-jebbas.png"
                alt="Collection Jebbas KENZA"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/80 font-medium">
                  Lins d'Exception
                </p>
                <h3
                  className="text-[24px] sm:text-[28px] font-normal leading-tight mt-1"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  JEBBAS
                </h3>
                <span className="mt-3 inline-flex items-center gap-2 border-b border-white pb-0.5 text-[10px] uppercase tracking-[0.16em] font-medium">
                  Explorer <ArrowRight size={12} strokeWidth={1.5} />
                </span>
              </div>
            </Link>

            <Link
              to="/robes"
              className="group relative block aspect-[4/5] overflow-hidden bg-[#f4f2ee]"
            >
              <ProductImage
                src="/home-robes.jpg"
                alt="Collection Robes KENZA"
                className="w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/80 font-medium">
                  Lignes Fluides
                </p>
                <h3
                  className="text-[24px] sm:text-[28px] font-normal leading-tight mt-1"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  ROBES
                </h3>
                <span className="mt-3 inline-flex items-center gap-2 border-b border-white pb-0.5 text-[10px] uppercase tracking-[0.16em] font-medium">
                  Explorer <ArrowRight size={12} strokeWidth={1.5} />
                </span>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* 4. SECTIONS ÉDITORIALES CONFIGURABLES */}
      {homeSections.map((section) => (
        <section key={section.id} className="home-section border-b border-black/10 py-12 sm:py-16 lg:py-20">
          <div className="asala-container">
            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-14">
              <div className="h-[420px] overflow-hidden bg-[#f4f2ee] sm:h-[540px] lg:col-span-6 lg:h-[620px]">
                <ProductImage
                  src={section.imageUrl}
                  alt={section.title}
                  loading="lazy"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="max-w-xl lg:col-span-6">
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone sm:text-[11px]">
                  {section.eyebrow}
                </p>
                <h2
                  className="mt-2 text-[30px] font-normal leading-[1.02] text-black xs:text-[36px] sm:text-[48px] lg:text-[56px]"
                  style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                >
                  {section.title}
                </h2>
                <div className="my-4 h-px w-12 bg-black sm:my-6" />
                {section.subtitle && (
                  <p
                    className="mb-4 text-[17px] font-normal italic leading-snug text-black sm:mb-5 sm:text-[22px]"
                    style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
                  >
                    {section.subtitle}
                  </p>
                )}
                <p className="mb-6 text-[12px] leading-relaxed text-stone sm:mb-8 sm:text-[14px]">
                  {section.description}
                </p>
                <Link
                  to={section.categorySlug ? `/${section.categorySlug}` : "/collection"}
                  className="asala-btn w-full justify-center text-center sm:w-auto"
                >
                  <span>{section.buttonLabel}</span>
                  <ArrowRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* 4. CAFTANS — FOCUS ÉDITORIAL */}
      <section className="hidden home-section py-14 sm:py-20 lg:py-24 border-b border-black/10">
        <div className="asala-container">
          {/* Editorial Split Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center mb-12 sm:mb-16">
            <div className="lg:col-span-6 aspect-[4/5] bg-[#f4f2ee] overflow-hidden">
              <ProductImage
                src="/hero-model.jpg"
                alt="Caftan Haute Couture Tunisienne"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-6 max-w-lg">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
                Collection Emblématique
              </p>
              <h2
                className="text-[28px] xs:text-[36px] sm:text-[48px] lg:text-[56px] font-normal leading-[1.02] text-black mt-2 sm:mt-3"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                L'ART DU CAFTAN
              </h2>
              <div className="w-12 h-px bg-black my-4 sm:my-6" />
              <p
                className="text-[17px] sm:text-[22px] italic text-black font-normal leading-snug mb-4 sm:mb-5"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                L'élégance tunisienne intemporelle, réinterprétée pour la femme d'aujourd'hui.
              </p>
              <p className="text-[12px] sm:text-[14px] leading-relaxed text-stone mb-6 sm:mb-8">
                Chaque caftan est pensé comme une œuvre de transmission : soies d'art, galons sfifa tissés à la main et broderies minutieuses exécutées dans nos ateliers de Tunis.
              </p>
              <Link
                to="/caftans"
                className="asala-btn w-full sm:w-auto justify-center text-center"
              >
                <span>Découvrir tous les caftans</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>

          {/* Caftans Product Row */}
          <ProductGrid products={caftans} columns={4} />
        </div>
      </section>

      {/* 5. JEBBAS — TRADITION & PURETÉ CONTEMPORAINE */}
      <section className="home-section py-14 sm:py-20 lg:py-24 bg-[#faf9f6] border-b border-black/10">
        <div className="asala-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 sm:mb-12 pb-5 sm:pb-6 border-b border-black/15">
            <div>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
                Noblesse des Matières
              </p>
              <h2
                className="text-[26px] xs:text-[32px] sm:text-[42px] lg:text-[48px] font-normal leading-[1.05] tracking-tight text-black mt-2"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                JEBBAS CONTEMPORAINES
              </h2>
            </div>
            <Link
              to="/jebbas"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] font-medium text-black hover:text-stone transition-colors group"
            >
              <span>Voir toute la sélection Jebbas</span>
              <ArrowRight
                size={14}
                strokeWidth={1.5}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>

          <ProductGrid products={jebbas} columns={4} />
        </div>
      </section>

      {/* 6. JEBBAS — GRAND APPARAT */}
      <section className="home-section relative min-h-[460px] sm:min-h-[540px] lg:min-h-[640px] flex items-center justify-center overflow-hidden bg-black text-white">
        <ProductImage
          src={content.home_occasion_image}
          alt="Collection Jebbas Haute Couture KENZA"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-2xl px-5 sm:px-6 text-center">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-white/80 font-medium">
            Occasions d'Exception
          </p>
          <h2
            className="text-[26px] xs:text-[36px] sm:text-[54px] lg:text-[68px] font-normal leading-[1] text-white mt-3 sm:mt-4"
            style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
          >
            {content.home_occasion_title}
          </h2>
          <div className="w-12 h-px bg-white/60 mx-auto my-4 sm:my-6" />
          <p className="text-[13px] sm:text-[15px] leading-relaxed text-white/90 font-light max-w-xl mx-auto mb-6 sm:mb-8">
            {content.home_occasion_description}
          </p>
          <Link
            to="/jebbas"
            className="inline-flex items-center justify-center gap-3 border border-white bg-transparent text-white px-6 sm:px-8 py-3.5 sm:py-4 text-[11px] uppercase tracking-[0.16em] font-medium hover:bg-white hover:text-black transition-colors w-full sm:w-auto text-center"
          >
            <span>Explorer la collection jebba</span>
            <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </section>

      {/* 7. NEWSLETTER — LA LETTRE KENZA */}
      <section className="home-section py-14 sm:py-20 bg-[#f8f7f5] border-b border-black/10">
        <div className="asala-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-stone font-medium">
                La Lettre KENZA
              </p>
              <h2
                className="text-[24px] xs:text-[28px] sm:text-[38px] font-normal leading-tight text-black mt-2"
                style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
              >
                ENTREZ DANS LA MAISON
              </h2>
              <p className="text-[12px] sm:text-[13px] text-stone mt-2">
                Nouvelles pièces, récits d'ateliers et invitations exclusives directement dans votre boîte de réception.
              </p>
            </div>

            <div className="lg:col-span-7">
              {subscribed ? (
                <div className="flex items-center gap-3 p-4 border border-black bg-white text-black text-[13px]">
                  <Check size={16} strokeWidth={2} />
                  <span>Votre inscription a bien été enregistrée. Bienvenue chez KENZA.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Entrez votre adresse email"
                    required
                    className="flex-1 bg-white border border-black px-4 py-3.5 text-[13px] text-black placeholder:text-stone focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="asala-btn-solid w-full sm:w-auto justify-center shrink-0 cursor-pointer"
                  >
                    <span>{isSubmitting ? "Enregistrement…" : "S'inscrire"}</span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </form>
              )}
              {subscriptionError && <p className="mt-3 text-[12px] text-red-700">{subscriptionError}</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
