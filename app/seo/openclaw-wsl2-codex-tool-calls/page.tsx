import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle2, ExternalLink } from "lucide-react";
import AppFooter from "@/components/AppFooter";
import AppHeader from "@/components/AppHeader";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 86400;

const pagePath = "/seo/openclaw-wsl2-codex-tool-calls";
const title = "OpenClaw WSL2 与 Codex Tool Calls 排查指南 | skill-cn";
const headline = "OpenClaw WSL2 与 Codex Tool Calls 排查指南";
const description =
  "面向 Windows/WSL2 开发者的 OpenClaw + Codex tool calls 实战排查指南：理解 Codex harness、AGENTS.md、Agent Skills、MCP/plugin 工具暴露与常见故障。";
const publishedDate = "2026-06-18";
const modifiedDate = "2026-06-27";

const officialLinks = [
  ["OpenAI Codex CLI", "https://developers.openai.com/codex/cli"],
  ["OpenAI Codex Windows", "https://developers.openai.com/codex/windows"],
  ["OpenAI AGENTS.md guide", "https://developers.openai.com/codex/guides/agents-md"],
  ["OpenAI Agent Skills", "https://developers.openai.com/codex/skills"],
  ["OpenClaw Codex harness", "https://docs.openclaw.ai/plugins/codex-harness"],
  ["OpenClaw tools overview", "https://docs.openclaw.ai/tools"],
  ["AGENTS.md", "https://agents.md/"],
] as const;

const faqItems = [
  {
    question: "Codex 在 Windows 上应该用原生还是 WSL2？",
    answer:
      "优先按当前项目环境选择。项目和依赖都在 Windows 原生环境时，直接用 Windows 更简单；仓库、Shell、包管理器、CI 假设都在 Linux 环境时，WSL2 更稳定。不要把 WSL2 当成万能修复项，先确认路径、权限和运行时一致。",
  },
  {
    question: "OpenClaw Codex harness 和直接运行 Codex CLI 有什么区别？",
    answer:
      "直接运行 Codex CLI 时，Codex 主要面对本机命令、文件和当前 CLI 配置。OpenClaw Codex harness 场景下，Codex 负责底层 coding session，OpenClaw 负责消息通道、会话编排、动态工具、审批和 transcript mirror，所以可见工具和权限策略可能不同。",
  },
  {
    question: "为什么 Codex 看不到 MCP/plugin tools？",
    answer:
      "常见原因包括当前会话不是预期的 harness、工具没有在本轮暴露、MCP/plugin server 未被当前运行时加载、审批或 sandbox 策略限制、以及 Windows 路径和 WSL2 路径混用。先确认工具列表，再确认运行时和配置文件。",
  },
  {
    question: "AGENTS.md 和 Agent Skills 谁负责什么？",
    answer:
      "AGENTS.md 更适合放项目级、团队级、仓库级约束，例如测试命令、分支策略和代码风格。Agent Skills 更适合沉淀可复用工作流，例如浏览器自动化、SEO audit、公众号发布或特定工具链操作。",
  },
  {
    question: "Agent Skills directory 和普通工具目录有什么区别？",
    answer:
      "普通工具目录回答“有什么工具”，Agent Skills directory 更应该回答“在什么场景用什么 Skill，以及怎么复用”。skill-cn 的核心模型是 Skill x scenario = practice，重点是把工具和真实任务连接起来。",
  },
  {
    question: "Tool call 失败时应该先查权限、路径还是工具暴露？",
    answer:
      "先查工具是否暴露，再查权限和 sandbox，最后查路径、环境变量、凭证、依赖和资源。这样能把“工具根本不可用”和“工具可用但命令执行失败”分开，排查成本最低。",
  },
] as const;

const howToSteps = [
  "确认当前是 Windows 原生还是 WSL2。",
  "确认工作目录、仓库路径和包管理器位置。",
  "确认运行时是 Codex CLI、Codex app 还是 OpenClaw Codex harness。",
  "执行一次无副作用的文件读取或目录列表命令。",
  "在临时目录执行一次无副作用写入。",
  "检查当前会话暴露了哪些 dynamic tools、MCP/plugin tools 和 Skill 工作流。",
  "读取相关 AGENTS.md 和已选 Skill 的约束。",
  "把错误归类为 missing tool、permission denied、command failure、timeout 或 resource exhaustion。",
] as const;

const relatedPracticeLinks = [
  {
    href: "/practice/193",
    title: "Codex Skills 初体验，第一个技能创建和使用",
    description: "从 Codex 使用 Skill 的真实流程切入，适合作为理解 Agent Skills directory 的下一步。",
  },
  {
    href: "/practice/194",
    title: "OpenClaw 打工人高效工作流",
    description: "把 OpenClaw 放进日常任务流，帮助判断 tool calls 问题是否来自会话编排或工具暴露。",
  },
  {
    href: "/practice/168",
    title: "Claude Code Skills：从手写到工具化",
    description: "对照 AGENTS.md、SKILL.md 与可复用工作流，理解为什么单纯堆 prompt 不够稳定。",
  },
  {
    href: "/practice/125",
    title: "agent-browser vs browser-use 深度测评",
    description: "浏览器自动化工具的高点击实践页，可承接 tool call 成功后如何选择具体 Skill。",
  },
] as const;

function toJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const absoluteUrl = new URL(pagePath, siteUrl).toString();

  return {
    title,
    description,
    keywords: [
      "OpenClaw WSL2",
      "Codex tool calls",
      "Agent Skills directory",
      "Codex WSL2 Windows",
      "OpenClaw Codex harness",
      "AGENTS.md Codex",
    ],
    alternates: {
      canonical: pagePath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl,
      type: "article",
      siteName: "Skill Hub 中国",
      publishedTime: publishedDate,
      modifiedTime: modifiedDate,
      images: [{ url: "/og-cover.png", alt: "Skill Hub 中国" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-cover.png"],
    },
  };
}

export default function Page() {
  const siteUrl = getSiteUrl();
  const absoluteUrl = new URL(pagePath, siteUrl).toString();
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    author: { "@type": "Organization", name: "Skill Hub 中国" },
    publisher: { "@type": "Organization", name: "Skill Hub 中国" },
    datePublished: publishedDate,
    dateModified: modifiedDate,
    mainEntityOfPage: absoluteUrl,
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Codex tool calls 最小可复现排查流程",
    description: "用于区分工具未暴露、权限拦截、路径错误和命令执行失败的排查流程。",
    step: howToSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: `Step ${index + 1}`,
      text: step,
    })),
  };

  return (
    <>
      <Suspense fallback={null}>
        <AppHeader />
      </Suspense>
      <main className="seo-page">
        <article className="seo-article">
          <section className="seo-hero" aria-labelledby="seo-title">
            <div className="seo-eyebrow">Windows / WSL2 / Codex harness</div>
            <h1 id="seo-title">{headline}</h1>
            <p className="seo-lead">
              如果 OpenClaw WSL2 环境里的 Codex tool calls 看起来不工作，先不要把问题简单归因于
              “Codex 坏了”。更高概率的问题是运行时、路径、sandbox、工具暴露层或 AGENTS.md / Agent
              Skills 约束没有对齐。
            </p>
            <div className="seo-hero__actions">
              <Link className="btn btn--primary" href="#checklist">
                开始排查
                <ArrowRight className="icon" aria-hidden="true" />
              </Link>
              <Link className="btn btn--ghost" href="/">
                看 Agent Skills directory
              </Link>
            </div>
          </section>

          <section className="seo-section" aria-labelledby="decision-title">
            <h2 id="decision-title">先选对运行路径</h2>
            <div className="seo-table-wrap">
              <table className="seo-table">
                <thead>
                  <tr>
                    <th>路径</th>
                    <th>适合场景</th>
                    <th>第一检查项</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Native Windows</td>
                    <td>默认 Windows Codex 工作流，项目依赖主要在 Windows 侧。</td>
                    <td>sandbox、工作目录、PowerShell 命令。</td>
                  </tr>
                  <tr>
                    <td>WSL2</td>
                    <td>仓库、Shell、依赖、CI 假设或 Linux-native 工具链已经在 WSL2。</td>
                    <td>distro 路径、包管理器、环境变量。</td>
                  </tr>
                  <tr>
                    <td>OpenClaw Codex harness</td>
                    <td>OpenClaw 负责编排消息和会话，Codex 负责底层 coding session。</td>
                    <td>当前工具列表、审批策略、会话来源。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="seo-section" aria-labelledby="model-title">
            <h2 id="model-title">正确模型：先分层，再排查</h2>
            <p>
              Tool call 不是一个单点能力，而是多层系统共同工作的结果。Windows / WSL2 决定命令和路径，
              Codex CLI 或 OpenClaw Codex harness 决定会话形态，Codex-native tools、OpenClaw dynamic
              tools、MCP/plugin tools 决定可用工具面，AGENTS.md 和 Agent Skills 决定工作流约束。
            </p>
            <pre className="seo-diagram">
              <code>User -&gt; OpenClaw chat/session -&gt; Codex harness -&gt; Codex tool calls -&gt; local shell/files/MCP/plugin surfaces</code>
            </pre>
          </section>

          <section className="seo-section seo-grid" aria-labelledby="wsl-title">
            <div>
              <h2 id="wsl-title">WSL2 什么时候值得用</h2>
              <p>
                WSL2 的价值是让 Linux-native 工作流保持一致，不是替代所有 Windows 原生开发。项目已经在
                Linux 路径、依赖依赖 Bash 行为、CI 和线上环境都是 Linux，或者 Windows 原生 sandbox
                行为和项目不匹配时，WSL2 才是更清晰的选择。
              </p>
            </div>
            <div className="seo-card">
              <h3>不要混用路径</h3>
              <p>
                最常见的低级错误是仓库在 WSL2，配置却指向 Windows 路径，或者反过来。先用一个 harmless
                list/read 命令确认 agent 看到的目录就是你以为的目录。
              </p>
            </div>
          </section>

          <section className="seo-section" id="checklist" aria-labelledby="broken-title">
            <h2 id="broken-title">Codex Tool Calls 为什么会“看起来不工作”</h2>
            <div className="seo-checklist">
              {[
                "当前 session 是 Codex harness、Codex CLI、Codex app，还是另一个 agent runtime？",
                "你期待的工具是否真的在这一轮暴露？",
                "缺失的是 Codex-native tool、OpenClaw dynamic tool、MCP/plugin tool，还是 Agent Skill workflow？",
                "approval 或 sandbox policy 是否拦截了动作？",
                "项目在 WSL2，但 UI、配置或凭证是否仍指向 Windows 路径？",
                "AGENTS.md 或 Skill 指令是否限制了当前操作？",
                "失败是否来自缺少 env vars、credentials、packages 或系统资源？",
              ].map((item) => (
                <div className="seo-check" key={item}>
                  <CheckCircle2 className="icon" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="seo-section" aria-labelledby="mcp-tools-title">
            <h2 id="mcp-tools-title">Codex MCP tools not showing 时先查什么？</h2>
            <p>
              先把“工具没有暴露”和“工具调用失败”分开。打开当前会话的 tools list，确认你期待的是
              Codex-native tool、OpenClaw dynamic tool，还是 MCP/plugin tool；如果列表里没有，就不要继续调
              prompt，而是回到 harness、plugin 安装状态、MCP server 启动状态和本轮会话配置。
            </p>
            <div className="seo-checklist">
              {[
                "确认当前 session 是否真的是加载 MCP/plugin 的 OpenClaw Codex harness。",
                "确认 MCP/plugin server 是否在同一个运行环境里启动，而不是启动在 Windows 侧、调用发生在 WSL2 侧。",
                "确认工具是否被本轮 sandbox、approval 或 connector 权限隐藏。",
              ].map((item) => (
                <div className="seo-check" key={item}>
                  <CheckCircle2 className="icon" aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="seo-section" aria-labelledby="mixed-path-title">
            <h2 id="mixed-path-title">Windows 和 WSL2 路径混用怎么定位？</h2>
            <p>
              路径混用通常表现为本地能打开文件，agent 却读不到；或者命令能运行，凭证、配置、缓存位置却不对。
              排查时先打印当前工作目录，再分别验证仓库路径、配置文件路径、包管理器路径和凭证路径，避免把
              `/mnt/c/...`、`C:\...` 和 Linux home 目录混成一个环境。
            </p>
            <div className="seo-card">
              <h3>最小验证</h3>
              <p>
                用同一个 session 完成 `pwd`、只读文件检查、包管理器版本检查和一次无副作用命令。如果其中任一步跨到另一个路径体系，
                先修路径和环境变量，再继续排 tool calls。
              </p>
            </div>
          </section>

          <section className="seo-section" aria-labelledby="dynamic-vs-mcp-title">
            <h2 id="dynamic-vs-mcp-title">OpenClaw dynamic tools 和 MCP tools 有什么区别？</h2>
            <p>
              OpenClaw dynamic tools 是当前 OpenClaw 会话按运行上下文暴露的能力，例如消息、会话、媒体、节点或平台编排工具；
              MCP tools 通常来自独立 MCP server 或 plugin connector。两者都可能出现在 agent 的工具面里，但加载来源、鉴权、
              生命周期和故障边界不同。
            </p>
            <div className="seo-table-wrap">
              <table className="seo-table">
                <thead>
                  <tr>
                    <th>类型</th>
                    <th>先查什么</th>
                    <th>常见故障</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>OpenClaw dynamic tools</td>
                    <td>当前会话、账号、节点和权限上下文。</td>
                    <td>工具未暴露、账号缺失、目标 channel 或 node 不可用。</td>
                  </tr>
                  <tr>
                    <td>MCP/plugin tools</td>
                    <td>server 是否启动、配置是否加载、运行环境是否一致。</td>
                    <td>server 未加载、路径错位、凭证缺失、connector 未授权。</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="seo-section seo-grid" aria-labelledby="skills-title">
            <div>
              <h2 id="skills-title">AGENTS.md 与 Agent Skills 怎么配合</h2>
              <p>
                AGENTS.md 负责项目级规则，比如测试命令、分支策略、代码风格和团队约束。Agent Skills
                负责可复用任务流，比如 SEO audit、browser automation、公众号发布、数据抓取或某个工具链的标准步骤。
              </p>
              <p>
                从 skill-cn 的内容模型看，Agent Skills directory 的价值不只是列出工具，而是把 Skill
                连接到真实场景和实践：Skill x scenario = practice。
              </p>
            </div>
            <div className="seo-card">
              <h3>下一步</h3>
              <p>如果基础 tool calls 已经能跑，下一步应该找可复用 Skill 和真实实践，而不是继续堆 prompt。</p>
              <Link className="seo-inline-link" href="/">
                浏览 AI 编程 Agent 技能目录
                <ArrowRight className="icon" aria-hidden="true" />
              </Link>
            </div>
          </section>

          <section className="seo-section" aria-labelledby="repro-title">
            <h2 id="repro-title">最小可复现排查流程</h2>
            <ol className="seo-steps">
              {howToSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>

          <section className="seo-section" aria-labelledby="related-practice-title">
            <h2 id="related-practice-title">相关实践入口</h2>
            <p>
              排查完成后，下一步是把可用 tool calls 接到具体任务。下面这些实践页能帮助你从 Codex、
              OpenClaw 和 Agent Skills 的概念，落到真实工作流。
            </p>
            <div className="seo-related-grid">
              {relatedPracticeLinks.map((item) => (
                <Link className="seo-related-card" href={item.href} key={item.href}>
                  <span className="seo-related-card__title">{item.title}</span>
                  <span className="seo-related-card__desc">{item.description}</span>
                  <span className="seo-related-card__action">
                    查看实践
                    <ArrowRight className="icon" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="seo-section" aria-labelledby="evidence-title">
            <h2 id="evidence-title">官方资料入口</h2>
            <div className="seo-link-grid">
              {officialLinks.map(([label, href]) => (
                <a key={href} className="seo-resource" href={href} target="_blank" rel="noreferrer noopener">
                  <span>{label}</span>
                  <ExternalLink className="icon" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          <section className="seo-section" aria-labelledby="faq-title">
            <h2 id="faq-title">FAQ</h2>
            <div className="seo-faq">
              {faqItems.map((item) => (
                <section className="seo-faq__item" key={item.question}>
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </section>
              ))}
            </div>
          </section>
        </article>
      </main>
      <AppFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: toJsonLd(howToJsonLd) }} />
    </>
  );
}
