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

export function shouldRenderPlain(markdown: string): boolean {
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

  const latestCommit = await getLatestCommit(owner, repo, branch, path);
  const markdown = await getSkillMarkdown(owner, repo, branch, path);

  const repoStars = repoInfo.stars ?? 0;
  const heatScore = calcHeat(skill.practice_count ?? 0, repoStars);
  const repoOwnerName = ownerInfo.displayName || repoInfo.ownerLogin;

  let renderMode: "markdown" | "plain" = "markdown";
  if (markdown) {
    renderMode = shouldRenderPlain(markdown) ? "plain" : "markdown";
  } else {
    renderMode = "plain";
  }

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
