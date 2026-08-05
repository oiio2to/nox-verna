# 07 · 链接小卡

> Threads / X / GitHub 链接的解析与渲染。这一章包含完整后端实现。

---

## 目标

聊天里贴一个链接，渲染成一张有标题、正文、作者头像、配图和互动数据的卡片，而不是一串裸 URL。同时把解析出的内容送进上下文——**他要真的看过你转的那条帖子**，而不是只看到一个链接。

## 统一形状

所有平台归一到同一个输出：

```js
{ ok: 1, note: { platform, title, desc, author, avatar, images[], stats{}, url } }
```

前端 `LinkCard` 只认这个形状。**加一个新平台只需要在后端多写一个 fetcher，前端一行不用改。** 这是整个模块最重要的设计决定——链接解析是那种会不断加平台的功能，接口不统一的话前端会逐渐长满分支。

---

## 三个平台的抓取策略

### GitHub

公开 API，匿名调用。速率限制 60 次/小时，个人使用完全够，**不需要配置 token**。

不带 token 还有一个好处：这段代码可以直接开源，没有凭证要摘。

### X

`x.com` 本体现在要登录才给内容，直接抓拿不到东西。

走 **fxtwitter** 的公开 JSON——这是专门为链接嵌入做的镜像服务，返回结构化数据，不需要认证。

局限是只给单条，评论区拿不到。但脉络能补：这条在回谁、引用了谁，这两个字段有，足够让模型理解上下文。

### Threads

没有公开 API，只能吃 `og:` meta 标签。

---

## 三个坑

### 坑 1 · Threads 必须用爬虫 UA

Threads 只对爬虫 UA 吐 `og:` meta。拿手机 UA 去请求，返回的是一个空壳 SPA，meta 全是占位符。

所以模块里维持两个 UA：

```js
const MUA  = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) …";
// Threads 只对爬虫 UA 吐 og: meta，拿手机 UA 去只会拿到一个空壳 SPA
const BOTUA = "Mozilla/5.0 (compatible; facebookexternalhit/1.1; +http://www.facebook.com/externalhit_uatext.php)";
```

用 `facebookexternalhit` 是因为 Threads 是 Meta 的产品，这个 UA 是它自家的抓取器，待遇最好。

### 坑 2 · HTML 实体解码的顺序

`&amp;` 必须**最后**解码，否则会把 `&amp;quot;` 提前拆成 `&quot;`，再解一次就变成了 `"`，内容被破坏。

```js
const unent = (s) => String(s || "")
  .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
  .replace(/&quot;/g,'"').replace(/&apos;/g,"'")
  .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&nbsp;/g," ")
  .replace(/&amp;/g,"&");   // ← 必须最后
```

这个 bug 表现得很隐蔽：大部分链接正常，只有正文里带引号的帖子会出现多余的转义残留。

### 坑 3 · 死帖也返回 200

帖子不存在或被墙时，Threads **照样返回 200**，页面里是一段通用招揽文案（「加入 Threads，看看大家在聊什么」之类）。

不拦掉的话，这段文案会被当成帖子正文渲染成一张卡片，看起来完全正常，只是内容是错的。

处理：拿到 `og:description` 后先判断是不是真帖。真帖的形式是 `@zuck on Threads: 正文`，有这个前缀才继续，同时把前缀剥掉只留正文。

---

## 另外两个实现细节

**`og:` 和 `twitter:` 都捞，`property` 和 `name` 两种写法都认。** 各家站点写法不统一，只认一种会漏掉相当一部分：

```js
function ogPick(html, key) {
  const pats = [
    new RegExp('<meta[^>]+(?:property|name)=["\'](?:og:|twitter:)?' + key + '["\'][^>]*content=["\']([^"\']*)["\']', "i"),
    new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:property|name)=["\'](?:og:|twitter:)?' + key + '["\']', "i"),
  ];
  for (const p of pats) { const m = html.match(p); if (m && m[1]) return m[1]; }
  return "";
}
```

两条正则是因为 `content` 属性可能在 `property` 前面也可能在后面。

**兜底 fetcher。** 三个特定平台都没命中时，走通用的 `og:` meta 抓取。大部分现代网站都有，命中率不错。

**数字缩写。** `stats` 里的互动数统一缩写：`1.2k` / `3.4M`。

---

## UI 设计

卡片遵循全局设计规范（见 [10 · 设计系统](10-design-system.md)）：

- 硬边 2px 像素边框，配偏移阴影，不用圆角柔阴影
- 平台标识用手绘像素 SVG，不用官方 logo，也不用 emoji
- 配图最多显示前 4 张，超出显示计数
- 头像方形裁切，不做圆形
- 低饱和度，卡片底色取自十二色宪法，不用平台品牌色

**没有加载骨架屏。** 解析通常在 1 秒内完成，骨架屏反而会闪一下。失败时卡片直接降级成一个带域名的朴素链接块，不显示错误。

---

## 完整源码

后端实现见 [`src/linkcard.js`](../src/linkcard.js)。

无外部依赖，Node 内置模块即可运行。挂载方式：

```js
const linkcard = require("./linkcard");
if (p === "/api/linkcard") return linkcard(req, res, u, json);
```

---

## 相关

- 卡片内容如何进上下文 → [02 · 上下文装配](02-context.md)
- 解析由哪个工具触发 → [04 · Agent 与工具调用](04-agent.md)
- 视觉规范 → [10 · 设计系统](10-design-system.md)
