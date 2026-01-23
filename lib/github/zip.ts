import AdmZip from "adm-zip";
import path from "node:path";

const CODELOAD = "https://codeload.github.com";

function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT || process.env.GH_TOKEN;
  return {
    "User-Agent": "skill-cn/0.1",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function downloadRepoZip(owner: string, repo: string, branch: string) {
  const url = `${CODELOAD}/${owner}/${repo}/zip/${encodeURIComponent(branch)}`;
  /**
   * IMPORTANT：关闭 Next.js 对 fetch 的 Data Cache
   * ------------------------------------------------------------
   * Next.js（app router）会增强服务端 `fetch`，并在某些场景下尝试把响应写入 Data Cache。
   * 但 GitHub codeload 的 ZIP 往往 > 2MB，会触发：
   *   "Failed to set Next.js data cache, items over 2MB can not be cached"
   * 这虽然不会导致接口失败（仍可继续读取 response body），但会在 dev 日志中产生误导性报错。
   *
   * 因为下载 ZIP 本身就是一次性流式资源，不需要缓存，所以这里显式设置：
   * - cache: "no-store"  —— 禁止写入 Next Data Cache，避免 >2MB 的写缓存错误
   */
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Download failed: ${res.status} ${text}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}

export function extractDirectoryZip(
  zipBuffer: Buffer,
  targetPath: string,
  outputDirName: string,
) {
  const zip = new AdmZip(zipBuffer);
  const entries = zip.getEntries();
  if (!entries.length) {
    throw new Error("Empty zip archive");
  }

  const rootName = entries[0].entryName.split("/")[0];
  const normalizedTarget = targetPath.replace(/^\/+|\/+$/g, "");
  const targetPrefix = normalizedTarget
    ? `${rootName}/${normalizedTarget}/`
    : `${rootName}/`;

  if (!normalizedTarget) {
    return zipBuffer;
  }

  const newZip = new AdmZip();
  const seenDirs = new Set<string>();

  entries.forEach((entry) => {
    if (!entry.entryName.startsWith(targetPrefix)) return;
    const relative = entry.entryName.slice(targetPrefix.length);
    if (!relative) return;
    const newEntryName = path.posix.join(outputDirName, relative);
    if (entry.isDirectory) {
      if (!seenDirs.has(newEntryName)) {
        newZip.addFile(newEntryName + "/", Buffer.alloc(0));
        seenDirs.add(newEntryName);
      }
      return;
    }
    newZip.addFile(newEntryName, entry.getData());
  });

  return newZip.toBuffer();
}
