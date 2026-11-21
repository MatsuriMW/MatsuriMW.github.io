// Trello 式功能路线图与心愿单（嵌入 /portfolio/journal-workflow/#wishlist，支持中英文自动检测与手动切换）
(() => {
  const root = document.getElementById("wishlist-app");
  if (!root) return;

  // Support legacy #whistlist typo in external links
  if (location.hash === "#whistlist") {
    history.replaceState(null, "", "#wishlist");
  }

  const LANG_KEY = "matsuri_jw_lang";
  function detectInitialLang() {
    try {
      const u = new URL(location.href);
      const q = u.searchParams.get("lang");
      if (q === "en" || q === "zh") return q;
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === "en" || saved === "zh") return saved;
    } catch {}
    const nav = (navigator.language || (navigator.languages && navigator.languages[0]) || "zh").toLowerCase();
    return nav.startsWith("zh") ? "zh" : "en";
  }

  let lang = detectInitialLang();
  const isEn = () => lang === "en";

  const API = "/api/wishlist";
  const AREAS = [
    { id: "Agent Deck", zh: "Agent Deck", en: "Agent Deck", cls: "is-deck" },
    { id: "螺旋日程", zh: "螺旋日程", en: "Nautilus Spiral", cls: "is-spiral" },
    { id: "双插件联动", zh: "双插件联动", en: "Dual-Plugin Sync", cls: "is-link" },
    { id: "macOS 菜单栏", zh: "macOS 菜单栏", en: "macOS Menu Bar", cls: "is-mac" },
  ];
  const AREA_CLS = Object.fromEntries(AREAS.map((a) => [a.id, a.cls]));
  const AREA_EN = Object.fromEntries(AREAS.map((a) => [a.id, a.en]));
  const areaLabel = (id) => (isEn() ? AREA_EN[id] || id : id || "Agent Deck");

  const COLUMNS = [
    { id: "pending", zhTitle: "TODO", enTitle: "TODO", zhSub: "待评估 · 新提交进这里", enSub: "Triaging · New ideas land here", cls: "is-pending" },
    { id: "planned", zhTitle: "计划中", enTitle: "Planned", zhSub: "已确认排期", enSub: "Scheduled on roadmap", cls: "is-planned" },
    { id: "in_progress", zhTitle: "开发中", enTitle: "In Progress", zhSub: "正在推进", enSub: "Actively building", cls: "is-progress" },
    { id: "done", zhTitle: "已上线", enTitle: "Shipped", zhSub: "已完成发布", enSub: "Released", cls: "is-done" },
  ];
  const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c]));
  const colTitle = (c) => (isEn() ? c.enTitle : c.zhTitle);
  const colSub = (c) => (isEn() ? c.enSub : c.zhSub);

  const UI = {
    zh: {
      allAreas: "全部模块",
      sortTop: "最热投票",
      sortNew: "最新提交",
      addMain: "+ 提功能建议（进入 TODO）",
      addCol: "+ 添加一张功能卡片",
      emptyPending: "还没有新提议，点下方添加第一张卡片",
      emptyCol: "暂无卡片",
      composeTitle: "提一个功能建议",
      composeBadge: "提交后进入 TODO 列",
      titlePh: "一句话标题（比如：支持一键把会话摘要导出成周报）",
      areaAria: "所属模块",
      descPh: "补充使用场景或痛点（选填，最多 1200 字；也可以直接 Ctrl/⌘+V 粘贴截图）",
      pickBtn: "上传截图",
      uploadHint: "可选，最多 2 张；支持拖拽或粘贴截图，自动压缩",
      authorPh: "昵称（选填，默认匿名）",
      contactPh: "联系方式（选填，微信 / 邮箱 / GitHub，仅作者可见）",
      contactLabel: "联系方式：",
      contactEmpty: "未填写",
      contactBadge: "留有联系",
      copyBtn: "复制",
      copied: "已复制",
      collapseHead: "收起抬头",
      expandHead: "展开抬头",
      boardLeft: "TODO · 计划中",
      boardRight: "开发中 · 已上线",
      boardSwipeHint: "← 横向滑动切换列 →",
      submitBtn: "提交到 TODO",
      submitting: "正在提交…",
      submitted: "已提交到 TODO 列！",
      titleShort: "标题至少写 2 个字",
      compressing: "正在压缩截图…",
      maxImgs: "每次最多上传 2 张截图",
      imgErr: "处理截图失败",
      imgTooBig: "图片太大，请换一张小一点的截图",
      voteFail: "投票失败，请稍后重试",
      votedTitle: "已投票（每人限投一次）",
      anon: "匿名用户",
      anonShort: "匿名",
      authorReply: "作者回复：",
      replyShort: "回复：",
      replyBtn: "回复",
      editReplyBtn: "改回复",
      sendReply: "发送",
      clearReply: "清空",
      replyPh: "输入作者回复（回车发送，Esc 取消）",
      adminLogin: "作者管理",
      adminLogout: "退出管理",
      adminPrompt: "输入管理员口令（WISHLIST_ADMIN_TOKEN）：",
      syncing: "正在同步最新数据…",
      loading: "正在加载 Roadmap…",
      slowNet: "网络较慢，先展示内置路线图，仍在后台同步最新投票…",
      offlineNet: "暂时连不上实时服务器，当前显示缓存路线图（仍可直接提建议）",
      retry: "重试",
      close: "关闭",
    },
    en: {
      allAreas: "All Modules",
      sortTop: "Most Voted",
      sortNew: "Newest",
      addMain: "+ Suggest a Feature (to TODO)",
      addCol: "+ Add a feature card",
      emptyPending: "No new proposals yet — click below to add the first card",
      emptyCol: "No cards yet",
      composeTitle: "Suggest a Feature",
      composeBadge: "Goes to TODO column",
      titlePh: "One-line title (e.g., Export weekly summary from session records)",
      areaAria: "Module",
      descPh: "Describe your use case or workflow friction (optional, up to 1200 chars; paste screenshots with Ctrl/⌘+V)",
      pickBtn: "Upload Screenshot",
      uploadHint: "Optional, up to 2 images; drag & drop or paste from clipboard",
      authorPh: "Nickname (optional, default Anonymous)",
      contactPh: "Contact (optional, email / Discord / GitHub — maintainer only)",
      contactLabel: "Contact: ",
      contactEmpty: "Not provided",
      contactBadge: "Contact",
      copyBtn: "Copy",
      copied: "Copied",
      collapseHead: "Collapse header",
      expandHead: "Expand header",
      boardLeft: "TODO · Planned",
      boardRight: "In Progress · Shipped",
      boardSwipeHint: "← Scroll horizontally →",
      submitBtn: "Submit to TODO",
      submitting: "Submitting…",
      submitted: "Submitted to TODO!",
      titleShort: "Title must be at least 2 characters",
      compressing: "Compressing screenshot…",
      maxImgs: "Up to 2 screenshots per submission",
      imgErr: "Failed to process image",
      imgTooBig: "Image is too large, please try a smaller screenshot",
      voteFail: "Vote failed, please try again",
      votedTitle: "Already voted (one vote per person)",
      anon: "Anonymous",
      anonShort: "Anon",
      authorReply: "Maintainer reply: ",
      replyShort: "Reply: ",
      replyBtn: "Reply",
      editReplyBtn: "Edit reply",
      sendReply: "Send",
      clearReply: "Clear",
      replyPh: "Write a reply (Enter to send, Esc to cancel)",
      adminLogin: "Maintainer",
      adminLogout: "Sign out",
      adminPrompt: "Enter admin token (WISHLIST_ADMIN_TOKEN):",
      syncing: "Syncing latest roadmap…",
      loading: "Loading Roadmap…",
      slowNet: "Slow connection — showing built-in roadmap while syncing live votes…",
      offlineNet: "Offline mode — showing cached roadmap (you can still submit ideas)",
      retry: "Retry",
      close: "Close",
    },
  };
  const t = (k) => UI[lang][k] || UI.zh[k];

  const QUICK_REPLIES = [
    { id: "ack", zhLabel: "收到", enLabel: "Received", zhText: "收到，感谢建议！", enText: "Received, thanks for the suggestion!", status: null, card: true },
    { id: "planned", zhLabel: "已排期", enLabel: "Planned", zhText: "收到，已加入后续排期。", enText: "Added to the roadmap.", status: "planned", card: true },
    { id: "progress", zhLabel: "开发中", enLabel: "In Progress", zhText: "正在开发中。", enText: "Actively working on this.", status: "in_progress", card: true },
    { id: "done", zhLabel: "已完成", enLabel: "Done", zhText: "已完成，已在最新版本上线！", enText: "Done! Shipped in the latest release.", status: "done", card: true },
    { id: "later", zhLabel: "暂不计划", enLabel: "Not Planned", zhText: "收到，暂不计划实现，先记录备查。", enText: "Noted, not planned for now.", status: null, card: false },
  ];
  const qrLabel = (q) => (isEn() ? q.enLabel : q.zhLabel);
  const qrText = (q) => (isEn() ? q.enText : q.zhText);

  // English translations for known seed & community items (by id)
  const EN_CARDS = {
    ad0000000105: [
      "Harness Auto-Detection, Paragraph Delegation, Outer-Rail Pomodoro & A/B/C Menu (v1.13.1–v1.13.11 / v2.5–v2.6)",
      "Agent Deck ships local harness auto-detection, QwenWork 2.x & Hermes tracking, cursor-following paragraph delegation, editor/4-view right-click delegation, Windows 3-OS CI, and Dream privacy filtering; Nautilus Spiral ships outer-rail Pomodoro (15m/25m/custom), Up Next A/B/C priority menu, and bilingual macOS widgets.",
    ],
    ad0000000101: [
      "M1.1 Unified Context Kernel, Privacy Gate & Zero Silent Loss (v1.13.0)",
      "Consolidate ancestor chains, wikilinks, memory selection, skill paths, and Q&A threads into a single ContextBundle pipeline; list file-path pointers for 4th+ linked notes instead of silently truncating, warn on broken anchors, read unsaved editor buffers first, and enforce private: true gates, permission guardrails, and trace diagnostics.",
    ],
    ad0000000102: [
      "M1.2 Structural Metadata, Anchor Hash Verification & Pre-Dispatch Preview",
      "Extract key note metadata (type / def / domain / father / status), verify soft/hard anchor hashes against drift, surface 1-hop structural neighbors with human-readable why signals, and add a collapsible context preview & per-item toggle list inside the delegation confirmation modal.",
    ],
    ad0000000103: [
      "M1.3 External Context Engine: Pure Node CLI + stdio Vault Context MCP",
      "Decouple the context kernel from Obsidian APIs to expose vault_outline, vault_read, vault_related, and vault_find alongside memory_search / read / recent over stdio MCP and CLI for any external agent.",
    ],
    ad0000000104: [
      "M0 Memory Store, Dispatch Drafts, Reply Inbox & Project-Folder Dispatch (v1.11.0–v1.12.2)",
      "Per-note Markdown memory store (Base table / 3-column board / review modal / source re-anchoring) and memory-query.mjs CLI; dispatch drafts & payload snapshots, Q&A reply protocol & non-modal Reply Inbox, project-folder dispatch (with Codex project grouping), and By-status view in Now.",
    ],
    ad0000000001: [
      "4-View Switcher for AI Record Blocks (Outline / Table / Cards / Timeline) (v1.10.0)",
      "Switch any AI record parent block between Outline, Table, Cards, and Timeline views inline with per-block persistence, without altering underlying Markdown.",
    ],
    ad0000000002: [
      "Expanded Agent & Terminal Matrix (Kimi / MiniMax / ZCode / Muse / Pi)",
      "Hermes Agent, QwenWork 2.x, and Grok Bot (Sand) tracking are live; expanding support to Kimi Code, ZCode, MiniMax Code, Muse, Pi, and more terminals (Ghostty / WezTerm / Kitty / Alacritty / cmux).",
    ],
    ad0000000003: [
      "Full Windows Compatibility & Verification",
      "v1.13.1–v1.13.6 shipped cross-platform SQLite, Windows .cmd/.bat CLI wrapping & process-tree cleanup with 3-OS CI pass and non-macOS UI cleanup; continuing desktop window handoff & real-machine verification.",
    ],
    ad0000000005: [
      "Behavioral Analytics & Review Feedback Loop",
      "Combine daily spiral trajectories, DOING active durations, and interruption snapshots to analyze focus patterns and postponement habits.",
    ],
    ad0000000006: [
      "Cursor Desktop (3.30.14+) Session Tracking (v1.9.8)",
      "Read-only tracking of Cursor Desktop conversation turns, tool activity, and status write-backs via Hooks and incremental scanning.",
    ],
    ad0000000007: [
      "Project Prefix for AI Records & Collapsible Recent Sessions (v1.9.8)",
      "Auto-logged titles use 'Project -> Title'; Recent Sessions supports 7/30/120-day windows, per-agent stacking, and viewport anchoring.",
    ],
    ad0000000008: [
      "Auto-Routing Background Answers >500 Chars & Streamlined 5-Tab Settings (v1.9.8)",
      "Background answers under 500 chars write inline while longer replies save full notes to Agent Deck/Answers/; settings consolidated into 5 tabs.",
    ],
    ad0000000009: [
      "Obsidian Idle CPU Optimization & Focus Counter",
      "Pause background loop animations to reduce idle power usage; switch Chrome bookmarks to manual sync and add foreground app focus counters.",
    ],
    ad000000000a: [
      "Clickable Short Links in Summaries & Unified Token Display (v1.9.7)",
      "Fold long URLs and file paths in summaries into clickable [🔗](url) links and unify token accounting with Nautilus Spiral.",
    ],
    ad000000000b: [
      "AI Collaboration Review Dashboard (v1.9.6)",
      "GitHub-style daily token heatmap, 24-hour concurrency rhythm, model breakdown, and project leaderboard with source block jump.",
    ],
    ad000000000c: [
      "OpenCode / Qoder Delegation, Archiving & Structured Summaries (v1.9.3–v1.9.6)",
      "Desktop tracking and background delegation for OpenCode and Qoder, archiving full transcripts to Conversations with structured summaries.",
    ],
    ad000000000d: [
      "Streamlined Execution & Antigravity / DSH Log Support (v2.3.0–v2.4.0)",
      "Read Antigravity and DSH session logs; remove redundant focus dialogs and default global hotkeys in 2.4.0 in favor of Agent Deck.",
    ],
    afbb50626f33: [
      "In-Place Fractal Boards & Multi-Agent Project Workbench (v1.10.0–v1.10.5)",
      "Toggle any parent task into a 2D board with By-status / By-group columns, recursive Zoom breadcrumbs, mirror cards, drag-and-drop, pinning, bulk actions, and Markdown card rendering; Project Workbench adds team presets, Copilot task decomposition, concurrent dispatch, and Steward wave wrap-up.",
    ],
    d0e3b04d1404: [
      "Outline Multi-Select, Group Rows & Bulk Status Switch (v1.10.3)",
      "Bulk-change task statuses across drag selections or multi-cursors in a single undo step; ⌥⌘↓ groups selected AI records under a new parent block, ⌥⌘↑ jumps to parent.",
    ],
    "6806931cd2c1": [
      "Auto-Journaling On by Default, Daily Note Creation & 10-Round Initial Window (v1.10.4)",
      "Auto-journaling enabled by default with 30s polling; auto-creates missing daily notes from templates; caps first-time session backfill to 10 rounds; Logseq-style keyword colors & icons.",
    ],
    "4de8acf9c1c7": ["Direct Delegation to Claude Desktop App", ""],
    "2dd4f4d72226": ["Support MiniMax Code Desktop Client & CLI", ""],
    b2d325ffa557: [
      "Track Sessions from Cindy Multi-Agent App",
      "https://github.com/makecindy/cindy — Cindy aggregates terminal agents in one app; would love Agent Deck to track conversation records from Cindy.",
    ],
    c7d6705feee6: [
      "Obsidian Copilot / Claudian Session Tracking, Delegation & Write-Back",
      "Track and delegate tasks to in-vault assistants like Obsidian Copilot or Claudian, binding sidebar conversations back to journal tasks.",
    ],
    "0cd667f704ab": ["Standalone Ready-to-Use Desktop Client", ""],
    "0c0a40ce1aa1": ["Add Multi-Language Support (Traditional Chinese, etc.)", ""],
    c4d52a0222d5: ["Auto-Detect Installed Agents & Allow Omitting Model Override", ""],
  };

  function itemTitle(it) {
    if (isEn()) return it.titleEn || (EN_CARDS[it.id] && EN_CARDS[it.id][0]) || it.title;
    return it.title;
  }
  function itemDesc(it) {
    if (isEn()) return it.descEn || (EN_CARDS[it.id] && EN_CARDS[it.id][1]) || it.desc;
    return it.desc;
  }
  function itemAuthor(it, short = false) {
    const a = it.author || "";
    if (!a || a === "匿名用户" || a === "匿名") return short ? t("anonShort") : t("anon");
    if (isEn() && a === "马自立") return "Matsuri";
    return a;
  }

  function getVoterId() {
    const key = "matsuri_wl_voter";
    try {
      let v = localStorage.getItem(key);
      if (v && /^[a-zA-Z0-9_-]{8,64}$/.test(v)) return v;
      const bytes = new Uint8Array(12);
      crypto.getRandomValues(bytes);
      v = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      localStorage.setItem(key, v);
      return v;
    } catch {
      return "anon_" + Math.random().toString(36).slice(2, 12);
    }
  }

  const CACHE_KEY = "matsuri_wl_cache_v2";
  const FALLBACK_ITEMS = [
    ["ad0000000105", "done", "双插件联动", "Harness 自动探测、段落右键委派、螺旋外沿番茄钟与 A/B/C 菜单（v1.13.1–v1.13.11 / v2.5–v2.6）", "Agent Deck 上线本机 Harness 自动探测、千问办公 2.x 与 Hermes 追踪、光标跟随段落委派箭头、编辑器与四视图右键委派（CLI 默认短写法）、Windows CLI 三端 CI 与 Dream 私密过滤；螺旋日程上线外沿轻量化番茄钟（15m/25m/自定义）、接下来 A/B/C 重要程度右键菜单与中英双语 macOS 小组件。", "2026-11-21T12:50:00.000Z"],
    ["ad0000000101", "done", "Agent Deck", "M1.1 上下文内核收口、隐私闸门与零静默丢失（v1.13.0）", "将祖先链、双链解析、记忆挑选、技能卡路径与问答回灌收口为单一 ContextBundle 管道；第 4 篇起双链显式列出绝对路径指针而非静默截断，坏 #^blockId / #标题 显式告警，优先读取未落盘编辑器缓冲，并加入 private: true / 排除目录隐私闸门、高危权限护栏与 Trace 脱敏诊断。", "2026-11-18T11:30:00.000Z"],
    ["ad0000000102", "planned", "Agent Deck", "M1.2 结构保真、锚点漂移校验与派发前透明预览", "提取笔记核心属性摘要（type / def / domain / father / status），为引用块建立软/硬锚点 sha256 漂移校验，提供带 why 信号的一跳结构邻居，并在委派确认框内提供可展开勾选的轻量上下文预览清单。", "2026-11-18T11:20:00.000Z"],
    ["ad0000000103", "planned", "Agent Deck", "M1.3 对外供给引擎：纯 Node CLI + stdio Vault Context MCP Server", "剥离 Obsidian API 的纯 Node 内核，除 memory_search / read / recent 外新增 vault_outline / vault_read / vault_related / vault_find 库级只读工具集，供 Claude Code、Codex、DSH、OpenCode 等任意客户端按需调用。", "2026-11-18T11:10:00.000Z"],
    ["ad0000000104", "done", "Agent Deck", "M0 记忆库（一文一条）、派发草稿、回复信箱与按项目目录派发（v1.11.0–v1.12.2）", "上线一文一条记忆库（Base 表格 / 三列看板 / 逐条审阅 / 来源重锚定）与 memory-query.mjs CLI；支持派发草稿与载荷快照、❓/✍️ 回复协议与非模态回复信箱、按项目目录派发（Codex 自动归组项目）及侧栏「现在」按状态视图。", "2026-11-18T10:50:00.000Z"],
    ["ad0000000001", "done", "Agent Deck", "AI 记录母块四视图切换（大纲 / 表格 / 卡片 / 时间线）（v1.10.0）", "AI 自动记录母块尾部是视图切换入口，支持大纲、表格、卡片、时间线四种展示并记住每个块的偏好，不改写底层 Markdown。", "2026-11-15T09:50:00.000Z"],
    ["ad0000000002", "planned", "Agent Deck", "更多 Agent 与终端生态扩展（Kimi / MiniMax / ZCode / Muse / Pi）", "Hermes Agent、千问办公（QwenWork 2.x）与 Grok Bot（Sand）追踪均已上线；持续接入 Kimi Code、ZCode、MiniMax Code、Muse、Pi 与更多终端（Ghostty / WezTerm / Kitty / Alacritty / cmux）。", "2026-11-15T09:40:00.000Z"],
    ["ad0000000003", "in_progress", "Agent Deck", "Windows 端完整适配", "v1.13.1–v1.13.6 已完成跨平台 SQLite、Windows .cmd/.bat CLI 包装脚本与进程树清理并跑通三端 CI，且在非 macOS 端自动隐藏菜单栏入口；持续补齐 Windows 桌面窗口联动与真机实测。", "2026-11-15T09:30:00.000Z"],
    ["ad0000000005", "planned", "螺旋日程", "行为数据分析与反馈闭环", "结合每日螺旋轨迹、DOING 用时记录与中断快照，统计专注分布与延期规律并给出复盘反馈。", "2026-11-15T09:10:00.000Z"],
    ["ad0000000006", "done", "Agent Deck", "Cursor 桌面端（3.30.14+）会话追踪（v1.9.8）", "基于 Cursor 桌面端 Hooks 与增量扫描只读追踪对话轮次、工具活动与状态回写。", "2026-11-15T11:40:00.000Z"],
    ["ad0000000007", "done", "Agent Deck", "AI 记录项目名前缀与「最近的会话」折叠改版（v1.9.8）", "自动记录标题统一为「项目名 -> 标题」；最近的会话支持 7/30/120 天窗口、按 Agent 默认叠放和视口锚定。", "2026-11-15T11:30:00.000Z"],
    ["ad0000000008", "done", "Agent Deck", "后台长回答 500 字自动分流与设置页精简（v1.9.8）", "普通结论默认约 350 字，超过 500 字的后台回答沉淀到 Agent Deck/Answers/；设置页收拢为 5 页。", "2026-11-15T11:20:00.000Z"],
    ["ad0000000009", "in_progress", "螺旋日程", "Obsidian 空闲性能优化与专注计数", "后台暂停循环动画并取消 DOING 旋转，降低空闲功耗；Chrome 书签改手动同步，补充前台 App 专注计数与中断快照。", "2026-11-15T11:10:00.000Z"],
    ["ad000000000a", "done", "Agent Deck", "摘要链接可点击与 token 显示兼容（v1.9.7）", "任务与结论摘要里的长网址与文件路径改为可点击 [🔗](完整地址)；补全并协调与螺旋日程的 token 显示口径。", "2026-11-15T10:40:00.000Z"],
    ["ad000000000b", "done", "Agent Deck", "AI 协作回顾 Dashboard（v1.9.6）", "上线 GitHub 风格每日 token 热力图与项目投入排行，支持 7/30/90 天及自定义区间汇总、回溯来源日记块与原会话。", "2026-11-15T10:30:00.000Z"],
    ["ad000000000c", "done", "Agent Deck", "OpenCode / Qoder 委派归档与三段式总结（v1.9.3–v1.9.6）", "打通 OpenCode 与 Qoder 桌面追踪及后台委派；完整原文归档到 Conversations，总结模型提炼“结论、改动、未完成”。", "2026-11-14T18:00:00.000Z"],
    ["ad000000000d", "done", "螺旋日程", "精简执行入口与 Antigravity / DSH 日志（v2.3.0–v2.4.0）", "支持读取 Antigravity 与 DSH 会话日志；2.4.0 移除冗余专注弹窗与全局预设快捷键，把常用快捷键优先让给 Agent Deck。", "2026-11-14T16:00:00.000Z"],
    ["afbb50626f33", "done", "Agent Deck", "原地分形看板与多 Agent 协作工作台（v1.10.0–v1.10.5）", "父块原地切换看板，支持按状态/子组列、Zoom 面包屑、镜像卡、跨列拖拽与列内排序、pin、多选批量状态/置顶/删除、列高收敛、Markdown 卡面与右键菜单；项目工作台提供小队预设、Copilot 拆解、并发派发与 Steward 波次收口。", "2026-11-16T15:45:00.000Z"],
    ["d0e3b04d1404", "done", "Agent Deck", "大纲多选、合并成组与批量改状态（v1.10.3）", "拖拽框选、跨层选区与多光标都能一次改任务状态；⌥⌘↓ 把选中记录合并成组，⌥⌘↑ 跳到母块；整批单步撤销，AI 条目人工锁定照常。", "2026-11-16T15:30:00.000Z"],
    ["6806931cd2c1", "done", "Agent Deck", "自动记录默认开启、缺日记自动创建与首次只补 10 轮（v1.10.4）", "自动会话记录默认开启、扫描间隔 30 秒；当天日记不存在时按模板创建；首次接入某个会话只补最近 10 轮；任务关键词配色与图标支持 TODOseq 让位。", "2026-11-16T15:15:00.000Z"],
  ].map(([id, status, area, title, desc, createdAt]) => ({
    id, status, area, title, desc, author: "马自立", authorNote: "", images: [], votes: 0, voted: false, createdAt, updatedAt: createdAt,
  }));

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data?.items) && data.items.length ? data.items : null;
    } catch {
      return null;
    }
  }
  function writeCache(list) {
    try {
      const safe = list.map(({ contact: _c, ...pub }) => pub);
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), items: safe }));
    } catch {}
  }

  async function fetchJson(url, opts = {}, timeoutMs = 8000) {
    const ac = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ac ? setTimeout(() => ac.abort(), timeoutMs) : null;
    try {
      const r = await fetch(url, { ...opts, signal: ac ? ac.signal : opts.signal });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        const err = new Error(data.error || `Request failed (${r.status})`);
        err.status = r.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (e?.name === "AbortError") throw new Error(isEn() ? "Request timed out, please check your connection" : "网络请求超时，请检查连接后重试");
      throw e;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  let adminToken = "";
  try {
    adminToken = sessionStorage.getItem("matsuri_wl_admin") || "";
  } catch {}

  async function fetchListWithRetry(attempts = 3) {
    const url = `${API}?voterId=${encodeURIComponent(voterId)}`;
    const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : undefined;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fetchJson(url, { cache: "no-store", headers }, i === 0 ? 6000 : 8000);
      } catch (e) {
        const retriable = e.status == null || e.status >= 500;
        if (!retriable || i === attempts - 1) throw e;
        await new Promise((res) => setTimeout(res, 350 * (i + 1)));
      }
    }
  }

  const voterId = getVoterId();
  let inflightInit = fetchListWithRetry();
  let items = readCache() || [];
  let hasLiveSync = false;
  let userScrolled = false;
  for (const ev of ["wheel", "touchmove"]) {
    window.addEventListener(ev, () => { userScrolled = true; }, { passive: true, once: true });
  }
  window.addEventListener("keydown", (e) => {
    if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) {
      userScrolled = true;
    }
  }, { passive: true });
  let filterArea = "all";
  let sortMode = "top";
  let pendingImages = [];
  let activeItem = null;

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  const fmtTime = (iso) => {
    try {
      const d = new Date(iso);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  async function compressImage(file) {
    if (file.type === "image/gif" && file.size <= 500 * 1024) {
      return await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = () => reject(new Error(t("imgErr")));
        r.readAsDataURL(file);
      });
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error(t("imgErr")));
        i.src = url;
      });
      const maxEdge = 1400;
      const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      for (const [mime, q] of [
        ["image/webp", 0.82],
        ["image/webp", 0.65],
        ["image/jpeg", 0.82],
        ["image/jpeg", 0.62],
      ]) {
        const dataUrl = canvas.toDataURL(mime, q);
        if (dataUrl.startsWith(`data:${mime}`) && dataUrl.length * 0.75 <= 550 * 1024) {
          return dataUrl;
        }
      }
      throw new Error(t("imgTooBig"));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---------- Skeleton ----------
  root.innerHTML = "";

  // Collapsible Wishlist Header (sec-head + toolbar)
  const HEAD_KEY = "matsuri_wl_head_collapsed";
  let headCollapsed = false;
  try {
    headCollapsed = localStorage.getItem(HEAD_KEY) === "1";
  } catch {}

  const secEl = root.closest("#wishlist") || document.getElementById("wishlist");
  const secHead = secEl ? secEl.querySelector(":scope > .sec-head") : null;
  const headToggleBtn = el("button", "wl-head-toggle");
  headToggleBtn.type = "button";
  const headToggleText = el("span", "", "");
  const headToggleCaret = el("span", "wl-head-caret");
  headToggleCaret.setAttribute("aria-hidden", "true");
  headToggleBtn.append(headToggleText, headToggleCaret);

  if (secHead) {
    const eyebrow = secHead.querySelector(":scope > .eyebrow");
    const topRow = el("div", "wl-head-top");
    if (eyebrow) {
      secHead.insertBefore(topRow, eyebrow);
      topRow.append(eyebrow, headToggleBtn);
    } else {
      secHead.prepend(topRow);
      topRow.append(headToggleBtn);
    }
  }

  function applyHeadCollapsed() {
    if (secEl) secEl.classList.toggle("is-head-collapsed", headCollapsed);
    root.classList.toggle("is-head-collapsed", headCollapsed);
    headToggleBtn.setAttribute("aria-expanded", String(!headCollapsed));
    headToggleText.textContent = headCollapsed ? t("expandHead") : t("collapseHead");
  }
  headToggleBtn.addEventListener("click", () => {
    headCollapsed = !headCollapsed;
    try { localStorage.setItem(HEAD_KEY, headCollapsed ? "1" : "0"); } catch {}
    applyHeadCollapsed();
  });

  const toolbar = el("div", "wl-bar");
  const areaGroup = el("div", "wl-filters");
  const rightControls = el("div", "wl-bar-right");
  const sortGroup = el("div", "wl-sorts");
  const addTopBtn = el("button", "wl-add-main", t("addMain"));
  addTopBtn.type = "button";
  rightControls.append(sortGroup, addTopBtn);
  toolbar.append(areaGroup, rightControls);

  const boardNav = el("div", "wl-board-nav");
  const boardPills = el("div", "wl-board-pills");
  const boardLeftBtn = el("button", "wl-tab on", t("boardLeft"));
  boardLeftBtn.type = "button";
  const boardRightBtn = el("button", "wl-tab", t("boardRight"));
  boardRightBtn.type = "button";
  boardPills.append(boardLeftBtn, boardRightBtn);
  const boardHint = el("span", "wl-board-hint", t("boardSwipeHint"));
  boardNav.append(boardPills, boardHint);

  const boardEl = el("div", "wl-board");
  function syncBoardNav() {
    const maxScroll = Math.max(0, boardEl.scrollWidth - boardEl.clientWidth);
    const inRightHalf = maxScroll > 20 && boardEl.scrollLeft >= maxScroll * 0.45;
    boardLeftBtn.classList.toggle("on", !inRightHalf);
    boardRightBtn.classList.toggle("on", inRightHalf);
  }
  boardLeftBtn.addEventListener("click", () => {
    boardEl.scrollTo({ left: 0, behavior: "smooth" });
  });
  boardRightBtn.addEventListener("click", () => {
    const targetCol = boardEl.children[2];
    const left = targetCol ? targetCol.offsetLeft : boardEl.scrollWidth;
    boardEl.scrollTo({ left, behavior: "smooth" });
  });
  boardEl.addEventListener("scroll", syncBoardNav, { passive: true });
  boardEl.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 0) {
      if (e.target.closest(".wl-card, .wl-col-list")) {
        boardEl.scrollLeft += e.deltaX;
        e.preventDefault();
      }
    }
  }, { passive: false });
  window.addEventListener("resize", syncBoardNav, { passive: true });

  const statusHint = el("div", "wl-board-msg");
  const adminBar = el("div", "wl-admin-bar");
  const adminToggle = el("button", "wl-admin-link", t("adminLogin"));
  adminToggle.type = "button";
  adminBar.append(adminToggle);

  // Inline Composer Card (placed right below the Trello board)
  const composeSection = el("section", "wl-compose");
  composeSection.id = "advice";
  composeSection.setAttribute("aria-label", t("composeTitle"));

  const composeHead = el("div", "wl-modal-head");
  const composeH3 = el("h3", "", t("composeTitle"));
  const composeSub = el("span", "wl-modal-badge", t("composeBadge"));
  composeHead.append(composeH3, composeSub);

  const formCard = el("form", "wl-form");
  formCard.noValidate = true;

  const row1 = el("div", "wl-row");
  const titleInput = el("input", "wl-input");
  titleInput.type = "text";
  titleInput.placeholder = t("titlePh");
  titleInput.maxLength = 80;
  titleInput.required = true;

  const areaSelect = el("select", "wl-select");
  areaSelect.setAttribute("aria-label", t("areaAria"));
  function populateAreaSelect() {
    const prev = areaSelect.value || "Agent Deck";
    areaSelect.innerHTML = "";
    for (const a of AREAS) {
      const opt = el("option", "", areaLabel(a.id));
      opt.value = a.id;
      if (a.id === prev) opt.selected = true;
      areaSelect.append(opt);
    }
  }
  populateAreaSelect();

  const statusSelect = el("select", "wl-select wl-status-sel");
  statusSelect.setAttribute("aria-label", "目标列");
  function populateStatusSelect() {
    const prev = statusSelect.value || "pending";
    statusSelect.innerHTML = "";
    for (const c of COLUMNS) {
      const opt = el("option", "", colTitle(c));
      opt.value = c.id;
      if (c.id === prev) opt.selected = true;
      statusSelect.append(opt);
    }
  }
  populateStatusSelect();
  statusSelect.hidden = !adminToken;
  row1.append(titleInput, areaSelect, statusSelect);

  const descInput = el("textarea", "wl-textarea");
  descInput.rows = 4;
  descInput.maxLength = 1200;
  descInput.placeholder = t("descPh");

  const hpInput = el("input", "wl-hp");
  hpInput.type = "text";
  hpInput.name = "website";
  hpInput.tabIndex = -1;
  hpInput.autocomplete = "off";
  hpInput.setAttribute("aria-hidden", "true");

  const uploadBox = el("div", "wl-upload");
  const fileInput = el("input");
  fileInput.type = "file";
  fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
  fileInput.multiple = true;
  fileInput.hidden = true;

  const pickBtn = el("button", "wl-pick", t("pickBtn"));
  pickBtn.type = "button";
  const uploadHint = el("span", "wl-hint", t("uploadHint"));
  const previewWrap = el("div", "wl-previews");
  uploadBox.append(fileInput, pickBtn, uploadHint, previewWrap);

  const rowMeta = el("div", "wl-form-meta");
  const authorInput = el("input", "wl-author");
  authorInput.type = "text";
  authorInput.maxLength = 24;
  authorInput.placeholder = t("authorPh");
  const contactInput = el("input", "wl-contact");
  contactInput.type = "text";
  contactInput.maxLength = 80;
  contactInput.placeholder = t("contactPh");
  rowMeta.append(authorInput, contactInput);

  const rowFoot = el("div", "wl-form-foot");
  const msgEl = el("span", "wl-msg");
  const submitBtn = el("button", "wl-submit", t("submitBtn"));
  submitBtn.type = "submit";
  rowFoot.append(msgEl, submitBtn);

  formCard.append(row1, descInput, hpInput, uploadBox, rowMeta, rowFoot);
  composeSection.append(composeHead, formCard);

  // Detail Modal
  const detailOverlay = el("div", "wl-modal-bg");
  detailOverlay.hidden = true;
  const detailDialog = el("div", "wl-modal wl-detail");
  detailDialog.setAttribute("role", "dialog");
  detailDialog.setAttribute("aria-modal", "true");
  detailOverlay.append(detailDialog);

  // Lightbox
  const lightbox = el("div", "wl-lightbox");
  lightbox.hidden = true;
  const lbImg = el("img");
  lbImg.alt = "Screenshot preview";
  const lbClose = el("button", "wl-lb-close", "×");
  lbClose.type = "button";
  lbClose.setAttribute("aria-label", t("close"));
  lightbox.append(lbImg, lbClose);

  root.append(toolbar, statusHint, boardNav, boardEl, composeSection, adminBar, detailOverlay, lightbox);
  if (!secHead) root.prepend(headToggleBtn);
  applyHeadCollapsed();

  // ---------- Whole-page Bilingual Switcher ----------
  function syncStaticI18n() {
    document.documentElement.setAttribute("data-jw-lang", lang);
    document.querySelectorAll("[data-i18n-en]").forEach((node) => {
      if (!node.hasAttribute("data-i18n-zh")) {
        node.setAttribute("data-i18n-zh", node.innerHTML);
      }
      node.innerHTML = isEn() ? node.getAttribute("data-i18n-en") : node.getAttribute("data-i18n-zh");
    });
    document.querySelectorAll("[data-jw-set-lang]").forEach((btn) => {
      const active = btn.getAttribute("data-jw-set-lang") === lang;
      btn.classList.toggle("on", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    addTopBtn.textContent = t("addMain");
    applyHeadCollapsed();
    boardLeftBtn.textContent = t("boardLeft");
    boardRightBtn.textContent = t("boardRight");
    boardHint.textContent = t("boardSwipeHint");
    composeSection.setAttribute("aria-label", t("composeTitle"));
    composeH3.textContent = t("composeTitle");
    composeSub.textContent = t("composeBadge");
    titleInput.placeholder = t("titlePh");
    areaSelect.setAttribute("aria-label", t("areaAria"));
    populateAreaSelect();
    populateStatusSelect();
    statusSelect.hidden = !adminToken;
    row1.classList.toggle("is-admin", Boolean(adminToken));
    descInput.placeholder = t("descPh");
    pickBtn.textContent = t("pickBtn");
    uploadHint.textContent = t("uploadHint");
    authorInput.placeholder = t("authorPh");
    contactInput.placeholder = t("contactPh");
    submitBtn.textContent = t("submitBtn");
    adminToggle.textContent = adminToken ? t("adminLogout") : t("adminLogin");
    renderToolbar();
    renderBoard();
    if (activeItem) openDetail(activeItem);
  }

  function setLang(next) {
    if (next !== "zh" && next !== "en") return;
    lang = next;
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
    syncStaticI18n();
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-jw-set-lang]");
    if (!btn) return;
    setLang(btn.getAttribute("data-jw-set-lang"));
  });

  // ---------- Focus, Modals & Previews ----------
  function scrollToAdvice(smooth = true) {
    composeSection.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }
  if (location.hash === "#advice") {
    scrollToAdvice(false);
  }
  function focusCompose(targetStatus) {
    userScrolled = true;
    msgEl.textContent = "";
    msgEl.classList.remove("is-err");
    if (adminToken && typeof targetStatus === "string" && COL_MAP[targetStatus]) {
      statusSelect.value = targetStatus;
    }
    scrollToAdvice(true);
    setTimeout(() => titleInput.focus(), 120);
  }
  addTopBtn.addEventListener("click", () => focusCompose());
  window.addEventListener("hashchange", () => {
    if (location.hash === "#whistlist") {
      history.replaceState(null, "", "#wishlist");
    }
    if (location.hash === "#advice") {
      userScrolled = false;
      scrollToAdvice(true);
    }
  });

  function closeDetail() {
    activeItem = null;
    detailOverlay.hidden = true;
    detailDialog.innerHTML = "";
  }
  detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) closeDetail();
  });

  const closeLb = () => {
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
  };
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === lbClose) closeLb();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!lightbox.hidden) return closeLb();
    if (!detailOverlay.hidden) return closeDetail();
  });

  function renderPreviews() {
    previewWrap.innerHTML = "";
    pendingImages.forEach((img, idx) => {
      const box = el("div", "wl-prev");
      const thumb = el("img");
      thumb.src = img.dataUrl;
      thumb.alt = img.name || "Screenshot";
      const rm = el("button", "wl-prev-rm", "×");
      rm.type = "button";
      rm.setAttribute("aria-label", "Remove screenshot");
      rm.addEventListener("click", () => {
        pendingImages.splice(idx, 1);
        renderPreviews();
      });
      box.append(thumb, rm);
      previewWrap.append(box);
    });
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith("image/"));
    if (!files.length) return;
    msgEl.textContent = t("compressing");
    msgEl.classList.remove("is-err");
    try {
      for (const f of files) {
        if (pendingImages.length >= 2) {
          msgEl.textContent = t("maxImgs");
          break;
        }
        const dataUrl = await compressImage(f);
        pendingImages.push({ dataUrl, name: f.name || "screenshot" });
      }
      if (pendingImages.length <= 2 && msgEl.textContent === t("compressing")) msgEl.textContent = "";
      renderPreviews();
    } catch (err) {
      msgEl.textContent = err.message || t("imgErr");
      msgEl.classList.add("is-err");
    }
  }

  pickBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    addFiles(fileInput.files);
    fileInput.value = "";
  });
  uploadBox.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadBox.classList.add("is-drag");
  });
  uploadBox.addEventListener("dragleave", () => uploadBox.classList.remove("is-drag"));
  uploadBox.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadBox.classList.remove("is-drag");
    addFiles(e.dataTransfer?.files);
  });
  formCard.addEventListener("paste", (e) => {
    const files = Array.from(e.clipboardData?.items || [])
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter(Boolean);
    if (files.length) {
      e.preventDefault();
      addFiles(files);
    }
  });

  // ---------- Voting (one vote per person) ----------
  async function toggleVote(item, onUpdated) {
    if (item.voted || item._voting) return;
    const prevVotes = item.votes || 0;
    item._voting = true;
    item.voted = true;
    item.votes = prevVotes + 1;
    onUpdated();

    try {
      const data = await fetchJson(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", id: item.id, voterId }),
      }, 9000);
      item.votes = data.votes;
      item.voted = Boolean(data.voted);
      writeCache(items);
      onUpdated();
      if (sortMode === "top") renderBoard();
    } catch (err) {
      item.voted = false;
      item.votes = prevVotes;
      onUpdated();
      statusHint.textContent = err.message || t("voteFail");
      statusHint.classList.add("is-err");
    } finally {
      item._voting = false;
    }
  }

  async function patchItem(it, patch) {
    const r = await fetch(API, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ id: it.id, ...patch }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || "保存失败");
    Object.assign(it, data.item);
    writeCache(items);
    return it;
  }

  // ---------- Card Detail Modal ----------
  function openDetail(it) {
    activeItem = it;
    detailDialog.innerHTML = "";
    const col = COL_MAP[it.status] || COLUMNS[0];

    const head = el("div", "wl-modal-head");
    const tags = el("div", "wl-detail-tags");
    tags.append(
      el("span", `wl-label ${AREA_CLS[it.area] || "is-deck"}`, areaLabel(it.area || "Agent Deck")),
      el("span", `wl-status ${col.cls}`, colTitle(col)),
    );
    const closeBtn = el("button", "wl-x", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", t("close"));
    closeBtn.addEventListener("click", closeDetail);
    head.append(tags, closeBtn);

    const topRow = el("div", "wl-detail-top");
    const voteBtn = el("button", `wl-vote wl-vote--lg${it.voted ? " on" : ""}`);
    voteBtn.type = "button";
    voteBtn.disabled = Boolean(it.voted);
    voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
    if (it.voted) voteBtn.title = t("votedTitle");
    voteBtn.append(el("span", "wl-arrow", "▲"), el("b", "", String(it.votes || 0)));
    const syncVoteUi = () => {
      voteBtn.classList.toggle("on", Boolean(it.voted));
      voteBtn.disabled = Boolean(it.voted);
      voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
      voteBtn.title = it.voted ? t("votedTitle") : "";
      voteBtn.querySelector("b").textContent = String(it.votes || 0);
      renderBoard();
    };
    voteBtn.addEventListener("click", () => toggleVote(it, syncVoteUi));

    const titleWrap = el("div", "wl-detail-title");
    titleWrap.append(
      el("h3", "", itemTitle(it)),
      el("div", "wl-who", `${itemAuthor(it, false)} · ${fmtTime(it.createdAt)}`),
    );
    topRow.append(voteBtn, titleWrap);

    detailDialog.append(head, topRow);

    const dText = itemDesc(it);
    if (dText) {
      detailDialog.append(el("p", "wl-detail-desc", dText));
    }

    if (Array.isArray(it.images) && it.images.length) {
      const imgs = el("div", "wl-detail-imgs");
      for (const imgId of it.images) {
        const src = `${API}?img=${encodeURIComponent(imgId)}`;
        const b = el("button", "wl-detail-img");
        b.type = "button";
        const img = el("img");
        img.src = src;
        img.alt = `${itemTitle(it)} screenshot`;
        b.append(img);
        b.addEventListener("click", () => {
          lbImg.src = src;
          lightbox.hidden = false;
        });
        imgs.append(b);
      }
      detailDialog.append(imgs);
    }

    if (it.authorNote) {
      const note = el("div", "wl-reply");
      note.append(el("b", "", t("authorReply")), document.createTextNode(it.authorNote));
      if (it.authorNoteAt) {
        note.append(el("span", "wl-reply-time", ` · ${fmtTime(it.authorNoteAt)}`));
      }
      detailDialog.append(note);
    }

    if (adminToken) {
      const adm = el("div", "wl-adm-box");
      adm.append(el("div", "wl-adm-title", "编辑 / 改状态 / 删除（作者管理）"));

      const contactRow = el("div", "wl-adm-contact");
      contactRow.append(el("b", "", t("contactLabel")));
      if (it.contact) {
        contactRow.append(el("span", "wl-adm-contact-val", it.contact));
        const copyBtn = el("button", "wl-adm-copy", t("copyBtn"));
        copyBtn.type = "button";
        copyBtn.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(it.contact);
            copyBtn.textContent = t("copied");
            setTimeout(() => { copyBtn.textContent = t("copyBtn"); }, 1500);
          } catch {}
        });
        contactRow.append(copyBtn);
      } else {
        contactRow.append(el("span", "wl-adm-contact-empty", t("contactEmpty")));
      }
      adm.append(contactRow);

      const admGrid = el("div", "wl-adm-grid");

      const titleIn = el("input", "wl-adm-in");
      titleIn.type = "text";
      titleIn.maxLength = 80;
      titleIn.value = it.title || "";
      titleIn.placeholder = "标题（2–80 字）";

      const metaRow = el("div", "wl-adm-row");
      const areaSel = el("select", "wl-adm-sel");
      for (const a of AREAS) {
        const o = el("option", "", areaLabel(a.id));
        o.value = a.id;
        if (it.area === a.id) o.selected = true;
        areaSel.append(o);
      }
      const sel = el("select", "wl-adm-sel");
      for (const c of COLUMNS) {
        const o = el("option", "", colTitle(c));
        o.value = c.id;
        if (it.status === c.id) o.selected = true;
        sel.append(o);
      }
      const authorIn = el("input", "wl-adm-in");
      authorIn.type = "text";
      authorIn.maxLength = 24;
      authorIn.value = it.author || "";
      authorIn.placeholder = "提交人";
      metaRow.append(areaSel, sel, authorIn);

      const descIn = el("textarea", "wl-adm-textarea");
      descIn.rows = 3;
      descIn.maxLength = 1200;
      descIn.value = it.desc || "";
      descIn.placeholder = "详细描述（选填）";

      const contactIn = el("input", "wl-adm-in");
      contactIn.type = "text";
      contactIn.maxLength = 80;
      contactIn.value = it.contact || "";
      contactIn.placeholder = "联系方式（仅作者可见）";

      const presetRow = el("div", "wl-adm-presets");
      const noteIn = el("textarea", "wl-adm-textarea wl-adm-note");
      noteIn.rows = 2;
      noteIn.maxLength = 300;
      noteIn.value = it.authorNote || "";
      noteIn.placeholder = "官方回复（选填，点上方快捷回应可一键填入）";

      for (const q of QUICK_REPLIES) {
        const b = el("button", "wl-quick-btn", qrLabel(q));
        b.type = "button";
        b.title = qrText(q);
        b.addEventListener("click", () => {
          noteIn.value = qrText(q);
          if (q.status) sel.value = q.status;
          noteIn.focus();
        });
        presetRow.append(b);
      }
      if (it.authorNote) {
        const clr = el("button", "wl-quick-btn is-muted", t("clearReply"));
        clr.type = "button";
        clr.addEventListener("click", () => {
          noteIn.value = "";
          noteIn.focus();
        });
        presetRow.append(clr);
      }

      const admRow = el("div", "wl-adm-row");
      const saveBtn = el("button", "wl-adm-btn is-primary", "保存修改");
      saveBtn.type = "button";
      saveBtn.addEventListener("click", async () => {
        const nextTitle = titleIn.value.trim();
        if (nextTitle.length < 2) return alert("标题至少写 2 个字");
        saveBtn.disabled = true;
        try {
          await patchItem(it, {
            title: nextTitle,
            desc: descIn.value.trim(),
            area: areaSel.value,
            author: authorIn.value.trim(),
            contact: contactIn.value.trim(),
            status: sel.value,
            authorNote: noteIn.value,
          });
          renderToolbar();
          renderBoard();
          openDetail(it);
        } catch (err) {
          alert(err.message);
        } finally {
          saveBtn.disabled = false;
        }
      });

      const delBtn = el("button", "wl-adm-btn is-del", "删除卡片");
      delBtn.type = "button";
      delBtn.addEventListener("click", async () => {
        if (!confirm(`确定删除「${it.title}」？`)) return;
        const r = await fetch(`${API}?id=${encodeURIComponent(it.id)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await r.json();
        if (!r.ok) return alert(data.error || "删除失败");
        items = items.filter((x) => x.id !== it.id);
        writeCache(items);
        closeDetail();
        renderToolbar();
        renderBoard();
      });

      admRow.append(saveBtn, delBtn);
      admGrid.append(titleIn, metaRow, descIn, contactIn, presetRow, noteIn, admRow);
      adm.append(admGrid);
      detailDialog.append(adm);
    }

    detailOverlay.hidden = false;
  }

  // ---------- Toolbar & Kanban Board ----------
  function renderToolbar() {
    areaGroup.innerHTML = "";
    const counts = { all: items.length };
    for (const it of items) counts[it.area] = (counts[it.area] || 0) + 1;

    for (const [id, label] of [["all", t("allAreas")], ...AREAS.map((a) => [a.id, areaLabel(a.id)])]) {
      const btn = el("button", `wl-tab${filterArea === id ? " on" : ""}`, `${label} (${counts[id] || 0})`);
      btn.type = "button";
      btn.addEventListener("click", () => {
        filterArea = id;
        renderToolbar();
        renderBoard();
      });
      areaGroup.append(btn);
    }

    sortGroup.innerHTML = "";
    for (const [k, label] of [
      ["top", t("sortTop")],
      ["new", t("sortNew")],
    ]) {
      const btn = el("button", `wl-tab${sortMode === k ? " on" : ""}`, label);
      btn.type = "button";
      btn.addEventListener("click", () => {
        sortMode = k;
        renderToolbar();
        renderBoard();
      });
      sortGroup.append(btn);
    }
  }

  function buildCard(it) {
    const card = el("article", "wl-card");
    card.tabIndex = 0;
    card.addEventListener("click", () => openDetail(it));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetail(it);
      }
    });

    if (Array.isArray(it.images) && it.images.length) {
      const cover = el("div", "wl-card-cover");
      const img = el("img");
      img.src = `${API}?img=${encodeURIComponent(it.images[0])}`;
      img.alt = `${itemTitle(it)} screenshot`;
      img.loading = "lazy";
      cover.append(img);
      if (it.images.length > 1) {
        cover.append(el("span", "wl-card-imgn", `+${it.images.length - 1}`));
      }
      card.append(cover);
    }

    const head = el("div", "wl-card-top");
    head.append(el("span", `wl-label ${AREA_CLS[it.area] || "is-deck"}`, areaLabel(it.area || "Agent Deck")));
    if (adminToken && it.contact) {
      head.append(el("span", "wl-label is-contact", t("contactBadge")));
    }
    if (adminToken) {
      const quickSel = el("select", "wl-card-status");
      quickSel.setAttribute("aria-label", "切换状态");
      for (const c of COLUMNS) {
        const o = el("option", "", colTitle(c));
        o.value = c.id;
        if ((COL_MAP[it.status] ? it.status : "pending") === c.id) o.selected = true;
        quickSel.append(o);
      }
      quickSel.addEventListener("click", (e) => e.stopPropagation());
      quickSel.addEventListener("change", async (e) => {
        e.stopPropagation();
        const prev = it.status;
        const next = quickSel.value;
        quickSel.disabled = true;
        try {
          await patchItem(it, { status: next });
          renderBoard();
        } catch (err) {
          it.status = prev;
          quickSel.value = prev;
          alert(err.message);
        } finally {
          quickSel.disabled = false;
        }
      });
      head.append(quickSel);
    }
    card.append(head);

    card.append(el("h3", "wl-card-title", itemTitle(it)));

    const dText = itemDesc(it);
    if (dText) {
      card.append(el("p", "wl-card-desc", dText));
    }

    if (it.authorNote) {
      const reply = el("div", "wl-card-note");
      reply.append(el("b", "", t("replyShort")), document.createTextNode(it.authorNote));
      if (it.authorNoteAt) {
        reply.append(el("span", "wl-reply-time", ` · ${fmtTime(it.authorNoteAt).slice(5)}`));
      }
      card.append(reply);
    }

    if (adminToken) {
      const admBar = el("div", "wl-card-adm");
      admBar.addEventListener("click", (e) => e.stopPropagation());
      admBar.addEventListener("keydown", (e) => e.stopPropagation());

      const quickRow = el("div", "wl-card-quick");
      for (const q of QUICK_REPLIES.filter((x) => x.card)) {
        const text = qrText(q);
        const active = it.authorNote === text || it.authorNote === q.zhText || it.authorNote === q.enText;
        const qb = el("button", `wl-quick-btn${active ? " on" : ""}`, qrLabel(q));
        qb.type = "button";
        qb.title = text;
        qb.addEventListener("click", async () => {
          qb.disabled = true;
          try {
            const patch = { authorNote: text };
            if (q.status) patch.status = q.status;
            await patchItem(it, patch);
            renderBoard();
          } catch (err) {
            alert(err.message);
          } finally {
            qb.disabled = false;
          }
        });
        quickRow.append(qb);
      }

      const replyBox = el("div", "wl-card-reply-box");
      replyBox.hidden = true;
      const replyIn = el("input", "wl-card-reply-in");
      replyIn.type = "text";
      replyIn.maxLength = 300;
      replyIn.value = it.authorNote || "";
      replyIn.placeholder = t("replyPh");

      const sendBtn = el("button", "wl-quick-btn is-send", t("sendReply"));
      sendBtn.type = "button";

      const submitReply = async (val) => {
        sendBtn.disabled = true;
        replyIn.disabled = true;
        try {
          await patchItem(it, { authorNote: val });
          renderBoard();
        } catch (err) {
          alert(err.message);
          sendBtn.disabled = false;
          replyIn.disabled = false;
        }
      };

      sendBtn.addEventListener("click", () => submitReply(replyIn.value));
      replyIn.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitReply(replyIn.value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          replyBox.hidden = true;
        }
      });

      replyBox.append(replyIn, sendBtn);
      if (it.authorNote) {
        const clrBtn = el("button", "wl-quick-btn is-muted", t("clearReply"));
        clrBtn.type = "button";
        clrBtn.addEventListener("click", () => submitReply(""));
        replyBox.append(clrBtn);
      }

      const toggleReply = el("button", "wl-quick-btn is-custom", it.authorNote ? t("editReplyBtn") : t("replyBtn"));
      toggleReply.type = "button";
      toggleReply.addEventListener("click", () => {
        replyBox.hidden = !replyBox.hidden;
        if (!replyBox.hidden) {
          replyIn.value = it.authorNote || "";
          replyIn.focus();
          replyIn.select();
        }
      });
      quickRow.append(toggleReply);

      admBar.append(quickRow, replyBox);
      card.append(admBar);
    }

    const foot = el("div", "wl-card-foot");
    foot.append(el("span", "wl-who", `${itemAuthor(it, true)} · ${fmtTime(it.createdAt).slice(5)}`));

    const voteBtn = el("button", `wl-vote-pill${it.voted ? " on" : ""}`);
    voteBtn.type = "button";
    voteBtn.disabled = Boolean(it.voted);
    voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
    voteBtn.setAttribute("aria-label", it.voted ? t("votedTitle") : `Vote for ${itemTitle(it)}`);
    if (it.voted) voteBtn.title = t("votedTitle");
    voteBtn.append(el("span", "wl-arrow", "▲"), el("b", "", String(it.votes || 0)));
    voteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleVote(it, () => {
        voteBtn.classList.toggle("on", Boolean(it.voted));
        voteBtn.disabled = Boolean(it.voted);
        voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
        voteBtn.setAttribute("aria-label", it.voted ? t("votedTitle") : `Vote for ${itemTitle(it)}`);
        voteBtn.title = it.voted ? t("votedTitle") : "";
        voteBtn.querySelector("b").textContent = String(it.votes || 0);
      });
    });

    foot.append(voteBtn);
    card.append(foot);
    return card;
  }

  function renderBoard() {
    const keepAdvice = location.hash === "#advice" && !userScrolled && !activeItem;
    const beforeTop = keepAdvice ? composeSection.getBoundingClientRect().top : 0;
    const syncAdvicePos = () => {
      if (!keepAdvice) return;
      const dy = composeSection.getBoundingClientRect().top - beforeTop;
      if (Math.abs(dy) > 1) window.scrollBy(0, dy);
    };

    boardEl.innerHTML = "";
    const filtered = items.filter((it) => filterArea === "all" || it.area === filterArea);
    const sorted = filtered.slice().sort((a, b) => {
      if (sortMode === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return (b.votes || 0) - (a.votes || 0) || (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    const clampLists = [];
    for (const col of COLUMNS) {
      const colItems = sorted.filter((it) => (COL_MAP[it.status] ? it.status : "pending") === col.id);
      const colEl = el("section", `wl-col ${col.cls}`);

      const head = el("header", "wl-col-head");
      const titleWrap = el("div", "wl-col-title");
      titleWrap.append(el("span", "wl-col-dot"), el("h3", "", colTitle(col)));
      const count = el("span", "wl-col-count", String(colItems.length));
      head.append(titleWrap, count);

      const sub = el("div", "wl-col-sub", colSub(col));
      const list = el("div", "wl-col-list");

      if (!colItems.length) {
        list.append(el("div", "wl-col-empty", col.id === "pending" ? t("emptyPending") : t("emptyCol")));
      } else {
        for (const it of colItems) list.append(buildCard(it));
        if (colItems.length > 4) {
          list.classList.add("is-scroll");
          clampLists.push(list);
        }
      }

      colEl.append(head, sub, list);

      if (col.id === "pending" || adminToken) {
        const addBtn = el("button", "wl-col-add", t("addCol"));
        addBtn.type = "button";
        addBtn.addEventListener("click", () => focusCompose(col.id));
        colEl.append(addBtn);
      }

      boardEl.append(colEl);
    }

    if (clampLists.length) {
      requestAnimationFrame(() => {
        for (const list of clampLists) {
          const fourth = list.children[3];
          if (fourth) list.style.maxHeight = `${fourth.offsetTop + fourth.offsetHeight + 2}px`;
        }
        syncBoardNav();
        syncAdvicePos();
      });
    } else {
      requestAnimationFrame(syncBoardNav);
      syncAdvicePos();
    }
  }

  // ---------- Form Submit ----------
  formCard.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (title.length < 2) {
      msgEl.textContent = t("titleShort");
      msgEl.classList.add("is-err");
      titleInput.focus();
      return;
    }
    submitBtn.disabled = true;
    msgEl.textContent = t("submitting");
    msgEl.classList.remove("is-err");

    try {
      const reqHeaders = { "Content-Type": "application/json" };
      if (adminToken) reqHeaders.Authorization = `Bearer ${adminToken}`;
      const payload = {
        action: "create",
        title,
        desc: descInput.value.trim(),
        area: areaSelect.value,
        author: authorInput.value.trim(),
        contact: contactInput.value.trim(),
        images: pendingImages.map((x) => ({ dataUrl: x.dataUrl })),
        website: hpInput.value,
        voterId,
      };
      if (adminToken) payload.status = statusSelect.value;
      const data = await fetchJson(API, {
        method: "POST",
        headers: reqHeaders,
        body: JSON.stringify(payload),
      }, 15000);
      if (data.item) {
        items.unshift(data.item);
        writeCache(items);
        filterArea = "all";
        renderToolbar();
        renderBoard();
      }
      titleInput.value = "";
      descInput.value = "";
      contactInput.value = "";
      pendingImages = [];
      renderPreviews();
      msgEl.textContent = t("submitted");
      msgEl.classList.remove("is-err");
      statusHint.textContent = "";
      statusHint.classList.remove("is-err");
    } catch (err) {
      msgEl.textContent = err.message || (isEn() ? "Submission failed" : "提交失败");
      msgEl.classList.add("is-err");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---------- Admin Auth ----------
  let verifyingAdmin = false;
  function syncAdminUi() {
    adminToggle.textContent = adminToken ? t("adminLogout") : t("adminLogin");
    statusSelect.hidden = !adminToken;
    row1.classList.toggle("is-admin", Boolean(adminToken));
  }
  adminToggle.addEventListener("click", () => {
    if (adminToken) {
      adminToken = "";
      try { sessionStorage.removeItem("matsuri_wl_admin"); } catch {}
      items = items.map(({ contact: _c, ...pub }) => pub);
      syncAdminUi();
      renderBoard();
      if (activeItem) {
        const refreshed = items.find((x) => x.id === activeItem.id);
        if (refreshed) openDetail(refreshed);
      }
      return;
    }
    const tk = prompt(t("adminPrompt"));
    if (!tk) return;
    adminToken = tk.trim();
    verifyingAdmin = true;
    try { sessionStorage.setItem("matsuri_wl_admin", adminToken); } catch {}
    syncAdminUi();
    inflightInit = null;
    load(true);
  });
  syncAdminUi();

  // ---------- Initial Load ----------
  function showStatus(text, isErr, canRetry) {
    statusHint.innerHTML = "";
    if (!text) {
      statusHint.classList.remove("is-err");
      return;
    }
    statusHint.classList.toggle("is-err", Boolean(isErr));
    statusHint.append(document.createTextNode(text));
    if (canRetry) {
      const retryBtn = el("button", "wl-retry", t("retry"));
      retryBtn.type = "button";
      retryBtn.addEventListener("click", () => {
        inflightInit = null;
        load(true);
      });
      statusHint.append(" ", retryBtn);
    }
  }

  async function load(forceFresh = false) {
    syncStaticI18n();
    if (items.length) {
      if (forceFresh) showStatus(t("syncing"), false, false);
    } else {
      showStatus(t("loading"), false, false);
    }

    const slowTimer = !items.length ? setTimeout(() => {
      if (!hasLiveSync && !items.length) {
        items = FALLBACK_ITEMS.map((x) => ({ ...x }));
        renderToolbar();
        renderBoard();
        showStatus(t("slowNet"), false, false);
      }
    }, 800) : null;

    try {
      const reqPromise = !forceFresh && inflightInit ? inflightInit : fetchListWithRetry();
      inflightInit = null;
      const data = await reqPromise;
      hasLiveSync = true;
      if (slowTimer) clearTimeout(slowTimer);
      if (adminToken && data.isAdmin === false) {
        adminToken = "";
        try { sessionStorage.removeItem("matsuri_wl_admin"); } catch {}
        syncAdminUi();
        if (verifyingAdmin) alert("管理口令不对");
      }
      verifyingAdmin = false;
      items = Array.isArray(data.items) ? data.items : [];
      writeCache(items);
      showStatus("", false, false);
      renderToolbar();
      renderBoard();
      if (activeItem) {
        const refreshed = items.find((x) => x.id === activeItem.id);
        if (refreshed) openDetail(refreshed);
      }
    } catch (err) {
      if (slowTimer) clearTimeout(slowTimer);
      if (!items.length) {
        items = FALLBACK_ITEMS.map((x) => ({ ...x }));
        renderToolbar();
        renderBoard();
      }
      showStatus(t("offlineNet"), true, true);
    }
  }

  load(false);
})();
