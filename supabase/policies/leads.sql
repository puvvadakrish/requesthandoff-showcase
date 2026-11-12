-- leads RLS (plan U4 + R20/R21).
-- Owner reads + updates (status + attributed_value_usd) their tenant's leads.
-- Founder reads + updates all. Inserts only via service role (post-call worker).

create policy leads_select_own
  on leads for select to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() );

create policy leads_update_own
  on leads for update to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() )
  with check ( tenant_id = app.current_tenant_id() or app.is_founder() );
