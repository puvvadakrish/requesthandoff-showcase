-- demo_sessions RLS (plan U22 abuse protection).
-- Public demo URLs are unauthenticated. The /demo/<id> page reads one exact
-- demo preview through `get_public_demo_session(demo_id)` rather than anon
-- table select, so approved demos cannot be enumerated from the REST API.
-- The /demo/<id>/connect API route uses service role to reserve sessions,
-- record hashed-IP attempts, and create Retell tokens after abuse controls pass.
-- End-users (paying tenants) have no visibility into demo_sessions beyond
-- public demo URLs they already possess.
-- Founder reads all (for the COGS dashboard demo-spend view).

create or replace function get_public_demo_session(p_demo_id text)
returns table (
  demo_id text,
  prospect_business_name text,
  prospect_website_url text,
  extracted_config jsonb,
  session_count integer,
  max_sessions integer,
  expires_at timestamptz,
  founder_approved boolean
)
language sql
security definer
set search_path = public
as $$
  select
    ds.demo_id,
    ds.prospect_business_name,
    ds.prospect_website_url,
    ds.extracted_config,
    ds.session_count,
    ds.max_sessions,
    ds.expires_at,
    ds.founder_approved
  from demo_sessions ds
  where ds.demo_id = p_demo_id
  limit 1;
$$;

revoke all on function get_public_demo_session(text) from public;
grant execute on function get_public_demo_session(text) to anon, authenticated;
revoke select on demo_sessions from anon;

create policy demo_sessions_founder_read
  on demo_sessions for select to authenticated
  using ( app.is_founder() );

-- All writes (creation, session_count increments, founder_approved flips) via
-- service role.

-- demo_session_attempts has RLS enabled in the base migration and intentionally
-- no anon/authenticated policies. Only the server route may insert/read these
-- hashed-IP attempt records.
