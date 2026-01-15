import { Octokit } from "@octokit/rest";

function parseGitHubUrl(raw) {
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

  let ref;
  let path;
  if (parts[2] === "tree" || parts[2] === "blob") {
    ref = parts[3];
    path = parts.slice(4).join("/");
  }

  return { owner, repo, ref, path };
}

async function main() {
  const inputUrl = process.argv[2];
  if (!inputUrl) {
    console.error("Usage: node demo.mjs <github-url>");
    process.exit(1);
  }

  const { owner, repo, ref, path } = parseGitHubUrl(inputUrl);

  const auth =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    undefined;

  const octokit = new Octokit({
    auth,
    userAgent: "skill-cn-github-demo/0.0.0",
  });

  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const ownerLogin = repoData.owner?.login ?? owner;

  const { data: ownerData } = await octokit.request("GET /users/{username}", {
    username: ownerLogin,
  });

  const effectiveRef = ref || repoData.default_branch;

  const { data: commits } = await octokit.request(
    "GET /repos/{owner}/{repo}/commits",
    {
      owner,
      repo,
      sha: effectiveRef,
      path: path || undefined,
      per_page: 1,
    },
  );

  const latest = Array.isArray(commits) ? commits[0] : undefined;
  const lastCommitDate =
    latest?.commit?.committer?.date ??
    latest?.commit?.author?.date ??
    undefined;

  const result = {
    inputUrl,
    owner,
    repo,
    ref: effectiveRef,
    path: path || undefined,
    stars: repoData.stargazers_count,
    author: {
      login: ownerLogin,
      name: ownerData?.name ?? undefined,
      type: ownerData?.type ?? undefined,
      avatarUrl: ownerData?.avatar_url ?? undefined,
    },
    directoryLastCommit: latest
      ? {
          sha: latest.sha,
          date: lastCommitDate,
          url: latest.html_url,
          message: latest.commit?.message,
        }
      : undefined,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

