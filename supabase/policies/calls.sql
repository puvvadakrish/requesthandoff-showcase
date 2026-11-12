-- calls RLS (plan U4).
-- Owner reads their tenant's calls. Founder reads all. Writes only via service role.

create policy calls_select_own
  on calls for select to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() );
