export const TAG_OPTIONS = ["全部", "研究", "编程", "写作", "数据分析", "设计", "生产力"] as const;
export const SORT_OPTIONS = [
  { value: "heat", label: "最热" },
  { value: "recent", label: "最新" },
] as const;

export const PAGE_SIZE = 12;
// Hero 推荐实践数量上限：
// - Swiper 的 cards 效果会给每个 slide 计算 3D transform/叠牌阴影
// - 卡片数量过多时会显著增加合成与绘制负担，导致首屏卡顿
// - 这里做统一上限，服务端/前端均使用同一数值保证体验一致
export const FEATURED_PRACTICE_LIMIT = 8;

// GitHub Issue 入口链接：固定常量，避免依赖 .env 导致线上入口缺失。
// 提交 Skill（create-skill 模板 + 新增技能标签）。
export const SKILL_ISSUE_URL =
  "https://github.com/xgaicoding/skill-cn/issues/new?template=create-skill.md&labels=%E6%96%B0%E5%A2%9E%E6%8A%80%E8%83%BD";
// 提交实践（create-practice 模板 + 提交实践标签）。
export const PRACTICE_ISSUE_URL =
  "https://github.com/xgaicoding/skill-cn/issues/new?template=create-practice.md&labels=%E6%8F%90%E4%BA%A4%E5%AE%9E%E8%B7%B5";
// 问题反馈（feature 模板 + 平台建议标签）。
export const FEEDBACK_ISSUE_URL =
  "https://github.com/xgaicoding/skill-cn/issues/new?template=feature.md&labels=%E5%B9%B3%E5%8F%B0%E5%BB%BA%E8%AE%AE";

export const COMMUNITY_LINK =
  process.env.NEXT_PUBLIC_COMMUNITY_LINK ||
  process.env.COMMUNITY_LINK ||
  "https://applink.larkoffice.com/client/chat/chatter/add_by_link?link_token=9ecr1835-e5f1-4072-a21e-9acd2dff5d87";

// 交流群二维码（主）：使用本地静态资源，保证展示稳定且与设计稿一致。
export const COMMUNITY_QR_URL =
  "/images/community.png";
// 交流群二维码（备用）：用于备用入口或分流展示。
export const COMMUNITY_QR_BACKUP_URL =
  "/images/xg-qr.png";

// 官方文档入口：固定链接，避免环境变量缺失导致按钮不可用。
export const OFFICIAL_DOCS_LINK =
  "https://my.feishu.cn/wiki/XKnEwisJbi8TLEkdW6wckqkQnoe?fromScene=spaceOverview";
