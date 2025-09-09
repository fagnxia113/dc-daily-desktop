const fetch_ = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function resolveBizFromUrl(url) {
  try {
    // 先直接解析
    const u = new URL(url, "https://mp.weixin.qq.com");
    const biz = u.searchParams.get("__biz");
    if (biz) return biz;
  } catch {}

  // 如果不是长链接，尝试请求一次
  try {
    const resp = await fetch_(url, { method: "GET", redirect: "manual" });
    const loc = resp.headers.get("location") || url;
    const u2 = new URL(loc, "https://mp.weixin.qq.com");
    return u2.searchParams.get("__biz");
  } catch {
    return null;
  }
}

function ymd(d){ return d.toISOString().slice(0,10); }

module.exports = { resolveBizFromUrl, ymd };
