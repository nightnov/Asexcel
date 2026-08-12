-- Asecxel — schema & Row Level Security policies
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "uuid-ossp";
-- Trigram similarity, used to match "very similar" questions in answer_cache
-- without needing an embeddings/vector pipeline.
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, tracks the daily free-quota counter
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  daily_quota_used integer not null default 0,
  quota_reset_at date not null default current_date,
  -- 'pro' grants unlimited AI usage (see src/lib/quota.ts). Flipped by the
  -- Tebex webhook (see src/app/api/tebex/webhook/route.ts), never set
  -- directly by client code.
  plan text not null default 'free' check (plan in ('free', 'pro')),
  -- Which Pro pricing option is active — null unless plan = 'pro'.
  plan_type text check (plan_type in ('monthly', 'annual')),
  -- Tebex transaction id, set once a checkout completes — used to match the
  -- profile again on cancellation/expiry. Nullable: most users never touch
  -- billing. No card data is ever stored here or anywhere else in this
  -- schema — Tebex (merchant of record) holds it, we only keep the id.
  tebex_transaction_id text unique,
  -- Set once the welcome e-mail has actually been sent (see
  -- src/app/auth/callback/route.ts) so a returning user is never re-sent
  -- one on every login — null means "not sent yet".
  welcome_email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Safe on repeat runs: adds columns if this table already existed before
-- the free/Pro tier split, or before Tebex billing, was introduced.
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free', 'pro'));
alter table public.profiles add column if not exists plan_type text check (plan_type in ('monthly', 'annual'));
alter table public.profiles add column if not exists tebex_transaction_id text unique;
alter table public.profiles add column if not exists welcome_email_sent_at timestamptz;
-- Drops columns from earlier payment-provider prototypes of this feature, if present.
alter table public.profiles drop column if exists stripe_customer_id;
alter table public.profiles drop column if exists stripe_subscription_id;
alter table public.profiles drop column if exists lemon_squeezy_customer_id;
alter table public.profiles drop column if exists lemon_squeezy_subscription_id;

alter table public.profiles enable row level security;

create policy "profiles: user can read own row"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: user can update own row"
  on public.profiles for update
  using (auth.uid() = id);

-- profile row is created automatically when a new auth user signs up
-- (including anonymous/guest users, whose new.email is null)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- conversations & messages: chat history
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null default 'Nouvelle conversation',
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;

create policy "conversations: owner full access"
  on public.conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

create policy "messages: owner full access"
  on public.messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists messages_conversation_id_idx on public.messages (conversation_id);

-- ---------------------------------------------------------------------------
-- files: metadata for uploads stored in the "excel-files" storage bucket
-- ---------------------------------------------------------------------------
create table if not exists public.files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  status text not null default 'uploaded' check (status in ('uploaded', 'processing', 'ready', 'error')),
  created_at timestamptz not null default now()
);

alter table public.files enable row level security;

create policy "files: owner full access"
  on public.files for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists files_user_id_idx on public.files (user_id);

-- ---------------------------------------------------------------------------
-- answer_cache: shared Q&A cache to avoid re-calling Groq for questions
-- other users have already asked. Deliberately NOT scoped by user_id — it's
-- meant to be reused across users, unlike `messages` which is private chat
-- history. Only ever populated with the model's own answers (no user PII
-- beyond the question text itself).
-- ---------------------------------------------------------------------------
create table if not exists public.answer_cache (
  id uuid primary key default uuid_generate_v4(),
  question_normalized text not null,
  question_original text not null,
  answer text not null,
  model text not null,
  hit_count integer not null default 0,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now(),
  -- Scopes the cache per feature so unrelated tools never match each
  -- other's entries (e.g. the formula generator's "create in French" cache
  -- must never answer a "create in English" or "explain" request, and
  -- neither should collide with the chat assistant's cache).
  namespace text not null default 'chat'
);

-- Safe on repeat runs: adds the column if this table already existed
-- before namespaces were introduced.
alter table public.answer_cache add column if not exists namespace text not null default 'chat';

alter table public.answer_cache enable row level security;

-- Shared cache: any authenticated user can read and contribute entries.
-- No update/delete policy — entries are immutable once written (hit_count
-- bumps go through the increment_cache_hit() function below instead, which
-- runs as the function owner so it isn't blocked by RLS).
create policy "answer_cache: authenticated can read"
  on public.answer_cache for select
  to authenticated
  using (true);

create policy "answer_cache: authenticated can insert"
  on public.answer_cache for insert
  to authenticated
  with check (true);

-- GIN trigram index powers the `similarity()` lookup used to find "very
-- similar" previously-asked questions in src/lib/answerCache.ts. The btree
-- index lets Postgres cheaply narrow down to one namespace before running
-- the (more expensive) similarity comparison within it.
create index if not exists answer_cache_question_trgm_idx
  on public.answer_cache using gin (question_normalized gin_trgm_ops);

create index if not exists answer_cache_namespace_idx
  on public.answer_cache (namespace);

-- Bumps hit_count/last_used_at without requiring an UPDATE RLS policy open
-- to every authenticated user.
create or replace function public.increment_cache_hit(cache_id uuid)
returns void as $$
begin
  update public.answer_cache
  set hit_count = hit_count + 1,
      last_used_at = now()
  where id = cache_id;
end;
$$ language plpgsql security definer set search_path = public;

grant execute on function public.increment_cache_hit(uuid) to authenticated;

-- Finds the single best cache match for a normalized question using trigram
-- similarity. PostgREST's query builder can't call similarity() inside a
-- WHERE/ORDER BY clause directly, hence this RPC. security invoker (the
-- default) is fine since the "authenticated can read" policy above already
-- allows this.
-- Adding p_namespace changes the signature, so "create or replace" would
-- leave the old 2-argument version behind as an ambiguous overload —
-- drop it explicitly first (no-op if this is a fresh install).
drop function if exists public.match_cached_answer(text, real);

create or replace function public.match_cached_answer(
  query_text text,
  min_similarity real default 0.55,
  p_namespace text default 'chat'
)
returns table (
  id uuid,
  answer text,
  model text,
  question_original text,
  similarity real
)
language sql
stable
as $$
  select
    answer_cache.id,
    answer_cache.answer,
    answer_cache.model,
    answer_cache.question_original,
    similarity(answer_cache.question_normalized, query_text) as similarity
  from public.answer_cache
  where answer_cache.namespace = p_namespace
    and answer_cache.question_normalized % query_text
    and similarity(answer_cache.question_normalized, query_text) >= min_similarity
  order by similarity desc
  limit 1;
$$;

grant execute on function public.match_cached_answer(text, real, text) to authenticated;

-- ---------------------------------------------------------------------------
-- support_requests: messages submitted through the "Questions, Requêtes &
-- Problèmes" contact form (/outils/support). Publicly submittable (no auth
-- required — anonymous visitors must be able to reach support), so RLS stays
-- enabled with no client-facing policies at all: the only writer is the
-- /api/support route, which uses the service-role admin client and bypasses
-- RLS entirely. No one can read/insert/update this table from the browser.
-- ---------------------------------------------------------------------------
create table if not exists public.support_requests (
  id uuid primary key default uuid_generate_v4(),
  message text not null,
  email text,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

-- ---------------------------------------------------------------------------
-- email_logs: one row per outbound Resend send attempt (support replies, Pro
-- confirmation, welcome), success or failure — replaces the old console.warn
-- so an infra hiccup (bad key, sandbox restriction, quota) leaves a durable
-- trace instead of silently vanishing the moment nobody tails server logs.
-- Written exclusively by the service-role client (see src/lib/email.ts); no
-- client-facing RLS policy is defined, same stance as support_requests.
-- ---------------------------------------------------------------------------
create table if not exists public.email_logs (
  id uuid primary key default uuid_generate_v4(),
  category text not null check (category in ('support', 'pro_confirmation', 'welcome', 'otp_code')),
  recipient text not null,
  subject text not null,
  status text not null check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now()
);

-- Safe on repeat runs: widens the category check if this table already
-- existed before 'otp_code' (custom OTP delivery, bypassing Supabase Auth's
-- own mailer) was added as a category.
alter table public.email_logs drop constraint if exists email_logs_category_check;
alter table public.email_logs add constraint email_logs_category_check
  check (category in ('support', 'pro_confirmation', 'welcome', 'otp_code'));

alter table public.email_logs enable row level security;
