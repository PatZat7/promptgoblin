-- 0006_updated_at_triggers.sql
-- LIVE-SAFE: creates only application-owned function in public schema.
-- Only clients has updated_at; add triggers for other tables if they gain updated_at.

create or replace function set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_set_updated_at on clients;
create trigger clients_set_updated_at
  before update on clients
  for each row execute function set_updated_at();
