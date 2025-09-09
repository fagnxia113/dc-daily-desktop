const fetch_ = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const MODEL = "glm-4-flash";

function buildPrompt(article, categories) {
  const schema = `
仅输出 JSON，不要多余文本。字段：
{
  "is_in_scope": boolean,
  "industry": string[], // 从 ["数据中心","算力","云计算"] 选
  "dynamic_categories": string[], // 从 ${JSON.stringify(categories)} 中选
  "event_date": "YYYY-MM-DD",
  "event_type": "政策|投融资|企业运营|政企合作|产业资讯|创新前沿|行业报告|权威报道|专家观点|项目动态|会展动态",
  "event_title": string,
  "orgs": string[],
  "people": string[],
  "amounts": [{"amount": string, "type": string}],
  "location": string,
  "summary": string, // <= 150字
  "evidence_snippets": string[], // 2-3段原文摘录
  "exclude_reason": string, // 软文/不相关时给出
  "confidence": number, // 0-1
  "canon_tokens": {
    "date": "YYYY-MM-DD",
    "orgs": string[],
    "location": string,
    "event_type": string,
    "main_amount": string
  },
  "source": {"mp": string, "url": string, "publish_time": "YYYY-MM-DD HH:mm:ss"}
}`;
  const text = (article.content_text || article.content || '').slice(0, 8000);
  return `你是严谨的行业动态抽取助手，面向“数据中心/算力/云计算”领域，剔除软文/教程/分享类。
${schema}

文章标题：${article.title || ""}
发布时间：${article.publish_time || ""}
来源链接：${article.url || ""}
正文：
${text}`;
}

async function extractEvent({ apiKey, article }) {
  const categories = ["政策","投融资","企业运营","政企合作","产业资讯","创新前沿","行业报告","权威报道","专家观点","项目动态","会展动态"];
  const prompt = buildPrompt(article, categories);
  const resp = await fetch_("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: "只输出合法 JSON，不要任何解释。" },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    return { is_in_scope: false, exclude_reason: "JSON解析失败", confidence: 0 };
  }
}

module.exports = { extractEvent };
