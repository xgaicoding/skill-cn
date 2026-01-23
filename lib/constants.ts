export const TAG_OPTIONS = ["全部", "研究", "编程", "写作", "数据分析", "设计", "生产力"] as const;
export const SORT_OPTIONS = [
  { value: "heat", label: "最热" },
  { value: "recent", label: "最新" },
] as const;

export const PAGE_SIZE = 12;

export const ISSUE_REPO_URL =
  process.env.NEXT_PUBLIC_ISSUE_REPO_URL ||
  process.env.ISSUE_REPO_URL ||
  "https://github.com/your-org/your-repo/issues/new/choose";

export const COMMUNITY_LINK =
  process.env.NEXT_PUBLIC_COMMUNITY_LINK ||
  process.env.COMMUNITY_LINK ||
  "https://applink.larkoffice.com/client/chat/chatter/add_by_link?link_token=9ecr1835-e5f1-4072-a21e-9acd2dff5d87";

export const OFFICIAL_DOCS_LINK =
  process.env.NEXT_PUBLIC_OFFICIAL_DOCS_LINK || process.env.OFFICIAL_DOCS_LINK || "";
