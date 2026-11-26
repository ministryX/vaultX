/* VaultX website — progressive enhancement only (every page works without JavaScript). */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  root.classList.remove("no-js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const store = {
    get(k) {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* private mode: ignore */
      }
    },
  };

  /* ---------------------------------------------------------------- theme */
  const systemDark = matchMedia("(prefers-color-scheme: dark)");
  const effective = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
  const syncThemeButtons = () =>
    $$(".theme-toggle").forEach((b) => {
      const dark = effective() === "dark";
      b.setAttribute("aria-pressed", String(dark));
      b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
      b.title = b.getAttribute("aria-label");
    });
  if (!root.dataset.theme) root.dataset.theme = effective();
  syncThemeButtons();
  $$(".theme-toggle").forEach((b) =>
    b.addEventListener("click", () => {
      root.dataset.theme = effective() === "dark" ? "light" : "dark";
      store.set("vx-theme", root.dataset.theme);
      syncThemeButtons();
    }),
  );
  systemDark.addEventListener?.("change", () => {
    if (!store.get("vx-theme")) {
      root.dataset.theme = systemDark.matches ? "dark" : "light";
      syncThemeButtons();
    }
  });

  /* ---------------------------------------------------------------- header + mobile nav */
  const header = $(".site-header");
  const onScroll = () => header?.classList.toggle("is-scrolled", scrollY > 8);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  const menu = $(".menu-toggle");
  menu?.addEventListener("click", () => {
    const open = document.body.classList.toggle("nav-open");
    menu.setAttribute("aria-expanded", String(open));
  });
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.body.classList.remove("nav-open");
      menu?.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------------------------------------------------------------- reveal on scroll (staggered) */
  const reveals = $$(".reveal");
  if (reduced || !("IntersectionObserver" in window)) reveals.forEach((el) => el.classList.add("in"));
  else {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    $$("[data-stagger]").forEach((group) => $$(".reveal", group).forEach((el, i) => el.style.setProperty("--d", `${i * 70}ms`)));
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------------------------------------------------------------- card spotlight follows the pointer */
  $$(".card.spot").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }),
  );

  /* ---------------------------------------------------------------- tabs (ARIA, arrow keys, ?tab= / #hash) */
  $$("[data-tabs]").forEach((wrap) => {
    const tabs = $$('[role="tab"]', wrap);
    const select = (tab, focus = false) => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      });
      if (focus) tab.focus();
      if (wrap.dataset.tabs) store.set(`vx-tab-${wrap.dataset.tabs}`, tab.id);
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(t));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length], true);
      });
    });
    const fromHash = tabs.find((t) => `#${t.id}` === location.hash);
    const remembered = wrap.dataset.tabs ? tabs.find((t) => t.id === store.get(`vx-tab-${wrap.dataset.tabs}`)) : null;
    const auto = wrap.dataset.auto ? tabs.find((t) => t.dataset.match && new RegExp(t.dataset.match, "i").test(navigator.userAgent)) : null;
    select(fromHash || remembered || auto || tabs[0]);
  });

  /* ---------------------------------------------------------------- lightbox */
  const lb = document.createElement("div");
  lb.className = "lightbox";
  lb.setAttribute("role", "dialog");
  lb.setAttribute("aria-modal", "true");
  lb.setAttribute("aria-label", "Screenshot");
  lb.innerHTML = '<figure style="margin:0"><img alt=""><figcaption></figcaption></figure>';
  document.body.append(lb);
  let lastFocus = null;
  const closeLb = () => {
    lb.classList.remove("open");
    lastFocus?.focus?.();
  };
  lb.addEventListener("click", closeLb);
  addEventListener("keydown", (e) => e.key === "Escape" && lb.classList.contains("open") && closeLb());
  $$(".shot").forEach((s) => {
    const img = $("img", s);
    if (!img) return;
    s.tabIndex = 0;
    s.setAttribute("role", "button");
    s.setAttribute("aria-label", `Enlarge: ${img.alt}`);
    const open = () => {
      lastFocus = s;
      $("img", lb).src = img.currentSrc || img.src;
      $("img", lb).alt = img.alt;
      $("figcaption", lb).textContent = img.alt;
      lb.classList.add("open");
    };
    s.addEventListener("click", open);
    s.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open()));
  });

  /* ---------------------------------------------------------------- toast + copy buttons */
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.append(toast);
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1600);
  };
  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      say("Copied to clipboard");
    } catch {
      say("Copy failed — select the text instead");
    }
  };
  $$(".code").forEach((block) => {
    const pre = $("pre", block);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => copy(pre.innerText.replace(/^\$ /gm, "").trim()));
    block.append(btn);
  });

  /* ---------------------------------------------------------------- table of contents scroll-spy */
  const tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    const map = new Map(tocLinks.map((a) => [a.getAttribute("href").slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          tocLinks.forEach((a) => a.classList.remove("active"));
          map.get(e.target.id)?.classList.add("active");
        }),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    map.forEach((_a, id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------------------------------------------------------------- animated counters */
  const counters = $$("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduced) {
    const co = new IntersectionObserver((entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        co.unobserve(e.target);
        const el = e.target;
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const t0 = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / 1100);
          el.textContent = `${Math.round(end * (1 - Math.pow(1 - p, 3)))}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
    );
    counters.forEach((c) => co.observe(c));
  }

  /* ---------------------------------------------------------------- password generator demo (same idea as VaultX) */
  const demo = $("#generator-demo");
  if (demo && window.crypto?.getRandomValues) {
    const SETS = { lower: "abcdefghijklmnopqrstuvwxyz", upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", digits: "0123456789", symbols: "!@#$%^&*()-_=+[]{};:,.<>?/~" };
    const AMBIGUOUS = new Set("Il1O0o|`'\"");
    const out = $(".demo-pw", demo);
    const len = $("#gen-length", demo);
    const lenOut = $("#gen-length-out", demo);
    const label = $(".strength", demo);
    const bits = $("#gen-bits", demo);
    const bar = $(".meter span", demo);
    // Unbiased random integer in [0, n) (rejection sampling), as in VaultX's generator.
    const rand = (n) => {
      const lim = Math.floor(0x100000000 / n) * n;
      const buf = new Uint32Array(1);
      for (;;) {
        crypto.getRandomValues(buf);
        if (buf[0] < lim) return buf[0] % n;
      }
    };
    const options = () => Object.fromEntries($$("input[type=checkbox]", demo).map((c) => [c.name, c.checked]));
    let current = "";
    const generate = () => {
      const o = options();
      const sets = ["lower", "upper", "digits", "symbols"].filter((k) => o[k]).map((k) => [...SETS[k]].filter((c) => !o.ambiguous || !AMBIGUOUS.has(c)));
      if (!sets.length) return;
      const n = Number(len.value);
      const all = sets.flat();
      const chars = sets.map((s) => s[rand(s.length)]);
      while (chars.length < n) chars.push(all[rand(all.length)]);
      for (let i = chars.length - 1; i > 0; i--) {
        const j = rand(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      current = chars.join("");
      out.replaceChildren(
        ...chars.map((c) => {
          const s = document.createElement("span");
          s.textContent = c;
          if (/[0-9]/.test(c)) s.className = "d";
          else if (!/[A-Za-z]/.test(c)) s.className = "s";
          return s;
        }),
      );
      const entropy = Math.floor(n * Math.log2(all.length));
      bits.textContent = `≈ ${entropy} bits of entropy`;
      const [text, color] = entropy >= 100 ? ["Very strong", "var(--success)"] : entropy >= 75 ? ["Strong", "#16a34a"] : entropy >= 55 ? ["Fair", "var(--warning)"] : ["Weak", "var(--danger)"];
      label.textContent = text;
      label.style.color = color;
      bar.style.width = `${Math.min(100, (entropy / 128) * 100)}%`;
      lenOut.textContent = n;
    };
    // At least one character type stays on.
    $$("input[type=checkbox]", demo).forEach((c) =>
      c.addEventListener("change", () => {
        const o = options();
        if (!o.lower && !o.upper && !o.digits && !o.symbols) c.checked = true;
        generate();
      }),
    );
    len.addEventListener("input", generate);
    $("#gen-again", demo).addEventListener("click", generate);
    $("#gen-copy", demo).addEventListener("click", () => copy(current));
    generate();
  }

  /* ---------------------------------------------------------------- footer year */
  $$("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));
})();
