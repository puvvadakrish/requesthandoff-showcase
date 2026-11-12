-- tenants RLS (plan U4).
-- Owners read/update their own tenant only. Founder reads/writes any.
-- Service role bypasses RLS by default.

create policy tenants_select_own
  on tenants for select to authenticated
  using ( id = app.current_tenant_id() or app.is_founder() );

create policy tenants_update_own
  on tenants for update to authenticated
  using ( id = app.current_tenant_id() or app.is_founder() )
  with check ( id = app.current_tenant_id() or app.is_founder() );

-- Inserts only via service role (founder admin tenant creation in U21) — no policy needed.
-- Deletes forbidden for owners; founder uses service role for cancellation.
