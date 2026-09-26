-- Sections éditoriales configurables de la page d'accueil.
-- À exécuter dans Supabase SQL Editor après admin-dashboard.sql.

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default '',
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  image_url text,
  button_label text not null default 'Découvrir la collection',
  category_slug text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.home_sections
  (eyebrow, title, subtitle, description, image_url, button_label, category_slug, sort_order)
select
  'Collection Emblématique',
  'L''ART DU CAFTAN',
  'L''élégance tunisienne intemporelle, réinterprétée pour la femme d''aujourd''hui.',
  'Chaque caftan est pensé comme une œuvre de transmission : soies d''art, galons sfifa tissés à la main et broderies minutieuses exécutées dans nos ateliers de Tunis.',
  '/hero-model.jpg',
  'Découvrir tous les caftans',
  'caftans',
  1
where not exists (select 1 from public.home_sections);

drop trigger if exists home_sections_set_updated_at on public.home_sections;
create trigger home_sections_set_updated_at before update on public.home_sections
for each row execute function public.set_dashboard_updated_at();

alter table public.home_sections enable row level security;
grant select on public.home_sections to anon, authenticated;
grant insert, update, delete on public.home_sections to authenticated;

drop policy if exists "Public can read active home sections" on public.home_sections;
create policy "Public can read active home sections"
on public.home_sections for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins manage home sections" on public.home_sections;
create policy "Admins manage home sections"
on public.home_sections for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.site_content (content_key, label, value, type)
values
  ('home_collections_eyebrow', 'Surtitre — Lignes de création', 'Panorama des Savoir-Faire', 'text'),
  ('home_collections_title', 'Titre — Lignes de création', 'NOS LIGNES DE CRÉATION', 'text'),
  ('home_collections_description', 'Description — Lignes de création', 'Une garde-robe tunisienne contemporaine où la rigueur des broderies d''or rencontre la fluidité des lignes modernes.', 'text')
on conflict (content_key) do nothing;

insert into public.site_content (content_key, label, value, type)
values
  ('about_hero_image', 'À propos — Image principale', '/hero-model.jpg', 'image'),
  ('about_hero_eyebrow', 'À propos — Surtitre principal', 'Maison KENZA', 'text'),
  ('about_hero_title', 'À propos — Titre principal', 'LA MAISON KENZA', 'text'),
  ('about_hero_description', 'À propos — Description principale', 'L''héritage de la haute couture tunisienne sublimé dans une modernité intemporelle.', 'text'),
  ('about_intro_eyebrow', 'À propos — Surtitre histoire', 'Origines & Philosophie', 'text'),
  ('about_intro_title', 'À propos — Titre histoire', 'NOTRE HISTOIRE & NOTRE VISION', 'text'),
  ('about_intro_paragraph_1', 'À propos — Histoire paragraphe 1', 'Fondée à Tunis, la Maison KENZA — signifiant authenticité et noblesse d''origine en arabe — est née d''une passion inconditionnelle pour le patrimoine vestimentaire tunisien et méditerranéen.', 'text'),
  ('about_intro_paragraph_2', 'À propos — Histoire paragraphe 2', 'Face à l''uniformisation de la mode mondiale, KENZA propose une vision singulière : des créations de grand apparat et des silhouettes quotidiennes qui célèbrent la richesse des broderies tunisiennes, la pureté des lins naturels et la splendeur des soies les plus précieuses.', 'text'),
  ('about_work_image', 'À propos — Image atelier', '/hero-model.jpg', 'image'),
  ('about_work_eyebrow', 'À propos — Surtitre atelier', 'Transmission Artisanale', 'text'),
  ('about_work_title', 'À propos — Titre atelier', 'L''ATELIER DE TUNIS', 'text'),
  ('about_work_paragraph_1', 'À propos — Atelier paragraphe 1', 'Chaque caftan, chaque jebba et chaque takchita est façonné au cœur de nos ateliers par des maîtresses artisanes détentrices d''un savoir-faire séculaire.', 'text'),
  ('about_work_paragraph_2', 'À propos — Atelier paragraphe 2', 'Le travail minutieux du fil d''or, la pose des boutons driba réalisés un à un à la main, et la précision des coupes architecturales confèrent à chaque création KENZA une noblesse incomparable.', 'text'),
  ('about_work_button_label', 'À propos — Texte du bouton', 'Découvrir la collection', 'text'),
  ('about_work_button_url', 'À propos — Lien du bouton', '/collection', 'url')
on conflict (content_key) do nothing;

insert into public.site_content (content_key, label, value, type)
values
  ('home_hero_01_image', 'Accueil — Hero 01 — Image', '/hero-slide-01.png', 'image'),
  ('home_hero_01_tagline', 'Accueil — Hero 01 — Surtitre', 'TRADITION — ÉLÉGANCE — INTEMPORALITÉ', 'text'),
  ('home_hero_01_arabic_title', 'Accueil — Hero 01 — Marque', 'أصالة', 'text'),
  ('home_hero_01_title_line_1', 'Accueil — Hero 01 — Titre ligne 1', 'L''ART DU', 'text'),
  ('home_hero_01_title_line_2', 'Accueil — Hero 01 — Titre ligne 2', 'TRADITIONNEL', 'text'),
  ('home_hero_01_description', 'Accueil — Hero 01 — Description', 'Des pièces intemporelles, pensées pour aujourd''hui.\\nL''héritage de la couture tunisienne sublimé dans une esthétique contemporaine.', 'text'),
  ('home_hero_01_button_label', 'Accueil — Hero 01 — Bouton', 'Découvrir la collection', 'text'),
  ('home_hero_01_button_url', 'Accueil — Hero 01 — Lien', '/collection', 'url'),
  ('home_hero_02_image', 'Accueil — Hero 02 — Image', '/hero-slide-02.png', 'image'),
  ('home_hero_02_tagline', 'Accueil — Hero 02 — Surtitre', 'ÉDITION JEBBA — HAUTE COUTURE', 'text'),
  ('home_hero_02_arabic_title', 'Accueil — Hero 02 — Marque', 'أصالة', 'text'),
  ('home_hero_02_title_line_1', 'Accueil — Hero 02 — Titre ligne 1', 'SPLENDEUR', 'text'),
  ('home_hero_02_title_line_2', 'Accueil — Hero 02 — Titre ligne 2', '& MAJESTÉ', 'text'),
  ('home_hero_02_description', 'Accueil — Hero 02 — Description', 'L''art de la jebba et du caftan d''apparat.\\nBroderies au fil d''or et soies d''art pour vos célébrations les plus précieuses.', 'text'),
  ('home_hero_02_button_label', 'Accueil — Hero 02 — Bouton', 'Explorer les jebbas', 'text'),
  ('home_hero_02_button_url', 'Accueil — Hero 02 — Lien', '/jebbas', 'url'),
  ('home_hero_03_image', 'Accueil — Hero 03 — Image', '/hero-slide-03.png', 'image'),
  ('home_hero_03_tagline', 'Accueil — Hero 03 — Surtitre', 'L''ESSENCE DU LIN — CRÉATION ARTISANALE', 'text'),
  ('home_hero_03_arabic_title', 'Accueil — Hero 03 — Marque', 'أصالة', 'text'),
  ('home_hero_03_title_line_1', 'Accueil — Hero 03 — Titre ligne 1', 'LA JEBBA', 'text'),
  ('home_hero_03_title_line_2', 'Accueil — Hero 03 — Titre ligne 2', 'RÉINVENTÉE', 'text'),
  ('home_hero_03_description', 'Accueil — Hero 03 — Description', 'Lignes fluides, pureté des matières et finitions cousues main.\\nLa noblesse de la jebba tunisienne dans son expression moderne.', 'text'),
  ('home_hero_03_button_label', 'Accueil — Hero 03 — Bouton', 'Voir les nouveautés', 'text'),
  ('home_hero_03_button_url', 'Accueil — Hero 03 — Lien', '/nouveautes', 'url')
on conflict (content_key) do nothing;

--- Cartes de la section « Nos lignes de création ».
create table if not exists public.home_collection_tiles (
  id uuid primary key default gen_random_uuid(),
  eyebrow text not null default '',
  title text not null,
  image_url text,
  button_label text not null default 'Découvrir',
  category_slug text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.home_collection_tiles
  (eyebrow, title, image_url, button_label, category_slug, sort_order)
select * from (values
  ('La Signature KENZA', 'CAFTANS', '/home-caftans.jpg', 'Découvrir', 'caftans', 1),
  ('Lins d''Exception', 'JEBBAS', '/home-jebbas.png', 'Explorer', 'jebbas', 2),
  ('Lignes Fluides', 'ROBES', '/home-robes.jpg', 'Explorer', 'robes', 3)
) as defaults(eyebrow, title, image_url, button_label, category_slug, sort_order)
where not exists (select 1 from public.home_collection_tiles);

drop trigger if exists home_collection_tiles_set_updated_at on public.home_collection_tiles;
create trigger home_collection_tiles_set_updated_at before update on public.home_collection_tiles
for each row execute function public.set_dashboard_updated_at();

alter table public.home_collection_tiles enable row level security;
grant select on public.home_collection_tiles to anon, authenticated;
grant insert, update, delete on public.home_collection_tiles to authenticated;

drop policy if exists "Public can read active collection tiles" on public.home_collection_tiles;
create policy "Public can read active collection tiles"
on public.home_collection_tiles for select
to anon, authenticated
using (is_active = true or public.is_admin());

drop policy if exists "Admins manage collection tiles" on public.home_collection_tiles;
create policy "Admins manage collection tiles"
on public.home_collection_tiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
