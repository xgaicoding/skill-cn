-- Migration: resync practice_skills from practices.skill_ids.
--
-- 场景：
-- - 已经在 practices 表写入了 skill_ids，但 practice_skills 没有被同步（例如触发器未生效时导入）。
-- - 首页实践数量依赖 practice_skills 统计，因此需要一次性修复。
--
-- 说明：
-- - 先删除不再属于 skill_ids 的旧关联。
-- - 再 upsert 当前 skill_ids，补齐缺失关系并更新 is_primary。

-- 1) 删除已不在 skill_ids 中的旧关联。
delete from public.practice_skills ps
using public.practices p
where p.id = ps.practice_id
  and not (ps.skill_id = any(p.skill_ids));

-- 2) 插入/更新 practice_skills 以匹配当前 skill_ids。
insert into public.practice_skills (practice_id, skill_id, is_primary)
select
  p.id as practice_id,
  sid as skill_id,
  (sid = p.primary_skill_id) as is_primary
from public.practices p
cross join lateral unnest(p.skill_ids) as sid
on conflict (practice_id, skill_id)
do update set is_primary = excluded.is_primary;
