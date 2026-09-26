-- ASALA — dashboard administrateur, commandes, clients, catégories et médias
-- À exécuter après schema.sql et admin-account.sql dans Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text not null default '',
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.categories (name, slug, sort_order)
values
  ('Caftan', 'caftans', 1),
  ('Jebba', 'jebbas', 2),
  ('Robe', 'robes', 3),
  ('Accessoire', 'accessoires', 4),
  ('Abaya', 'abayas', 5),
  ('Takchita', 'takchitas', 6)
on conflict (name) do nothing;

-- Catégorie publique alimentée automatiquement par la gestion des soldes.
insert into public.categories (name, slug, description, sort_order)
values ('Promotions', 'promotions', 'Les articles actuellement en promotion.', 7)
on conflict (name) do nothing;

-- Métadonnées nécessaires pour appliquer puis retirer une solde sans perdre
-- le prix ou la catégorie d'origine du produit.
alter table public.products
  add column if not exists sale_percentage numeric(5, 2) not null default 0 check (sale_percentage >= 0 and sale_percentage <= 100),
  add column if not exists sale_regular_price numeric(10, 2),
  add column if not exists sale_original_price numeric(10, 2),
  add column if not exists sale_original_category text;

-- Vue publique : le stock et les champs internes ne sont jamais exposés au navigateur.
create or replace view public.catalog_products as
select
  id, name, category, price, original_price, images, color_images, description,
  details, fabric, care, sizes, colors, featured, is_new, created_at,
  (stock > 0) as in_stock
from public.products;

revoke all on public.products from anon;
grant select on public.products to authenticated;
grant select on public.catalog_products to anon, authenticated;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  phone text,
  address jsonb not null default '{}'::jsonb,
  order_count integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Champs de compte client utilisés par l'inscription et la page Relation client.
alter table public.customers
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists phone_secondary text,
  add column if not exists gender text,
  add column if not exists birth_date date;

create unique index if not exists customers_user_id_unique
  on public.customers(user_id)
  where user_id is not null;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null default '',
  email text not null,
  phone text,
  address jsonb not null default '{}'::jsonb,
  shipping_method text not null default 'standard',
  payment_method text not null default 'cod',
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  shipping_fee numeric(12, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists orders_user_id_idx on public.orders(user_id);
update public.orders o
set user_id = c.user_id
from public.customers c
where o.customer_id = c.id and o.user_id is null and c.user_id is not null;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text,
  product_name text not null,
  category text,
  unit_price numeric(12, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0),
  size text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percentage numeric(5, 2) not null check (discount_percentage > 0 and discount_percentage <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_code_usages (
  id uuid primary key default gen_random_uuid(),
  promo_code_id uuid not null references public.promo_codes(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email text not null,
  customer_name text not null default '',
  order_total numeric(12, 2) not null default 0,
  discount_amount numeric(12, 2) not null default 0,
  used_at timestamptz not null default now(),
  unique (promo_code_id, order_id)
);

-- Limitation serveur par action et identifiant. Elle complète le rate-limit
-- de l'hébergeur et évite le spam répété avec la même adresse.
create table if not exists public.public_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);

alter table public.public_rate_limits enable row level security;
revoke all on public.public_rate_limits from anon, authenticated;

create or replace function public.enforce_public_rate_limit(
  p_action text,
  p_identifier text,
  p_limit integer,
  p_window_seconds integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_key text := left(lower(trim(coalesce(p_action, ''))) || ':' || lower(trim(coalesce(p_identifier, ''))), 240);
  current_attempts integer;
begin
  if current_key = ':' or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Limitation invalide';
  end if;

  insert into public.public_rate_limits (rate_key, window_started_at, attempts)
  values (current_key, now(), 1)
  on conflict (rate_key) do update set
    window_started_at = case
      when now() - public.public_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
      then now()
      else public.public_rate_limits.window_started_at
    end,
    attempts = case
      when now() - public.public_rate_limits.window_started_at >= make_interval(secs => p_window_seconds)
      then 1
      else public.public_rate_limits.attempts + 1
    end
  returning attempts into current_attempts;

  if current_attempts > p_limit then
    raise exception 'Trop de demandes, veuillez réessayer plus tard';
  end if;
end;
$$;

revoke all on function public.enforce_public_rate_limit(text, text, integer, integer) from public;

create or replace function public.validate_promo_code(p_code text)
returns table (code text, discount_percentage numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.enforce_public_rate_limit('promo', coalesce(auth.uid()::text, 'anonymous'), 30, 60);
  return query
    select p.code, p.discount_percentage
    from public.promo_codes p
    where p.code = upper(trim(p_code))
      and p.is_active = true;
end;
$$;

revoke all on function public.validate_promo_code(text) from public;
grant execute on function public.validate_promo_code(text) to anon, authenticated;

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  content_key text not null unique,
  label text not null,
  value text not null default '',
  type text not null default 'text' check (type in ('text', 'image', 'url')),
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.site_content (content_key, label, value, type)
values
  ('announcement', 'Bandeau d''annonce', 'Livraison offerte dans toute la Tunisie à partir de 250 TND', 'text'),
  ('home_occasion_image', 'Image — Occasions d''Exception', '/occasion-jebba-banner.png', 'image'),
  ('home_occasion_title', 'Titre — Occasions d''Exception', 'L''ART DE LA JEBBA', 'text'),
  ('home_occasion_description', 'Description — Occasions d''Exception', 'Mariages, fiançailles et célébrations prestigieuses.', 'text')
on conflict (content_key) do nothing;

insert into public.site_content (content_key, label, value, type)
values ('shipping_fee', 'Frais de livraison standard (TND)', '7', 'text')
on conflict (content_key) do nothing;

insert into public.site_content (content_key, label, value, type)
values ('free_shipping_threshold', 'Livraison gratuite à partir de (TND)', '250', 'text')
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

insert into public.site_content (content_key, label, value, type)
values
  ('home_collections_eyebrow', 'Surtitre — Lignes de création', 'Panorama des Savoir-Faire', 'text'),
  ('home_collections_title', 'Titre — Lignes de création', 'NOS LIGNES DE CRÉATION', 'text'),
  ('home_collections_description', 'Description — Lignes de création', 'Une garde-robe tunisienne contemporaine où la rigueur des broderies d''or rencontre la fluidité des lignes modernes.', 'text')
on conflict (content_key) do nothing;

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
  'Collection Emblématique', 'L''ART DU CAFTAN',
  'L''élégance tunisienne intemporelle, réinterprétée pour la femme d''aujourd''hui.',
  'Chaque caftan est pensé comme une œuvre de transmission : soies d''art, galons sfifa tissés à la main et broderies minutieuses exécutées dans nos ateliers de Tunis.',
  '/hero-model.jpg', 'Découvrir tous les caftans', 'caftans', 1
where not exists (select 1 from public.home_sections);

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

create or replace function public.set_dashboard_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists promo_codes_set_updated_at on public.promo_codes;
create trigger promo_codes_set_updated_at before update on public.promo_codes
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists site_content_set_updated_at on public.site_content;
create trigger site_content_set_updated_at before update on public.site_content
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists home_sections_set_updated_at on public.home_sections;
create trigger home_sections_set_updated_at before update on public.home_sections
for each row execute function public.set_dashboard_updated_at();

drop trigger if exists home_collection_tiles_set_updated_at on public.home_collection_tiles;
create trigger home_collection_tiles_set_updated_at before update on public.home_collection_tiles
for each row execute function public.set_dashboard_updated_at();

create or replace function public.sync_customer_from_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_uuid uuid;
  name_parts text[];
begin
  name_parts := regexp_split_to_array(trim(new.customer_name), '\s+');
  insert into public.customers (user_id, email, first_name, last_name, phone, address)
  values (
    new.user_id,
    lower(trim(new.email)),
    coalesce(name_parts[1], ''),
    coalesce(array_to_string(name_parts[2:array_length(name_parts, 1)], ' '), ''),
    new.phone,
    new.address
  )
  on conflict (email) do update set
    user_id = coalesce(excluded.user_id, public.customers.user_id),
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    phone = excluded.phone,
    address = excluded.address,
    updated_at = now()
  returning id into customer_uuid;

  new.customer_id := customer_uuid;
  return new;
end;
$$;

drop trigger if exists orders_sync_customer on public.orders;
create trigger orders_sync_customer before insert on public.orders
for each row execute function public.sync_customer_from_order();

create or replace function public.refresh_customer_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.customer_id is not null then
    update public.customers
    set order_count = (
          select count(*)::integer
          from public.orders
          where customer_id = new.customer_id and status <> 'cancelled'
        ),
        total_spent = (
          select coalesce(sum(total), 0)
          from public.orders
          where customer_id = new.customer_id and status <> 'cancelled'
        ),
        updated_at = now()
    where id = new.customer_id;
  end if;

  if tg_op = 'UPDATE' and old.customer_id is distinct from new.customer_id and old.customer_id is not null then
    update public.customers
    set order_count = (
          select count(*)::integer
          from public.orders
          where customer_id = old.customer_id and status <> 'cancelled'
        ),
        total_spent = (
          select coalesce(sum(total), 0)
          from public.orders
          where customer_id = old.customer_id and status <> 'cancelled'
        ),
        updated_at = now()
    where id = old.customer_id;
  end if;

  return new;
end;
$$;

drop trigger if exists orders_refresh_customer_totals on public.orders;
create trigger orders_refresh_customer_totals after insert or update on public.orders
for each row execute function public.refresh_customer_totals();

-- Checkout public sécurisé : aucune lecture de données privées n'est accordée au client.
drop function if exists public.create_order(text, text, text, text, jsonb, text, text, numeric, numeric, numeric, numeric, jsonb);
drop function if exists public.create_order(text, text, text, text, jsonb, text, text, numeric, numeric, numeric, numeric, jsonb, text);
drop function if exists public.create_order(text, text, text, text, jsonb, text, text, jsonb, text);

create or replace function public.create_order(
  p_order_number text,
  p_customer_name text,
  p_email text,
  p_phone text,
  p_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_items jsonb,
  p_promo_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  customer_uuid uuid;
  current_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(p_email, '')));
  promo_uuid uuid;
  promo_percentage numeric := 0;
  actual_subtotal numeric := 0;
  actual_discount numeric := 0;
  actual_shipping numeric := 0;
  actual_total numeric := 0;
  standard_shipping numeric := 7;
  free_shipping_threshold numeric := 250;
  item jsonb;
  product_uuid uuid;
  product_name text;
  product_category text;
  product_price numeric;
  product_stock integer;
  product_sizes text[];
  product_colors text[];
  item_quantity integer;
  item_size text;
  item_color text;
  validated_items jsonb := '[]'::jsonb;
begin
  if nullif(trim(p_order_number), '') is null or length(trim(p_order_number)) > 80 then
    raise exception 'Numéro de commande invalide';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 3 and 160 then
    raise exception 'Nom client invalide';
  end if;
  if current_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email client invalide';
  end if;
  if length(trim(coalesce(p_phone, ''))) not between 6 and 40
    or trim(p_phone) !~ '^[0-9+ ()-]+$' then
    raise exception 'Téléphone invalide';
  end if;
  if jsonb_typeof(coalesce(p_address, '{}'::jsonb)) <> 'object' or octet_length(coalesce(p_address, '{}'::jsonb)::text) > 10000 then
    raise exception 'Adresse invalide';
  end if;
  if length(trim(coalesce(p_address->>'address', p_address->>'street', ''))) not between 3 and 250
    or length(trim(coalesce(p_address->>'city', ''))) not between 2 and 100
    or length(trim(coalesce(p_address->>'governorate', ''))) not between 2 and 100
    or length(trim(coalesce(p_address->>'apartment', ''))) > 100
    or length(trim(coalesce(p_address->>'postalCode', ''))) > 20 then
    raise exception 'Adresse invalide';
  end if;
  if current_user_id is not null and current_email <> lower(coalesce(auth.jwt() ->> 'email', '')) then
    raise exception 'L''email de commande doit correspondre au compte connecté';
  end if;
  if p_shipping_method <> 'standard' or p_payment_method <> 'cod' then
    raise exception 'Mode de livraison ou de paiement invalide';
  end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Le panier est vide';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Panier trop volumineux';
  end if;

  perform public.enforce_public_rate_limit('order', current_email, 10, 3600);

  select coalesce((
    select case
      when value ~ '^\s*\d+([.,]\d+)?\s*$' then greatest(replace(trim(value), ',', '.')::numeric, 0)
      else 7
    end
    from public.site_content where content_key = 'shipping_fee'
  ), 7)
  into standard_shipping;

  select coalesce((
    select case
      when value ~ '^\s*\d+([.,]\d+)?\s*$' then greatest(replace(trim(value), ',', '.')::numeric, 0)
      else 250
    end
    from public.site_content where content_key = 'free_shipping_threshold'
  ), 250)
  into free_shipping_threshold;

  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'Produit invalide';
    end if;
    if coalesce(item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Quantité invalide';
    end if;

    product_uuid := (item->>'product_id')::uuid;
    item_quantity := (item->>'quantity')::integer;
    item_size := nullif(trim(coalesce(item->>'size', '')), '');
    item_color := nullif(trim(coalesce(item->>'color', '')), '');

    if item_quantity < 1 or item_quantity > 50 then
      raise exception 'Quantité invalide';
    end if;

    select p.name, p.category, p.price, p.stock, p.sizes, p.colors
    into product_name, product_category, product_price, product_stock, product_sizes, product_colors
    from public.products p
    where p.id = product_uuid
    for update;

    if not found then
      raise exception 'Produit introuvable';
    end if;
    if product_stock < item_quantity then
      raise exception 'Stock insuffisant pour le produit %', product_name;
    end if;
    if coalesce(array_length(product_sizes, 1), 0) > 0 and (item_size is null or not item_size = any(product_sizes)) then
      raise exception 'Taille invalide pour le produit %', product_name;
    end if;
    if coalesce(array_length(product_colors, 1), 0) > 0 and (item_color is null or not item_color = any(product_colors)) then
      raise exception 'Couleur invalide pour le produit %', prod²https://github.com/fezaiirayen-collabuct_name;
    end if;

    update public.products set stock = stock - item_quantity where id = product_uuid;
    actual_subtotal := actual_subtotal + (product_price * item_quantity);
    validated_items := validated_items || jsonb_build_array(jsonb_build_object(
      'product_id', product_uuid::text,
      'product_name', product_name,
      'category', product_category,
      'unit_price', product_price,
      'quantity', item_quantity,
      'size', item_size,
      'color', item_color
    ));
  end loop;

  if nullif(trim(p_promo_code), '') is not null then
    select id, discount_percentage
    into promo_uuid, promo_percentage
    from public.promo_codes
    where code = upper(trim(p_promo_code)) and is_active = true;
    if promo_uuid is null then
      raise exception 'Code promotionnel invalide';
    end if;
    actual_discount := round((actual_subtotal * promo_percentage / 100)::numeric, 2);
  end if;

  actual_shipping := case when actual_subtotal >= free_shipping_threshold then 0 else standard_shipping end;
  actual_total := greatest(actual_subtotal - actual_discount + actual_shipping, 0);

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address,
    shipping_method, payment_method, subtotal, discount, shipping_fee, total
  )
  values (
    trim(p_order_number), current_user_id, trim(p_customer_name), current_email, nullif(trim(coalesce(p_phone, '')), ''), coalesce(p_address, '{}'::jsonb),
    p_shipping_method, p_payment_method, actual_subtotal, actual_discount, actual_shipping, actual_total
  )
  returning id into new_order_id;

  select customer_id
  into customer_uuid
  from public.orders
  where id = new_order_id;

  for item in select value from jsonb_array_elements(validated_items) loop
    insert into public.order_items (order_id, product_id, product_name, category, unit_price, quantity, size, color)
    values (
      new_order_id,
      nullif(item->>'product_id', ''),
      item->>'product_name',
      item->>'category',
      (item->>'unit_price')::numeric,
      (item->>'quantity')::integer,
      item->>'size',
      item->>'color'
    );
  end loop;

  if promo_uuid is not null then
    insert into public.promo_code_usages (
      promo_code_id, order_id, customer_id, customer_email, customer_name, order_total, discount_amount
    )
    values (
      promo_uuid,
      new_order_id,
      customer_uuid,
      lower(trim(p_email)),
      trim(p_customer_name),
      actual_total,
      actual_discount
    )
    on conflict (promo_code_id, order_id) do nothing;
  end if;

  return new_order_id;
end;
$$;

grant execute on function public.create_order(text, text, text, text, jsonb, text, text, jsonb, text) to anon, authenticated;

alter table public.categories enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.promo_codes enable row level security;
alter table public.promo_code_usages enable row level security;
alter table public.site_content enable row level security;
alter table public.home_sections enable row level security;
alter table public.home_collection_tiles enable row level security;

-- Droits PostgreSQL nécessaires avant l'application des policies RLS.
grant select on public.catalog_products to anon, authenticated;
grant select on public.products to authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.categories, public.site_content to anon, authenticated;
grant insert, update, delete on public.categories, public.site_content to authenticated;
grant select on public.home_sections to anon, authenticated;
grant insert, update, delete on public.home_sections to authenticated;
grant select on public.home_collection_tiles to anon, authenticated;
grant insert, update, delete on public.home_collection_tiles to authenticated;
grant select, insert, update, delete on public.customers to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant select, insert, update, delete on public.promo_codes to authenticated;
grant select on public.promo_code_usages to authenticated;

-- Le catalogue public passe par la vue limitée catalog_products.
drop policy if exists "Public can read products" on public.products;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories" on public.categories for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories" on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read customers" on public.customers;
create policy "Admins read customers" on public.customers for select to authenticated using (public.is_admin());
drop policy if exists "Admins manage customers" on public.customers;
create policy "Admins manage customers" on public.customers for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read orders" on public.orders;
create policy "Admins read orders" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders" on public.orders for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read order items" on public.order_items;
create policy "Admins read order items" on public.order_items for select to authenticated using (public.is_admin());

drop policy if exists "Admins manage promo codes" on public.promo_codes;
create policy "Admins manage promo codes" on public.promo_codes for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins read promo code usages" on public.promo_code_usages;
create policy "Admins read promo code usages" on public.promo_code_usages for select to authenticated using (public.is_admin());

drop policy if exists "Public can read visible site content" on public.site_content;
create policy "Public can read visible site content" on public.site_content for select to anon, authenticated using (is_visible = true or public.is_admin());
drop policy if exists "Admins manage site content" on public.site_content;
create policy "Admins manage site content" on public.site_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public can read active home sections" on public.home_sections;
create policy "Public can read active home sections" on public.home_sections for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage home sections" on public.home_sections;
create policy "Admins manage home sections" on public.home_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Public can read active collection tiles" on public.home_collection_tiles;
create policy "Public can read active collection tiles" on public.home_collection_tiles for select to anon, authenticated using (is_active = true or public.is_admin());
drop policy if exists "Admins manage collection tiles" on public.home_collection_tiles;
create policy "Admins manage collection tiles" on public.home_collection_tiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[]
where id = 'product-images';

drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects for select to public
using (bucket_id = 'product-images');
drop policy if exists "Admins upload product images" on storage.objects;
create policy "Admins upload product images" on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins update product images" on storage.objects;
create policy "Admins update product images" on storage.objects for update to authenticated
using (bucket_id = 'product-images' and public.is_admin())
with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "Admins delete product images" on storage.objects;
create policy "Admins delete product images" on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and public.is_admin());
