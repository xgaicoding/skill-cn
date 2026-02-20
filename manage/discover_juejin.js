#!/usr/bin/env node
"use strict";

/**
 * 掘金实践文章自动发掘工具
 *
 * 流程：
 * 1. 从 skills 表获取所有 Skill 名称，生成搜索关键词
 * 2. 掘金搜索 API 批量搜索，收集候选文章
 * 3. Chrome 渲染获取文章全文
 * 4. AI 判断是否为"实践文章"（Skill × 场景 = 实践）
 * 5. 输出筛选结果汇总
 *
 * 用法：
 *   node manage/discover_juejin.js                    # 全量搜索所有 Skill
 *   node manage/discover_juejin.js --keyword "MCP"    # 指定关键词搜索
 *   node manage/discover_juejin.js --limit 5          # 每个关键词最多取 5 篇
 *   node manage/discover_juejin.js --import            # 对通过筛选的文章自动入库
 *
 * 环境变量（从 .env 读取）：
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   DEEPSEEK_API_KEY
 *   DEEPSEEK_API_KEY
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

// ============ 全局 Browser 实例（复用，避免 OOM）============
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
      "--js-flags=--max-old-space-size=256",
    ],
  });
  return _browser;
}

async function closeBrowser() {
  if (_browser) { try { await _browser.close(); } catch {} _browser = null; }
}

// ============ 掘金搜索 ============
async function searchJuejin(keyword, limit = 10, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      const searchUrl = `https://juejin.cn/search?query=${encodeURIComponent(keyword)}&type=0`;
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 2000));

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
        view_count: 0,
        digg_count: 0,
        comment_count: 0,
        ctime: "",
        url: `https://juejin.cn/post/${r.article_id}`,
      }));
    } catch (err) {
      if (page) try { await page.close(); } catch {}
      if (attempt < retries) {
        console.log(`   ⚠️ 搜索 "${keyword}" 超时，重试 (${attempt + 1}/${retries})...`);
        // 超时可能是 browser 挂了，重启
        await closeBrowser();
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      throw err;
    }
  }
  return [];
}

// ============ Chrome 渲染获取全文 ============

async function fetchArticleContent(url) {
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
    await page
      .waitForSelector("article, .article-content, #article-root", { timeout: 10000 })
      .catch(() => {});

    const result = await page.evaluate(() => {
      const articleEl =
        document.querySelector(".article-content") ||
        document.querySelector("article") ||
        document.querySelector("#article-root");
      if (articleEl) {
        articleEl
          .querySelectorAll("style, script, .copy-code-btn, .code-block-extension-header")
          .forEach((el) => el.remove());
      }
      return articleEl?.innerText?.trim() || "";
    });

    await page.close();
    return result;
  } catch (err) {
    if (page) try { await page.close(); } catch {}
    throw err;
  }
}

// ============ AI 判断是否为实践文章 ============
function buildJudgePrompt(skillNames) {
  const skillList = skillNames.join(", ");
  return `你是 AI 实践文章评审专家。请判断以下文章是否为"实践文章"。

**实践文章的定义**：用具体的 AI Skill/工具，在真实场景中做出了具体产出。
核心公式：Skill × 场景 = 实践

**重要约束：只识别以下 Skill 列表中的工具，不在列表中的工具一律忽略**：
${skillList}

**关键区分：Agent Skill 实践 vs 技术本身的应用**
- Agent Skill 是指在 AI Agent（如 Claude Code、Cursor 等）中以"Skill/插件/技能包"形式使用的工具
- 如果文章只是在用某个技术本身（如直接用 RAG 框架搭系统、直接用 Milvus 做向量检索、直接用 Supabase 建数据库、直接用 Vue/React 写前端），这不算 Agent Skill 实践，即使技术名称出现在上述列表中
- 只有当文章明确是在 AI Agent 环境中调用/使用了上述 Skill（如通过 Claude Code 的 Skill 机制、通过 Agent 的工具调用等），才算实践文章

**好文章（收录）**：
- 在 AI Agent 中使用上述列表中的某个 Skill 做了一个项目/解决了一个问题
- 有操作步骤、代码、截图、踩坑记录
- 最终有可见的产出

**差文章（不收录）**：
- 文章中没有使用上述列表中的任何 Skill
- 只是用某个技术本身做开发（如用 RAG 搭系统、用 Milvus 做检索），而非通过 Agent Skill 机制调用
- 单纯介绍/推荐工具，无具体落地场景
- 工具对比评测，但没有实际项目产出
- 纯概念科普、新闻资讯
- 通用 AI 编程教程（如"如何使用 ChatGPT"）

**排除以下通用 AI 工具，它们不算 Skill**：
Claude Code, Cursor, Windsurf, Copilot, ChatGPT, DeepSeek, Gemini, GPT-4, Claude, Trae, Augment Code, Cline, Roo Code, Aider

文章标题：{title}
文章正文（前3000字）：
{content}

请严格按以下 JSON 格式输出：
{
  "is_practice": true/false,
  "confidence": 0.0-1.0,
  "skills": ["只填上述列表中匹配到的skill名称"],
  "scene": "一句话描述使用场景",
  "reason": "判断理由（一句话）"
}`;
}

async function judgeArticle(title, content, skillNames) {
  const promptTemplate = buildJudgePrompt(skillNames);
  const prompt = promptTemplate.replace("{title}", title).replace("{content}", content.slice(0, 3000));

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
  if (!match) return { is_practice: false, reason: "AI 返回格式错误" };
  return JSON.parse(match[0]);
}

// ============ 生成营销摘要 ============
const SUMMARY_PROMPT = `你是顶级内容营销专家。为以下文章写一段「让人忍不住想点进去看」的中文摘要（100字左右）。

要求：
- 开头就要抓眼球，制造好奇心或冲突感
- 突出「用了什么 → 做出了什么」的实践成果
- 语气生动有感染力，像朋友在安利你一个超酷的东西
- 适当用 emoji 增加视觉吸引力（2-3个就好）
- 绝对不要用"本文"、"该文章"这种无聊开头

标题：{title}
正文（前2000字）：
{content}

直接输出摘要文本，不要加引号或其他格式。`;

async function generateSummary(title, content) {
  const prompt = SUMMARY_PROMPT.replace("{title}", title).replace("{content}", content.slice(0, 2000));
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

// ============ Skill 匹配 ============
function coreWord(name) {
  return name
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .replace(/(skills?|bestpractices|promax|pro)$/g, "");
}

function matchSkills(extractedNames, dbSkills) {
  const matched = [];
  const unmatched = [];

  for (const name of extractedNames) {
    const core = coreWord(name);
    const lower = name.toLowerCase().replace(/[\s_-]+/g, "");

    const found = dbSkills.find((s) => {
      const dbLower = s.name.toLowerCase().replace(/[\s_-]+/g, "");
      const dbCore = coreWord(s.name);
      return (
        dbLower === lower || dbCore === core ||
        dbLower.includes(lower) || lower.includes(dbLower) ||
        dbCore.includes(core) || core.includes(dbCore)
      );
    });

    if (found) matched.push(found);
    else unmatched.push(name);
  }

  return { matched, unmatched };
}

// ============ 生成搜索关键词 ============
function generateSearchKeywords(skills) {
  // 用 Skill 名称 + "skill" 后缀生成搜索词，网页搜索召回率高
  const keywords = new Set();
  // 只跳过太短或太通用不适合搜索的词
  const SKIP_KEYWORDS = ["pdf", "xlsx", "ppt", "find", "trending"];
  for (const skill of skills) {
    const name = skill.name
      .replace(/-best-practices$/i, "")
      .replace(/-skill$/i, "")
      .replace(/-skills$/i, "")
      .replace(/-pro$/i, "");
    if (name.length >= 3 && !SKIP_KEYWORDS.includes(name.toLowerCase())) {
      // 把连字符替换成空格，更适合网页搜索
      const searchName = name.replace(/-/g, " ");
      keywords.add(searchName + " skill");
    }
  }
  return [...keywords];
}

// ============ 主流程 ============
async function main() {
  const args = process.argv.slice(2);
  const doImport = args.includes("--import");
  const doNotify = args.includes("--notify"); // 跑完输出汇总到 .discover_result.txt

  // 解析 --keyword
  let customKeyword = null;
  const kwIdx = args.indexOf("--keyword");
  if (kwIdx !== -1 && args[kwIdx + 1]) customKeyword = args[kwIdx + 1];

  // 解析 --limit
  let perKeywordLimit = 10;
  const limIdx = args.indexOf("--limit");
  if (limIdx !== -1 && args[limIdx + 1]) perKeywordLimit = parseInt(args[limIdx + 1]) || 10;

  // 检查环境变量
  for (const [k, v] of Object.entries({ SUPABASE_URL, SUPABASE_KEY, DEEPSEEK_KEY })) {
    if (!v) { console.error(`缺少环境变量: ${k}`); process.exit(1); }
  }

  try {
    // 1. 获取 Skill 列表 & 生成关键词
    console.log("📋 获取 Skill 列表...");
    const dbSkills = await fetchAllSkills();
    console.log(`   共 ${dbSkills.length} 个 Skill`);

    const keywords = customKeyword ? [customKeyword] : generateSearchKeywords(dbSkills);
    console.log(`   搜索关键词: ${keywords.length} 个`);

    // 2. 批量搜索
    console.log("\n🔍 搜索掘金文章...");
    const allCandidates = new Map(); // article_id -> article info，去重

    for (let kwIdx = 0; kwIdx < keywords.length; kwIdx++) {
      const kw = keywords[kwIdx];

      // 每 10 个关键词重启 Browser 释放内存
      if (kwIdx > 0 && kwIdx % 10 === 0) {
        await closeBrowser();
        console.log(`   🔄 重启 Browser（已搜索 ${kwIdx} 个关键词，释放内存）`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      try {
        const results = await searchJuejin(kw, perKeywordLimit);
        for (const r of results) {
          if (!allCandidates.has(r.article_id)) {
            r._keyword = kw;
            allCandidates.set(r.article_id, r);
          }
        }
        // 避免请求过快
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.log(`   ⚠️ 搜索 "${kw}" 失败: ${err.message}`);
      }
    }

    console.log(`   共发现 ${allCandidates.size} 篇去重后的候选文章`);

    // 3. 过滤已收录（URL + 标题双重去重）
    console.log("\n🔍 过滤已收录文章...");
    const candidates = [];
    for (const article of allCandidates.values()) {
      const existsByUrl = await checkPracticeExists(article.url);
      if (existsByUrl) { continue; }
      const existsByTitle = await checkPracticeExistsByTitle(article.title);
      if (existsByTitle) { continue; }
      candidates.push(article);
    }
    console.log(`   ${allCandidates.size - candidates.length} 篇已收录，${candidates.length} 篇待分析`);

    if (candidates.length === 0) {
      console.log("\n✅ 没有新的候选文章，全部已收录或不符合条件。");
      
      process.exit(0);
    }

    // 4. Chrome 抓取全文 + AI 判断
    console.log("\n🤖 逐篇分析（Chrome 渲染 + AI 判断）...");
    const passed = [];
    const failed = [];

    // 预计算 skill 关键词（拆成子词，任一子词命中即可）
    const skillNames = dbSkills.map((s) => s.name);
    const skillSubwords = dbSkills.flatMap((s) => {
      const parts = s.name.toLowerCase().split(/[-_]/);
      // 返回长度>=3的子词（去掉太短的如 "ui"）
      return parts.filter((p) => p.length >= 3);
    });
    const skillSubwordsUnique = [...new Set(skillSubwords)];

    for (let i = 0; i < candidates.length; i++) {
      const article = candidates[i];
      const progress = `[${i + 1}/${candidates.length}]`;

      // 每 10 篇重启 Browser 释放内存
      if (i > 0 && i % 10 === 0) {
        await closeBrowser();
        console.log(`   🔄 重启 Browser（已处理 ${i} 篇，释放内存）`);
        await new Promise((r) => setTimeout(r, 1000));
      }

      try {
        // 快速预筛：用 title + brief 检查是否可能包含已有 Skill 关键词
        const textToCheck = (article.title + " " + article.brief).toLowerCase();
        const maybeRelevant = skillSubwordsUnique.some((word) => word.length >= 3 && textToCheck.includes(word));
        if (!maybeRelevant) {
          // 标题和摘要里完全没有任何 Skill 关键词，大概率不相关，跳过 Chrome 渲染
          process.stdout.write(`${progress} ${article.title.slice(0, 50)}... `);
          console.log("⏭️ 预筛跳过（标题/摘要无 Skill 关键词）");
          failed.push({ ...article, reason: "预筛：无 Skill 关键词" });
          continue;
        }

        process.stdout.write(`${progress} ${article.title.slice(0, 50)}... `);

        // Chrome 抓全文
        const content = await fetchArticleContent(article.url);
        if (content.length < 200) {
          console.log("❌ 内容过短，跳过");
          failed.push({ ...article, reason: "内容过短" });
          continue;
        }

        // AI 判断（传入 skills 表名单，只识别已有 Skill）
        const judgment = await judgeArticle(article.title, content, skillNames);
        article._content = content;
        article._judgment = judgment;

        if (judgment.is_practice && judgment.confidence >= 0.6) {
          console.log(`✅ 实践文章 (${(judgment.confidence * 100).toFixed(0)}%) — ${judgment.scene || ""}`);
          console.log(`   → ${article.url}`);
          passed.push(article);
        } else {
          console.log(`❌ 非实践 — ${judgment.reason || ""}`);
          failed.push({ ...article, reason: judgment.reason });
        }

        // 控制速率
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.log(`⚠️ 失败: ${err.message}`);
        failed.push({ ...article, reason: err.message });
      }
    }

    

    // 5. 输出汇总
    console.log("\n" + "=".repeat(60));
    console.log(`📊 发掘结果汇总`);
    console.log("=".repeat(60));
    console.log(`候选文章: ${candidates.length} 篇`);
    console.log(`通过筛选: ${passed.length} 篇`);
    console.log(`未通过:   ${failed.length} 篇`);

    if (passed.length > 0) {
      console.log("\n✅ 通过筛选的实践文章：\n");
      for (let i = 0; i < passed.length; i++) {
        const a = passed[i];
        const j = a._judgment;
        console.log(`${i + 1}. ${a.title}`);
        console.log(`   链接: ${a.url}`);
        console.log(`   作者: ${a.author} | 👀 ${a.view_count} | 👍 ${a.digg_count} | 💬 ${a.comment_count}`);
        console.log(`   场景: ${j.scene || "—"}`);
        console.log(`   Skill: ${(j.skills || []).join(", ") || "—"}`);
        console.log(`   置信度: ${(j.confidence * 100).toFixed(0)}%`);
        console.log();
      }
    }

    // 6. 自动入库（如果指定了 --import）
    if (doImport && passed.length > 0) {
      console.log("\n🚀 开始自动入库...\n");

      for (const article of passed) {
        try {
          const j = article._judgment;
          const { matched, unmatched } = matchSkills(j.skills || [], dbSkills);

          if (matched.length === 0) {
            console.log(`⏭️  ${article.title.slice(0, 40)}... — 无匹配 Skill（${(j.skills || []).join(",")}），跳过`);
            continue;
          }

          // 入库前再次检查标题去重（防止并发或多轮跑重复）
          const titleExists = await checkPracticeExistsByTitle(article.title);
          if (titleExists) {
            console.log(`⏭️  ${article.title.slice(0, 40)}... — 标题已存在，跳过`);
            continue;
          }

          // 生成摘要
          const summary = await generateSummary(article.title, article._content);
          const skillIds = [...new Set(matched.map((s) => s.id))];
          const today = new Date().toISOString();

          const practice = {
            skill_ids: skillIds,
            primary_skill_id: skillIds[0],
            title: article.title,
            summary,
            channel: "掘金",
            updated_at: today,
            source_url: article.url,
            author_name: article.author,
            is_listed: true,
            click_count: 100,
            is_featured: false,
          };

          const jsonData = {
            practices: [practice],
            options: { dry_run: false, chunk_size: 50, skip_duplicates: true },
          };

          fs.writeFileSync(PRACTICES_JSON, JSON.stringify(jsonData, null, 2), "utf8");
          const importScript = path.join(__dirname, "import_practices.js");
          execSync(`node "${importScript}" --skip-duplicates`, {
            cwd: ROOT_DIR,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
          });

          console.log(`✅ 入库成功: ${article.title.slice(0, 50)}... → Skill: ${matched.map((s) => s.name).join(", ")}`);
          await new Promise((r) => setTimeout(r, 300));
        } catch (err) {
          console.log(`❌ 入库失败: ${article.title.slice(0, 40)}... — ${err.message}`);
        }
      }

      console.log("\n🎉 自动入库完成！");
    } else if (passed.length > 0 && !doImport) {
      console.log("💡 提示：加 --import 参数可自动入库通过筛选的文章");
    }

    // 7. 输出可发送的汇总消息（方便复制到群里）
    if (passed.length > 0) {
      console.log("\n" + "=".repeat(60));
      console.log("📋 以下是可发送到群里的汇总消息：");
      console.log("=".repeat(60));
      let msg = `📊 掘金实践文章发掘报告\n\n`;
      msg += `候选 ${candidates.length} 篇 → 通过 ${passed.length} 篇\n\n`;
      for (let i = 0; i < passed.length; i++) {
        const a = passed[i];
        const j = a._judgment;
        msg += `${i + 1}. ${a.title}\n`;
        msg += `   ${a.url}\n`;
        msg += `   Skill: ${(j.skills || []).join(", ")} | ${(j.confidence * 100).toFixed(0)}%\n\n`;
      }
      if (doImport) msg += `✅ 已自动入库`;
      else msg += `💡 待审核确认后入库`;
      console.log(msg);

      // --notify: 写汇总到文件，供外部读取发送
      if (doNotify) {
        const resultFile = path.join(__dirname, ".discover_result.txt");
        fs.writeFileSync(resultFile, msg, "utf8");
        console.log(`\n📝 汇总已写入: ${resultFile}`);
      }
    }
  } catch (err) {
    console.error(`\n❌ 失败: ${err.message}`);
    await closeBrowser();
    process.exit(1);
  }

  await closeBrowser();
}

main();
