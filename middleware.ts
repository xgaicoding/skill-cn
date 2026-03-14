import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 全局中间件：为页面响应添加 CDN 缓存头
 *
 * 策略：
 * - 首页（无查询参数）：s-maxage=60, stale-while-revalidate=300
 * - Skill 详情页：s-maxage=120, stale-while-revalidate=600
 * - 带查询参数的页面：不缓存（搜索/筛选结果）
 * - API 路由：不干预
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 跳过 API、静态资源、Next.js 内部路由
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/auth/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  // 首页（无查询参数时）
  if (pathname === "/" && searchParams.toString() === "") {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300"
    );
    return response;
  }

  // Skill 详情页
  if (/^\/skill\/\d+$/.test(pathname)) {
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600"
    );
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|images|.*\\..*).*)"],
};
