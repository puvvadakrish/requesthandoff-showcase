-- RLS helper functions (plan U4).
--
-- These run with the row-level security check; they're SECURITY DEFINER so they
-- can read auth.users + public.users without infinite policy recursion.
-- Naming: app.* prefix keeps them out of the public namespace.

create schema if not exists app;

-- Returns the tenant_id associated with the current authenticated user, or NULL
-- if no user / no tenant link. Used by all tenant-scoped policies.
create or replace function app.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select tenant_id from public.users where id = auth.uid()
$$;

-- True if the current user is the founder (set via Supabase Dashboard
-- on the founder's auth user — `is_founder = true` in public.users).
-- Founder bypasses tenant RLS and can read/write any tenant's rows from admin routes.
create or replace function app.is_founder()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select coalesce(
    (select is_founder from public.users where id = auth.uid()),
    false
  )
$$;
