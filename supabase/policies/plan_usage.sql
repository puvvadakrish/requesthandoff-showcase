-- plan_usage RLS (plan U4).
-- Owner reads their tenant's usage; founder reads all (powers the COGS dashboard).
-- Writes only via service role (post-call worker rollups + cron updates).

create policy plan_usage_select_own
  on plan_usage for select to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() );
