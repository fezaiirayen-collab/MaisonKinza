import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useSiteContent } from "@/context/SiteContentContext";

const AboutPage: React.FC = () => {
  const { content } = useSiteContent();

  return (
    <div className="min-h-screen bg-white">
      <section className="relative flex h-[420px] w-full items-center justify-center overflow-hidden border-b border-black/10 bg-[#f4f2ee] sm:h-[500px] lg:h-[560px]">
        <ProductImage
          src={content.about_hero_image}
          alt="Maison KENZA Savoir-faire"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 max-w-2xl px-4 text-center text-white">
          <span className="mb-2 block text-[44px] font-normal text-white sm:text-[54px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
            {content.about_hero_eyebrow}
          </span>
          <h1 className="mb-3 text-[32px] font-normal uppercase tracking-tight text-white sm:text-[44px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
            {content.about_hero_title}
          </h1>
          <div className="mx-auto mb-4 h-px w-12 bg-white/70" />
          <p className="text-[13px] font-light leading-relaxed text-white/90 sm:text-[14px]">
            {content.about_hero_description}
          </p>
        </div>
      </section>

      <div className="asala-container max-w-[1400px] space-y-16 py-16 lg:space-y-20 lg:py-24">
        <div className="space-y-6 text-[14px] font-normal leading-relaxed text-stone">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone">
            {content.about_intro_eyebrow}
          </p>
          <h2 className="text-[30px] font-normal uppercase leading-snug tracking-tight text-black sm:text-[38px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
            {content.about_intro_title}
          </h2>
          <p>{content.about_intro_paragraph_1}</p>
          <p>{content.about_intro_paragraph_2}</p>
        </div>

        <div className="grid grid-cols-1 items-center gap-10 border-b border-t border-black/10 py-10 md:grid-cols-2 md:py-14 lg:gap-16">
          <div className="h-[420px] overflow-hidden bg-[#f4f2ee] sm:h-[520px] md:h-[560px] lg:h-[620px]">
            <ProductImage
              src={content.about_work_image}
              alt={content.about_work_title}
              className="h-full w-full object-cover object-top"
            />
          </div>
          <div className="space-y-4 text-[13px] font-normal leading-relaxed text-stone sm:text-[14px]">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-stone">
              {content.about_work_eyebrow}
            </p>
            <h3 className="text-[24px] font-normal uppercase text-black sm:text-[28px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
              {content.about_work_title}
            </h3>
            <p>{content.about_work_paragraph_1}</p>
            <p>{content.about_work_paragraph_2}</p>
            <div className="pt-3">
              <Link to={content.about_work_button_url || "/collection"} className="asala-btn inline-flex">
                <span>{content.about_work_button_label}</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
