import { NextResponse } from "next/server";
import path from "node:path";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { parseGitHubUrl, getRepoInfo } from "@/lib/github/github";
import { downloadRepoZip, extractDirectoryZip } from "@/lib/github/zip";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { data: skill, error } = await supabase
    .from("skills")
    // 读取 supports_download_zip 以便阻止不支持的直接下载
    .select("id, source_url, supports_download_zip")
    .eq("id", id)
    .single();

  if (error || !skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  // 若该 Skill 标记为不支持 ZIP 下载，则直接返回提示信息。
  if (skill.supports_download_zip === false) {
    return NextResponse.json({ error: "Skill download not supported" }, { status: 400 });
  }

  try {
    const { owner, repo, path: repoPath } = parseGitHubUrl(skill.source_url);
    const repoInfo = await getRepoInfo(owner, repo);
    const branch = repoInfo.defaultBranch;

    const zipBuffer = await downloadRepoZip(owner, repo, branch);
    const dirName = repoPath ? path.posix.basename(repoPath) : repo;
    const outputBuffer = extractDirectoryZip(zipBuffer, repoPath || "", dirName);

    /**
     * NextResponse 的 body 类型是 Web 标准 `BodyInit`：
     * - Node 的 `Buffer` 在运行时可用，但类型层面不一定被识别为 `BodyInit`
     * - 这里显式转成 `Uint8Array`，让 TS 与运行时都一致，避免 build 阶段类型报错
     */
    const body = new Uint8Array(outputBuffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=${dirName}.zip`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Download failed" }, { status: 500 });
  }
}
