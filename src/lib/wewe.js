const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');

async function runWeweRssForBiz({ exe, biz, from, to, workDir }) {
  const outDir = path.join(workDir, biz);
  fse.ensureDirSync(outDir);

  // 用 node 来运行 js 脚本
  const cmd = "node";
  const args = [
    exe,
    "--biz", biz,
    "--from", from,
    "--to", to,
    "--format", "json",
    "--out", outDir
  ];

  await spawnAsync(cmd, args, { cwd: workDir });

  // 和之前相同，读取输出的 JSON 文件
  const jsonFiles = fs.readdirSync(outDir).filter(f=>f.toLowerCase().endsWith('.json'));
  let items = [];
  for (const jf of jsonFiles) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(outDir, jf), 'utf-8'));
      if (Array.isArray(raw)) items.push(...raw);
      else if (raw?.title || raw?.url) items.push(raw);
    } catch {}
  }
  return items;
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
