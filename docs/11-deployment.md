# 11 · 部署与运维

> 单机部署，没有 CI，没有容器。这一章讲实际怎么改、怎么发、以及三个踩过的运维坑。

---

## 构建与发布

前端：

```bash
cd /path/to/app
npm run build          # Vite 构建到 dist/
```

Nginx 直接指向 `dist/`。没有 CDN，没有构建产物版本管理。

网关与微服务：

```bash
node --check server.js && systemctl restart <service> && \
  sleep 1 && systemctl is-active <service>
```

**语法检查必须在重启之前。** 这是最容易省掉也最不该省的一步——一个拼写错误配上直接重启，结果是服务起不来，而你已经关掉终端了。

---

## 编辑模式：断言唯一匹配

前端主文件约 7,100 行（拆分历史见 [01](01-architecture.md)），加上 `lib/` 和 `components/` 里的模块。改动不靠 IDE 重构，靠精确字符串替换——这个模式在文件还是 13,000+ 行时尤其关键，也正是它最终触发拆分的原因。

每次替换前断言匹配数唯一：

```python
def rep(old, new):
    global s
    assert s.count(old) == 1, f"匹配数 {s.count(old)}，期望 1"
    s = s.replace(old, new)
```

`assert` 在写入之前执行。锚点漂移（代码改过、缩进变了、有第二处相同片段）会立刻失败，而不是默默改错地方。

这个模式的价值在大文件里被放大：13,000 行里改错一处，可能几天后才发现。

读取时统一用 `errors='surrogateescape'`，避免非 UTF-8 字节导致整个脚本崩掉。

---

## 三个运维坑

### 坑 1 · Safari 缓存极其顽固

**同名文件更新等于没更新。** Safari 会长期使用缓存版本，强制刷新也不一定管用。

处理规则：

- 任何新版本的 HTML 或静态资源，**换新文件名**，不覆盖旧的
- 每次静态资源变更，**必须递增 Service Worker 的缓存版本号**

第二条如果忘了，用户会停留在旧版本，且完全无感——应用正常运行，只是不是最新的。这个问题的排查成本极高，因为你自己的设备可能恰好刷新过。

配套的一条约定：**版本化文件永不覆盖。** `v1` / `v2` / `v3` 各自独立，改 `v3` 就是新建 `v4`。

### 坑 2 · `pkill` 会杀掉自己

`pkill -f "pattern"` 会匹配到执行这条命令的 shell 自身，导致命令还没生效进程就没了。

用方括号规避：

```bash
pkill -f "[p]attern"
```

正则 `[p]attern` 匹配 `pattern`，但不匹配命令行里的字面量 `[p]attern`。

另外：`pkill` 和随后的启动命令要分开执行。放在同一条命令里，进程还没完全退出新的就起来了，会撞端口。

### 坑 3 · 字体不子集化会拖垮首屏

完整的中文字体动辄几 MB。汇文明朝体全量嵌入会让首屏加载不可用。

必须子集化：

```bash
pyftsubset input.ttf --flavor=woff2 --layout-features='' \
  --unicodes-file=used-chars.txt --output-file=out.woff2
```

`--layout-features=''` 清空 OpenType 特性——中文场景用不上连字、花体这些，留着体积会大很多。

---

## 后台任务

长任务用 `nohup` 起，日志落文件，后续轮询：

```bash
nohup node script.mjs > run.log 2>&1 &
```

不用 `screen` 或 `tmux`，因为多数运维动作是通过工具调用发起的（见 [04](04-agent.md)），交互式终端派不上用场。

定时任务走 cron：日观察、朋友圈发帖、共读回批、森林推手、备份快照。

---

## 大文件传输

工具调用的载荷有大小限制，直接传大文件会失败。流程是：

1. gzip + base64
2. 切成小块
3. 逐块追加
4. **`md5sum` 校验后再使用**

第 4 步不能省。base64 少一个字符不会报错，只会在解压时给出一个语焉不详的错误，或者更糟——解出一个损坏但看起来正常的文件。

---

## 目录约定

```
app/            前端源码，构建产物在 dist/
gateway/        网关与微服务
  data/         全部状态（JSON + 媒体）
  data/backups/ 快照
```

备份就是 `tar` 整个 `data/`。这是用文件当数据库的主要收益之一（见 [01](01-architecture.md)）。
