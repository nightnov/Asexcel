# Asecxel — Assistant Excel

Plateforme d'assistance IA et d'outils automatisés pour les utilisateurs d'Excel :
chat pas-à-pas propulsé par Groq, upload sécurisé de fichiers Excel/CSV, quotas
quotidiens et protection anti-abus via Cloudflare Turnstile.

## Stack

- **Next.js 14** (App Router, TypeScript) — frontend + routes API backend
- **Supabase** — Auth (magic link), Postgres (historique, quotas, métadonnées), Storage (bucket privé)
- **Groq** (`llama-3.3-70b-versatile`, fallback `llama-3.1-8b-instant`) via le SDK `openai`, appelé uniquement côté serveur
- **Cloudflare Turnstile** — captcha invisible sur les endpoints `/api/chat` et `/api/upload`
- **Tailwind CSS**

## Structure du projet

```
src/
  app/
    api/chat/route.ts       # endpoint streaming Groq (auth + quota + turnstile)
    api/upload/route.ts     # endpoint upload sécurisé (validation + storage + DB)
    auth/callback/route.ts  # échange du code magic-link Supabase
    chat/page.tsx           # page de l'assistant
    login/page.tsx          # connexion par lien magique
    layout.tsx, page.tsx, globals.css
  components/
    ChatWindow.tsx          # orchestration du chat (state, streaming, quota)
    ChatMessage.tsx
    FileUpload.tsx
    TurnstileWidget.tsx
  lib/
    groq.ts                 # client Groq + prompt système + fallback modèle
    quota.ts                # lecture/incrémentation du quota quotidien
    validation.ts           # règles de validation des fichiers uploadés
    turnstile.ts            # vérification serveur du token Turnstile
    supabase/
      client.ts             # client navigateur (Client Components)
      server.ts             # client serveur lié aux cookies (RLS actif)
      admin.ts               # client service-role (opérations privilégiées uniquement)
  middleware.ts              # rafraîchit la session Supabase, protège /chat et /api
  types/database.ts          # types des tables Supabase
supabase/
  schema.sql                 # tables + RLS (profiles, conversations, messages, files)
  storage-policies.sql       # bucket "excel-files" + policies par dossier utilisateur
```

## Mise en route

1. **Installer les dépendances**

   ```bash
   npm install
   ```

2. **Créer le projet Supabase** puis exécuter, dans l'éditeur SQL :
   - `supabase/schema.sql`
   - `supabase/storage-policies.sql`

   Activer l'auth par email (magic link) dans *Authentication > Providers*.

3. **Créer un site Cloudflare Turnstile** (mode invisible) pour obtenir la
   paire clé de site / clé secrète.

4. **Copier `.env.example` en `.env.local`** et renseigner toutes les valeurs
   (URL/clés Supabase, clé Groq, clés Turnstile). Ne jamais committer ce fichier.

5. **Lancer le serveur de développement**

   ```bash
   npm run dev
   ```

   Ouvrir [http://localhost:3000](http://localhost:3000) → redirection vers `/login`.

## Sécurité — points clés

- `GROQ_API_KEY` et `SUPABASE_SERVICE_ROLE_KEY` ne sont lus que dans des
  modules marqués `server-only` et ne sont jamais renvoyés au client.
- Le bucket `excel-files` est privé ; chaque objet est stocké sous
  `{user_id}/...` et les policies RLS Storage n'autorisent un utilisateur qu'à
  lire/écrire/supprimer dans son propre dossier. Les fichiers ne sont jamais
  exposés via une URL publique, uniquement via des URLs signées à durée de vie
  courte (5 minutes).
- Toutes les tables Postgres ont RLS activé avec des policies `auth.uid() = user_id`.
- `/api/chat` et `/api/upload` vérifient : session Supabase valide → token
  Turnstile → (pour le chat) quota quotidien avant tout appel à Groq ou au
  storage.
- Validation des fichiers : extension + type MIME + taille (10 Mo max) côté
  client (retour rapide) **et** côté serveur (source de vérité).

## Prochaines étapes suggérées

- Outils automatisés de nettoyage/conversion de fichiers (traitement des
  fichiers déjà uploadés dans le bucket).
- Affichage de l'historique des conversations (liste + reprise).
- Rafraîchissement automatique du widget Turnstile après chaque token consommé.
