#!/usr/bin/env node
"use strict";

/**
 * 多平台实践案例入库工具
 *
 * 支持平台：
 * - 微信公众号（mp.weixin.qq.com）→ we-mp-rss API
 * - 掘金（juejin.cn）→ HTTP 抓取
 * - 知乎（zhuanlan.zhihu.com / zhihu.com）→ HTTP 抓取
 * - CSDN（blog.csdn.net）→ HTTP 抓取
 * - 少数派（sspai.com）→ HTTP 抓取
 * - Medium（medium.com）→ HTTP 抓取
 * - dev.to → HTTP 抓取
 * - 其他博客/网站 → 通用 HTTP 抓取（fallback）
 *
 * 流程：
 * 1. 识别平台 → 对应适配器获取文章全文
 * 2. AI 解析提取关联 Skill 名称
 * 3. Supabase 查询匹配 Skill ID
 * 4. 组装 practices.json 格式数据
 * 5. 调用 import_practices.js 入库
 *
 * 用法：
 *   node manage/fetch_practice.js "<文章链接>" [--dry-run]
 *
 * 环境变量（从 .env 读取）：
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DEEPSEEK_API_KEY
 *   WERSS_URL, WERSS_USERNAME, WERSS_PASSWORD（仅公众号需要）
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const PRACTICES_JSON = path.join(__dirname, "practices.json");

// ============ 加载环境变量 ============
function loadEnv() {
  for (const name of [".env", ".env.local"]) {
    const p = path.join(ROOT_DIR, name);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
        v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const WERSS_URL = process.env.WERSS_URL || "http://127.0.0.1:8001";
const WERSS_USER = process.env.WERSS_USERNAME || "admin";
const WERSS_PASS = process.env.WERSS_PASSWORD || "admin@123";

// ============ HTML → 纯文本 ============
function stripHTML(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

// ============ 平台识别 ============
const PLATFORM_RULES = [
  { pattern: /mp\.weixin\.qq\.com/,       channel: "公众号",  fetcher: "werss" },
  { pattern: /juejin\.cn/,                channel: "掘金",    fetcher: "http" },
  { pattern: /zhuanlan\.zhihu\.com/,      channel: "知乎",    fetcher: "http" },
  { pattern: /zhihu\.com\/p\//,           channel: "知乎",    fetcher: "http" },
  { pattern: /blog\.csdn\.net/,           channel: "CSDN",    fetcher: "http" },
  { pattern: /sspai\.com/,                channel: "少数派",  fetcher: "http" },
  { pattern: /medium\.com/,               channel: "Medium",  fetcher: "http" },
  { pattern: /dev\.to\//,                 channel: "dev.to",  fetcher: "http" },
];

function detectPlatform(url) {
  for (const rule of PLATFORM_RULES) {
    if (rule.pattern.test(url)) return { channel: rule.channel, fetcher: rule.fetcher };
  }
  // 通用 fallback：任何 HTTP(S) 链接都尝试抓取
  return { channel: "博客", fetcher: "http" };
}

// ============ we-mp-rss API（公众号专用） ============
let werssToken = null;

async function werssLogin() {
  if (werssToken) return werssToken;
  const res = await fetch(`${WERSS_URL}/api/v1/wx/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `username=${WERSS_USER}&password=${WERSS_PASS}`,
  });
  const data = await res.json();
  if (data.code !== 0) throw new Error(`we-mp-rss 登录失败: ${data.message}`);
  werssToken = data.data.access_token;
  return werssToken;
}

async function fetchArticleFromWerss(url) {
  const token = await werssLogin();
  const res = await fetch(
    `${WERSS_URL}/api/v1/wx/mps/by_article?url=${encodeURIComponent(url)}`,
    { method: "POST", headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  if (data.code !== 0) throw new Error(`获取文章失败: ${data.message}`);
  const d = data.data;
  return {
    title: d.title || "",
    content: d.content || "",
    plainText: stripHTML(d.content || ""),
    author: d.author || d.mp_info?.mp_name || "",
    mpName: d.mp_info?.mp_name || "",
    description: d.description || "",
    publishTime: d.publish_time || 0,
    sourceUrl: url,
  };
}

// ============ 从本地文件读取预抓取内容 ============

/**
 * 支持两种文件格式：
 * 1. 纯文本/Markdown 文件 → 直接作为 plainText
 * 2. JSON 文件 → { title, content, author } 结构化数据
 *
 * 使用场景：国内 CSR 重度平台（掘金/知乎/CSDN/少数派）无法直接 HTTP 抓取，
 * 由 OpenClaw 的 web_fetch / browser 工具预先抓取内容存为文件，再喂给脚本。
 */
function loadContentFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`内容文件不存在: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8").trim();

  // 尝试 JSON 格式
  if (raw.startsWith("{")) {
    try {
      const obj = JSON.parse(raw);
      return {
        title: obj.title || "",
        plainText: obj.content || obj.plainText || obj.text || "",
        author: obj.author || "",
      };
    } catch (_) {
      // 不是合法 JSON，当纯文本处理
    }
  }

  // Markdown / 纯文本：第一行作为标题
  const lines = raw.split("\n");
  let title = "";
  let bodyStart = 0;

  // 如果第一行是 # 标题
  if (lines[0] && lines[0].startsWith("# ")) {
    title = lines[0].replace(/^#+\s*/, "").trim();
    bodyStart = 1;
  }

  return {
    title,
    plainText: lines.slice(bodyStart).join("\n").trim(),
    author: "",
  };
}

// ============ 通用 HTTP 抓取（SSR 站点 fallback） ============

function extractTitleFromHTML(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? stripHTML(match[1]).trim() : "";
}

function extractMetaAuthor(html) {
  const patterns = [
    /meta\s+name=["']author["']\s+content=["']([^"']+)["']/i,
    /meta\s+content=["']([^"']+)["']\s+name=["']author["']/i,
    /meta\s+property=["']article:author["']\s+content=["']([^"']+)["']/i,
    /meta\s+content=["']([^"']+)["']\s+property=["']article:author["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

async function fetchArticleFromHTTP(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    },
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} — ${url}`);

  const html = await res.text();
  const title = extractTitleFromHTML(html);
  const author = extractMetaAuthor(html);
  const plainText = stripHTML(html);

  if (plainText.length < 100) {
    throw new Error(
      `抓取内容过短（${plainText.length} 字），该平台可能需要 JS 渲染。\n` +
      `请使用 --content <文件路径> 模式：先用 OpenClaw web_fetch/browser 抓取内容存为文件，再传入。`
    );
  }

  return {
    title,
    content: html,
    plainText,
    author,
    mpName: "",
    description: "",
    publishTime: 0,
    sourceUrl: url,
  };
}

// ============ 统一入口：根据平台 + 参数选择抓取方式 ============
async function fetchArticle(url, contentFile) {
  const platform = detectPlatform(url);

  // 模式 B：预抓取内容文件
  if (contentFile) {
    console.log(`   平台识别: ${platform.channel}（从本地文件读取内容）`);
    const loaded = loadContentFromFile(contentFile);
    return {
      title: loaded.title,
      content: "",
      plainText: loaded.plainText,
      author: loaded.author,
      mpName: "",
      description: "",
      publishTime: 0,
      sourceUrl: url,
      _channel: platform.channel,
    };
  }

  // 模式 A：自动抓取
  console.log(`   平台识别: ${platform.channel}（${platform.fetcher === "werss" ? "we-mp-rss" : "HTTP 抓取"}）`);

  if (platform.fetcher === "werss") {
    const article = await fetchArticleFromWerss(url);
    article._channel = platform.channel;
    return article;
  }

  const article = await fetchArticleFromHTTP(url);
  article._channel = platform.channel;
  return article;
}

// ============ Supabase ============
async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase error: ${await res.text()}`);
  return res.json();
}

async function fetchAllSkills() {
  return supabaseGet("skills?select=id,name&order=id");
}

async function checkPracticeExists(sourceUrl) {
  const data = await supabaseGet(
    `practices?source_url=eq.${encodeURIComponent(sourceUrl)}&select=id&limit=1`
  );
  return Array.isArray(data) && data.length > 0;
}

// ============ AI 解析 Skill ============
const EXTRACT_PROMPT = `你是 AI Skill 识别专家。请从以下文章中提取所有用到的 AI Skill / 工具名称。

注意：
- 只提取文章中**实际使用**的 Skill/工具，不是提到的所有工具
- 返回 Skill 的常见英文名（如 cursor、browser-use、v0、bolt、remotion）
- 如果文章用的是中文名，也转成对应的英文标识
- **排除以下通用 AI 编程工具/平台，它们不算 Skill：**
  Claude Code, Cursor, Windsurf, Copilot, ChatGPT, DeepSeek, Gemini, GPT-4, Claude, Trae, Augment Code, Cline, Roo Code, Aider
- 不要包含通用概念（如 AI、LLM、GPT、Agent），只要具体的 Skill

文章标题：{title}
文章正文（前3000字）：
{content}

请严格按以下 JSON 格式输出，不要输出其他内容：
{
  "skills": ["skill-name-1", "skill-name-2"],
  "summary": "<一句话概括文章在用这些Skill做什么>"
}`;

async function extractSkills(article) {
  const prompt = EXTRACT_PROMPT
    .replace("{title}", article.title)
    .replace("{content}", article.plainText.slice(0, 3000));

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是专业的AI工具识别助手，只输出JSON。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`AI 返回格式错误: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

// ============ Skill 匹配 ============
function matchSkills(extractedNames, dbSkills) {
  const matched = [];
  const unmatched = [];

  // 预处理：去掉常见后缀 -skill/-skills/-best-practices/-pro 等，取核心词
  function coreWord(name) {
    return name
      .toLowerCase()
      .replace(/[\s_-]+/g, "")
      .replace(/(skills?|bestpractices|promax|pro)$/g, "");
  }

  for (const name of extractedNames) {
    const core = coreWord(name);
    const lower = name.toLowerCase().replace(/[\s_-]+/g, "");

    const found = dbSkills.find((s) => {
      const dbLower = s.name.toLowerCase().replace(/[\s_-]+/g, "");
      const dbCore = coreWord(s.name);
      return (
        dbLower === lower ||
        dbCore === core ||
        dbLower.includes(lower) ||
        lower.includes(dbLower) ||
        dbCore.includes(core) ||
        core.includes(dbCore)
      );
    });

    if (found) {
      matched.push(found);
    } else {
      unmatched.push(name);
    }
  }

  return { matched, unmatched };
}

// ============ 生成摘要 ============
const SUMMARY_PROMPT = `你是顶级内容营销专家。为以下文章写一段「让人忍不住想点进去看」的中文摘要（100字左右）。

要求：
- 开头就要抓眼球，制造好奇心或冲突感
- 突出「用了什么 → 做出了什么」的实践成果
- 语气生动有感染力，像朋友在安利你一个超酷的东西
- 适当用 emoji 增加视觉吸引力（2-3个就好）
- 绝对不要用"本文"、"该文章"这种无聊开头
- 不要写成新闻稿，要写成让人想转发的朋友圈文案

标题：{title}
正文（前2000字）：
{content}

直接输出摘要文本，不要加引号或其他格式。`;

async function generateSummary(article) {
  const prompt = SUMMARY_PROMPT
    .replace("{title}", article.title)
    .replace("{content}", article.plainText.slice(0, 2000));

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 200,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${await res.text()}`);
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || "").trim();
}

// ============ 主流程 ============
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // 解析 --content <文件路径>
  let contentFile = null;
  const contentIdx = args.indexOf("--content");
  if (contentIdx !== -1 && args[contentIdx + 1]) {
    contentFile = args[contentIdx + 1];
  }

  // URL 是第一个不以 -- 开头的参数（且不是 --content 的值）
  const skipSet = new Set(["--dry-run", "--content"]);
  if (contentFile) skipSet.add(contentFile);
  const url = args.find((a) => !skipSet.has(a) && !a.startsWith("--"));

  if (!url) {
    console.error('用法: node manage/fetch_practice.js "<文章链接>" [--dry-run] [--content <文件路径>]');
    console.error('');
    console.error('模式 A（自动抓取）：');
    console.error('  node manage/fetch_practice.js "https://mp.weixin.qq.com/s/xxx"');
    console.error('');
    console.error('模式 B（预抓取内容）：');
    console.error('  node manage/fetch_practice.js "https://juejin.cn/post/xxx" --content /tmp/article.md');
    process.exit(1);
  }

  // 检查环境变量
  for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_KEY, DEEPSEEK_KEY })) {
    if (!v) { console.error(`缺少环境变量: ${k}`); process.exit(1); }
  }

  try {
    // 1. 查重
    console.log("🔍 检查是否已收录...");
    if (await checkPracticeExists(url)) {
      console.log("⚠️  该文章已收录，跳过。");
      process.exit(0);
    }

    // 2. 获取文章
    console.log("📥 获取文章内容...");
    const article = await fetchArticle(url, contentFile);
    console.log(`   标题: ${article.title}`);
    console.log(`   来源: ${article._channel || "未知"} | 作者: ${article.author || article.mpName || "未知"}`);
    console.log(`   正文: ${article.plainText.length} 字`);

    // 3. AI 提取 Skill
    console.log("\n🤖 识别关联 Skill...");
    const dbSkills = await fetchAllSkills();
    const extracted = await extractSkills(article);
    console.log(`   AI 识别到: ${extracted.skills.join(", ")}`);
    console.log(`   AI 摘要: ${extracted.summary}`);

    // 4. 匹配 Skill ID
    const { matched, unmatched } = matchSkills(extracted.skills, dbSkills);

    if (unmatched.length > 0) {
      console.log(`\n⚠️  以下 Skill 未在数据库中找到（已跳过）：`);
      for (const name of unmatched) {
        console.log(`   ⏭️  ${name}`);
      }
    }

    if (matched.length === 0) {
      console.log(`\n❌ 没有任何 Skill 匹配成功，无法入库。`);
      console.log("   请先录入相关 Skill 后重新运行。");
      process.exit(1);
    }

    const skillIds = [...new Set(matched.map((s) => s.id))];
    console.log(`   匹配成功: ${matched.map((s) => `${s.name}(${s.id})`).join(", ")}`);

    // 5. 生成摘要
    console.log("\n📝 生成展示摘要...");
    const summary = await generateSummary(article);
    console.log(`   ${summary.slice(0, 80)}...`);

    // 6. 组装 practices.json
    const today = new Date().toISOString().slice(0, 10);
    const practice = {
      skill_ids: skillIds,
      primary_skill_id: skillIds[0],
      title: article.title,
      summary: summary,
      channel: article._channel || "博客",
      updated_at: today,
      source_url: url,
      author_name: article.author || article.mpName,
      is_listed: true,
      click_count: 100,
      is_featured: false,
    };

    const jsonData = {
      practices: [practice],
      options: { dry_run: dryRun, chunk_size: 50, skip_duplicates: true },
    };

    // 写入 practices.json
    fs.writeFileSync(PRACTICES_JSON, JSON.stringify(jsonData, null, 2), "utf8");
    console.log(`\n💾 已写入 ${PRACTICES_JSON}`);

    if (dryRun) {
      console.log("\n🏁 Dry run 模式，未导入。数据预览：");
      console.log(JSON.stringify(practice, null, 2));
      process.exit(0);
    }

    // 7. 调用 import_practices.js 入库
    console.log("\n🚀 导入数据库...");
    const importScript = path.join(__dirname, "import_practices.js");
    const output = execSync(`node "${importScript}" --skip-duplicates`, {
      cwd: ROOT_DIR,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log(output);

    console.log("🎉 完成！文章已入库。");
  } catch (err) {
    console.error(`\n❌ 失败: ${err.message}`);
    process.exit(1);
  }
}

main();
