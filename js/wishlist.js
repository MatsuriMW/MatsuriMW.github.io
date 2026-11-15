// Trello 式功能路线图与心愿单（嵌入 /portfolio/journal-workflow/#wishlist）
(() => {
  const root = document.getElementById("wishlist-app");
  if (!root) return;

  const API = "/api/wishlist";
  const AREAS = [
    { id: "Agent Deck", cls: "is-deck" },
    { id: "螺旋日程", cls: "is-spiral" },
    { id: "双插件联动", cls: "is-link" },
    { id: "macOS 菜单栏", cls: "is-mac" },
  ];
  const AREA_CLS = Object.fromEntries(AREAS.map((a) => [a.id, a.cls]));
  const COLUMNS = [
    { id: "pending", title: "TODO", sub: "待评估 · 新提交进这里", cls: "is-pending" },
    { id: "planned", title: "计划中", sub: "已确认排期", cls: "is-planned" },
    { id: "in_progress", title: "开发中", sub: "正在推进", cls: "is-progress" },
    { id: "done", title: "已上线", sub: "已完成发布", cls: "is-done" },
  ];
  const COL_MAP = Object.fromEntries(COLUMNS.map((c) => [c.id, c]));

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

  const voterId = getVoterId();
  let items = [];
  let filterArea = "all";
  let sortMode = "top";
  let pendingImages = [];
  let activeItem = null;
  let adminToken = "";
  try {
    adminToken = sessionStorage.getItem("matsuri_wl_admin") || "";
  } catch {}

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
        r.onerror = () => reject(new Error("读取图片失败"));
        r.readAsDataURL(file);
      });
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("图片无法解析"));
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
      throw new Error("图片太大，请换一张小一点的截图");
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // ---------- Skeleton ----------
  root.innerHTML = "";

  const toolbar = el("div", "wl-bar");
  const areaGroup = el("div", "wl-filters");
  const rightControls = el("div", "wl-bar-right");
  const sortGroup = el("div", "wl-sorts");
  const addTopBtn = el("button", "wl-add-main", "+ 提功能建议（进入 TODO）");
  addTopBtn.type = "button";
  rightControls.append(sortGroup, addTopBtn);
  toolbar.append(areaGroup, rightControls);

  const boardEl = el("div", "wl-board");
  const statusHint = el("div", "wl-board-msg");
  const adminBar = el("div", "wl-admin-bar");
  const adminToggle = el("button", "wl-admin-link", "作者管理");
  adminToggle.type = "button";
  adminBar.append(adminToggle);

  // Composer Modal
  const composeOverlay = el("div", "wl-modal-bg");
  composeOverlay.hidden = true;
  const composeDialog = el("div", "wl-modal");
  composeDialog.setAttribute("role", "dialog");
  composeDialog.setAttribute("aria-modal", "true");
  composeDialog.setAttribute("aria-label", "提交功能建议");

  const composeHead = el("div", "wl-modal-head");
  composeHead.append(el("h3", "", "提一个功能建议"));
  const composeSub = el("span", "wl-modal-badge", "提交后进入 TODO 列");
  const composeClose = el("button", "wl-x", "×");
  composeClose.type = "button";
  composeClose.setAttribute("aria-label", "关闭");
  composeHead.append(composeSub, composeClose);

  const formCard = el("form", "wl-form");
  formCard.noValidate = true;

  const row1 = el("div", "wl-row");
  const titleInput = el("input", "wl-input");
  titleInput.type = "text";
  titleInput.placeholder = "一句话标题（比如：支持一键把会话摘要导出成周报）";
  titleInput.maxLength = 80;
  titleInput.required = true;

  const areaSelect = el("select", "wl-select");
  areaSelect.setAttribute("aria-label", "所属模块");
  for (const a of AREAS) {
    const opt = el("option", "", a.id);
    opt.value = a.id;
    areaSelect.append(opt);
  }
  row1.append(titleInput, areaSelect);

  const descInput = el("textarea", "wl-textarea");
  descInput.rows = 4;
  descInput.maxLength = 1200;
  descInput.placeholder = "补充使用场景或痛点（选填，最多 1200 字；也可以直接 Ctrl/⌘+V 粘贴截图）";

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

  const pickBtn = el("button", "wl-pick", "上传截图");
  pickBtn.type = "button";
  const uploadHint = el("span", "wl-hint", "可选，最多 2 张；支持拖拽或粘贴截图，自动压缩");
  const previewWrap = el("div", "wl-previews");
  uploadBox.append(fileInput, pickBtn, uploadHint, previewWrap);

  const rowFoot = el("div", "wl-form-foot");
  const authorInput = el("input", "wl-author");
  authorInput.type = "text";
  authorInput.maxLength = 24;
  authorInput.placeholder = "昵称（选填，默认匿名）";
  const msgEl = el("span", "wl-msg");
  const submitBtn = el("button", "wl-submit", "提交到 TODO");
  submitBtn.type = "submit";
  rowFoot.append(authorInput, msgEl, submitBtn);

  formCard.append(row1, descInput, hpInput, uploadBox, rowFoot);
  composeDialog.append(composeHead, formCard);
  composeOverlay.append(composeDialog);

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
  lbImg.alt = "截图预览";
  const lbClose = el("button", "wl-lb-close", "×");
  lbClose.type = "button";
  lbClose.setAttribute("aria-label", "关闭预览");
  lightbox.append(lbImg, lbClose);

  root.append(toolbar, statusHint, boardEl, adminBar, composeOverlay, detailOverlay, lightbox);

  // ---------- Modals & Previews ----------
  function openCompose() {
    msgEl.textContent = "";
    msgEl.classList.remove("is-err");
    composeOverlay.hidden = false;
    setTimeout(() => titleInput.focus(), 20);
  }
  function closeCompose() {
    composeOverlay.hidden = true;
  }
  addTopBtn.addEventListener("click", openCompose);
  composeClose.addEventListener("click", closeCompose);
  composeOverlay.addEventListener("click", (e) => {
    if (e.target === composeOverlay) closeCompose();
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
    if (!composeOverlay.hidden) return closeCompose();
  });

  function renderPreviews() {
    previewWrap.innerHTML = "";
    pendingImages.forEach((img, idx) => {
      const box = el("div", "wl-prev");
      const thumb = el("img");
      thumb.src = img.dataUrl;
      thumb.alt = img.name || "截图预览";
      const rm = el("button", "wl-prev-rm", "×");
      rm.type = "button";
      rm.setAttribute("aria-label", "移除截图");
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
    msgEl.textContent = "正在压缩截图…";
    msgEl.classList.remove("is-err");
    try {
      for (const f of files) {
        if (pendingImages.length >= 2) {
          msgEl.textContent = "每次最多上传 2 张截图";
          break;
        }
        const dataUrl = await compressImage(f);
        pendingImages.push({ dataUrl, name: f.name || "screenshot" });
      }
      if (pendingImages.length <= 2 && msgEl.textContent === "正在压缩截图…") msgEl.textContent = "";
      renderPreviews();
    } catch (err) {
      msgEl.textContent = err.message || "处理截图失败";
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

  // ---------- Voting ----------
  async function toggleVote(item, onUpdated) {
    const prevVoted = item.voted;
    const prevVotes = item.votes;
    item.voted = !prevVoted;
    item.votes = Math.max(0, prevVotes + (item.voted ? 1 : -1));
    onUpdated();

    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "vote", id: item.id, voterId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "投票失败");
      item.votes = data.votes;
      item.voted = data.voted;
      onUpdated();
      if (sortMode === "top") renderBoard();
    } catch (err) {
      item.voted = prevVoted;
      item.votes = prevVotes;
      onUpdated();
      statusHint.textContent = err.message || "投票失败";
      statusHint.classList.add("is-err");
    }
  }

  // ---------- Card Detail Modal ----------
  function openDetail(it) {
    activeItem = it;
    detailDialog.innerHTML = "";
    const col = COL_MAP[it.status] || COLUMNS[0];

    const head = el("div", "wl-modal-head");
    const tags = el("div", "wl-detail-tags");
    tags.append(
      el("span", `wl-label ${AREA_CLS[it.area] || "is-deck"}`, it.area || "Agent Deck"),
      el("span", `wl-status ${col.cls}`, col.title),
    );
    const closeBtn = el("button", "wl-x", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "关闭");
    closeBtn.addEventListener("click", closeDetail);
    head.append(tags, closeBtn);

    const topRow = el("div", "wl-detail-top");
    const voteBtn = el("button", `wl-vote wl-vote--lg${it.voted ? " on" : ""}`);
    voteBtn.type = "button";
    voteBtn.append(el("span", "wl-arrow", "▲"), el("b", "", String(it.votes || 0)));
    const syncVoteUi = () => {
      voteBtn.classList.toggle("on", Boolean(it.voted));
      voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
      voteBtn.querySelector("b").textContent = String(it.votes || 0);
      renderBoard();
    };
    voteBtn.addEventListener("click", () => toggleVote(it, syncVoteUi));

    const titleWrap = el("div", "wl-detail-title");
    titleWrap.append(
      el("h3", "", it.title),
      el("div", "wl-who", `${it.author || "匿名用户"} · ${fmtTime(it.createdAt)}`),
    );
    topRow.append(voteBtn, titleWrap);

    detailDialog.append(head, topRow);

    if (it.desc) {
      detailDialog.append(el("p", "wl-detail-desc", it.desc));
    }

    if (Array.isArray(it.images) && it.images.length) {
      const imgs = el("div", "wl-detail-imgs");
      for (const imgId of it.images) {
        const src = `${API}?img=${encodeURIComponent(imgId)}`;
        const b = el("button", "wl-detail-img");
        b.type = "button";
        const img = el("img");
        img.src = src;
        img.alt = `${it.title} 截图`;
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
      note.append(el("b", "", "作者回复："), document.createTextNode(it.authorNote));
      detailDialog.append(note);
    }

    if (adminToken) {
      const adm = el("div", "wl-adm-box");
      adm.append(el("div", "wl-adm-title", "移动列表 / 回复（作者管理）"));
      const admRow = el("div", "wl-adm-row");
      const sel = el("select", "wl-adm-sel");
      for (const c of COLUMNS) {
        const o = el("option", "", c.title);
        o.value = c.id;
        if (it.status === c.id) o.selected = true;
        sel.append(o);
      }
      const noteIn = el("input", "wl-adm-in");
      noteIn.type = "text";
      noteIn.value = it.authorNote || "";
      noteIn.placeholder = "官方回复（选填）";

      const saveBtn = el("button", "wl-adm-btn", "保存并移动");
      saveBtn.type = "button";
      saveBtn.addEventListener("click", async () => {
        saveBtn.disabled = true;
        try {
          const r = await fetch(API, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
            body: JSON.stringify({ id: it.id, status: sel.value, authorNote: noteIn.value }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || "保存失败");
          Object.assign(it, data.item);
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
        closeDetail();
        renderToolbar();
        renderBoard();
      });

      admRow.append(sel, noteIn, saveBtn, delBtn);
      adm.append(admRow);
      detailDialog.append(adm);
    }

    detailOverlay.hidden = false;
  }

  // ---------- Toolbar & Kanban Board ----------
  function renderToolbar() {
    areaGroup.innerHTML = "";
    const counts = { all: items.length };
    for (const it of items) counts[it.area] = (counts[it.area] || 0) + 1;

    for (const [id, label] of [["all", "全部模块"], ...AREAS.map((a) => [a.id, a.id])]) {
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
      ["top", "最热投票"],
      ["new", "最新提交"],
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
      img.alt = `${it.title} 截图`;
      img.loading = "lazy";
      cover.append(img);
      if (it.images.length > 1) {
        cover.append(el("span", "wl-card-imgn", `+${it.images.length - 1}`));
      }
      card.append(cover);
    }

    const head = el("div", "wl-card-top");
    head.append(el("span", `wl-label ${AREA_CLS[it.area] || "is-deck"}`, it.area || "Agent Deck"));
    card.append(head);

    card.append(el("h3", "wl-card-title", it.title));

    if (it.desc) {
      card.append(el("p", "wl-card-desc", it.desc));
    }

    if (it.authorNote) {
      const reply = el("div", "wl-card-note");
      reply.append(el("b", "", "回复："), document.createTextNode(it.authorNote));
      card.append(reply);
    }

    const foot = el("div", "wl-card-foot");
    foot.append(el("span", "wl-who", `${it.author || "匿名"} · ${fmtTime(it.createdAt).slice(5)}`));

    const voteBtn = el("button", `wl-vote-pill${it.voted ? " on" : ""}`);
    voteBtn.type = "button";
    voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
    voteBtn.setAttribute("aria-label", `为「${it.title}」投票`);
    voteBtn.append(el("span", "wl-arrow", "▲"), el("b", "", String(it.votes || 0)));
    voteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleVote(it, () => {
        voteBtn.classList.toggle("on", Boolean(it.voted));
        voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
        voteBtn.querySelector("b").textContent = String(it.votes || 0);
      });
    });

    foot.append(voteBtn);
    card.append(foot);
    return card;
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    const filtered = items.filter((it) => filterArea === "all" || it.area === filterArea);
    const sorted = filtered.slice().sort((a, b) => {
      if (sortMode === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return (b.votes || 0) - (a.votes || 0) || (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    for (const col of COLUMNS) {
      const colItems = sorted.filter((it) => (COL_MAP[it.status] ? it.status : "pending") === col.id);
      const colEl = el("section", `wl-col ${col.cls}`);

      const head = el("header", "wl-col-head");
      const titleWrap = el("div", "wl-col-title");
      titleWrap.append(el("span", "wl-col-dot"), el("h3", "", col.title));
      const count = el("span", "wl-col-count", String(colItems.length));
      head.append(titleWrap, count);

      const sub = el("div", "wl-col-sub", col.sub);
      const list = el("div", "wl-col-list");

      if (!colItems.length) {
        list.append(el("div", "wl-col-empty", col.id === "pending" ? "还没有新提议，点下方添加第一张卡片" : "暂无卡片"));
      } else {
        for (const it of colItems) list.append(buildCard(it));
      }

      colEl.append(head, sub, list);

      if (col.id === "pending") {
        const addBtn = el("button", "wl-col-add", "+ 添加一张功能卡片");
        addBtn.type = "button";
        addBtn.addEventListener("click", openCompose);
        colEl.append(addBtn);
      }

      boardEl.append(colEl);
    }
  }

  // ---------- Form Submit ----------
  formCard.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = titleInput.value.trim();
    if (title.length < 2) {
      msgEl.textContent = "标题至少写 2 个字";
      msgEl.classList.add("is-err");
      titleInput.focus();
      return;
    }
    submitBtn.disabled = true;
    msgEl.textContent = "正在提交…";
    msgEl.classList.remove("is-err");

    try {
      const r = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          title,
          desc: descInput.value.trim(),
          area: areaSelect.value,
          author: authorInput.value.trim(),
          images: pendingImages.map((x) => ({ dataUrl: x.dataUrl })),
          website: hpInput.value,
          voterId,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "提交失败");
      if (data.item) {
        items.unshift(data.item);
        filterArea = "all";
        renderToolbar();
        renderBoard();
      }
      titleInput.value = "";
      descInput.value = "";
      pendingImages = [];
      renderPreviews();
      closeCompose();
      statusHint.textContent = "已加入 TODO 列！";
      statusHint.classList.remove("is-err");
    } catch (err) {
      msgEl.textContent = err.message || "提交失败";
      msgEl.classList.add("is-err");
    } finally {
      submitBtn.disabled = false;
    }
  });

  // ---------- Admin Auth ----------
  adminToggle.addEventListener("click", () => {
    if (adminToken) {
      adminToken = "";
      try { sessionStorage.removeItem("matsuri_wl_admin"); } catch {}
      adminToggle.textContent = "作者管理";
      if (activeItem) openDetail(activeItem);
      return;
    }
    const t = prompt("输入管理员口令（WISHLIST_ADMIN_TOKEN）：");
    if (!t) return;
    adminToken = t.trim();
    try { sessionStorage.setItem("matsuri_wl_admin", adminToken); } catch {}
    adminToggle.textContent = "退出管理";
    if (activeItem) openDetail(activeItem);
  });
  if (adminToken) adminToggle.textContent = "退出管理";

  // ---------- Initial Load ----------
  async function load() {
    statusHint.textContent = "正在加载 Roadmap…";
    statusHint.classList.remove("is-err");
    try {
      const r = await fetch(`${API}?voterId=${encodeURIComponent(voterId)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "加载失败");
      items = Array.isArray(data.items) ? data.items : [];
      statusHint.textContent = "";
      renderToolbar();
      renderBoard();
    } catch (err) {
      statusHint.textContent = err.message || "暂时加载不出来，请稍后刷新";
      statusHint.classList.add("is-err");
      renderToolbar();
      renderBoard();
    }
  }

  load();
})();
