-- Run this once in Supabase SQL Editor to fix "permission denied" errors
-- on every app table (conversations, messages, files, answer_cache, profiles).
-- Safe to re-run.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answer_cache TO authenticated, service_role;

-- Sequences (needed for any serial/identity columns to auto-increment)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
