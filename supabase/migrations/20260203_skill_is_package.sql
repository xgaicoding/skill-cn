/*
  v1.3.0 - Skill Package
  ----------------------------------------
  目的：
  - 某些 Skill 实际上是“技能包”（一组 skills 的合集概念），而非单一 skill。
  - 本期只做“标识字段 + 前端展示”，不做 package -> items 的结构化关系建模。

  变更：
  - skills 新增 is_package 字段（boolean, NOT NULL, default false）
*/

alter table public.skills
add column if not exists is_package boolean not null default false;

comment on column public.skills.is_package is '是否为技能包（Skill 的合集概念），用于详情页展示「技能包」标识';

