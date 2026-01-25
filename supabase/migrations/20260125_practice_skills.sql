-- Migration: allow practices to link multiple skills via a join table.
-- Notes:
-- - This migration backfills existing practices.skill_id into practice_skills.
-- - After backfill, it removes practices.skill_id and related indexes.
-- - It refreshes practice_count using the new relationship.

-- 1) Create join table for many-to-many relationships.
create table if not exists public.practice_skills (
  practice_id integer not null,
  skill_id integer not null,
  is_primary boolean not null default false,
  created_at timestamp without time zone not null default now(),
  updated_at_sys timestamp without time zone not null default now(),
  constraint practice_skills_pkey primary key (practice_id, skill_id),
  constraint practice_skills_practice_id_fkey foreign key (practice_id) references public.practices (id) on delete cascade,
  constraint practice_skills_skill_id_fkey foreign key (skill_id) references public.skills (id) on delete cascade
) tablespace pg_default;

-- 2) Add indexes for common access patterns.
create index if not exists idx_practice_skills_skill_id on public.practice_skills using btree (skill_id) tablespace pg_default;
create index if not exists idx_practice_skills_practice_id on public.practice_skills using btree (practice_id) tablespace pg_default;

-- Ensure each practice has at most one primary skill.
create unique index if not exists idx_practice_skills_primary_unique
  on public.practice_skills (practice_id)
  where (is_primary = true);

-- 3) Backfill existing practices.skill_id into practice_skills.
insert into public.practice_skills (practice_id, skill_id, is_primary)
select id as practice_id, skill_id, true
from public.practices
where skill_id is not null
on conflict (practice_id, skill_id) do nothing;

-- 4) Remove old skill_id-based indexes and foreign key.
drop index if exists public.idx_practices_skill_id_performance;
drop index if exists public.idx_practices_skill_count;
alter table public.practices drop constraint if exists practices_skill_id_fkey;

-- 5) Remove practices.skill_id to avoid conflicting sources of truth.
alter table public.practices drop column if exists skill_id;

-- 6) Recreate RPC to count practices per skill using the join table.
create or replace function public.get_practice_counts_for_skills(skill_ids int[])
returns table(skill_id int, practice_count int)
language sql
stable
as $$
  select ps.skill_id,
         count(distinct ps.practice_id)::int as practice_count
  from public.practice_skills ps
  join public.practices p on p.id = ps.practice_id
  where ps.skill_id = any (skill_ids)
    and p.is_listed = true
  group by ps.skill_id;
$$;

-- 7) Helper to refresh practice_count for one skill.
create or replace function public.refresh_skill_practice_count(target_skill_id int)
returns void
language plpgsql
as $$
begin
  update public.skills
  set practice_count = (
    select count(distinct ps.practice_id)
    from public.practice_skills ps
    join public.practices p on p.id = ps.practice_id
    where ps.skill_id = target_skill_id
      and p.is_listed = true
  )
  where id = target_skill_id;
end;
$$;

-- 8) Helper to refresh practice_count for all skills linked to a practice.
create or replace function public.refresh_skill_practice_count_for_practice(target_practice_id int)
returns void
language plpgsql
as $$
declare
  linked_skill_id int;
begin
  for linked_skill_id in
    select skill_id from public.practice_skills where practice_id = target_practice_id
  loop
    perform public.refresh_skill_practice_count(linked_skill_id);
  end loop;
end;
$$;

-- 9) Trigger function: refresh counts when links change.
create or replace function public.trg_refresh_skill_practice_count_on_link()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    perform public.refresh_skill_practice_count(new.skill_id);
  elsif (tg_op = 'DELETE') then
    perform public.refresh_skill_practice_count(old.skill_id);
  else
    -- UPDATE: handle skill_id changes and primary flag updates.
    if (new.skill_id is distinct from old.skill_id) then
      perform public.refresh_skill_practice_count(old.skill_id);
      perform public.refresh_skill_practice_count(new.skill_id);
    else
      perform public.refresh_skill_practice_count(new.skill_id);
    end if;
  end if;
  return null;
end;
$$;

-- 10) Trigger function: refresh counts when practice listing state changes.
create or replace function public.trg_refresh_skill_practice_count_on_practice()
returns trigger
language plpgsql
as $$
begin
  if (new.is_listed is distinct from old.is_listed) then
    perform public.refresh_skill_practice_count_for_practice(new.id);
  end if;
  return null;
end;
$$;

-- 11) Replace old trigger and add new triggers.
drop trigger if exists tr_update_skill_practice_count on public.practices;

create trigger tr_refresh_skill_practice_count_on_link
after insert or delete or update of skill_id, is_primary on public.practice_skills
for each row execute function public.trg_refresh_skill_practice_count_on_link();

create trigger tr_refresh_skill_practice_count_on_practice
after update of is_listed on public.practices
for each row execute function public.trg_refresh_skill_practice_count_on_practice();

-- 12) Optional: add general-purpose indexes for listing practices after join.
create index if not exists idx_practices_listed_heat
  on public.practices using btree (is_listed, click_count desc, updated_at desc)
  tablespace pg_default
  where (is_listed = true);

create index if not exists idx_practices_listed_recent
  on public.practices using btree (is_listed, updated_at desc, click_count desc)
  tablespace pg_default
  where (is_listed = true);

-- 13) Recompute practice_count for all skills to align with the new relationship.
update public.skills
set practice_count = 0;

update public.skills s
set practice_count = sub.practice_count
from (
  select ps.skill_id, count(distinct ps.practice_id)::int as practice_count
  from public.practice_skills ps
  join public.practices p on p.id = ps.practice_id
  where p.is_listed = true
  group by ps.skill_id
) sub
where s.id = sub.skill_id;
