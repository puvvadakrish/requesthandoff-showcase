-- users RLS (plan U4).
-- A user can read their own row. Founder can read all rows. Updates only via service role.

create policy users_select_self
  on users for select to authenticated
  using ( id = auth.uid() or app.is_founder() );
