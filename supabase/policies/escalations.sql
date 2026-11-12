-- escalations RLS (plan U4).
-- Owner reads escalations for their tenant + can flip `owner_marked_false_positive`
-- via the U19 "Wasn't actually urgent" button (round 1 finding #12 — STRATEGY metric #2).
-- Inserts only via service role (services/post-call escalation worker, U15).

create policy escalations_select_own
  on escalations for select to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() );

-- Owners may only update the false-positive feedback fields, nothing else.
create policy escalations_update_false_positive_own
  on escalations for update to authenticated
  using ( tenant_id = app.current_tenant_id() or app.is_founder() )
  with check ( tenant_id = app.current_tenant_id() or app.is_founder() );
-- NOTE: column-level immutability (only false-positive fields editable) enforced
-- in application code; RLS gives row visibility, application gives column-level rules.
