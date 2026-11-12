-- agent_to_tenant RLS (plan U4 + ADV-R3-1).
-- This is the server-owned mapping that resolves Retell agent_id → tenant_id.
-- HOT-PATH SAFETY: tenant_id is derived from this table at provision time, NEVER
-- read from inbound webhook bodies. A spoofed webhook with the wrong tenant_id
-- in the body resolves to the correct tenant via agent_id join.
--
-- End-users have no read access. Founder reads all. Hot-path service uses
-- service role JWT (bypasses RLS).

create policy agent_to_tenant_founder_read
  on agent_to_tenant for select to authenticated
  using ( app.is_founder() );

-- Inserts/updates/deletes only via service role.
