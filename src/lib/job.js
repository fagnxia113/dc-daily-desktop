const path = require('path');
const os = require('os');
const fse = require('fs-extra');
const { runWeweRssForBiz } = require('./wewe');
const { extractEvent } = require('./zhipu');
const { dedup, signature } = require('./dedup');
const { ymd } = require('./utils');

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function preFilter(article, keywords, softText){
  // 标题或正文包含行业词 + 动态词，且非软文关键词
  const title = (article.title || '').toLowerCase();
  const text = (article.content_text || article.content || '').toLowerCase();
  const hasIndustry = keywords.industry.some(k => title.includes(k.toLowerCase()) || text.includes(k.toLowerCase()));
  const hasDynamics = keywords.dynamics.some(k => title.includes(k.toLowerCase()) || text.includes(k.toLowerCase()));
  const isSoft = softText.some(k => title.includes(k.toLowerCase()));
  return hasIndustry && hasDynamics && !isSoft;
}

async function runJob({ bizList, fromDate, toDate, savePath, weweExe, commandTemplate, keywords, softText, concurrency=3, dataDir, logsDir }){
  if (!bizList || bizList.length === 0) throw new Error('请先添加至少一个公众号');
  if (!weweExe) throw new Error('wewe-rss 可执行文件未找到');
  const tmp = path.join(dataDir, 'cache', `job_${Date.now()}`);
  fse.ensureDirSync(tmp);

  // 1) 拉取
  let allArticles = [];
  for (const biz of bizList){
    try {
      const items = await runWeweRssForBiz({
        exe: weweExe,
        biz,
        from: fromDate,
        to: toDate,
        workDir: tmp,
        commandTemplate
      });
      const norm = items.map(it => ({
        source_mp: it.mp_name || it.account || '',
        url: it.url || it.link || '',
        title: it.title || '',
        publish_time: it.publish_time || it.pubDate || '',
        content_text: it.content_text || it.description || '',
        content: it.content || '',
      }));
      allArticles.push(...norm);
      await sleep(1800 + Math.floor(Math.random()*1200)); // 1.8-3.0s 抖动
    } catch (e) {
      // 记录失败但不中断
      allArticles.push({ title: `[抓取失败 ${biz}]`, content_text: '', url: '', publish_time: '' });
    }
  }

  // 2) 预筛
  const candidates = allArticles.filter(a => preFilter(a, keywords, softText));

  // 3) LLM 抽取
  const apiKey = process.env.ZHIPU_API_KEY || process.env.zhipu || "";
  if (!apiKey) {
    // Alpha：运行时从环境变量读取；UI 不持久化保存
    throw new Error('请以环境变量 ZHIPU_API_KEY 方式提供智谱密钥（Alpha 版不持久化保存）');
  }

  const queue = [...candidates];
  const results = [];
  let running = 0;
  async function next(){
    if (queue.length === 0) return;
    if (running >= concurrency) return;
    const item = queue.shift();
    running++;
    try {
      const ev = await extractEvent({ apiKey, article: item });
      if (ev?.is_in_scope) {
        ev._dedup_key = signature(ev);
        results.push(ev);
      }
    } catch {}
    running--;
    await next();
  }
  const starters = Array.from({length: Math.min(concurrency, queue.length)}).map(()=>next());
  await Promise.all(starters);
  // 等待全部结束
  while(running > 0 || queue.length > 0){ await sleep(100); }

  // 4) 去重
  const { deduped } = dedup(results);

  // 5) 导出
  const { exportEventsToXlsx } = require('./excel');
  const report = await exportEventsToXlsx(deduped, savePath);

  return { exported: deduped.length, savePath: report.filePath, errors: [] };
}

module.exports = { runJob };
