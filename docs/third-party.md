# 第三方组件与许可 · Third-Party Components

本项目使用以下第三方软件与服务，各自受其许可证约束。本仓库不重新分发其中任何组件。

*The following third-party software and services are used under their own licenses. None are redistributed by this repository.*

---

## 运行时依赖 · Runtime

| 组件 | 用途 | 许可 |
|---|---|---|
| React 19 | 前端框架 | MIT |
| Vite | 构建工具 | MIT |
| Node.js | 网关与微服务运行时 | MIT |
| Nginx | 反向代理与静态服务 | BSD-2-Clause |
| ffmpeg | 视频抽帧、音频转码 | LGPL / GPL（取决于构建配置） |

## 记忆层 · Memory

| 组件 | 用途 | 许可 |
|---|---|---|
| [Ombre Brain](https://github.com/P0luz/Ombre-Brain) by P0lar1zzZ | 外置长期记忆 MCP 服务 | MIT |

息之洲（`isle-of-breath`）为本项目自行实现，不含 Ombre Brain 代码。

## 外部服务 · External services

| 服务 | 用途 |
|---|---|
| iTunes Search API | 歌曲元数据 |
| lrclib | 歌词 |
| fxtwitter | X 帖子公开 JSON 镜像（链接小卡） |
| GitHub REST API | 仓库信息（链接小卡，匿名调用） |
| Telegram Bot API | 跨端桥接 |

模型推理、语音合成与语音识别通过可配置的第三方接口完成，具体服务商不在本仓库记录。

## 字体 · Fonts

**字体文件不随本仓库分发，也不在本仓库任何授权范围内。**

设计系统中引用的字体（汇文明朝体、MysteryTypewriter、IM Fell English 等）各自有独立授权条款。复现本设计者需自行确认并取得相应授权。

*Font files are not redistributed here and are not covered by any grant in this repository. Anyone reproducing this design must obtain their own font licenses.*

---

如发现遗漏的第三方组件署名，请开 issue 指出。

*If an attribution is missing, please open an issue.*
