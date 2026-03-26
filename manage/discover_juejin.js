#!/usr/bin/env node
"use strict";

/**
 * 掘金实践文章发掘脚本（两阶段 + 断点续跑）
 *
 * 用法：
 *   node manage/discover_juejin.js                     # 搜索 + 分析
 *   node manage/discover_juejin.js --phase search       # 只搜索
 *   node manage/discover_juejin.js --phase analyze      # 只分析（断点续跑）
 *   node manage/discover_juejin.js --keyword "MCP"      # 指定关键词
 *   node manage/discover_juejin.js --limit 5            # 每关键词最多5篇
 *   node manage/discover_juejin.js --notify             # 汇总写入文件
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const CANDIDATES_FILE = path.join(__dirname, ".discover_candidates.json");
const ANALYZED_FILE = path.join(__dirname, ".discover_analyzed.json");
const RESULT_FILE = path.join(__dirname, ".discover_result.txt");

// ============ 环境变量 ============
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

// ============ 工具函数 ============
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function maybeGC() { if (typeof global.gc === "function") global.gc(); }

function readJson(fp) {
  if (!fs.existsSync(fp)) return null;
  const raw = fs.readFileSync(fp, "utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function writeJsonAtomic(fp, data) {
  const tmp = fp + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, fp);
}

// ============ Supabase ============
async function supabaseGet(apiPath) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${apiPath}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
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

async function checkPracticeExistsByTitle(title) {
  const data = await supabaseGet(
    `practices?title=eq.${encodeURIComponent(title)}&select=id&limit=1`
  );
  return Array.isArray(data) && data.length > 0;
}

// ============ Chrome 搜索 ============
const puppeteer = require(path.join(ROOT_DIR, "node_modules/puppeteer-core"));
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: "new",
    args: [
      "--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu",
      "--disable-dev-shm-usage", "--single-process", "--disable-extensions",
      "--js-flags=--max-old-space-size=128",
      "--disable-background-networking", "--disable-default-apps",
      "--disable-translate", "--disable-sync", "--metrics-recording-only",
      "--no-first-run", "--disable-backgrounding-occluded-windows",
    ],
  });
  return _browser;
}

async function closeBrowser() {
  if (_browser) { try { await _browser.close(); } catch {} _browser = null; }
}

async function searchJuejin(keyword, limit = 10, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      // type=0 综合搜索, sort_type=1 按时间排序, period=1 一周内
      const searchUrl = `https://juejin.cn/search?query=${encodeURIComponent(keyword)}&type=0&sort_type=1&period=1`;
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(2000);

      const results = await page.evaluate(() => {
        const links = document.querySelectorAll('a[href*="/post/"]');
        const seen = new Set();
        const out = [];
        links.forEach((el) => {
          const href = el.href || "";
          const match = href.match(/\/post\/(\d+)/);
          if (!match) return;
          const articleId = match[1];
          if (seen.has(articleId)) return;
          seen.add(articleId);
          const titleEl = el.querySelector(".title") || el.querySelector("h2") || el;
          const title = (titleEl.innerText || "").trim().split("\n")[0].trim();
          if (!title || title.length < 5) return;
          out.push({ article_id: articleId, title });
        });
        return out;
      });

      await page.close();
      return results.slice(0, limit).map((r) => ({
        article_id: r.article_id,
        title: r.title,
        brief: "",
        author: "",
        url: `https://juejin.cn/post/${r.article_id}`,
      }));
    } catch (err) {
      if (page) try { await page.close(); } catch {}
      if (attempt < retries) {
        console.log(`   ⚠️ 搜索 "${keyword}" 失败，重试 (${attempt + 1}/${retries})...`);
        await closeBrowser();
        await sleep(1500);
        continue;
      }
      throw err;
    }
  }
  return [];
}

// ============ 关键词生成 ============

/**
 * 精准 Skill 搜索策略
 *
 * 目标：搜出"某个具体 skill 的实践文章"
 * 核心：skill 名本身就是最精准的关键词
 *
 * 1. skill 原名直接搜（写实践的人一定会提到 skill 名）
 * 2. skill 名 + "实战"（扩展覆盖面）
 * 3. 高频 skill 补中文别名（部分用户用中文描述 skill）
 * 4. 少量通用热词（覆盖跨 skill 的实践文章）
 */

const CN_ALIASES = {
  "browser-use": ["browser-use 浏览器"],
  "frontend-design": ["frontend-design 前端"],
  "ui-ux-pro-max": ["ui-ux-pro-max 设计"],
  "skill-creator": ["skill-creator 创建skill"],
  "stock-analysis": ["stock-analysis 股票"],
  "pptx": ["pptx skill PPT"],
  "md2wechat": ["md2wechat 公众号"],
  "excalidraw-diagram": ["excalidraw-diagram 画图"],
  "obsidian-skills": ["obsidian-skills 笔记"],
  "yt-dlp-downloader": ["yt-dlp-downloader 下载"],
  "mcp-server-creator": ["mcp-server-creator MCP"],
};

function generateSearchKeywords(skills) {
  const keywords = new Set();
  const SKIP = new Set(["pdf", "xlsx", "ppt", "find", "trending"]);

  for (const skill of skills) {
    const rawName = skill.name;
    if (SKIP.has(rawName.toLowerCase())) continue;

    const readable = rawName.replace(/-/g, " ");
    if (readable.length < 2) continue;

    // 1. skill 原名
    keywords.add(readable);
    // 2. skill 名 + 实战
    keywords.add(`${readable} 实战`);

    // 3. 中文别名（仅高频 skill）
    const aliases = CN_ALIASES[rawName];
    if (aliases) {
      for (const a of aliases) keywords.add(a);
    }
  }

  // 4. 通用热词
  const HOT = [
    "Agent Skill 实战", "Claude Code Skill 实践",
    "Cursor Skill 实战", "MCP Skill 实战",
    "Vibe Coding Skill", "AI Agent Skill 推荐",
  ];
  for (const h of HOT) keywords.add(h);

  return [...keywords];
}

function buildSkillSubwords(skillNames) {
  const parts = [];
  for (const name of skillNames) {
    for (const p of name.toLowerCase().split(/[-_\s]+/)) {
      if (p.length >= 3) parts.push(p);
    }
  }
  return [...new Set(parts)];
}

// ============ 阶段一：搜索 ============
async function runSearch({ customKeyword, perKeywordLimit }) {
  console.log("📋 获取 Skill 列表...");
  const dbSkills = await fetchAllSkills();
  const skillNames = dbSkills.map(s => s.name);
  console.log(`   共 ${dbSkills.length} 个 Skill`);

  const keywords = customKeyword ? [customKeyword] : generateSearchKeywords(dbSkills);
  console.log(`   搜索关键词: ${keywords.length} 个`);

  console.log("\n🔍 搜索掘金文章...");
  const allCandidates = new Map();

  for (let i = 0; i < keywords.length; i++) {
    const kw = keywords[i];
    try {
      const results = await searchJuejin(kw, perKeywordLimit);
      let added = 0;
      for (const r of results) {
        if (!allCandidates.has(r.article_id)) {
          r._keyword = kw;
          allCandidates.set(r.article_id, r);
          added++;
        }
      }
      if ((i + 1) % 10 === 0) console.log(`   ✅ 已搜索 ${i + 1}/${keywords.length} 个关键词`);
    } catch (err) {
      console.log(`   ⚠️ 搜索 "${kw}" 失败: ${err.message}`);
    }
    // 每个关键词搜完都关 Chrome + GC
    await closeBrowser();
    maybeGC();
    await sleep(500);
  }

  await closeBrowser();
  maybeGC();

  const candidates = [...allCandidates.values()];

  // 过滤已收录
  console.log("\n🔍 过滤已收录文章...");
  const newCandidates = [];
  for (const article of candidates) {
    const byUrl = await checkPracticeExists(article.url);
    if (byUrl) continue;
    const byTitle = await checkPracticeExistsByTitle(article.title);
    if (byTitle) continue;
    newCandidates.push(article);
  }
  console.log(`   ${candidates.length - newCandidates.length} 篇已收录，${newCandidates.length} 篇待分析`);

  const bundle = {
    generated_at: new Date().toISOString(),
    skill_names: skillNames,
    total: newCandidates.length,
    candidates: newCandidates,
  };
  writeJsonAtomic(CANDIDATES_FILE, bundle);
  console.log(`\n✅ 搜索完成：${newCandidates.length} 篇候选已存入 ${CANDIDATES_FILE}`);
  return bundle;
}

// ============ 抓取掘金文章正文 ============
async function fetchArticleContent(url, retries = 1) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
      await sleep(1500);
      const content = await page.evaluate(() => {
        const el = document.querySelector("article.article-content") || document.querySelector(".article-viewer");
        return el ? el.innerText.trim() : (document.body.innerText || "").trim();
      });
      await page.close();
      return content.slice(0, 3000);
    } catch (err) {
      if (page) try { await page.close(); } catch {}
      if (attempt < retries) {
        await closeBrowser();
        await sleep(1000);
        continue;
      }
      return "";
    }
  }
  return "";
}

// ============ AI 判断 ============
async function analyzeContent(content, title, skillNames) {
  const skillList = skillNames.join(", ");
  const textForAI = content.slice(0, 3000);

  if (textForAI.length < 200) return { is_practice: false, reason: "内容过短" };

  const prompt = `你是 AI 实践文章评审专家。请判断以下文章是否为"实践文章"。

**实践文章的定义**：用具体的 AI Skill/工具，在真实场景中做出了具体产出。
核心公式：Skill × 场景 = 实践

**重要约束：只识别以下 Skill 列表中的工具，不在列表中的工具一律忽略**：
${skillList}

**关键区分：Agent Skill 实践 vs 技术本身的应用**
- Agent Skill 是指在 AI Agent（如 Claude Code、Cursor 等）中以"Skill/插件/技能包"形式使用的工具
- 如果文章只是在用某个技术本身（如直接用 RAG 框架搭系统），这不算 Agent Skill 实践
- 只有当文章明确是在 AI Agent 环境中调用/使用了上述 Skill，才算实践文章

**好文章（收录）**：在 AI Agent 中使用上述 Skill 做了项目/解决了问题，有操作步骤、代码、踩坑记录
**差文章（不收录）**：单纯介绍/推荐工具、工具对比评测、纯概念科普、通用 AI 编程教程

**排除以下通用 AI 工具，它们不算 Skill**：
Claude Code, Cursor, Windsurf, Copilot, ChatGPT, DeepSeek, Gemini, GPT-4, Claude, Trae, Augment Code, Cline, Roo Code, Aider

文章标题：${title}
文章正文（前3000字）：
${textForAI}

请严格按以下 JSON 格式输出：
{
  "is_practice": true/false,
  "confidence": 0.0-1.0,
  "skills": ["只填上述列表中匹配到的skill名称"],
  "scene": "一句话描述使用场景",
  "reason": "判断理由（一句话）"
}`;

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "你是专业的AI实践文章评审专家，只输出JSON。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : { is_practice: false, reason: "AI 返回格式错误" };
}

// ============ 阶段二：分析 ============
async function runAnalyze({ bundle, doNotify }) {
  // 读候选
  const data = bundle || readJson(CANDIDATES_FILE);
  if (!data || !data.candidates || data.candidates.length === 0) {
    console.log("\nℹ️ 无候选文章，跳过分析。");
    return;
  }

  const candidates = data.candidates;
  const skillNames = data.skill_names || [];
  const skillSubwords = buildSkillSubwords(skillNames);

  // 读已分析结果（断点续跑）
  const analyzed = readJson(ANALYZED_FILE) || { results: [] };
  const doneKeys = new Set(analyzed.results.map(r => r.url));

  const pending = candidates.filter(a => !doneKeys.has(a.url));

  console.log("\n🤖 分析阶段（抓取正文 + DeepSeek 分析）...");
  console.log(`   候选: ${candidates.length} | 已分析: ${candidates.length - pending.length} | 待分析: ${pending.length}`);

  if (pending.length === 0) {
    console.log("✅ 全部已分析完成。");
    printSummary(analyzed.results, candidates.length, doNotify);
    return;
  }

  for (let i = 0; i < pending.length; i++) {
    const article = pending[i];
    const progress = `[${i + 1}/${pending.length}]`;
    const titleShort = (article.title || "").slice(0, 50);

    // 预筛
    const text = `${article.title} ${article.brief || ""}`.toLowerCase();
    const relevant = skillSubwords.some(w => text.includes(w));
    if (!relevant) {
      console.log(`${progress} ${titleShort}... ⏭️ 预筛跳过`);
      analyzed.results.push({ url: article.url, title: article.title, status: "skipped", reason: "预筛跳过" });
      writeJsonAtomic(ANALYZED_FILE, analyzed);
      continue;
    }

    process.stdout.write(`${progress} ${titleShort}... `);

    // 抓取文章正文
    let content;
    try {
      content = await fetchArticleContent(article.url);
      await closeBrowser();
      maybeGC();
    } catch (err) {
      await closeBrowser();
      console.log("⚠️ 抓取失败");
      analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: "抓取失败" });
      writeJsonAtomic(ANALYZED_FILE, analyzed);
      await sleep(200);
      continue;
    }

    if (!content || content.length < 200) {
      console.log("⏭️ 内容不足");
      analyzed.results.push({ url: article.url, title: article.title, status: "skipped", reason: "内容不足" });
      writeJsonAtomic(ANALYZED_FILE, analyzed);
      continue;
    }

    // DeepSeek 分析
    try {
      const j = await analyzeContent(content, article.title, skillNames);
      const pass = j.is_practice && j.confidence >= 0.6;

      if (pass) {
        console.log(`✅ 通过 (${(j.confidence * 100).toFixed(0)}%) — ${j.scene || ""}`);
        console.log(`   → ${article.url}`);
        analyzed.results.push({
          url: article.url, title: article.title, status: "passed",
          judgment: j, content_preview: content.slice(0, 500),
        });
      } else {
        console.log(`❌ ${j.reason || "未通过"}`);
        analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: j.reason || "未通过" });
      }
    } catch (err) {
      console.log(`⚠️ 分析失败: ${err.message}`);
      analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: err.message });
    }

    writeJsonAtomic(ANALYZED_FILE, analyzed);
    await sleep(300);
  }

  await closeBrowser();
  printSummary(analyzed.results, candidates.length, doNotify);
}

function printSummary(results, totalCandidates, doNotify) {
  const passed = results.filter(r => r.status === "passed");

  console.log("\n" + "=".repeat(60));
  console.log("📊 发掘结果汇总");
  console.log("=".repeat(60));
  console.log(`候选: ${totalCandidates} | 已分析: ${results.length} | 通过: ${passed.length}`);

  let msg = `📊 掘金实践文章发掘报告\n\n`;
  msg += `候选 ${totalCandidates} 篇 → 通过 ${passed.length} 篇\n\n`;

  if (passed.length > 0) {
    console.log("\n✅ 通过筛选的实践文章：\n");
    for (let i = 0; i < passed.length; i++) {
      const r = passed[i];
      const j = r.judgment || {};
      console.log(`${i + 1}. ${r.title}`);
      console.log(`   ${r.url}`);
      console.log(`   Skill: ${(j.skills || []).join(", ")} | ${(j.confidence * 100).toFixed(0)}%`);
      console.log();

      msg += `${i + 1}. ${r.title}\n`;
      msg += `   ${r.url}\n`;
      msg += `   Skill: ${(j.skills || []).join(", ")} | ${(j.confidence * 100).toFixed(0)}%\n\n`;
    }
  }

  msg += "💡 待骁哥审核确认后入库";

  if (doNotify) {
    fs.writeFileSync(RESULT_FILE, msg, "utf8");
    console.log(`\n📝 汇总已写入: ${RESULT_FILE}`);
  }
}

// ============ 主流程 ============
async function main() {
  const args = process.argv.slice(2);

  let phase = "all";
  const phaseIdx = args.indexOf("--phase");
  if (phaseIdx !== -1 && args[phaseIdx + 1]) phase = args[phaseIdx + 1];

  let customKeyword = null;
  const kwIdx = args.indexOf("--keyword");
  if (kwIdx !== -1 && args[kwIdx + 1]) customKeyword = args[kwIdx + 1];

  let perKeywordLimit = 10;
  const limIdx = args.indexOf("--limit");
  if (limIdx !== -1 && args[limIdx + 1]) perKeywordLimit = parseInt(args[limIdx + 1]) || 10;

  const doNotify = args.includes("--notify");

  try {
    let bundle = null;

    if (phase === "all" || phase === "search") {
      bundle = await runSearch({ customKeyword, perKeywordLimit });
    }

    if (phase === "all" || phase === "analyze") {
      await runAnalyze({ bundle, doNotify });
    }
  } catch (err) {
    console.error(`\n❌ 失败: ${err.message}`);
    await closeBrowser();
    process.exit(1);
  }

  await closeBrowser();
}

main();
