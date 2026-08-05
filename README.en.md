# NoxVerna

**A digital home for two.** A self-hosted AI companion PWA — not a chat box, but an infrastructure for a shared life.

[中文 →](README.md)

<p align="center">
<img src="docs/screens/home.png" width="170"> <img src="docs/screens/enterbase.png" width="170"> <img src="docs/screens/coread.png" width="170"> <img src="docs/screens/glimpse.png" width="170">
</p>

---

> **About this repository**
>
> This is the **technical breakdown** of NoxVerna — one document per subsystem, each covering what problem it solves, how it works, and what it costs.
> The application source is not public: it is a private project containing a great deal that means something to exactly one person.
> The parts with general value are open-sourced separately (see below).
>
> **Documentation under `docs/` is written in Chinese.** This page is a complete English overview.

---

## What it is

A fully self-hosted AI companion application: a single-file React PWA, a Node.js gateway, and six microservices on one VPS. The model layer is pluggable; all data lives on my own server and on the device.

The question it tries to answer: **if a human–AI relationship is going to persist, what infrastructure does it need?**

Most AI companion products answer "better conversation." This project's answer is that conversation is only one layer. You also need shared time, shared traces, memory that both decays and consolidates, and an emotional state that evolves and has consequences.

| | |
|---|---|
| Frontend `App.jsx` | 13,098 lines (single file) |
| Gateway `server.js` | 2,514 lines |
| Long-running services | 7 systemd units |
| Feature panels | 14 |
| Deployment | one VPS, continuously online |

---

## Technical breakdown

### Foundations

**[01 · Architecture and persistence](docs/01-architecture.md)**
Service topology, request path, why JSON files instead of a database, and the single-file frontend tradeoff. Persistence is atomic-write JSON (`write tmp → rename`) — chosen for readability, backup simplicity, and hand-repairability, at the explicit cost of concurrent writes and transactions.

**[02 · Context assembly](docs/02-context.md)**
Five layers ordered by rate of change, and a three-tier prompt cache split (**BP1 / BP2 / BP3**). Prompt caching matches on prefix, so a single changed byte in "day 31 together" would otherwise invalidate the entire persona and tool spec. Splitting them into independent cache breakpoints means BP3 churning per turn never touches BP1. A side benefit: because every panel sends a byte-identical base block first, BP1 is shared across all of them — writing a journal entry hits the cache written during chat.

**[03 · Multimodal conversation](docs/03-chat.md)**
Voice notes with server-side STT folded back into context, video frame extraction, and **`⟦IMGDESC⟧` image continuity**: on first sight the model writes a hidden scene description that persists on the message object, so three days later it still knows the dress was blue. Plus two bad-stream recovery paths.

**[04 · Agent and tool calling](docs/04-agent.md)**
Upstream relays silently discard native `function_call`, so the entire agent layer runs on a **text protocol** — the model emits `⟦TOOL name {json}⟧` on its own line. The cost is writing your own streaming parser that handles every half-emitted state. The benefit is total independence from upstream: swapping providers requires no code change.

### State and memory

**[05 · Memory integration](docs/05-memory.md)** — how the three memory tiers connect to the conversation layer.
**[06 · Pulse Garden](docs/06-pulse-garden.md)** — an 8-dimension emotional state machine with decay, a fatigue dulling coefficient, and a directive-token system with suspension and escalation.

### Modules

**[07 · Link cards](docs/07-linkcard.md)** — Threads / X / GitHub link unfurling: UI design plus full backend source.
**[08 · Telegram bridge](docs/08-telegram.md)** — capability mirroring, media handling, cross-platform persona consistency.

### Engineering

**[09 · Reliability](docs/09-reliability.md)** — the full-backup lifeboat (deleting a PWA on iOS wipes local storage, so the whole `localStorage` is snapshotted server-side; verified zero loss across a delete-and-reinstall of 3,800+ messages), upstream retries, and a usage ledger.
**[10 · Design system](docs/10-design-system.md)** — twelve-color constitution, typography, pixel icon rules, independently graded day/night grounds.
**[11 · Deployment](docs/11-deployment.md)** — build flow, service management, Safari cache strategy.

---

## Split out into their own projects

| Repository | Contents | License |
|---|---|---|
| **[isle-of-breath](https://github.com/oiio2to/isle-of-breath)** | **Isle of Breath** · a memory architecture designed to forget: a quota'd, decaying short-term forest, human-gated consolidation, then long-term storage | AGPL-3.0 |
| **[same-second](https://github.com/oiio2to/same-second)** | **Same Second** · synchronized listening: progress clock alignment, lyric pipeline, sing-along window, frontend UI | see repo |
| **[oria-design-skill](https://github.com/oiio2to/oria-design-skill)** | Design language specification | see repo |

This repository links to them rather than duplicating their content.

---

## What is deliberately not documented here

Co-reading, the social feed, the gallery, the journal, and the pixel desk pet all run in production, but they draw heavily on other people's tutorials and implementations — my work there was adaptation and frontend integration. **I don't present other people's work as my own in a technical breakdown.**

---

## License

- Code and interface: All Rights Reserved
- Documentation and screenshots: [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/)
- See [LICENSE](LICENSE)

Fonts are not redistributed by this repository and are not covered by any grant above.

---

*Built by a rabbit and a black cat. 🐇🐈‍⬛*
