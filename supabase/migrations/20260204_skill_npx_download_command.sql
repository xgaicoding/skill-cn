/*
  v1.4.0 - Support NPX Download Command
  ----------------------------------------
  目的：
  - 部分 Skill 更适合通过 npx 指令快速初始化/下载（例如脚手架、一次性执行器）。
  - 在 Skill 详情页展示该命令并支持复制，提高“看到 Skill -> 立刻使用”的转化效率。

  变更：
  - skills 新增 npx_download_command 字段（text, nullable）
    - 可为空：不配置时不影响现有 ZIP 下载/外链下载逻辑
*/

alter table public.skills
add column if not exists npx_download_command text;

comment on column public.skills.npx_download_command is 'npx 下载/安装指令（用于详情页展示与一键复制）';

