import Link from "next/link";
import { Flame, FolderOpen, Tag } from "lucide-react";
import { Skill } from "@/lib/types";
import { formatHeat } from "@/lib/format";

export default function SkillCard({ skill }: { skill: Skill }) {
  // 将整卡片作为可点击链接，避免空 Link 无子元素导致无法触发跳转。
  return (
    <Link
      className="skill-card"
      href={`/skill/${skill.id}`}
      aria-label={`查看 ${skill.name} 详情`}
      // 首页卡片统一“新开页面”体验，避免打断当前浏览列表。
      target="_blank"
      rel="noreferrer"
    >
      {/* 顶部区域：分类标签 + 热度 */}
      <div className="skill-card__header">
        <span className="tag">
          {/* 标签图标改为标准 Tag 形态，识别度更高 */}
          <Tag className="icon" />
          {skill.tag}
        </span>
        <div className="skill-card__header-right">
          <span className="stat stat--heat" aria-label={`热度 ${formatHeat(skill.heat_score)}`}>
            {/* 热度图标改为火焰，提升“热度”语义一致性 */}
            <Flame className="icon" />
            {formatHeat(skill.heat_score)}
          </span>
        </div>
      </div>
      {/* 标题与简介 */}
      <div className="skill-card__title">{skill.name}</div>
      <div className="skill-card__desc">{skill.description}</div>
      {/* 底部元信息：作者/实践数量 */}
      <div className="skill-card__meta">
        <span className="meta">
          {skill.repo_owner_avatar_url ? (
            <img className="avatar avatar--sm" src={skill.repo_owner_avatar_url} alt={skill.repo_owner_name || ""} />
          ) : (
            <span className="avatar avatar--sm" aria-hidden="true"></span>
          )}
          {skill.repo_owner_name || "-"}
        </span>
        <span className="meta">
          <FolderOpen className="icon" />
          实践 {skill.practice_count}
        </span>
      </div>
    </Link>
  );
}
