const logEl = document.getElementById('log');
function log(s){ logEl.textContent += s + "\n"; logEl.scrollTop = logEl.scrollHeight; }

async function refresh() {
  const cfg = await window.api.getConfig();
  const ul = document.getElementById('bizList');
  ul.innerHTML = '';
  cfg.bizList.forEach(b => {
    const li = document.createElement('li');
    li.textContent = b + ' ';
    const del = document.createElement('button');
    del.textContent = '删除';
    del.onclick = async () => { await window.api.removeBiz(b); refresh(); };
    li.appendChild(del);
    ul.appendChild(li);
  });
  // 默认日期 = 前一日
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const s = d.toISOString().slice(0,10);
  document.getElementById('fromDate').value = s;
  document.getElementById('toDate').value = s;
}
document.getElementById('btnAdd').onclick = async () => {
  const url = document.getElementById('mpUrl').value.trim();
  if(!url) return;
  try {
    const biz = await window.api.addBizFromUrl(url);
    log(`添加成功：__biz=${biz}`);
    refresh();
  } catch(e){ log('添加失败：' + e.message); }
};
document.getElementById('btnRun').onclick = async () => {
  const fromDate = document.getElementById('fromDate').value;
  const toDate = document.getElementById('toDate').value;
  log(`开始：${fromDate} ~ ${toDate}`);
  try {
    const res = await window.api.runJob({ fromDate, toDate });
    if(res?.canceled){ log('已取消保存'); return; }
    log(`完成：导出 ${res?.exported || 0} 条 → ${res?.savePath}`);
    if(res?.errors?.length){ log('失败条目：\n' + res.errors.map(e=>`- ${e}`).join('\n')); }
  } catch(e){
    log('运行失败：' + e.message);
  }
};
refresh();
