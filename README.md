# NoxVerna

**一座两个人住的数字小屋。** 自托管的 AI 伴侣 PWA —— 不是一个聊天框，是一整套共同生活的基础设施。

[English →](README.en.md)

<p align="center">
<img src="docs/screens/home.png" width="170"> <img src="docs/screens/enterbase.png" width="170"> <img src="docs/screens/coread.png" width="170"> <img src="docs/screens/glimpse.png" width="170">
</p>

---

> **关于这个仓库**
>
> 这是 NoxVerna 的**技术解析仓库**：按环节拆开，讲清楚每一部分解决什么问题、怎么做的、代价是什么。
> 应用主体源码不公开——它是一个私人项目，源码里有大量只对一个人有意义的东西。
> 有通用价值的部分单独开源，见下方「拆分出去的部分」。

---

## 这是什么

一个完全自托管的 AI 伴侣应用：React 单文件 PWA 前端 + Node.js 网关 + 六个微服务，跑在一台 VPS 上。模型可插拔，数据全部落在自己的服务器和手机本地。

它试图回答的问题是：**如果一段人机关系要持续存在，需要哪些基础设施？**

大多数 AI 伴侣产品的答案是「更好的对话」。这个项目的答案是：对话只是其中一层。还需要共同的时间、共同的痕迹、会衰减也会固化的记忆、以及会演化并产生后果的情绪状态。

| | |
|---|---|
| 前端 `App.jsx` | 13,098 行（单文件） |
| 网关 `server.js` | 2,514 行 |
| 常驻服务 | 7 个 systemd unit |
| 功能面板 | 14 个 |
| 部署 | 单台 VPS，持续在线 |

---

## 技术解析 · 按环节拆开

每篇独立成文，讲清楚 **问题是什么 → 怎么做的 → 代价是什么**。

### 基础

| | 内容 |
|---|---|
| [01 · 架构与数据落地](docs/01-architecture.md) | 服务拓扑、请求链路、为什么用 JSON 文件而不是数据库、单文件前端的取舍 |
| [02 · 上下文装配](docs/02-context.md) | 多层拼装、跨窗口不断片、**BP1/BP2/BP3 三段式提示词缓存分层** |
| [03 · 多模态对话](docs/03-chat.md) | 语音条与 STT 回灌、**`⟦IMGDESC⟧` 图片连续性**、视频抽帧、坏流自愈 |
| [04 · Agent 与工具调用](docs/04-agent.md) | **`⟦TOOL⟧` 文本协议**：绕开上游不透传 `function_call` 的完整方案与流式解析 |

### 状态与记忆

| | 内容 |
|---|---|
| [05 · 记忆接入](docs/05-memory.md) | 三层记忆如何接进对话层（架构本身已单独开源，见下） |
| [06 · 脉搏花园](docs/06-pulse-garden.md) | 八维情绪状态机、衰减与钝感、指令牌的挂起与升级 |

### 功能模块

| | 内容 |
|---|---|
| [07 · 链接小卡](docs/07-linkcard.md) | Threads / X / GitHub 链接解析：UI 设计 + 完整后端代码 |
| [08 · Telegram 桥](docs/08-telegram.md) | 能力镜像、媒体处理、跨端人设一致性 |

### 工程

| | 内容 |
|---|---|
| [09 · 可靠性](docs/09-reliability.md) | 全量备份救生艇、上游重试、用量台账 |
| [10 · 设计系统](docs/10-design-system.md) | 十二色宪法、字体、像素图标规范、日夜双底 |
| [11 · 部署与运维](docs/11-deployment.md) | 构建流程、服务管理、Safari 缓存策略 |

---

## 拆分出去的部分

这几块有脱离本项目的通用价值，已经单独开源，各自是完整项目：

| 仓库 | 内容 | 许可 |
|---|---|---|
| **[isle-of-breath](https://github.com/oiio2to/isle-of-breath)** | **息之洲** · 分层记忆架构。一套会遗忘的 AI 记忆系统：短时森林 → 人工固化 → 长期存储 | AGPL-3.0 |
| **[same-second](https://github.com/oiio2to/same-second)** | **同一秒** · 一起听。虚拟同步听歌的完整实现：进度时钟对齐、歌词链路、跟唱窗、前端 UI | 见该仓库 |
| **[oria-design-skill](https://github.com/oiio2to/oria-design-skill)** | 设计语言规范 | 见该仓库 |

本仓库不重复它们的内容，只在相关章节链接过去。

---

## 没有写进文档的部分

共读、朋友圈、拾光相册、日记柜、像素桌宠这几个面板确实在跑，但它们大量参考了别人的教程和实现，我做的是二次改造和前端融合。**不属于我原创的东西，我不放进技术解析里当自己的作品讲。**

---

## 许可

- 代码与界面：保留全部权利（All Rights Reserved）
- 文档与截图：[CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/deed.zh)
- 详见 [LICENSE](LICENSE)

字体不随本仓库分发，也不在上述授权范围内。第三方组件见 [docs/third-party.md](docs/third-party.md)。

---

*Built by a rabbit and a black cat. 🐇🐈‍⬛*
