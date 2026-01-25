-- Migration: fully automate practice <-> skill links.
--
-- Goals:
-- 1) Allow editing only the practices table (skill_ids / primary_skill_id).
-- 2) Automatically sync the practice_skills join table.
-- 3) Keep practice_count in skills consistent via existing triggers.

-- 1) Add write-friendly columns on practices.
--    skill_ids:    ordered list of skill ids for the practice (source of truth)
--    primary_skill_id: optional primary skill id (if null, we auto-pick the first element)
alter table public.practices
  add column if not exists skill_ids int[],
  add column if not exists primary_skill_id int;

-- 2) Backfill practices.skill_ids / primary_skill_id from existing practice_skills links.
--    This keeps historical data consistent after the column is introduced.
update public.practices p
set skill_ids = sub.skill_ids,
    primary_skill_id = coalesce(sub.primary_skill_id, sub.skill_ids[1])
from (
  select
    ps.practice_id,
    array_agg(
      ps.skill_id
      order by case when ps.is_primary then 0 else 1 end, ps.skill_id
    ) as skill_ids,
    max(case when ps.is_primary then ps.skill_id end) as primary_skill_id
  from public.practice_skills ps
  group by ps.practice_id
) sub
where p.id = sub.practice_id;

-- 3) Ensure columns have defaults and constraints.
--    - skill_ids must be non-empty
--    - primary_skill_id (if provided) must exist in skill_ids
update public.practices
set skill_ids = '{}'::int[]
where skill_ids is null;

update public.practices
set primary_skill_id = skill_ids[1]
where primary_skill_id is null
  and array_length(skill_ids, 1) >= 1;

alter table public.practices
  alter column skill_ids set default '{}'::int[],
  alter column skill_ids set not null;

alter table public.practices
  add constraint practices_skill_ids_check
  check (array_length(skill_ids, 1) >= 1);

alter table public.practices
  add constraint practices_primary_skill_check
  check (primary_skill_id is null or primary_skill_id = any(skill_ids));

-- 4) BEFORE trigger: normalize skill_ids + primary_skill_id before insert/update.
--    - remove null/invalid ids
--    - remove duplicates while preserving order
--    - auto-pick primary_skill_id when missing or invalid
create or replace function public.trg_prepare_practice_skill_ids()
returns trigger
language plpgsql
as $$
declare
  normalized_ids int[];
  normalized_primary int;
begin
  -- 清洗与去重：保留原始顺序，只取第一次出现的 skill_id。
  select array_agg(skill_id order by ord)
  into normalized_ids
  from (
    select distinct on (skill_id) skill_id, ord
    from unnest(new.skill_ids) with ordinality as u(skill_id, ord)
    where skill_id is not null and skill_id > 0
    order by skill_id, ord
  ) cleaned;

  if normalized_ids is null or array_length(normalized_ids, 1) = 0 then
    raise exception 'skill_ids cannot be empty for practices';
  end if;

  normalized_primary := new.primary_skill_id;

  -- primary_skill_id 必须在 skill_ids 中；否则自动回落到第一个 skill。
  if normalized_primary is null or not (normalized_primary = any(normalized_ids)) then
    normalized_primary := normalized_ids[1];
  end if;

  new.skill_ids := normalized_ids;
  new.primary_skill_id := normalized_primary;

  return new;
end;
$$;

-- 5) AFTER trigger: sync practice_skills join table from practices.skill_ids.
create or replace function public.trg_sync_practice_skills_from_practices()
returns trigger
language plpgsql
as $$
begin
  -- 如果 skill_ids/primary_skill_id 没变化，则不重复刷新。
  if tg_op = 'UPDATE'
     and new.skill_ids = old.skill_ids
     and new.primary_skill_id is not distinct from old.primary_skill_id then
    return null;
  end if;

  -- 先清理旧关系，再写入新关系，保证一致性。
  delete from public.practice_skills
  where practice_id = new.id;

  insert into public.practice_skills (practice_id, skill_id, is_primary)
  select new.id,
         skill_id,
         (skill_id = new.primary_skill_id)
  from unnest(new.skill_ids) as skill_id;

  return null;
end;
$$;

-- 6) Create triggers on practices to drive automation.
drop trigger if exists tr_prepare_practice_skill_ids on public.practices;
drop trigger if exists tr_sync_practice_skills_from_practices on public.practices;

create trigger tr_prepare_practice_skill_ids
before insert or update of skill_ids, primary_skill_id on public.practices
for each row execute function public.trg_prepare_practice_skill_ids();

create trigger tr_sync_practice_skills_from_practices
after insert or update of skill_ids, primary_skill_id on public.practices
for each row execute function public.trg_sync_practice_skills_from_practices();
