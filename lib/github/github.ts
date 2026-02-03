import { Octokit } from "@octokit/rest";
import { calcHeat } from "@/lib/format";
import { Skill } from "@/lib/types";

export type GitHubParsedUrl = {
  owner: string;
  repo: string;
  ref: string | null;
  path: string | null;
};

export function parseGitHubUrl(raw: string): GitHubParsedUrl {
  const url = new URL(raw);
  if (url.hostname !== "github.com") {
    throw new Error(`Only supports github.com URLs, got: ${url.hostname}`);
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid GitHub URL path: ${url.pathname}`);
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");

  let ref: string | null = null;
  let path: string | null = null;
  if (parts[2] === "tree" || parts[2] === "blob") {
    ref = parts[3] || null;
    path = parts.slice(4).join("/") || null;
  }

  return { owner, repo, ref, path };
}

function getOctokit() {
  const auth = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || process.env.GH_TOKEN;
  return new Octokit({
    auth,
    userAgent: "skill-cn-github/0.1.0",
  });
}

export async function getRepoInfo(owner: string, repo: string) {
  const octokit = getOctokit();
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return {
    defaultBranch: data.default_branch,
    stars: data.stargazers_count,
    ownerLogin: data.owner?.login || owner,
    ownerAvatarUrl: data.owner?.avatar_url || null,
  };
}

export async function getOwnerInfo(login: string) {
  const octokit = getOctokit();
  const { data } = await octokit.request("GET /users/{username}", { username: login });
  return { displayName: data?.name || null };
}

export async function getLatestCommit(
  owner: string,
  repo: string,
  branch: string,
  path: string | null,
) {
  const octokit = getOctokit();
  const { data } = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner,
    repo,
    sha: branch,
    path: path || undefined,
    per_page: 1,
  });

  const latest = Array.isArray(data) ? data[0] : undefined;
  const date =
    latest?.commit?.committer?.date ||
    latest?.commit?.author?.date ||
    null;

  return { sha: latest?.sha || null, date };
}

export async function getSkillMarkdown(
  owner: string,
  repo: string,
  branch: string,
  path: string | null,
) {
  const octokit = getOctokit();
  const filePath = path ? `${path}/SKILL.md` : "SKILL.md";
  try {
    const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path: filePath,
      ref: branch,
    });

    if (!data || Array.isArray(data)) return null;
    const content = (data as { content?: string }).content;
    if (!content) return null;
    return Buffer.from(content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * 获取仓库根目录的 README（用于“技能包”展示）：
 * - 需求口径：技能包详情页不展示 SKILL.md，改为展示仓库根目录 README
 * - 说明：使用 GitHub 的 readme endpoint，可自动识别 README / README.md / README.MD 等文件名
 */
export async function getRepoReadmeMarkdown(
  owner: string,
  repo: string,
  branch: string,
) {
  const octokit = getOctokit();
  /**
   * README 读取优先级（产品追更）：
   * 1) README.zh.md（中文优先，便于国内用户阅读）
   * 2) README.md
   *
   * 说明：
   * - 这里不使用 GitHub 的 `/readme` endpoint，因为它会自动选一个“默认 README”，
   *   无法满足“先 zh 再默认”的明确优先级规则。
   */
  const tryPaths = ["README.zh.md", "README.md"];

  for (const filePath of tryPaths) {
    try {
      const { data } = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner,
        repo,
        path: filePath,
        ref: branch,
      });

      if (!data || Array.isArray(data)) {
        continue;
      }

      const content = (data as { content?: string }).content;
      if (!content) {
        continue;
      }

      return Buffer.from(content, "base64").toString("utf-8");
    } catch {
      // ignore：继续尝试下一个候选文件
    }
  }

  return null;
}

export function shouldRenderPlain(markdown: string): boolean {
  /**
   * 历史逻辑说明（保留函数但不再作为“默认降级策略”）：
   * - 早期为了避免 README/SKILL.md 中存在相对链接（如 ./README.md、./images/a.png）
   *   导致站内渲染出现 404/空白，因此用“整篇降级为纯文本”规避。
   *
   * v1.3.0 之后的策略：
   * - 不再因为“存在链接/相对链接”就把整篇 Markdown 降级
   * - 前端会对不支持的相对链接做“按需转换”（例如转成 GitHub blob/raw URL），做到“能渲染的正常渲染”
   *
   * 因此：该函数目前仅作为参考保留，不再用于决定 renderMode。
   */
  const urls: string[] = [];
  const inlineRegex = /!?\[[^\]]*\]\(([^)]+)\)/g;
  const refRegex = /^\s*\[[^\]]+\]:\s*(\S+)/gm;
  const htmlRegex = /<(a|img)\s+[^>]*(href|src)=["']([^"']+)["'][^>]*>/gi;

  let match: RegExpExecArray | null = null;
  while ((match = inlineRegex.exec(markdown))) {
    urls.push(match[1]);
  }
  while ((match = refRegex.exec(markdown))) {
    urls.push(match[1]);
  }
  while ((match = htmlRegex.exec(markdown))) {
    urls.push(match[3]);
  }

  return urls.some((url) => {
    const trimmed = url.trim();
    return !(trimmed.startsWith("http://") || trimmed.startsWith("https://"));
  });
}

export async function syncSkillFromGitHub(skill: Skill) {
  const { owner, repo, path } = parseGitHubUrl(skill.source_url);
  const repoInfo = await getRepoInfo(owner, repo);
  const ownerInfo = await getOwnerInfo(repoInfo.ownerLogin);
  const branch = repoInfo.defaultBranch; // 统一使用默认分支

  /**
   * v1.3.0 技能包（is_package）：
   * - 普通 Skill：读取（path 下的）SKILL.md
   * - 技能包：读取仓库根目录 README（与“合集”语义一致）
   *
   * 同时，技能包的更新时间更贴近“仓库级别变化”，因此取全仓库最新提交（path=null）
   */
  const isPackage = skill.is_package === true;
  const latestCommit = await getLatestCommit(owner, repo, branch, isPackage ? null : path);
  const markdown = isPackage
    ? await getRepoReadmeMarkdown(owner, repo, branch)
    : await getSkillMarkdown(owner, repo, branch, path);

  const repoStars = repoInfo.stars ?? 0;
  const heatScore = calcHeat(skill.practice_count ?? 0, repoStars);
  const repoOwnerName = ownerInfo.displayName || repoInfo.ownerLogin;

  let renderMode: "markdown" | "plain" = "markdown";
  /**
   * 渲染模式策略（追更）：
   * - 只要拿到 Markdown 内容，默认都按 markdown 渲染
   * - 不再因为“存在相对链接”而整篇降级为 plain
   *
   * 原因：详情页会在渲染层把相对链接按需转换为 GitHub 链接，从而做到“局部降级、整体可读”。
   */
  renderMode = markdown ? "markdown" : "plain";

  return {
    repo_stars: repoStars,
    repo_owner_name: repoOwnerName,
    repo_owner_avatar_url: repoInfo.ownerAvatarUrl,
    updated_at: latestCommit.date || skill.updated_at,
    markdown,
    markdown_render_mode: renderMode,
    heat_score: heatScore,
  } as const;
}
