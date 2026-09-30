import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

export type SiteContentValues = Record<string, string>;

export type HomeSection = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  buttonLabel: string;
  categorySlug: string;
  sortOrder: number;
};

export type CollectionTile = {
  id: string;
  eyebrow: string;
  title: string;
  imageUrl: string;
  buttonLabel: string;
  categorySlug: string;
  sortOrder: number;
};

const defaultContent: SiteContentValues = {
  announcement: "Livraison offerte dans toute la Tunisie à partir de 250 TND",
  shipping_fee: "7",
  free_shipping_threshold: "250",
  home_occasion_image: "/occasion-jebba-banner.png",
  home_occasion_title: "L'ART DE LA JEBBA",
  home_occasion_description: "Mariages, fiançailles et célébrations prestigieuses.",
  about_hero_image: "/hero-model.jpg",
  about_hero_eyebrow: "Maison KENZA",
  about_hero_title: "LA MAISON KENZA",
  about_hero_description: "L'héritage de la haute couture tunisienne sublimé dans une modernité intemporelle.",
  about_intro_eyebrow: "Origines & Philosophie",
  about_intro_title: "NOTRE HISTOIRE & NOTRE VISION",
  about_intro_paragraph_1: "Fondée à Tunis, la Maison KENZA — signifiant authenticité et noblesse d'origine en arabe — est née d'une passion inconditionnelle pour le patrimoine vestimentaire tunisien et méditerranéen.",
  about_intro_paragraph_2: "Face à l'uniformisation de la mode mondiale, KENZA propose une vision singulière : des créations de grand apparat et des silhouettes quotidiennes qui célèbrent la richesse des broderies tunisiennes, la pureté des lins naturels et la splendeur des soies les plus précieuses.",
  about_work_image: "/hero-model.jpg",
  about_work_eyebrow: "Transmission Artisanale",
  about_work_title: "L'ATELIER DE TUNIS",
  about_work_paragraph_1: "Chaque caftan, chaque jebba et chaque takchita est façonné au cœur de nos ateliers par des maîtresses artisanes détentrices d'un savoir-faire séculaire.",
  about_work_paragraph_2: "Le travail minutieux du fil d'or, la pose des boutons driba réalisés un à un à la main, et la précision des coupes architecturales confèrent à chaque création KENZA une noblesse incomparable.",
  about_work_button_label: "Découvrir la collection",
  about_work_button_url: "/collection",
  home_hero_01_image: "/hero-slide-01.png",
  home_hero_01_tagline: "TRADITION — ÉLÉGANCE — INTEMPORALITÉ",
  home_hero_01_arabic_title: "كنزة",
  home_hero_01_title_line_1: "L'ART DU",
  home_hero_01_title_line_2: "TRADITIONNEL",
  home_hero_01_description: "Des pièces intemporelles, pensées pour aujourd'hui.\nL'héritage de la couture tunisienne sublimé dans une esthétique contemporaine.",
  home_hero_01_button_label: "Découvrir la collection",
  home_hero_01_button_url: "/collection",
  home_hero_02_image: "/hero-slide-02.png",
  home_hero_02_tagline: "ÉDITION JEBBA — HAUTE COUTURE",
  home_hero_02_arabic_title: "كنزة",
  home_hero_02_title_line_1: "SPLENDEUR",
  home_hero_02_title_line_2: "& MAJESTÉ",
  home_hero_02_description: "L'art de la jebba et du caftan d'apparat.\nBroderies au fil d'or et soies d'art pour vos célébrations les plus précieuses.",
  home_hero_02_button_label: "Explorer les jebbas",
  home_hero_02_button_url: "/jebbas",
  home_hero_03_image: "/hero-slide-03.png",
  home_hero_03_tagline: "L'ESSENCE DU LIN — CRÉATION ARTISANALE",
  home_hero_03_arabic_title: "كنزة",
  home_hero_03_title_line_1: "LA JEBBA",
  home_hero_03_title_line_2: "RÉINVENTÉE",
  home_hero_03_description: "Lignes fluides, pureté des matières et finitions cousues main.\nLa noblesse de la jebba tunisienne dans son expression moderne.",
  home_hero_03_button_label: "Voir les nouveautés",
  home_hero_03_button_url: "/nouveautes",
};

const defaultSections: HomeSection[] = [{
  id: "default-caftan",
  eyebrow: "Collection Emblématique",
  title: "L'ART DU CAFTAN",
  subtitle: "L'élégance tunisienne intemporelle, réinterprétée pour la femme d'aujourd'hui.",
  description: "Chaque caftan est pensé comme une œuvre de transmission : soies d'art, galons sfifa tissés à la main et broderies minutieuses exécutées dans nos ateliers de Tunis.",
  imageUrl: "/hero-model.jpg",
  buttonLabel: "Découvrir tous les caftans",
  categorySlug: "caftans",
  sortOrder: 1,
}];

const defaultCollectionTiles: CollectionTile[] = [
  { id: "default-caftans", eyebrow: "La Signature KENZA", title: "CAFTANS", imageUrl: "/home-caftans.jpg", buttonLabel: "Découvrir", categorySlug: "caftans", sortOrder: 1 },
  { id: "default-jebbas", eyebrow: "Lins d'Exception", title: "JEBBAS", imageUrl: "/home-jebbas.png", buttonLabel: "Explorer", categorySlug: "jebbas", sortOrder: 2 },
  { id: "default-robes", eyebrow: "Lignes Fluides", title: "ROBES", imageUrl: "/home-robes.jpg", buttonLabel: "Explorer", categorySlug: "robes", sortOrder: 3 },
];

const replaceBrand = (value: string) => value.replace(/ASALA|KINZA/gi, "Maison Kenza").replaceAll("أصالة", "كنزة");

type SiteContentContextValue = { content: SiteContentValues; homeSections: HomeSection[]; collectionTiles: CollectionTile[] };

const SiteContentContext = createContext<SiteContentContextValue | undefined>(undefined);

export const SiteContentProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [content, setContent] = useState<SiteContentValues>(defaultContent);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultSections);
  const [collectionTiles, setCollectionTiles] = useState<CollectionTile[]>(defaultCollectionTiles);

  const refreshContent = useCallback(async () => {
    if (!supabase) return;

    const [contentResult, sectionsResult, tilesResult] = await Promise.all([
      supabase
        .from("site_content")
        .select("content_key,value")
        .eq("is_visible", true),
      supabase
        .from("home_sections")
        .select("id,eyebrow,title,subtitle,description,image_url,button_label,category_slug,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
      supabase
        .from("home_collection_tiles")
        .select("id,eyebrow,title,image_url,button_label,category_slug,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (contentResult.data) {
      setContent({
        ...defaultContent,
        ...Object.fromEntries(contentResult.data.map((item) => [item.content_key, replaceBrand(item.value)])),
      });
    }
    if (!sectionsResult.error && sectionsResult.data) {
      setHomeSections(sectionsResult.data.map((item) => ({
        id: item.id,
        eyebrow: replaceBrand(item.eyebrow || ""),
        title: replaceBrand(item.title || ""),
        subtitle: replaceBrand(item.subtitle || ""),
        description: replaceBrand(item.description || ""),
        imageUrl: item.image_url || "/hero-model.jpg",
        buttonLabel: replaceBrand(item.button_label || "Découvrir la collection"),
        categorySlug: item.category_slug || "",
        sortOrder: Number(item.sort_order || 0),
      })));
    }
    if (!tilesResult.error && tilesResult.data) {
      setCollectionTiles(tilesResult.data.map((item) => ({
        id: item.id,
        eyebrow: replaceBrand(item.eyebrow || ""),
        title: replaceBrand(item.title || ""),
        imageUrl: item.image_url || "/hero-model.jpg",
        buttonLabel: replaceBrand(item.button_label || "Découvrir"),
        categorySlug: item.category_slug || "",
        sortOrder: Number(item.sort_order || 0),
      })));
    }
  }, []);

  useEffect(() => {
    void refreshContent();
  }, [refreshContent]);

  useEffect(() => {
    const handleContentChange = () => void refreshContent();
    window.addEventListener("asala:content-updated", handleContentChange);
    return () => window.removeEventListener("asala:content-updated", handleContentChange);
  }, [refreshContent]);

  const value = useMemo(() => ({ content, homeSections, collectionTiles }), [content, homeSections, collectionTiles]);
  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) throw new Error("useSiteContent doit être utilisé dans SiteContentProvider");
  return context;
};
