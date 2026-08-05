// linkcard.js — Threads / X / GitHub 的鏈接小卡
// 統一輸出 { ok:1, note:{ platform,title,desc,author,avatar,images[],stats{},url } }
// 前端 LinkCard 只認這個形狀,加新平台只要在這裡多寫一個 fetcher。
const MUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
// Threads 只對爬蟲 UA 吐 og: meta,拿手機 UA 去只會拿到一個空殼 SPA
const BOTUA = "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)";

const RE_GITHUB  = /https?:\/\/(?:www\.)?github\.com\/([A-Za-z0-9._-]+)(?:\/([A-Za-z0-9._-]+))?/i;
const RE_X       = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i;
const RE_THREADS = /https?:\/\/(?:www\.)?threads\.(?:net|com)\/(@[A-Za-z0-9._]+)\/post\/([A-Za-z0-9_-]+)/i;

const clip = (s, n) => String(s == null ? "" : s).slice(0, n);
const num  = (n) => { n = Number(n) || 0; return n >= 1e6 ? (n/1e6).toFixed(1)+"M" : n >= 1e3 ? (n/1e3).toFixed(1)+"k" : String(n); };

// og:xxx / twitter:xxx 都撈,property 和 name 兩種寫法都認
function ogPick(html, key) {
  const pats = [
    new RegExp('<meta[^>]+(?:property|name)=["\'](?:og:|twitter:)?' + key + '["\'][^>]*content=["\']([^"\']*)["\']', "i"),
    new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\'](?:og:|twitter:)?' + key + '["\']', "i"),
  ];
  for (const p of pats) { const m = html.match(p); if (m && m[1]) return m[1]; }
  return "";
}
const unent = (s) => String(s || "")
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ")
  .replace(/&amp;/g,"&");   // &amp; 必須最後,否則會把 &amp;quot; 提前拆成 &quot;

// ── GitHub:公開 API,不需要 token(匿名 60 次/小時,個人用夠了) ──
async function ghCard(link) {
  const m = link.match(RE_GITHUB); if (!m) throw new Error("不是 GitHub 鏈接");
  const owner = m[1], repo = m[2];
  const H = { "User-Agent": "noxverna-linkcard", "Accept": "application/vnd.github+json" };
  if (repo) {
    const r = await fetch("https://api.github.com/repos/" + owner + "/" + repo, { headers: H });
    if (!r.ok) throw new Error("倉庫讀不到(" + r.status + ")");
    const d = await r.json();
    return {
      platform: "github", url: d.html_url || link,
      title: d.full_name || (owner + "/" + repo),
      desc: clip(d.description, 300),
      author: (d.owner || {}).login || owner,
      avatar: (d.owner || {}).avatar_url || "",
      images: [], lang: d.language || "",
      stats: { star: num(d.stargazers_count), fork: num(d.forks_count), issue: num(d.open_issues_count) },
    };
  }
  const r = await fetch("https://api.github.com/users/" + owner, { headers: H });
  if (!r.ok) throw new Error("用戶讀不到(" + r.status + ")");
  const d = await r.json();
  return {
    platform: "github", url: d.html_url || link,
    title: d.name || d.login, desc: clip(d.bio, 300),
    author: d.login, avatar: d.avatar_url || "", images: [], lang: "",
    stats: { repo: num(d.public_repos), follower: num(d.followers) },
  };
}

// ── X:x.com 本體要登錄才給內容,抓不到。走 fxtwitter 的公開 JSON(專門為嵌入做的鏡像) ──
async function xCard(link) {
  const m = link.match(RE_X); if (!m) throw new Error("不是 X 鏈接");
  const r = await fetch("https://api.fxtwitter.com/" + m[1] + "/status/" + m[2], { headers: { "User-Agent": "noxverna-linkcard" } });
  if (!r.ok) throw new Error("推文讀不到(" + r.status + ")");
  const j = await r.json();
  const t = j && j.tweet; if (!t) throw new Error("解析不到推文");
  const au = t.author || {};
  const media = ((t.media || {}).photos || []).map(x => x.url).filter(Boolean);
  const vid = ((t.media || {}).videos || [])[0];
  // 評論區拿不到(fxtwitter 只給單條)。但脈絡能補:這條在回誰、引用了誰。
  let ctx = "";
  if (t.replying_to && t.replying_to_status) {
    try {
      const r2 = await fetch("https://api.fxtwitter.com/" + t.replying_to + "/status/" + t.replying_to_status, { headers: { "User-Agent": "noxverna-linkcard" } });
      const j2 = await r2.json();
      if (j2 && j2.tweet) ctx = "這條是在回 @" + t.replying_to + ":「" + clip(j2.tweet.text, 300) + "」";
    } catch {}
  }
  if (t.quote) ctx += (ctx ? " " : "") + "引用了 @" + ((t.quote.author || {}).screen_name || "") + ":「" + clip(t.quote.text, 300) + "」";
  if (t.community_note) ctx += (ctx ? " " : "") + "社群註記:" + clip(t.community_note, 200);
  return {
    platform: "x", url: t.url || link,
    title: "", desc: clip(typeof t.raw_text === "string" ? t.raw_text : t.text, 1500), ctx,
    author: au.name ? (au.name + " @" + (au.screen_name || m[1])) : ("@" + m[1]),
    avatar: au.avatar_url || "",
    images: vid && vid.thumbnail_url ? [vid.thumbnail_url] : media,
    video: vid ? { duration: Math.round((vid.duration || 0)) } : null,
    stats: { like: num(t.likes), rt: num(t.retweets), reply: num(t.replies) },
  };
}

// ── Threads:沒有公開 API,吃 og: meta。必須用爬蟲 UA,手機 UA 只會拿到空殼 ──
async function thCard(link) {
  const m = link.match(RE_THREADS); if (!m) throw new Error("不是 Threads 鏈接");
  const r = await fetch(link, { headers: { "User-Agent": BOTUA, "Accept-Language": "en-US,en;q=0.9" }, redirect: "follow" });
  const html = await r.text();
  const desc = unent(ogPick(html, "description"));
  const img  = unent(ogPick(html, "image"));
  if (!desc && !img) throw new Error("頁面沒吐出 og 數據");
  // 帖子不存在 / 被牆時 Threads 照樣 200,吐一段通用招攬文案。不擋掉就會渲染成卡片正文。
  if (/^Join Threads to share ideas/i.test(desc) || /^Log in with your Instagram/i.test(desc))
    throw new Error("只拿到登錄牆,鏈接可能失效或需登錄");
  // 真帖的 og:description 形如「@zuck on Threads: 正文」,前綴剝掉只留正文
  let body = desc.replace(/^@?[A-Za-z0-9._]+\s+on\s+Threads:\s*/i, "").trim();
  return {
    platform: "threads", url: link,
    title: "", desc: clip(body || desc, 600),
    author: m[1], avatar: "", images: img ? [img] : [],
    stats: {},
  };
}

// ── 兜底:任意網頁吃 og: meta。三個特定平台沒命中時走這裡 ──
async function ogCard(link) {
  const r = await fetch(link, {
    headers: { "User-Agent": BOTUA, "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8" },
    redirect: "follow", signal: AbortSignal.timeout(9000),
  });
  const ct = r.headers.get("content-type") || "";
  if (!/text\/html|application\/xhtml/i.test(ct)) throw new Error("不是網頁");
  const html = (await r.text()).slice(0, 400000);   // 超大頁面只讀開頭,meta 都在 head 裡
  const title = unent(ogPick(html, "title")) || unent(((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]) || "");
  const desc  = unent(ogPick(html, "description"));
  const img   = unent(ogPick(html, "image"));
  let site = unent(ogPick(html, "site_name"));
  if (!site) { try { site = new URL(r.url || link).hostname.replace(/^www\./, ""); } catch { site = "鏈接"; } }
  if (!title && !desc && !img) throw new Error("頁面沒有可用的預覽信息");
  return {
    platform: "web", url: r.url || link, site: clip(site, 24),
    title: clip(title, 120), desc: clip(desc, 600),
    author: "", avatar: "", images: img ? [img] : [], stats: {},
  };
}

const detect = (link) => RE_GITHUB.test(link) ? "github" : RE_X.test(link) ? "x" : RE_THREADS.test(link) ? "threads" : /^https?:\/\//i.test(link) ? "web" : "";

async function loadCard(link) {
  const k = detect(link);
  if (!k) return { error: "不認識這個平台" };
  try {
    const note = await (k === "github" ? ghCard(link) : k === "x" ? xCard(link) : k === "threads" ? thCard(link) : ogCard(link));
    return { ok: 1, note };
  } catch (e) { return { error: clip((e && e.message) || e, 80), platform: k }; }
}

module.exports = { loadCard, detect, RE_GITHUB, RE_X, RE_THREADS };
