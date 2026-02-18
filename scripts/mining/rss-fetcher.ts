/**
 * RSS 抓取模块
 * 
 * 从配置的 RSS 源抓取文章，解析后存入候选池
 */

import type { RSSSource } from '@/lib/types/mining';

// RSS 源配置（后续移到数据库或配置文件）
export const RSS_SOURCES: RSSSource[] = [
  // 待骁哥确认后填充
  // {
  //   id: 'example',
  //   name: '示例公众号',
  //   feed_url: 'https://werss.app/xxx',
  //   channel: '公众号',
  //   enabled: true,
  //   priority: 10,
  //   last_fetched_at: null,
  // },
];

/**
 * RSS 文章结构
 */
export type RSSArticle = {
  title: string;
  link: string;
  description: string;
  content: string;
  author: string | null;
  pubDate: string | null;
};

/**
 * 解析 RSS XML
 */
export function parseRSS(xml: string): RSSArticle[] {
  const articles: RSSArticle[] = [];
  
  // 简单的 XML 解析（生产环境建议用 fast-xml-parser）
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    
    const getTag = (tag: string): string => {
      const tagRegex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`);
      const m = item.match(tagRegex);
      return (m?.[1] || m?.[2] || '').trim();
    };
    
    articles.push({
      title: getTag('title'),
      link: getTag('link'),
      description: getTag('description'),
      content: getTag('content:encoded') || getTag('content'),
      author: getTag('author') || getTag('dc:creator') || null,
      pubDate: getTag('pubDate') || getTag('dc:date') || null,
    });
  }
  
  return articles;
}

/**
 * 抓取单个 RSS 源
 */
export async function fetchRSSSource(source: RSSSource): Promise<RSSArticle[]> {
  if (!source.enabled) {
    return [];
  }
  
  try {
    const response = await fetch(source.feed_url, {
      headers: {
        'User-Agent': 'skill-cn-mining/1.0',
      },
    });
    
    if (!response.ok) {
      console.error(`RSS fetch failed for ${source.name}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const articles = parseRSS(xml);
    
    // 补充来源信息
    return articles.map(article => ({
      ...article,
      author: article.author || source.name,
    }));
  } catch (error) {
    console.error(`RSS fetch error for ${source.name}:`, error);
    return [];
  }
}

/**
 * 抓取所有启用的 RSS 源
 */
export async function fetchAllRSSSources(): Promise<{
  source: RSSSource;
  articles: RSSArticle[];
}[]> {
  const results = await Promise.all(
    RSS_SOURCES
      .filter(s => s.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map(async source => ({
        source,
        articles: await fetchRSSSource(source),
      }))
  );
  
  return results;
}

/**
 * 去除 HTML 标签，提取纯文本
 */
export function stripHTML(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
