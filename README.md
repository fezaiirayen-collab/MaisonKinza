# KENZA

Boutique ASALA â€” site public React/Vite connectÃ© Ã  Supabase.

## DÃ©veloppement local

CrÃ©er `.env` Ã  partir de `.env.example` et renseigner uniquement :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_votre-cle
```

Ne jamais utiliser `service_role` dans le navigateur, dans GitHub Actions ou dans le dÃ©pÃ´t.

```bash
npm ci
npm run dev
```

Le site public est disponible sur `http://localhost:5173`.

Le tableau de bord est une application sÃ©parÃ©e dans `admin-portal` :

```bash
cd admin-portal
npm ci
npm run dev
```

Il est disponible sur `http://localhost:5174`. En dÃ©veloppement, `http://localhost:5173/vrai-admin` ouvre automatiquement ce portail.

## Installation Supabase

Dans Supabase > SQL Editor, exÃ©cuter avec le rÃ´le propriÃ©taire, dans cet ordre :

1. `supabase/schema.sql`
2. `supabase/admin-dashboard.sql`
3. `supabase/customer-account.sql`
4. `supabase/contact-newsletter.sql`
5. `supabase/product-color-variants.sql`
6. `supabase/fix-live-database.sql`
7. `supabase/order-tracking-custom-sizing.sql`

Le dernier script rÃ©pare la vue publique `catalog_products`, les droits RLS, les catÃ©gories, le contenu du site et lâ€™association sÃ©curisÃ©e des commandes Ã  `auth.uid()`.

CrÃ©er ensuite explicitement lâ€™administrateur avec son UUID Supabase vÃ©rifiÃ© :

```sql
insert into public.admin_users (user_id)
values ('UUID_DU_COMPTE_ADMIN')
on conflict (user_id) do nothing;
```

## GitHub Pages

Le dÃ©pÃ´t public est configurÃ© pour GitHub Pages avec GitHub Actions.

Dans `Settings > Secrets and variables > Actions`, crÃ©er :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Dans `Settings > Pages`, choisir `GitHub Actions` comme source.

Lâ€™URL du site est :

`https://fezaiirayen-collab.github.io/MaisonKinza/`

Dans Supabase > Authentication > URL Configuration, autoriser au minimum :

- `http://localhost:5173/reset-password`
- `https://fezaiirayen-collab.github.io/MaisonKinza/reset-password`

Le fichier `.env` et les clÃ©s privÃ©es sont exclus du dÃ©pÃ´t. Le dashboard admin doit Ãªtre publiÃ© dans un dÃ©pÃ´t privÃ© sÃ©parÃ©.

