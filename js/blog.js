// matsuri 主题的交互和动效。orb / 流光边框 / 液态金属按钮来自 window.FX（和 /demo/second-brain/ 共用的 fx.js），
// 没加载成功就只是少了这几样，页面照常能用
window.BLOG = true;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const FX = window.FX;
if (!FX) document.documentElement.classList.add("no-fx");   // 金属按钮套不上，CSS 就不再藏着原按钮
const hover = matchMedia("(hover: hover)").matches;
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- 顶栏、阅读进度、回到顶部 ---------- */
const head = $(".site-head"), bar = $(".progress");
let toTop = $(".to-top");
const wrapTop = document.createElement("div");
wrapTop.className = "to-top-wrap";
toTop.replaceWith(wrapTop);
wrapTop.append(toTop);
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  head.classList.toggle("scrolled", y > 8);
  wrapTop.classList.toggle("on", y > 600);
  if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
}
addEventListener("scroll", onScroll, { passive: true });
onScroll();

// 点开的小框：顶栏「作品集」下拉、作品集收尾的电话号码。点按钮开合，点别处或按 Esc 收起
function popover(root, btn) {
  const set = (open) => { root.classList.toggle("open", open); btn.setAttribute("aria-expanded", open); };
  btn.addEventListener("click", (e) => { e.preventDefault(); set(!root.classList.contains("open")); });
  document.addEventListener("click", (e) => { if (!root.contains(e.target)) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("open")) { set(false); btn.focus(); } });
}
for (const drop of $$(".menu-drop")) popover(drop, $(".menu-caret", drop));
for (const tel of $$(".pf-tel")) popover(tel, $("button", tel));

// 关于页大标题的故障效果：进页面 1.2 秒先闪一下，之后每隔 2.5～7 秒随机闪一下，每次半秒；页面在后台时不闪
if (!calm) for (const el of $$(".glitch")) {
  const next = (wait) => setTimeout(() => {
    if (document.hidden) return next(2000);
    el.classList.add("on");
    setTimeout(() => { el.classList.remove("on"); next(2500 + Math.random() * 4500); }, 500);
  }, wait);
  next(1200);
}
document.addEventListener("click", (e) => {
  if (e.target.closest(".to-top")) scrollTo({ top: 0, behavior: calm ? "auto" : "smooth" });
  const cta = e.target.closest(".cta");
  if (cta) location.href = cta.closest("[data-href]").dataset.href;
});

/* ---------- 项目页：每个 h2 连同下面的段落收成一张卡片 ---------- */
for (const prose of $$(".prose.as-cards")) {
  const grid = document.createElement("div");
  grid.className = "proj-grid";
  let card = null;
  for (const el of [...prose.children]) {
    if (el.tagName === "H2") {
      card = document.createElement("div");
      card.className = "card proj beam";
      grid.append(card);
    }
    if (card) card.append(el);
  }
  prose.append(grid);
}

/* ---------- 组件：orb、流光边框、金属按钮 ---------- */
if (FX) {
  const brand = $(".brand"), brandOrb = FX.orb("breathing", 20);
  $(".brand-orb").append(brandOrb.el);
  brand.addEventListener("mouseenter", () => brandOrb.set({ state: "working" }));
  brand.addEventListener("mouseleave", () => brandOrb.set({ state: "breathing" }));

  for (const slot of $$(".orb-slot")) {
    const orb = FX.orb(slot.dataset.orb, +slot.dataset.size || 20, { speed: 0.7 });   // 尺寸只能是 20、32、64，别的会报错画不出来
    slot.append(orb.el);
    const card = slot.closest(".card");
    card.addEventListener("mouseenter", () => orb.set({ speed: 1.6 }));
    card.addEventListener("mouseleave", () => orb.set({ speed: 0.7 }));
  }

  // 卡片：鼠标移上去时外圈走一道流光（demo 里回答卡片在生成时的同款）；触屏不挂
  if (hover) for (const card of $$(".beam")) {
    const beam = FX.beam(card, { size: "md", colorVariant: "ocean", active: false, borderRadius: 12, strength: 0.7, style: { height: "100%" } }, { height: "100%" });
    card.addEventListener("mouseenter", () => beam.set({ active: true }));
    card.addEventListener("mouseleave", () => beam.set({ active: false }));
  }

  for (const btn of $$(".cta, #sgo")) FX.metal(btn, { variant: "button", preset: "chromatic" });
  FX.metal(toTop, { variant: "circle", preset: "chromatic" });
}

/* ---------- 滚动出场：同一批进入视野的依次升起 ---------- */
const REVEAL = ".sec-head, .grid > *, .proj-grid > *, .prose:not(.as-cards) > *, .year li, .chips > *, .pj-log > li, .ab-sec .prose > ul > li";
const io = "IntersectionObserver" in window && !calm ? new IntersectionObserver((es) => {
  let k = 0;
  for (const e of es) {
    if (!e.isIntersecting) continue;
    const el = e.target;
    if (el.classList.contains("year")) el.classList.add("on");
    else { el.style.setProperty("--d", Math.min(k++, 8) * 60 + "ms"); el.classList.add("in"); }
    io.unobserve(el);
  }
}, { rootMargin: "0px 0px -6% 0px" }) : null;
for (const el of $$(REVEAL + ", .year")) io ? io.observe(el) : el.classList.add("in", "on");

/* ---------- 作品集页：数字滚进视野时从 0 数上去 ---------- */
const count = "IntersectionObserver" in window && !calm ? new IntersectionObserver((es) => {
  for (const e of es) {
    if (!e.isIntersecting) continue;
    count.unobserve(e.target);
    const el = e.target, n = +el.dataset.n, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / 1100);
      el.textContent = Math.round(n * (1 - (1 - k) ** 3));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
}) : null;
if (count) for (const el of $$(".pf-stats [data-n]")) count.observe(el);

/* ---------- 文章目录：按正文标题生成，滚动时高亮当前一节 ---------- */
const prose = $(".is-post .prose"), toc = $(".toc");
if (prose && toc) {
  const hs = $$(":scope > h1, :scope > h2, :scope > h3", prose);
  if (hs.length >= 2) {
    const top = Math.min(...hs.map((h) => +h.tagName[1]));
    const list = $(".toc-list"), ind = $(".toc-ind");
    const links = hs.map((h, i) => {
      if (!h.id) h.id = "s-" + (i + 1);
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent.replace(/^¶/, "").trim();
      if (+h.tagName[1] > top) a.className = "l3";
      list.append(a);
      return a;
    });
    toc.hidden = false;
    toc.parentElement.classList.add("has-toc");
    let cur = -1;
    const mark = () => {
      let i = 0;
      hs.forEach((h, j) => { if (h.getBoundingClientRect().top < 120) i = j; });
      if (i === cur) return;
      if (cur >= 0) links[cur].classList.remove("on");
      cur = i;
      const a = links[i];
      a.classList.add("on");
      ind.style.height = a.offsetHeight + "px";
      ind.style.transform = `translateY(${a.offsetTop}px)`;
    };
    addEventListener("scroll", mark, { passive: true });
    mark();
  }
}

// 脚注角标去掉方括号，和 demo 回答里的引用角标一个样子
for (const a of $$(".footnote-ref a")) a.textContent = a.textContent.replace(/[[\]]/g, "");

/* ---------- 正文图片点开看大图 ---------- */
document.addEventListener("click", (e) => {
  const img = e.target.closest(".prose img");
  if (!img || img.closest("a")) return;
  const box = document.createElement("div");
  box.className = "lightbox";
  box.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
  const close = () => { box.classList.add("out"); setTimeout(() => box.remove(), 200); removeEventListener("keydown", esc); };
  const esc = (k) => { if (k.key === "Escape") close(); };
  box.addEventListener("click", close);
  addEventListener("keydown", esc);
  document.body.append(box);
});

/* ---------- 归档搜索：标题、正文、分类、标签都搜，多个词要同时命中 ---------- */
const sf = $("#sf");
if (sf) {
  const input = $("#sq"), note = $(".search-note");
  for (const y of $$(".year")) y.dataset.n = $("small", y).textContent;
  const rows = $$(".year li").map((li) => ({ li, a: $("a", li), t: $(".t", li), title: $(".t", li).textContent }));
  let index = null, beam = null, calmDown = 0;
  const load = () => index || (index = fetch("/search.json").then((r) => r.json()));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const re = (terms) => new RegExp(terms.map((t) => esc(t).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  const light = (s, terms) => esc(s).replace(re(terms), "<mark>$&</mark>");
  if (FX) beam = FX.beam(input, { size: "md", colorVariant: "ocean", active: false, borderRadius: 10, style: { flex: 1, minWidth: 0 } }, { display: "flex" });

  async function run() {
    const q = input.value.trim();
    history.replaceState(null, "", q ? "?q=" + encodeURIComponent(q) : location.pathname);
    for (const r of rows) { r.li.classList.remove("miss"); r.t.textContent = r.title; $(".hit", r.li)?.remove(); }
    for (const y of $$(".year")) { y.classList.remove("miss"); $("small", y).textContent = y.dataset.n; }
    if (!q) { note.textContent = ""; return; }
    // 搜的时候外圈流光转起来，停手一会儿再收
    if (beam) { beam.set({ active: true }); clearTimeout(calmDown); calmDown = setTimeout(() => beam.set({ active: false }), 1200); }
    const terms = q.toLowerCase().split(/\s+/);
    const posts = await load();
    if (input.value.trim() !== q) return;
    const byUrl = new Map(posts.map((p) => [p.url, p]));
    let n = 0;
    for (const r of rows) {
      const p = byUrl.get(r.a.getAttribute("href"));
      const hay = p ? [p.title, ...p.cats, ...p.tags, p.text].join(" ").toLowerCase() : r.title.toLowerCase();
      const ok = terms.every((t) => hay.includes(t));
      r.li.classList.toggle("miss", !ok);
      if (!ok) continue;
      n++;
      r.t.innerHTML = light(r.title, terms);
      // 标题里没有的词，从正文里摘一段带出来
      const rest = terms.filter((t) => !r.title.toLowerCase().includes(t));
      if (p && rest.length) {
        const at = p.text.toLowerCase().indexOf(rest[0]);
        if (at >= 0) {
          const s = Math.max(0, at - 28), e = Math.min(p.text.length, at + rest[0].length + 48);
          const hit = document.createElement("span");
          hit.className = "hit";
          hit.innerHTML = (s ? "…" : "") + light(p.text.slice(s, e), terms) + (e < p.text.length ? "…" : "");
          r.li.append(hit);
        }
      }
    }
    for (const y of $$(".year")) {
      const k = $$("li:not(.miss)", y).length;
      y.classList.toggle("miss", !k);
      $("small", y).textContent = k + " 篇";
    }
    note.innerHTML = n ? `找到 <b>${n}</b> 篇` : "没有找到，换个词试试";
  }

  let t = 0;
  input.addEventListener("focus", load, { once: true });
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(run, 150); });
  sf.addEventListener("submit", (e) => { e.preventDefault(); clearTimeout(t); run(); });
  const q0 = new URLSearchParams(location.search).get("q");
  if (q0) { input.value = q0; run(); }
}
