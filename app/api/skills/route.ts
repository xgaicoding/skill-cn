import { NextResponse } from "next/server";
import { PAGE_SIZE } from "@/lib/constants";
import { fetchSkillList } from "@/lib/data/skills";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const size = Math.max(Number(searchParams.get("size") || PAGE_SIZE), 1);
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");
    // ids=1,2,3：用于“只展示指定 Skill 集合”的场景（例如从实践卡片筛选相关 Skill 进入）。
    const idsParam = searchParams.get("ids");
    const sort = searchParams.get("sort") || "heat";

    /**
     * 解析 ids 参数（逗号分隔）：
     * - 过滤非法值（NaN/<=0）
     * - 去重，避免 SQL IN 列表膨胀
     * 说明：不在这里做“顺序保持”，列表顺序仍由 sort 控制（最热/最新）。
     */
    const ids = (idsParam || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number(item))
      .filter((num) => Number.isFinite(num) && num > 0);
    const uniqueIds = Array.from(new Set(ids));

    const payload = await fetchSkillList({
      page,
      size,
      tag,
      q,
      ids: uniqueIds,
      sort,
    });

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}
