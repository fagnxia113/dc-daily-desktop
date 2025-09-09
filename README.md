# DC Daily Desktop (Windows 绿色版, Alpha)

手动运行，内置 wewe-rss（构建时自动下载），调用智谱 GLM 抽取“数据中心/算力/云计算”行业动态，去重后导出 Excel。

## 使用
1. 进入 Releases 页面，下载 `dc-daily-desktop_<version>_win64_portable.zip` 解压（建议英文路径）
2. 双击 App.exe 启动
3. 添加公众号：在“添加公众号”输入框粘贴该号任意文章链接（mp.weixin.qq.com/s/...），点击“解析并添加”
4. 日期范围默认“前一日 00:00–23:59, Asia/Shanghai”
5. 运行前设置环境变量（Alpha 版暂不持久化 API Key）：
   - 打开 PowerShell，运行：
     ```
     setx ZHIPU_API_KEY "你的智谱APIKey"
     ```
     关闭并重新打开 App.exe 生效
6. 点击“开始运行并导出”，选择 Excel 保存路径，等待完成

## 说明
- 无代理、无浏览器回退；仅使用内置 wewe-rss。若抓取失败条目会被跳过。
- wewe-rss 不同版本的 CLI 参数可能差异；若运行日志提示“wewe-rss 参数无效”，请修改 `data/config.json` 中的 `settings.commandTemplate`：
