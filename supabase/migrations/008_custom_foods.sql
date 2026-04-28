create table if not exists custom_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  category    text not null default 'My Foods',
  calories    numeric not null default 0,
  protein_g   numeric not null default 0,
  carbs_g     numeric not null default 0,
  fat_g       numeric not null default 0,
  fiber_g     numeric not null default 0,
  default_serving integer not null default 100,
  serving_unit text not null default 'g',
  created_at  timestamptz default now()
);

alter table custom_foods enable row level security;

create policy "Users manage own custom foods"
  on custom_foods for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
