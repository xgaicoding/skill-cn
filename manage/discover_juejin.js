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
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const CANDIDATES_FILE = path.join(__dirname, ".discover_candidates.json");
const ANALYZED_FILE = path.join(__dirname, ".discover_analyzed.json");
const RESULT_FILE = path.join(__dirname, ".discover_result.txt");
const ANALYZE_SCRIPT = path.join(__dirname, "analyze_one.js");

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
 * 中文需求词映射（来自 lib/seo-keywords.ts）
 * 用中文需求词搜掘金，比英文 skill name 效果好得多
 */
const DEMAND_KEYWORDS = {
  1: "AI UI 设计",
  8: "创建 Agent Skill",
  9: "AI 做 PPT",
  10: "AI 前端开发",
  11: "Supabase 数据库优化",
  12: "AI 浏览器自动化",
  13: "AI 销售线索",
  14: "域名生成器",
  15: "AI 头脑风暴",
  16: "React 做视频",
  17: "NotebookLM API",
  18: "Markdown 转公众号",
  19: "AI 画流程图",
  20: "Three.js 3D 开发",
  21: "AI 提示词生成",
  22: "Obsidian 知识管理",
  23: "AI 自动写公众号",
  24: "视频下载工具",
  25: "AI 写推特",
  26: "AI 视频包装",
  27: "AI 生成 PPT",
  28: "开发效率工具",
  29: "Markdown 转 PPT",
  30: "Skill 趋势追踪",
  31: "AI 学习记忆",
  32: "AI 文本去痕迹",
  33: "Milvus 向量数据库",
  34: "Vue 最佳实践",
  35: "React 最佳实践",
  36: "查找 Agent Skill",
  37: "Web UI 审查",
  38: "AI 处理 PDF",
  39: "AI 处理 Excel",
  40: "SaaS 营销策略",
  41: "创建 MCP Server",
  42: "YouTube 订阅更新",
  43: "YouTube 字幕提取",
  44: "本地知识库 RAG",
  45: "AI 营销工具",
  46: "AI Agent 记忆",
  47: "AI 编程工作流",
  48: "WordPress AI 开发",
  49: "聊天记录分析",
  50: "A股技术分析",
  51: "AI 操控浏览器",
  52: "AI 文字转语音",
  53: "SEO 审查工具",
  54: "GitHub Pages 预览",
  56: "AI 社交通信",
};

function generateSearchKeywords(skills) {
  const keywords = new Set();
  for (const skill of skills) {
    const demand = DEMAND_KEYWORDS[skill.id];
    if (demand) {
      keywords.add(demand);
    }
  }
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

  console.log("\n🤖 分析阶段（子进程逐篇处理）...");
  console.log(`   候选: ${candidates.length} | 已分析: ${candidates.length - pending.length} | 待分析: ${pending.length}`);

  if (pending.length === 0) {
    console.log("✅ 全部已分析完成。");
    printSummary(analyzed.results, candidates.length, doNotify);
    return;
  }

  const skillNamesJsonFile = path.join(__dirname, ".skill_names.json");
  fs.writeFileSync(skillNamesJsonFile, JSON.stringify(skillNames), "utf8");

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

    // 子进程分析
    let result;
    try {
      const stdout = execSync(
        `node --max-old-space-size=256 "${ANALYZE_SCRIPT}" "${article.url}" "$(cat "${skillNamesJsonFile}")"`,
        { cwd: ROOT_DIR, encoding: "utf8", timeout: 90000, stdio: ["pipe", "pipe", "pipe"] }
      );
      result = JSON.parse(stdout.trim());
    } catch (err) {
      console.log("⚠️ 子进程失败");
      analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: "子进程失败" });
      writeJsonAtomic(ANALYZED_FILE, analyzed);
      await sleep(200);
      continue;
    }

    if (result.error) {
      console.log(`❌ ${result.error}`);
      analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: result.error });
      writeJsonAtomic(ANALYZED_FILE, analyzed);
      await sleep(200);
      continue;
    }

    const j = result.judgment || {};
    const pass = j.is_practice && j.confidence >= 0.6;

    if (pass) {
      console.log(`✅ 通过 (${(j.confidence * 100).toFixed(0)}%) — ${j.scene || ""}`);
      console.log(`   → ${article.url}`);
      analyzed.results.push({
        url: article.url, title: article.title, status: "passed",
        judgment: j, content_preview: (result.content || "").slice(0, 500),
      });
    } else {
      console.log(`❌ 非实践 — ${j.reason || ""}`);
      analyzed.results.push({ url: article.url, title: article.title, status: "failed", reason: j.reason || "未通过" });
    }

    writeJsonAtomic(ANALYZED_FILE, analyzed);
    await sleep(300);
  }

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
