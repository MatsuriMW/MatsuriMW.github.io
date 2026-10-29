/* 玻璃文件夹：照 21st.dev 的 Glass Folder Cards（React）改写成原生 JS，去掉了「+ 新建」和菜单，右下角的键改成链接。
   三层从后往前：背板（生成的流体纹理）、里面的文件、磨砂玻璃前板。悬停时前板往前倾、文件冒头；点开后前板倒得更低，文件升起扇开，每张都是链接。

   用法：<div class="gfolder" data-label="杂谈" data-meta="8 篇" data-art="aurora" data-seed="3" data-href="/categories/杂谈/" data-key="进分类页" data-autoopen="1200">
           <a href="/2021/…/" data-meta="2021">文章标题</a> …
         </div>
   没有 JS 时就是一串普通链接。 */
(function () {
  "use strict";

  // ---------- 生成纹理 ----------
  var PRESETS = {
    aurora: { style: "streak", colors: ["#f4efe9", "#e9c2b8", "#c2433f", "#2a1e2a", "#22395e", "#6f97c2", "#e5edf4"], scale: 0.7, warp: 1.4, angle: -0.62, gloss: 0.18, veins: 0 },
    ember: { style: "marble", colors: ["#07090c", "#16252c", "#3d5f68", "#1a1416", "#a3201a", "#ef4a2b", "#ff8a5c"], scale: 0.62, warp: 3.2, angle: -0.5, gloss: 0.55, veins: 0.6 },
    dusk: { style: "marble", colors: ["#120c18", "#3e2850", "#8f6c9c", "#2b1a24", "#b3502f", "#eab08a", "#fbe7d2"], scale: 0.75, warp: 3.6, angle: 0.8, gloss: 0.5, veins: 0.5 },
    glacier: { style: "streak", colors: ["#f7f8fa", "#d9e2ea", "#9fb4c7", "#e8edf2", "#bccbd8", "#ffffff"], scale: 0.7, warp: 1.6, angle: 0.35, gloss: 0.25, veins: 0 },
    verdant: { style: "marble", colors: ["#070b08", "#173024", "#4f7a5a", "#141812", "#a7843a", "#e9cf87", "#fbf3d6"], scale: 0.7, warp: 3.4, angle: 2.1, gloss: 0.5, veins: 0.5 }
  };

  function hexToRgb(hex) {
    var h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = /^[0-9a-f]{6}$/i.test(h) ? parseInt(h, 16) : 0x808080;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    return h >>> 0;
  }

  function makeFbm(seed) {
    var r = rng(seed), perm = new Uint8Array(512), grad = new Float32Array(512), p = [], i;
    for (i = 0; i < 256; i++) p.push(i);
    for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) perm[i] = p[i & 255];
    for (i = 0; i < 256; i++) { var a = r() * Math.PI * 2; grad[i * 2] = Math.cos(a); grad[i * 2 + 1] = Math.sin(a); }
    function noise(x, y) {
      var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, X = xi & 255, Y = yi & 255;
      var h00 = perm[X + perm[Y]] * 2, h10 = perm[X + 1 + perm[Y]] * 2, h01 = perm[X + perm[Y + 1]] * 2, h11 = perm[X + 1 + perm[Y + 1]] * 2;
      var d00 = grad[h00] * xf + grad[h00 + 1] * yf, d10 = grad[h10] * (xf - 1) + grad[h10 + 1] * yf;
      var d01 = grad[h01] * xf + grad[h01 + 1] * (yf - 1), d11 = grad[h11] * (xf - 1) + grad[h11 + 1] * (yf - 1);
      var u = xf * xf * xf * (xf * (xf * 6 - 15) + 10), v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
      return d00 + u * (d10 - d00) + v * (d01 - d00 + u * (d11 - d01 - d10 + d00));
    }
    return function (x, y, octaves) {
      var sum = 0, amp = 0.5;
      for (var o = 0; o < octaves; o++) {
        sum += amp * noise(x, y);
        var nx = 1.6 * x + 1.2 * y + 7.1;
        y = -1.2 * x + 1.6 * y + 3.3; x = nx; amp *= 0.5;
      }
      return sum;
    };
  }

  // 两次域扭曲的噪声场，按自身分位数归一化后当作液面高度打光；streak 先沿一个轴压扁，变成长曝光拖影。可以分几帧画完。
  function createArtJob(width, height, recipe, seed) {
    var w = Math.max(1, Math.round(width)), h = Math.max(1, Math.round(height));
    var colors = recipe.colors.length >= 2 ? recipe.colors : ["#111111", "#eeeeee"];
    var stops = colors.map(function (c, i) { return { t: i / (colors.length - 1), c: hexToRgb(c) }; });
    var scale = recipe.scale == null ? 0.7 : recipe.scale, warp = recipe.warp == null ? 3 : recipe.warp;
    var gloss = recipe.gloss == null ? 0.4 : recipe.gloss, veins = recipe.veins || 0, streak = recipe.style === "streak";
    var fbm = makeFbm(seed * 977 + 13), r = rng(seed + 1), ox = r() * 50, oy = r() * 50;
    var angle = (recipe.angle || 0) + (r() - 0.5) * 0.5, ca = Math.cos(angle), sa = Math.sin(angle), m = Math.min(w, h);
    // 半分辨率采样再用 Catmull-Rom 放大，坡度保持连续，打光看不出差别
    var gw = Math.ceil(w / 2) + 3, gh = Math.ceil(h / 2) + 3;
    var G = new Float32Array(gw * gh), GQ = new Float32Array(gw * gh), F = new Float32Array(w * h), Q = new Float32Array(w * h);
    var pixels = new Uint8ClampedArray(w * h * 4), row = 0;

    function field(gy) {
      for (var gx = 0; gx < gw; gx++) {
        var u = ((gx - 1) * 2 - w / 2) / m, v = ((gy - 1) * 2 - h / 2) / m;
        var px = (u * ca - v * sa) * scale, py = (u * sa + v * ca) * scale;
        if (streak) { px *= 0.14; py *= 2.2; }
        px += ox; py += oy;
        var qx = fbm(px, py, 3), qy = fbm(px + 5.2, py + 1.3, 3);
        var rx = fbm(px + warp * qx + 1.7, py + warp * qy + 9.2, 3), ry = fbm(px + warp * qx + 8.3, py + warp * qy + 2.8, 3);
        G[gy * gw + gx] = fbm(px + warp * rx, py + warp * ry, 4);
        GQ[gy * gw + gx] = Math.sqrt(qx * qx + qy * qy);
      }
    }

    function upsample() {
      function cr(a, b, c, d) { return (-a + 9 * b + 9 * c - d) / 16; }
      var T = new Float32Array(w * gh), x, y, c;
      for (var gy = 0; gy < gh; gy++) {
        var rr = gy * gw;
        for (x = 0; x < w; x++) { c = (x >> 1) + 1; T[gy * w + x] = x & 1 ? cr(G[rr + c - 1], G[rr + c], G[rr + c + 1], G[rr + c + 2]) : G[rr + c]; }
      }
      for (y = 0; y < h; y++) {
        c = (y >> 1) + 1;
        for (x = 0; x < w; x++) {
          F[y * w + x] = y & 1 ? cr(T[(c - 1) * w + x], T[c * w + x], T[(c + 1) * w + x], T[(c + 2) * w + x]) : T[c * w + x];
          var gx = (x >> 1) + 1, q0 = GQ[c * gw + gx];
          var qx = x & 1 ? (q0 + GQ[c * gw + gx + 1]) / 2 : q0;
          var q1 = y & 1 ? (x & 1 ? (GQ[(c + 1) * gw + gx] + GQ[(c + 1) * gw + gx + 1]) / 2 : GQ[(c + 1) * gw + gx]) : qx;
          Q[y * w + x] = (qx + q1) / 2;
        }
      }
    }

    function colorize() {
      var sample = [], stride = Math.max(1, Math.floor(F.length / 4096)), i;
      for (i = 0; i < F.length; i += stride) sample.push(F[i]);
      sample.sort(function (a, b) { return a - b; });
      var lo = sample[Math.floor(sample.length * 0.02)], hi = sample[Math.floor(sample.length * 0.98)], k = 1 / (hi - lo || 1);
      var lx = -0.55, ly = -0.65, lz = 0.52, slope = k * m * 0.012;
      for (var y = 0; y < h; y++) {
        for (var x = 0; x < w; x++) {
          i = y * w + x;
          var t = (F[i] - lo) * k; t = t < 0 ? 0 : t > 1 ? 1 : t;
          var j = 1; while (j < stops.length - 1 && stops[j].t < t) j++;
          var a = stops[j - 1], b = stops[j], f = (t - a.t) / (b.t - a.t || 1);
          f = f < 0 ? 0 : f > 1 ? 1 : f; f = f * f * (3 - 2 * f);
          var gx = (F[x < w - 1 ? i + 1 : i] - F[x > 0 ? i - 1 : i]) * slope;
          var gy = (F[y < h - 1 ? i + w : i] - F[y > 0 ? i - w : i]) * slope;
          var nd = (-gx * lx - gy * ly + lz) / Math.sqrt(gx * gx + gy * gy + 1);
          var spec = Math.pow(nd > 0 ? nd : 0, 24) * gloss * 255;
          var silk = 1 + 0.035 * Math.sin(t * 150 + Q[i] * 24);
          var vein = veins * Math.max(0, 1 - Math.abs(Q[i] - 0.42) * 14) * 0.6;
          var lit = (0.82 + 0.28 * nd) * silk * (1 - vein);
          pixels[i * 4] = (a.c[0] + (b.c[0] - a.c[0]) * f) * lit + spec;
          pixels[i * 4 + 1] = (a.c[1] + (b.c[1] - a.c[1]) * f) * lit + spec;
          pixels[i * 4 + 2] = (a.c[2] + (b.c[2] - a.c[2]) * f) * lit + spec;
          pixels[i * 4 + 3] = 255;
        }
      }
    }

    return {
      width: w, height: h, pixels: pixels,
      step: function (rows) {
        if (row >= gh) return true;
        var end = Math.min(gh, row + Math.max(1, rows));
        while (row < end) field(row++);
        if (row < gh) return false;
        upsample(); colorize();
        return true;
      }
    };
  }

  // 全页共用一个画师：每帧只花几毫秒，一排文件夹也不卡；背板（0）先于文件（1）
  var cache = new Map(), queue = [], pumping = false;
  function pump() {
    if (pumping) return;
    pumping = true;
    function tick() {
      var until = performance.now() + 7;
      while (queue.length && performance.now() < until) {
        var head = queue[0];
        if (head.job.step(4)) {
          queue.shift();
          var c = document.createElement("canvas");
          c.width = head.job.width; c.height = head.job.height;
          c.getContext("2d").putImageData(new ImageData(head.job.pixels, c.width, c.height), 0, 0);
          head.done(c);
        }
      }
      if (queue.length) requestAnimationFrame(tick); else pumping = false;
    }
    requestAnimationFrame(tick);
  }
  function paint(recipe, seed, w, h, priority) {
    var key = JSON.stringify([recipe, seed, w, h]), p = cache.get(key);
    if (!p) {
      p = new Promise(function (done) {
        var at = queue.length;
        while (at > 1 && queue[at - 1].priority > priority) at--;
        queue.splice(at, 0, { job: createArtJob(w, h, recipe, seed), priority: priority, done: done });
        pump();
      });
      cache.set(key, p);
    }
    return p;
  }
  function artCanvas(art, seed, w, h, density, priority, cls) {
    var c = document.createElement("canvas");
    c.className = cls; c.setAttribute("aria-hidden", "true");
    c.style.width = w + "px"; c.style.height = h + "px"; c.style.maxWidth = "none";
    var recipe = PRESETS[art] || PRESETS.aurora;
    paint(recipe, seed, Math.round(w * density), Math.round(h * density), priority).then(function (src) {
      c.width = src.width; c.height = src.height;
      c.getContext("2d").drawImage(src, 0, 0);
      c.setAttribute("data-ready", "");
    });
    return c;
  }

  // ---------- 几何：舞台按 340 × 272 画，再整体缩放 ----------
  var W = 340, H = 272, HEADROOM = 54, FRONT_H = H - 74, MAX_VISIBLE = 4;
  var BACK_PATH = "M0 56A22 22 0 0 1 22 34L146 34C170 34 172 0 198 0L318 0A22 22 0 0 1 340 22L340 250A22 22 0 0 1 318 272L22 272A22 22 0 0 1 0 250Z";
  var FRONT_PATH = "M0 22A22 22 0 0 1 22 0L118 0C144 0 146 32 172 32L318 32A22 22 0 0 1 340 54L340 " + (FRONT_H - 22) +
    "A22 22 0 0 1 318 " + FRONT_H + "L22 " + FRONT_H + "A22 22 0 0 1 0 " + (FRONT_H - 22) + "Z";
  var SVG = "http://www.w3.org/2000/svg", uid = 0;

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }
  function svgRim(cls, h, path, stroke, parent) {
    var s = document.createElementNS(SVG, "svg");
    s.setAttribute("class", "gf-rim " + cls); s.setAttribute("viewBox", "0 0 " + W + " " + h); s.setAttribute("aria-hidden", "true");
    s.innerHTML = stroke || "";
    var p = document.createElementNS(SVG, "path"); p.setAttribute("d", path);
    s.appendChild(p); parent.appendChild(s);
    return { svg: s, path: p };
  }

  function mount(root) {
    var d = root.dataset, id = ++uid;
    var files = Array.prototype.map.call(root.querySelectorAll(":scope > a"), function (a) {
      return { name: a.textContent.trim(), href: a.getAttribute("href"), meta: a.dataset.meta || "", art: a.dataset.art || "" };
    });
    var label = d.label || "", place = d.place || "bottom-left";
    // 网格里按自己那一格算宽度，别的地方按父元素的内容宽度
    var box = root.parentElement, cs = getComputedStyle(box);
    var room = cs.display === "grid" ? parseFloat(cs.gridTemplateColumns)
      : box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var width = Math.min(+d.width || 320, room > 0 ? room : 320);
    var k = width / W, density = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1)) * k;

    root.textContent = "";
    root.classList.add("gf-root");
    root.dataset.place = place;
    root.style.width = width + "px";
    root.style.height = (H + HEADROOM) * k + "px";

    var stage = el("div", "gf-stage", root);
    stage.style.transform = "translateY(" + HEADROOM * k + "px) scale(" + k + ")";
    var tilt = el("div", "gf-tilt", stage);
    el("div", "gf-shadow", tilt).setAttribute("aria-hidden", "true");

    var back = el("div", "gf-back", tilt);
    back.style.clipPath = "path('" + BACK_PATH + "')";
    back.setAttribute("aria-hidden", "true");
    if (d.art !== "none") back.appendChild(artCanvas(d.art, +d.seed || 3, W + 24, H + 24, density, 0, "gf-art"));
    el("div", "gf-back-sheen", back);
    svgRim("gf-back-rim", H, BACK_PATH, "", tilt);

    var front = el("div", "gf-front", tilt);
    front.style.clipPath = "path('" + FRONT_PATH + "')";
    el("div", "gf-tint", front).setAttribute("aria-hidden", "true");
    el("div", "gf-spec", front).setAttribute("aria-hidden", "true");
    var rim = svgRim("gf-front-rim", FRONT_H,
      FRONT_PATH,
      '<defs><linearGradient id="gf-rim-' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient></defs>',
      front);
    rim.path.setAttribute("stroke", "url(#gf-rim-" + id + ")");
    var hit = el("button", "gf-hit", front);
    hit.type = "button";
    var lab = el("div", "gf-label", front);
    el("span", "gf-title", lab).textContent = label;
    el("span", "gf-meta", lab).textContent = d.meta || files.length + " 项";

    // 文件：Tab 顺序在玻璃后面，画面上在玻璃下面；最新的放在最前，贴着玻璃
    var pile = el("div", "gf-files", tilt);
    pile.setAttribute("role", "list");
    pile.setAttribute("aria-label", label + " 里的内容");
    var visible = files.slice(0, MAX_VISIBLE).reverse();
    visible.forEach(function (f, v) {
      var slot = visible.length <= 1 ? 0 : (v / (visible.length - 1)) * 2 - 1;
      var jitter = rng(hashString(f.name) + v);
      var a = el("a", "gf-sheet" + (f.art ? " gf-sheet--art" : ""), pile);
      a.href = f.href;
      a.setAttribute("role", "listitem");
      a.style.setProperty("--gf-slot", slot);
      a.style.setProperty("--gf-depth", visible.length - 1 - v);
      a.style.setProperty("--gf-jx", ((jitter() - 0.5) * 10).toFixed(2) + "px");
      a.style.setProperty("--gf-jr", ((jitter() - 0.5) * 3.2).toFixed(2) + "deg");
      a.style.zIndex = v + 1;
      if (f.art) {
        a.appendChild(artCanvas(f.art, hashString(f.name) % 997, 272, 184, Math.min(density, 1.25), 1, "gf-sheet-art"));
      } else {
        var lines = el("span", "gf-lines", a);
        lines.setAttribute("aria-hidden", "true");
        ["86%", "92%", "64%", "88%", "42%"].forEach(function (wd) { el("i", "", lines).style.width = wd; });
      }
      var head = el("span", "gf-sheet-head", a);
      el("span", "gf-sheet-name", head).textContent = f.name;
      if (f.meta) el("span", "gf-sheet-meta", head).textContent = f.meta;
    });

    if (d.href) {
      var key = el("a", "gf-key", tilt);
      key.href = d.href;
      key.setAttribute("aria-label", d.key || "打开 " + label);
      key.title = d.key || "";
      key.innerHTML = '<svg class="gf-glyph" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    }

    // ---- 开合 ----
    function setOpen(open) {
      root.toggleAttribute("data-open", open);
      pile.toggleAttribute("inert", !open);
      hit.setAttribute("aria-expanded", open);
      hit.setAttribute("aria-label", (open ? "合上 " : "打开 ") + label + "，" + (d.meta || files.length + " 项"));
    }
    setOpen(false);
    hit.addEventListener("click", function () { setOpen(!root.hasAttribute("data-open")); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.hasAttribute("data-open")) { setOpen(false); hit.focus(); }
    });
    document.addEventListener("pointerdown", function (e) {
      if (root.hasAttribute("data-open") && !root.contains(e.target)) setOpen(false);
    });

    // ---- 光和视差跟着指针，不重排 ----
    var raf = 0, px = 0, py = 0;
    function write() { raf = 0; root.style.setProperty("--gf-px", px.toFixed(3)); root.style.setProperty("--gf-py", py.toFixed(3)); }
    root.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = root.getBoundingClientRect();
      px = ((e.clientX - r.left) / r.width) * 2 - 1;
      py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!raf) raf = requestAnimationFrame(write);
    });
    root.addEventListener("pointerleave", function () { px = 0; py = 0; if (!raf) raf = requestAnimationFrame(write); });

    // ---- 第一次滚进视野时自己组装起来 ----
    if (!("IntersectionObserver" in window)) { root.setAttribute("data-entered", ""); if (d.autoopen) setOpen(true); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      io.disconnect();
      setTimeout(function () {
        root.setAttribute("data-entered", "");
        // data-autoopen：组装好之后再等这么多毫秒自己摊开
        if (d.autoopen) setTimeout(function () { setOpen(true); }, +d.autoopen);
      }, +d.delay || 0);
    }, { threshold: 0.25 });
    io.observe(root);
  }

  document.querySelectorAll(".gfolder").forEach(mount);
})();
