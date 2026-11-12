-- RequestHandoff MVP — initial schema (plan U3).
-- Target: Supabase Postgres in us-east-1 (Virginia).
-- All tenant-scoped tables are RLS-enabled (policies live in supabase/policies/).
-- Encrypted PII columns (caller_*) use Supabase Vault per R25.

-- =============================================================================
-- Extensions
-- =============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- Enums
-- =============================================================================
create type vertical_kind as enum ('general', 'hvac', 'plumbing');
create type plan_tier as enum ('starter', 'growth', 'pro');
create type tenant_status as enum ('draft', 'active', 'cancelled', 'suspended');
create type call_direction as enum ('inbound', 'demo', 'audit');
create type call_status as enum (
  'in_progress',
  'completed',
  'abandoned',
  'wrap_capped',
  'non_english_fallback'
);
create type urgency_level as enum ('standard', 'elevated', 'urgent');
create type lead_status as enum ('new', 'contacted', 'booked', 'lost', 'spam');
create type escalation_outcome as enum (
  'answered',
  'no_answer',
  'declined',
  'retell_error',
  'owner_unreachable',
  'urgent_unbridged'
);
create type delivery_channel as enum ('email', 'jobber', 'webhook_url');
create type delivery_status as enum ('pending', 'delivered', 'failed', 'retrying', 'needs_reauth');

-- =============================================================================
-- vertical_scaffolds — system-owned playbook scaffolds (per plan D14).
-- Seeded with general + hvac at MVP; plumbing deferred to v1.1.
-- =============================================================================
create table vertical_scaffolds (
  id uuid primary key default uuid_generate_v4(),
  vertical vertical_kind not null,
  name text not null,
  parent_id uuid references vertical_scaffolds(id),

  greeting_prefix text not null default '',
  -- urgency_rules / qualification_fields / recommended_actions stored as jsonb
  -- so seed files can ship them as a single payload; runtime schema enforces shape via zod.
  urgency_rules jsonb not null default '[]'::jsonb,
  qualification_fields jsonb not null default '[]'::jsonb,
  recommended_actions jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now()
);
create unique index vertical_scaffolds_vertical_root_uniq
  on vertical_scaffolds(vertical) where parent_id is null;

-- =============================================================================
-- tenants — one row per home/local-services business
-- =============================================================================
create table tenants (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  vertical vertical_kind not null,
  -- secondary verticals whose urgency rules merge in (D14).
  secondary_services vertical_kind[] not null default '{}',
  -- owner's primary state of operation (default TX for Austin launch; D11).
  primary_state char(2) not null default 'TX',

  plan plan_tier not null default 'starter',
  status tenant_status not null default 'draft',

  -- E.164 US format. Used for Retell warm-transfer outbound (F2, R11).
  escalation_phone text not null,
  escalation_email text not null,

  greeting_override text not null default '',

  hours jsonb not null default '{}'::jsonb,
  services_offered text[] not null default '{}',
  services_not_offered text[] not null default '{}',
  coverage_zip_codes text[] not null default '{}',
  outbound_webhook_url text,
  -- Encrypted by services/post-call with OUTBOUND_WEBHOOK_SECRET_ENCRYPTION_KEY.
  -- Runtime TenantConfig exposes plaintext only after decrypting in process.
  outbound_webhook_secret_ciphertext text,
  custom_urgency_rules jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- agent_to_tenant — server-owned mapping for hot-path tenant resolution (plan U4 + ADV-R3-1).
-- Hot-path service NEVER reads tenant_id from inbound webhook bodies.
-- It joins on Retell's agent_id to find the owning tenant_id.
-- =============================================================================
create table agent_to_tenant (
  retell_agent_id text primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  -- 'production' for paying-tenant agents, 'demo' for the shared demo agent (per U22).
  agent_kind text not null check (agent_kind in ('production', 'demo')),
  created_at timestamptz not null default now()
);
create index agent_to_tenant_tenant_idx on agent_to_tenant(tenant_id);

-- =============================================================================
-- users — Supabase auth.users join. Founder identity gated by `is_founder`.
-- =============================================================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references tenants(id) on delete cascade,
  email text not null,
  is_founder boolean not null default false,
  created_at timestamptz not null default now()
);
create index users_tenant_idx on users(tenant_id);

-- =============================================================================
-- calls — one row per Retell call (or demo session).
-- PII columns encrypted at the column layer via Supabase Vault wrappers in
-- application code; transcript text is long-form free text (R12, R25).
-- =============================================================================
create table calls (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  retell_agent_id text not null,
  retell_call_id text not null unique, -- idempotency key for U8 webhook ingest

  direction call_direction not null,
  status call_status not null default 'in_progress',

  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,

  transcript text,
  transcript_retention_days integer not null default 90,

  -- COGS telemetry (R27 + round 1 finding #11).
  retell_inbound_minutes numeric(8, 4) not null default 0,
  retell_outbound_transfer_minutes numeric(8, 4) not null default 0,
  gemini_input_tokens integer not null default 0,
  gemini_output_tokens integer not null default 0,
  gemini_cached_tokens integer not null default 0,
  resend_sends integer not null default 0,

  created_at timestamptz not null default now()
);
create index calls_tenant_started_idx on calls(tenant_id, started_at desc);

-- =============================================================================
-- leads — extraction result + workflow state (R15, R20, R21).
-- caller_* columns hold encrypted ciphertext; plaintext lives only in transit.
-- =============================================================================
create table leads (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  call_id uuid not null references calls(id) on delete cascade unique,

  caller_name text,
  caller_phone text,
  caller_email text,
  caller_address text,

  service_category text not null,
  issue_description text not null,
  location text,

  urgency_level urgency_level not null default 'standard',
  urgency_confidence numeric(4, 3) not null default 0,

  preferred_window text,

  recommended_action text not null,
  recommended_action_confidence numeric(4, 3) not null default 0,

  missing_information text[] not null default '{}',
  call_confidence_score numeric(4, 3) not null default 0,
  rule_match_known boolean not null default false,
  detected_language char(2),

  status lead_status not null default 'new',
  attributed_value_usd numeric(10, 2), -- owner self-attribution (R21, U19)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_tenant_status_created_idx on leads(tenant_id, status, created_at desc);

-- =============================================================================
-- escalations — every warm-transfer attempt (R11, R13, AE2).
-- No escalation may silently fail.
-- =============================================================================
create table escalations (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  call_id uuid not null references calls(id) on delete cascade,

  rule_id text not null,
  rule_severity urgency_level not null,

  target_phone text not null,

  attempted_at timestamptz not null default now(),
  completed_at timestamptz,
  ring_duration_seconds integer,
  outcome escalation_outcome not null default 'answered',

  -- false-positive feedback loop (round 1 finding #12 — STRATEGY metric #2).
  owner_marked_false_positive boolean not null default false,
  owner_feedback_at timestamptz,

  -- D11 multi-state warning shown to the owner pre-bridge?
  multi_state_warning_shown boolean not null default false
);
create index escalations_tenant_attempted_idx
  on escalations(tenant_id, attempted_at desc);

-- =============================================================================
-- deliveries — one row per (lead × channel) attempt (R16, U11/U12/U14).
-- =============================================================================
create table deliveries (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,

  channel delivery_channel not null,
  status delivery_status not null default 'pending',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  error_message text,
  provider_id text,

  created_at timestamptz not null default now()
);
create index deliveries_tenant_lead_idx on deliveries(tenant_id, lead_id);
create index deliveries_pending_retry_idx
  on deliveries(next_attempt_at) where status in ('pending', 'retrying');

-- =============================================================================
-- plan_usage — per-tenant per-billing-cycle metering (R28).
-- =============================================================================
create table plan_usage (
  id uuid primary key default uuid_generate_v4(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  billing_period_start date not null,
  billing_period_end date not null,
  plan plan_tier not null,
  included_calls integer not null,
  calls_used integer not null default 0,

  -- aggregated COGS for the period (rolled up from calls.* per Week 7 dashboard).
  total_retell_inbound_minutes numeric(10, 4) not null default 0,
  total_retell_outbound_transfer_minutes numeric(10, 4) not null default 0,
  total_gemini_cost_usd numeric(10, 4) not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, billing_period_start)
);

-- =============================================================================
-- demo_sessions — per-prospect Retell web-call instance (per plan U22).
-- Separate from `calls` to keep tenant analytics clean and to enable abuse-
-- protection caps (3 sessions per demo_id, daily spend circuit-breaker).
-- =============================================================================
create table demo_sessions (
  id uuid primary key default uuid_generate_v4(),
  -- the public demo_id surfaced in /demo/<demoId>
  demo_id text not null,
  -- snapshot of the extracted tenant config used to dynamically prompt the demo agent
  extracted_config jsonb not null,
  prospect_business_name text not null,
  prospect_website_url text,

  session_count integer not null default 0,
  max_sessions integer not null default 3, -- abuse cap (U22)
  expires_at timestamptz not null,

  -- per-session cost rollup (Retell minutes for the public demo agent only).
  total_demo_minutes numeric(8, 4) not null default 0,
  total_demo_cost_usd numeric(8, 4) not null default 0,

  -- founder pre-flight gate (U22) — must be true before /demo/<demoId> is shareable.
  founder_approved boolean not null default false,
  founder_approved_at timestamptz,

  created_at timestamptz not null default now()
);
create unique index demo_sessions_demo_id_uniq on demo_sessions(demo_id);
create index demo_sessions_expires_idx on demo_sessions(expires_at);

-- Public-demo connect attempts. Stores only a salted hash of the client IP so
-- the demo route can enforce U22's 1-session-per-IP-per-hour guard without
-- retaining raw visitor IPs.
create table demo_session_attempts (
  id uuid primary key default uuid_generate_v4(),
  demo_id text not null references demo_sessions(demo_id) on delete cascade,
  ip_hash text not null,
  turnstile_verified boolean not null default false,
  succeeded boolean not null default false,
  retell_call_id text,
  created_at timestamptz not null default now()
);
create index demo_session_attempts_demo_ip_created_idx
  on demo_session_attempts(demo_id, ip_hash, created_at desc);
create index demo_session_attempts_success_created_idx
  on demo_session_attempts(succeeded, created_at desc);

-- =============================================================================
-- updated_at triggers — keep timestamp columns honest.
-- =============================================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenants_updated_at before update on tenants
  for each row execute function set_updated_at();
create trigger leads_updated_at before update on leads
  for each row execute function set_updated_at();
create trigger plan_usage_updated_at before update on plan_usage
  for each row execute function set_updated_at();

-- Public demo preview lookup. This allows /demo/<demoId> to load the one
-- exact preview link a prospect possesses without granting anon table reads
-- that could enumerate all approved demo sessions.
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

-- =============================================================================
-- Enable RLS on all tenant-scoped tables. Policies live in supabase/policies/.
-- vertical_scaffolds is global; agent_to_tenant + demo_sessions are
-- founder/service-only (no end-user RLS access).
-- =============================================================================
alter table tenants enable row level security;
alter table users enable row level security;
alter table calls enable row level security;
alter table leads enable row level security;
alter table escalations enable row level security;
alter table deliveries enable row level security;
alter table plan_usage enable row level security;
alter table agent_to_tenant enable row level security;
alter table demo_sessions enable row level security;
alter table demo_session_attempts enable row level security;
-- vertical_scaffolds is intentionally global-readable (no RLS).
