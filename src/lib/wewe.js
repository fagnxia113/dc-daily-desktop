const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

// 说明：wewe-rss 不同版本 CLI 参数可能有差异。
// 默认模板如下，如有需要可改："{exe} --biz {biz} --from {from} --to {to} --format json --out {out}"
async function runWeweRssForBiz({ exe, biz, from, to, workDir, commandTemplate }) {
  const outDir = path.join(workDir, biz);
  fse.ensureDirSync(outDir);
  const cmd = commandTemplate
    .replace('{exe}', exe)
    .replace('{biz}', biz)
    .replace('{from}', from)
    .replace('{to}', to)
    .replace('{out}', outDir);

  const parts = splitCmd(cmd);
  await spawnAsync(parts[0], parts.slice(1), { cwd: workDir });

  // 约定输出一个 *.json 或多个 json，每条为一个文章对象
  const jsonFiles = fs.readdirSync(outDir).filter(f=>f.toLowerCase().endsWith('.json'));
  let items = [];
  for(const jf of jsonFiles) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(outDir, jf), 'utf-8'));
      if (Array.isArray(raw)) items.push(...raw);
      else if (raw?.title || raw?.url) items.push(raw);
    } catch {}
  }
  return items;
}

function splitCmd(s) {
  const arr = [];
  let cur = '', inQ = false;
  for (let i=0;i<s.length;i++){
    const c = s[i];
    if (c === '"'){ inQ = !inQ; continue; }
    if (!inQ && c === ' ') { if (cur) { arr.push(cur); cur=''; } continue; }
    cur += c;
  }
  if (cur) arr.push(cur);
  return arr;
}

function spawnAsync(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { ...opts, windowsHide: true });
    let stderr = '';
    p.stderr.on('data', d => { stderr += d.toString(); });
    p.on('close', code => code === 0 ? resolve() : reject(new Error(stderr || (`${cmd} exited ${code}`))));
  });
}

module.exports = { runWeweRssForBiz };
