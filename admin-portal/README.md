# ASALA — Admin Portal

Projet séparé du site public ASALA. Ce dossier doit être publié dans un dépôt GitHub privé.

## Installation

```bash
npm install
cp .env.example .env
npm run dev
```

Renseignez uniquement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`. Ne mettez jamais la clé `service_role` dans ce projet.

Le compte doit également exister dans `public.admin_users` de Supabase pour accéder au dashboard.
