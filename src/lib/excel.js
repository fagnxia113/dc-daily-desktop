const ExcelJS = require('exceljs');
async function exportEventsToXlsx(events, filePath){
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Events");
  ws.columns = [
    { header: "事件日期", key: "event_date", width: 12 },
    { header: "行业领域", key: "industry", width: 16 },
    { header: "动态维度", key: "dynamic_categories", width: 22 },
    { header: "事件标题", key: "event_title", width: 40 },
    { header: "事件类型", key: "event_type", width: 14 },
    { header: "涉及机构", key: "orgs", width: 28 },
    { header: "相关人物", key: "people", width: 18 },
    { header: "金额信息", key: "amounts", width: 18 },
    { header: "地点", key: "location", width: 12 },
    { header: "摘要", key: "summary", width: 50 },
    { header: "证据摘录", key: "evidence_snippets", width: 60 },
    { header: "来源公众号", key: "source_mp", width: 16 },
    { header: "发布时间", key: "publish_time", width: 20 },
    { header: "原文链接", key: "url", width: 48 },
    { header: "去重ID", key: "dedup_key", width: 40 },
    { header: "置信度", key: "confidence", width: 10 },
    { header: "剔除原因", key: "exclude_reason", width: 18 }
  ];
  for(const e of events){
    ws.addRow({
      event_date: e.event_date || e.canon_tokens?.date || "",
      industry: (e.industry||[]).join("；"),
      dynamic_categories: (e.dynamic_categories||[]).join("；"),
      event_title: e.event_title || "",
      event_type: e.event_type || "",
      orgs: (e.orgs||[]).join("；"),
      people: (e.people||[]).join("；"),
      amounts: (e.amounts||[]).map(a=>`${a.type || '金额'}=${a.amount}`).join("；"),
      location: e.location || "",
      summary: e.summary || "",
      evidence_snippets: (e.evidence_snippets||[]).slice(0,2).join(" / "),
      source_mp: e.source?.mp || "",
      publish_time: e.source?.publish_time || "",
      url: e.source?.url || "",
      dedup_key: e._dedup_key || "",
      confidence: e.confidence ?? "",
      exclude_reason: e.exclude_reason || ""
    });
  }
  await wb.xlsx.writeFile(filePath);
  return { filePath, count: events.length };
}
module.exports = { exportEventsToXlsx };
