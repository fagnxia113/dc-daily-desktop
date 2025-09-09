const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fse = require('fs-extra');
const { runJob } = require('./lib/job');
const { resolveBizFromUrl } = require('./lib/utils');

function getBaseDir() {
  // 绿色版：把数据放在 exe 同级目录
  try {
    const exeDir = path.dirname(app.getPath('exe'));
    return exeDir;
  } catch {
    return process.cwd();
  }
}

const baseDir = getBaseDir();
const dataDir = path.join(baseDir, 'data');
const logsDir = path.join(baseDir, 'logs');
fse.ensureDirSync(dataDir);
fse.ensureDirSync(logsDir);

const configPath = path.join(dataDir, 'config.json');
function loadConfig() {
  if (!fs.existsSync(configPath)) {
    const init = {
      bizList: [], // 保存 __biz
      keywords: {
        industry: ["数据中心","IDC","算力","智算","云计算","云原生","Kubernetes","OpenStack","GPU","服务器","机房","东数西算","PUE","双碳","算力中心","大模型","AI训练","智算中心"],
        dynamics: ["政策","意见","通知","征求意见","发布","挂牌","中标","签约","合作","落地","动工","竣工","开工","扩容","扩建","上线","发布会","报告","融资","募资","A轮","B轮","C轮","IPO","投资","并购","收购","基金","会展","峰会","大会","论坛","研讨","白皮书","蓝皮书"]
      },
      softText: ["分享","干货","教程","课程","报名","直播","招聘","岗位","招募","经验","心得","盘点","top","清单","合集","指南","技巧","方法","最佳实践","避坑","案例","复盘","活动预告","报名通道"],
      settings: {
        commandTemplate: '"{exe}" --biz {biz} --from {from} --to {to} --format json --out {out}', // 若官方 CLI 不同，可在 UI 修改
        concurrency: 3
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(init, null, 2), 'utf-8');
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
function saveConfig(cfg) { fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2)); }

function getBundledWewePath() {
  // extraResources => process.resourcesPath/wewe-rss/wewe-rss.exe
  const exe = path.join(process.resourcesPath, 'wewe-rss', 'wewe-rss.exe');
  return exe;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

// IPC
ipcMain.handle('config:get', () => loadConfig());
ipcMain.handle('config:addBizFromUrl', async (_e, url) => {
  const biz = await resolveBizFromUrl(url);
  if (!biz) throw new Error('无法从链接解析 __biz');
  const cfg = loadConfig();
  if (!cfg.bizList.includes(biz)) {
    cfg.bizList.push(biz);
    saveConfig(cfg);
  }
  return biz;
});
ipcMain.handle('config:removeBiz', (_e, biz) => {
  const cfg = loadConfig();
  cfg.bizList = cfg.bizList.filter(b => b !== biz);
  saveConfig(cfg);
  return cfg.bizList;
});

ipcMain.handle('job:run', async (_e, args) => {
  const { fromDate, toDate } = args;
  const save = await dialog.showSaveDialog({
    title: '导出 Excel 保存为',
    defaultPath: path.join(baseDir, `行业动态_${fromDate}.xlsx`),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }]
  });
  if (save.canceled) return { canceled: true };
  const cfg = loadConfig();
  const weweExe = getBundledWewePath();
  const out = await runJob({
    bizList: cfg.bizList,
    fromDate,
    toDate,
    savePath: save.filePath,
    weweExe,
    commandTemplate: cfg.settings.commandTemplate,
    keywords: cfg.keywords,
    softText: cfg.softText,
    concurrency: cfg.settings.concurrency,
    dataDir,
    logsDir
  });
  return out;
});
