# 贡献指南（Contributing）

感谢你愿意为 Skill Hub 中国贡献代码/内容。我们希望把「可复用、可落地」的 Skill 与实践沉淀成社区资产，因此非常欢迎 PR、Issue 与实践分享。

## 推荐贡献方式

- 🐛 报告 Bug：请在 Issue 中描述复现步骤、期望/实际行为、运行环境（Node 版本/浏览器/是否配置 Supabase）
- 🌟 推荐优质 Skill：使用 Issue 模板 `.github/ISSUE_TEMPLATE/create-skill.md`
- ✨ 推荐优质实践：使用 Issue 模板 `.github/ISSUE_TEMPLATE/create-practice.md`
- 💡 功能建议：使用 Issue 模板 `.github/ISSUE_TEMPLATE/feature.md`
- 📖 文档完善：补充 README、PRD、技术方案、最佳实践等

## 开发约定（重要）

- 中文优先：文案与注释尽量使用中文，方便更多同学参与共建
- 注释要求：**新增/修改的关键逻辑请写清楚“为什么这么做”**，避免只写“做了什么”
- 版本与日志（仅针对“特性改动”）：每次功能/特性变更后
  - 升级 `package.json` 的版本号
  - 在根目录 `CHANGELOG.md` 记录变更内容
- 安全：不要把任何真实 Key/Token（Supabase/GitHub 等）提交到仓库

## 提交流程

1. Fork 本仓库
2. 新建分支：
   - `feature/xxx`：新功能
   - `fix/xxx`：修复
   - `docs/xxx`：文档
3. 开发与自测：
   - `npm run lint`
   - `npm run build`
4. 提交代码：
   - `git commit -m "xxx"`（建议写清楚动机与影响）
5. 推送并创建 Pull Request

## PR 描述建议

为了让 Review 更高效，建议在 PR 描述中包含：

- 改动点摘要（做了什么 & 为什么）
- 影响范围（页面/API/数据结构/兼容性）
- 自测方式（跑了哪些命令、如何验证）
- 如涉及 UI：提供截图/录屏

再次感谢你的贡献！每一个 PR 都会让 Skill Hub 中国更接近“万众瞩目”的开源作品。

