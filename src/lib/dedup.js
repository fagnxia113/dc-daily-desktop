const crypto = require('crypto');

function norm(s){ return (s||'').replace(/\s+/g,'').toLowerCase(); }
function normOrg(o){ return norm(o).replace(/股份有限公司|有限公司|有限责任公司|股份公司|集团|控股|科技|信息|网络|数据|有限合伙|（.*?）/g,''); }

function signature(ev){
  const d = ev.canon_tokens?.date || ev.event_date || '';
  const type = ev.canon_tokens?.event_type || ev.event_type || '';
  const loc = ev.canon_tokens?.location || ev.location || '';
  const amt = ev.canon_tokens?.main_amount || (Array.isArray(ev.amounts)&&ev.amounts[0]?.amount)||'';
  const orgs = (ev.canon_tokens?.orgs || ev.orgs || []).map(normOrg).sort().join('|');
  const raw = [d, type, loc, amt, orgs].join('|');
  return crypto.createHash('sha1').update(raw).digest('hex');
}

function dedup(events){
  const map = new Map();
  for (const e of events){
    const key = signature(e);
    const exist = map.get(key);
    if(!exist) map.set(key, e);
    else {
      // 保留置信度高的；若相等保持发布时间更早的
      if((e.confidence||0) > (exist.confidence||0)) map.set(key, e);
    }
  }
  return { deduped: Array.from(map.values()), keys: Array.from(map.keys()) };
}

module.exports = { dedup, signature };
