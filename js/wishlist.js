// 功能心愿单与投票（嵌入 /portfolio/journal-workflow/#wishlist）
(() => {
  const root = document.getElementById("wishlist-app");
  if (!root) return;

  const API = "/api/wishlist";
  const AREAS = ["Agent Deck", "螺旋日程", "双插件联动", "macOS 菜单栏"];
  const STATUS_META = {
    pending: { label: "待评估", cls: "is-pending" },
    planned: { label: "计划中", cls: "is-planned" },
    in_progress: { label: "开发中", cls: "is-progress" },
    done: { label: "已上线", cls: "is-done" },
  };

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
  let filterStatus = "all";
  let sortMode = "top";
  let pendingImages = []; // [{ dataUrl, name }]
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

  // ---------- Build Static Skeleton ----------
  root.innerHTML = "";

  const formCard = el("form", "card wl-form");
  formCard.noValidate = true;

  const row1 = el("div", "wl-row");
  const titleInput = el("input", "wl-input");
  titleInput.type = "text";
  titleInput.placeholder = "想要什么功能？（一句话标题，比如：支持一键把会话摘要导出成周报）";
  titleInput.maxLength = 80;
  titleInput.required = true;

  const areaSelect = el("select", "wl-select");
  areaSelect.setAttribute("aria-label", "所属模块");
  for (const a of AREAS) {
    const opt = el("option", "", a);
    opt.value = a;
    areaSelect.append(opt);
  }
  row1.append(titleInput, areaSelect);

  const descInput = el("textarea", "wl-textarea");
  descInput.rows = 3;
  descInput.maxLength = 1200;
  descInput.placeholder = "补充场景或痛点（选填，最多 1200 字；也可以直接 Ctrl/⌘+V 粘贴截图）";

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

  const pickBtn = el("button", "wl-pick", "选择截图");
  pickBtn.type = "button";
  const uploadHint = el("span", "wl-hint", "可选，最多 2 张；支持拖拽或直接粘贴截图，自动压缩");
  const previewWrap = el("div", "wl-previews");
  uploadBox.append(fileInput, pickBtn, uploadHint, previewWrap);

  const rowFoot = el("div", "wl-form-foot");
  const authorInput = el("input", "wl-author");
  authorInput.type = "text";
  authorInput.maxLength = 24;
  authorInput.placeholder = "昵称（选填，默认匿名）";

  const msgEl = el("span", "wl-msg");
  const submitBtn = el("button", "wl-submit", "提交功能建议");
  submitBtn.type = "submit";
  rowFoot.append(authorInput, msgEl, submitBtn);

  formCard.append(row1, descInput, hpInput, uploadBox, rowFoot);

  // Toolbar: status filters + sort
  const toolbar = el("div", "wl-bar");
  const filterGroup = el("div", "wl-filters");
  const sortGroup = el("div", "wl-sorts");
  toolbar.append(filterGroup, sortGroup);

  const listEl = el("div", "wl-list");

  // Admin footer bar
  const adminBar = el("div", "wl-admin-bar");
  const adminToggle = el("button", "wl-admin-link", "作者管理");
  adminToggle.type = "button";
  adminBar.append(adminToggle);

  // Lightbox
  const lightbox = el("div", "wl-lightbox");
  lightbox.hidden = true;
  const lbImg = el("img");
  lbImg.alt = "截图预览";
  const lbClose = el("button", "wl-lb-close", "×");
  lbClose.type = "button";
  lbClose.setAttribute("aria-label", "关闭预览");
  lightbox.append(lbImg, lbClose);

  root.append(formCard, toolbar, listEl, adminBar, lightbox);

  // ---------- Image Handling ----------
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

  // Lightbox events
  const closeLb = () => {
    lightbox.hidden = true;
    lbImg.removeAttribute("src");
  };
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target === lbClose) closeLb();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !lightbox.hidden) closeLb();
  });

  // ---------- Render Toolbar & List ----------
  function renderToolbar() {
    filterGroup.innerHTML = "";
    const counts = { all: items.length, pending: 0, planned: 0, in_progress: 0, done: 0 };
    for (const it of items) counts[it.status] = (counts[it.status] || 0) + 1;

    const defs = [
      ["all", "全部"],
      ["pending", "待评估"],
      ["planned", "计划中"],
      ["in_progress", "开发中"],
      ["done", "已上线"],
    ];
    for (const [k, label] of defs) {
      const btn = el("button", `wl-tab${filterStatus === k ? " on" : ""}`, `${label} (${counts[k] || 0})`);
      btn.type = "button";
      btn.addEventListener("click", () => {
        filterStatus = k;
        renderToolbar();
        renderList();
      });
      filterGroup.append(btn);
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
        renderList();
      });
      sortGroup.append(btn);
    }
  }

  async function toggleVote(item, btn) {
    const prevVoted = item.voted;
    const prevVotes = item.votes;
    item.voted = !prevVoted;
    item.votes = Math.max(0, prevVotes + (item.voted ? 1 : -1));
    btn.classList.toggle("on", item.voted);
    btn.querySelector("b").textContent = String(item.votes);

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
      btn.classList.toggle("on", item.voted);
      btn.querySelector("b").textContent = String(item.votes);
    } catch (err) {
      item.voted = prevVoted;
      item.votes = prevVotes;
      btn.classList.toggle("on", prevVoted);
      btn.querySelector("b").textContent = String(prevVotes);
      msgEl.textContent = err.message || "投票失败";
      msgEl.classList.add("is-err");
    }
  }

  function renderList() {
    listEl.innerHTML = "";
    let shown = items.filter((it) => filterStatus === "all" || it.status === filterStatus);
    shown = shown.slice().sort((a, b) => {
      if (sortMode === "new") return (b.createdAt || "").localeCompare(a.createdAt || "");
      return (b.votes || 0) - (a.votes || 0) || (b.createdAt || "").localeCompare(a.createdAt || "");
    });

    if (!shown.length) {
      const empty = el("div", "card wl-empty", items.length ? "这个状态下还没有条目。" : "还没有人提交功能建议，在上面写第一条吧。");
      listEl.append(empty);
      return;
    }

    for (const it of shown) {
      const card = el("article", "card wl-item");

      const voteBtn = el("button", `wl-vote${it.voted ? " on" : ""}`);
      voteBtn.type = "button";
      voteBtn.setAttribute("aria-pressed", String(Boolean(it.voted)));
      voteBtn.setAttribute("aria-label", `为「${it.title}」投票`);
      const arrow = el("span", "wl-arrow", "▲");
      const count = el("b", "", String(it.votes || 0));
      voteBtn.append(arrow, count);
      voteBtn.addEventListener("click", () => toggleVote(it, voteBtn));

      const body = el("div", "wl-body");
      const meta = el("div", "wl-meta");
      const area = el("span", "kind", it.area || "Agent Deck");
      const sm = STATUS_META[it.status] || STATUS_META.pending;
      const statusBadge = el("span", `wl-status ${sm.cls}`, sm.label);
      const author = el("span", "wl-who", `${it.author || "匿名用户"} · ${fmtTime(it.createdAt)}`);
      meta.append(area, statusBadge, author);

      const h3 = el("h3", "", it.title);
      body.append(meta, h3);

      if (it.desc) {
        body.append(el("p", "wl-desc", it.desc));
      }

      if (Array.isArray(it.images) && it.images.length) {
        const thumbs = el("div", "wl-thumbs");
        for (const imgId of it.images) {
          const src = `${API}?img=${encodeURIComponent(imgId)}`;
          const tBtn = el("button", "wl-thumb");
          tBtn.type = "button";
          const img = el("img");
          img.src = src;
          img.alt = `${it.title} 截图`;
          img.loading = "lazy";
          tBtn.append(img);
          tBtn.addEventListener("click", () => {
            lbImg.src = src;
            lightbox.hidden = false;
          });
          thumbs.append(tBtn);
        }
        body.append(thumbs);
      }

      if (it.authorNote) {
        const note = el("div", "wl-reply");
        const tag = el("b", "", "作者回复：");
        note.append(tag, document.createTextNode(it.authorNote));
        body.append(note);
      }

      if (adminToken) {
        const adm = el("div", "wl-adm-row");
        const sel = el("select", "wl-adm-sel");
        for (const [k, v] of Object.entries(STATUS_META)) {
          const o = el("option", "", v.label);
          o.value = k;
          if (it.status === k) o.selected = true;
          sel.append(o);
        }
        const noteIn = el("input", "wl-adm-in");
        noteIn.type = "text";
        noteIn.value = it.authorNote || "";
        noteIn.placeholder = "官方回复（选填）";

        const saveBtn = el("button", "wl-adm-btn", "保存");
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
            renderToolbar();
            renderList();
          } catch (err) {
            alert(err.message);
          } finally {
            saveBtn.disabled = false;
          }
        });

        const delBtn = el("button", "wl-adm-btn is-del", "删除");
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
          renderToolbar();
          renderList();
        });

        adm.append(sel, noteIn, saveBtn, delBtn);
        body.append(adm);
      }

      card.append(voteBtn, body);
      listEl.append(card);
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
        filterStatus = "all";
        renderToolbar();
        renderList();
      }
      titleInput.value = "";
      descInput.value = "";
      pendingImages = [];
      renderPreviews();
      msgEl.textContent = "已提交！";
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
      renderList();
      return;
    }
    const t = prompt("输入管理员口令（WISHLIST_ADMIN_TOKEN）：");
    if (!t) return;
    adminToken = t.trim();
    try { sessionStorage.setItem("matsuri_wl_admin", adminToken); } catch {}
    adminToggle.textContent = "退出管理";
    renderList();
  });
  if (adminToken) adminToggle.textContent = "退出管理";

  // ---------- Initial Load ----------
  async function load() {
    listEl.innerHTML = "";
    listEl.append(el("div", "card wl-empty", "正在加载心愿单…"));
    try {
      const r = await fetch(`${API}?voterId=${encodeURIComponent(voterId)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "加载失败");
      items = Array.isArray(data.items) ? data.items : [];
      renderToolbar();
      renderList();
    } catch (err) {
      listEl.innerHTML = "";
      listEl.append(el("div", "card wl-empty", err.message || "心愿单暂时加载不出来，请稍后刷新"));
    }
  }

  load();
})();
