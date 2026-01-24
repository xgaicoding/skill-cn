"use client";

import { useEffect, useMemo, useState } from "react";
import { SKILL_ISSUE_URL, TAG_OPTIONS, SORT_OPTIONS, PAGE_SIZE } from "@/lib/constants";
import type { Paginated, Practice, Skill } from "@/lib/types";
import SkillCard from "@/components/home/SkillCard";
import { SkillCardSkeleton } from "@/components/SkillCardSkeleton";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import Pagination from "@/components/home/Pagination";
import EmptyState from "@/components/EmptyState";
import { Clock, FilterX, Flame, Plus, SearchX, Sparkles } from "lucide-react";

export type HomeInitialState = {
  q?: string;
  tag?: string;
  sort?: string;
};

export default function HomePage({ initial }: { initial: HomeInitialState }) {
  const [tag, setTag] = useState(initial.tag || "全部");
  const [sort, setSort] = useState(initial.sort || "heat");
  const [query, setQuery] = useState(initial.q || "");
  const [page, setPage] = useState(1);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  // 首屏默认视为加载中，避免“先出现暂无 Skill 再闪回骨架”的视觉抖动。
  const [loading, setLoading] = useState(true);
  // 标记是否完成过至少一次请求，用于控制空状态的显示时机。
  const [hasLoaded, setHasLoaded] = useState(false);

  const [featured, setFeatured] = useState<Practice[]>([]);
  // Hero 推荐卡片加载状态：用于触发“骨架 -> 渐隐 -> 入场”过渡。
  const [featuredLoading, setFeaturedLoading] = useState(true);

  /**
   * 首页空状态（暂无 Skill / 暂无结果）展示策略：
   * - 如果用户做了筛选（搜索关键词 / 标签），但结果为空：提示“暂无匹配”，并给出“清空筛选”动作
   * - 如果用户未筛选且仍为空：提示“暂无 Skill”，引导用户去提交（右上角 +Skill / Issue 链接）
   */
  const hasFilters = Boolean(query) || (tag && tag !== "全部");

  useEffect(() => {
    setQuery(initial.q || "");
    setPage(1);
  }, [initial.q]);

  const params = useMemo(() => {
    const search = new URLSearchParams();
    search.set("page", String(page));
    search.set("size", String(PAGE_SIZE));
    if (tag && tag !== "全部") search.set("tag", tag);
    if (query) search.set("q", query);
    if (sort) search.set("sort", sort);
    return search.toString();
  }, [page, tag, query, sort]);

  useEffect(() => {
    let cancelled = false;
    const fetchFeatured = async () => {
      // 保持首屏进入时的“骨架卡片”可见，直到数据到达。
      setFeaturedLoading(true);
      try {
        const res = await fetch("/api/practices/featured", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled) {
          setFeatured(json.data || []);
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
        }
      } finally {
        if (!cancelled) {
          setFeaturedLoading(false);
        }
      }
    };
    fetchFeatured();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchSkills = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/skills?${params}`, { cache: "no-store" });
        const json: Paginated<Skill> = await res.json();
        if (!cancelled) {
          setSkills(json.data || []);
          setTotalPages(json.totalPages || 1);
        }
      } catch {
        if (!cancelled) {
          setSkills([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          // 只要请求完成（成功/失败）就置为 true，空状态可在此后展示。
          setHasLoaded(true);
        }
      }
    };
    fetchSkills();
    return () => {
      cancelled = true;
    };
  }, [params]);

  const handleTagChange = (next: string) => {
    setTag(next);
    setPage(1);
  };

  const handleSortChange = (next: string) => {
    setSort(next);
    setPage(1);
  };

  return (
    <>
      <FeaturedCarousel practices={featured} loading={featuredLoading} />

      <main className="page">
        <section className="toolbar" id="skill-list" aria-label="筛选与排序">
          <nav className="segmented" aria-label="标签筛选（单选）">
            {TAG_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`segmented__item ${item === tag ? "is-active" : ""}`}
                onClick={() => handleTagChange(item)}
                // data-loading 用于触发按钮“过渡态”视觉反馈（见 app/globals.css）。
                data-loading={loading && item === tag}
                aria-busy={loading && item === tag}
                disabled={loading}
              >
                {item}
              </button>
            ))}
          </nav>

          <div className="sort-switch" role="group" aria-label="排序">
            <div className="sort-switch__seg" data-active={sort}>
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  className={`sort-switch__btn ${option.value === sort ? "is-active" : ""}`}
                  type="button"
                  aria-pressed={option.value === sort}
                  onClick={() => handleSortChange(option.value)}
                  // 排序切换同样走接口更新，加载时给激活态按钮一个过渡态提示。
                  data-loading={loading && option.value === sort}
                  aria-busy={loading && option.value === sort}
                  disabled={loading}
                >
                  {option.value === "heat" ? <Flame className="icon" /> : <Clock className="icon" />}
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="skill-grid" aria-label="Skill 列表" aria-busy={loading}>
          {loading || !hasLoaded ? (
            // 加载态：骨架屏替代空白 + 文案，避免“暂无 Skill”闪现。
            Array.from({ length: PAGE_SIZE }).map((_, index) => (
              <SkillCardSkeleton key={`skill-skeleton-${index}`} />
            ))
          ) : skills.length === 0 ? (
            <EmptyState
              title={hasFilters ? "暂无匹配的 Skill" : "暂无 Skill"}
              description={
                hasFilters
                  ? "试试清空搜索或切换标签，可能会发现更多高质量实践。"
                  : "还没有人提交 Skill，点击右上角「+ Skill」成为第一个贡献者吧。"
              }
              icon={hasFilters ? <SearchX className="icon" /> : <Sparkles className="icon" />}
              action={
                hasFilters ? (
                  /**
                   * 使用原生 <a> 直接回到首页：
                   * - 可以“一次性”清掉 URL query（q/tag/sort 等）
                   * - 同时把本地 state（tag/sort/page）恢复为默认值
                   * - 避免额外引入 router 逻辑，让空态交互保持极简
                   */
                  <a className="btn btn--soft btn--sm" href="/" aria-label="清空筛选并回到首页">
                    <FilterX className="icon" aria-hidden="true" />
                    清空筛选
                  </a>
                ) : (
                  /**
                   * 当前没有任何 Skill：引导用户去提交
                   * - 使用外链（Issue 表单）与 Header 的“+Skill”入口一致
                   */
                  <a
                    className="btn btn--primary btn--sm"
                    // 指向创建 Skill 的 Issue 表单，与右上角“+ Skill”入口保持一致。
                    href={SKILL_ISSUE_URL}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="去提交 Skill（新窗口）"
                  >
                    <Plus className="icon" aria-hidden="true" />
                    提交 Skill
                  </a>
                )
              }
            />
          ) : (
            skills.map((skill) => <SkillCard key={skill.id} skill={skill} />)
          )}
        </section>

        {/* 分页按钮也走接口，加载中给按钮一个可感知的过渡态。 */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} loading={loading} />
      </main>
    </>
  );
}
