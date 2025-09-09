const fetch_ = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function resolveBizFromUrl(url) {
  // 不跟随跳转，拿 302 Location 中的长链，再读 __biz
  const resp = await fetch_(url, { method: 'GET', redirect: 'manual' });
  let loc = resp.headers.get('location');
  if (!loc) {
    // 有些链接直接是长链
    loc = url;
  }
  const u = new URL(loc, 'https://mp.weixin.qq.com');
  const biz = u.searchParams.get('__biz');
  return biz;
}

function ymd(d){ return d.toISOString().slice(0,10); }

module.exports = { resolveBizFromUrl, ymd };
