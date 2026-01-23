import { spawnSync } from "node:child_process";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

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
  let repoPath;
  if (parts[2] === "tree" || parts[2] === "blob") {
    ref = parts[3];
    repoPath = parts.slice(4).join("/");
  }

  return { owner, repo, ref, repoPath };
}

function run(cmd, args, options = {}) {
  const res = spawnSync(cmd, args, { stdio: "inherit", ...options });
  if (res.error) throw res.error;
  if (res.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} failed with exit code ${res.status}`);
  }
}

async function downloadFile(url, destPath, headers) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Download failed: ${res.status} ${res.statusText}${text ? `\n${text}` : ""}`,
    );
  }
  if (!res.body) throw new Error("Download failed: empty response body");

  await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
}

async function main() {
  const inputUrl = process.argv[2];
  const outputZipArg = process.argv[3];
  if (!inputUrl) {
    console.error("Usage: node dir-zip.mjs <github-dir-url> [outputZipPath]");
    process.exit(1);
  }

  const { owner, repo, ref, repoPath } = parseGitHubUrl(inputUrl);
  const targetPath = (repoPath || "").replace(/^\/+|\/+$/g, "");
  if (!targetPath) {
    throw new Error(
      "This demo expects a directory URL like: https://github.com/<owner>/<repo>/tree/<ref>/<path>",
    );
  }

  const auth =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.GITHUB_PAT ||
    undefined;

  const octokit = new Octokit({
    auth,
    userAgent: "skill-cn-github-dir-zip/0.0.0",
  });

  const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
  const effectiveRef = ref || repoData.default_branch;

  const headers = {
    "User-Agent": "skill-cn-github-dir-zip/0.0.0",
    ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
  };

  const workdir = await fs.mkdtemp(path.join(os.tmpdir(), "github-dir-zip-"));
  try {
    const repoZipPath = path.join(workdir, "repo.zip");
    const zipballUrl = `https://codeload.github.com/${owner}/${repo}/zip/${encodeURIComponent(
      effectiveRef,
    )}`;

    await downloadFile(zipballUrl, repoZipPath, headers);

    run("unzip", ["-q", repoZipPath, "-d", workdir]);

    const entries = await fs.readdir(workdir, { withFileTypes: true });
    const rootDir = entries.find(
      (e) => e.isDirectory() && e.name !== "__MACOSX" && !e.name.startsWith("."),
    );
    if (!rootDir) {
      throw new Error("Failed to locate extracted repo root directory");
    }

    const extractedRoot = path.join(workdir, rootDir.name);
    const extractedTarget = path.join(extractedRoot, targetPath);

    const stat = await fs.stat(extractedTarget).catch(() => null);
    if (!stat) {
      throw new Error(`Path not found in archive: ${targetPath}`);
    }
    if (!stat.isDirectory()) {
      throw new Error(`Path is not a directory: ${targetPath}`);
    }

    const dirName = path.basename(targetPath);
    const outZipPath = outputZipArg
      ? path.resolve(process.cwd(), outputZipArg)
      : path.resolve(process.cwd(), "output", `${dirName}.zip`);

    await fs.mkdir(path.dirname(outZipPath), { recursive: true });
    await fs.rm(outZipPath, { force: true }).catch(() => undefined);

    run("zip", ["-qr", outZipPath, dirName], { cwd: path.dirname(extractedTarget) });

    console.log(outZipPath);
  } finally {
    await fs.rm(workdir, { recursive: true, force: true }).catch(() => undefined);
  }
}

main().catch((err) => {
  console.error(err?.stack || String(err));
  process.exit(1);
});

