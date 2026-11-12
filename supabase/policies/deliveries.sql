-- deliveries RLS (plan U4).
-- Owner reads delivery status for their tenant's leads. No updates from owner side.
-- Inserts/updates only via service role (post-call worker delivery fan-out).

create policy deliveries_select_own
  on deliveries for select to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() );
