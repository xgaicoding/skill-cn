# Skill Hub 技能包（is_package）需求文档（PRD）

版本：v1.3.0（Skill Package）  
日期：2026-02-03  
作者：TBD  

本文档用于明确 **Skill Hub「技能包」能力的最小需求**：在 `skills` 上增加 `is_package` 字段，并在 Skill 详情页进行可视化标识。  
本期不引入“技能包包含哪些子 Skill”的结构化关系，仅做标识与展示，避免范围膨胀。

---

## 1. 背景与目标
### 1.1 背景
- 现有站点把每个 Skill 视为“单一技能/单一能力单元”。
- 实际上存在一类 Skill：它代表一组 Skills 的合集（技能包），而非某个单一 Skill。若不标识，用户在详情页容易误解其边界与用途。

### 1.2 目标
- 在数据层新增 `is_package` 字段，用于标记该 Skill 是否为“技能包”。
- 在 Skill 详情页（`/skill/[id]`）的 Skill 名称旁，若 `is_package=true`，展示 **「技能包」** Label，帮助用户快速理解该条目性质。

### 1.3 非目标（本期不做）
- 不建立“技能包-子 Skill”的关联模型（例如 `skill_packages`/`package_items` 等）。
- 不新增“技能包专属详情结构”（例如展示包含的 Skill 列表、版本、更新日志等）。
- 不改首页 Skill 卡片、搜索结果卡片的展示（仅改 Skill 详情页的名称旁标识）。
- 不提供后台/前端编辑入口来维护 `is_package`（仅提供字段与展示；数据维护沿用现有写入流程/DB 运维）。

---

## 2. 数据需求
### 2.1 表结构变更
在 `public.skills` 表新增字段：
- 字段名：`is_package`
- 类型：`boolean`
- 默认值：`false`
- 约束：`NOT NULL`

### 2.2 数据兼容/迁移
- 存量数据：全部默认 `false`，不改变现有展示。
- 需要标记为技能包的 Skill：通过现有数据写入/更新流程进行置位（例如脚本/管理端/SQL 维护，具体方式不在本期范围内）。

---

## 3. 前端展示需求（Skill 详情页）
### 3.1 展示位置
- 页面：Skill 详情页（`/skill/[id]`）
- 位置：Skill 名称（skill name）右侧（同行展示）

### 3.2 展示规则
- 当 `is_package = true`：显示 Label 文案 **「技能包」**
- 当 `is_package = false`：不显示该 Label

### 3.3 视觉与交互（最小口径）
- Label 采用与站内现有标签/Chip 一致的视觉语言（圆角、字号、间距与对比度保持统一）。
- Label 为纯展示元素，不可点击、无额外交互。

### 3.4 文档展示（仅 PC 端）
> 追更需求点：技能包不展示 SKILL.md，改为展示 README。

- 前提：`is_package = true`
- 页面：Skill 详情页（PC 端）
- 规则：
  - 原「SKILL.md」Tab 保留其位置，但文案改为 **README**
  - 内容区展示 **当前仓库根目录 README**（而不是 `SKILL.md`）
  - README 获取方式：从 GitHub 仓库根目录读取，优先级：
    - 优先：`README.zh.md`
    - 兜底：`README.md`
- 非目标：
  - 移动端详情页无需新增该交互/展示（移动端本期仍以关联实践流为主）

---

## 4. 接口/数据读取要求（口径）
- Skill 详情页数据查询需包含 `is_package` 字段（与 `name/description/tag/...` 同级返回），以支持渲染逻辑。
- 其他页面与接口可暂不使用该字段（但建议一并透出，避免后续重复改动）。

---

## 5. 验收标准
- 数据库 `skills` 表存在 `is_package` 字段，默认值为 `false`，且为 `NOT NULL`。
- 任意 Skill 详情页：
  - `is_package=false`：Skill 名称旁不出现「技能包」Label
  - `is_package=true`：Skill 名称旁出现「技能包」Label，视觉与现有标签风格一致
