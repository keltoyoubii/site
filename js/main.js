/* =========================================================================
   Maëldan — accueil
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const projects = window.PROJECTS || [];

  const CAT_LABELS = { video: "Vidéo", motion: "Motion", graphisme: "Graphisme", photographie: "Photographie" };
  const CAT_ORDER = ["video", "motion", "graphisme", "photographie"];
  const cover = (p) => p.cover || (p.images > 0 ? `assets/projets/${p.slug}/01.webp` : null);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="word"><span class="word__in">${w}</span></span>`).join(" ");
    return Array.from(el.querySelectorAll(".word__in"));
  }

  // découpe un texte en LIGNES réelles (selon le retour à la ligne rendu)
  function splitLines(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    const ws = Array.from(el.querySelectorAll(".w"));
    const lines = []; let cur = []; let top = null;
    ws.forEach((w) => { const t = w.offsetTop; if (top === null) top = t; if (Math.abs(t - top) > 3) { lines.push(cur); cur = []; top = t; } cur.push(w); });
    if (cur.length) lines.push(cur);
    el.innerHTML = "";
    const inners = [];
    lines.forEach((grp) => {
      const wrap = document.createElement("span"); wrap.className = "linewrap";
      const inner = document.createElement("span"); inner.className = "linewrap__in";
      inner.textContent = grp.map((w) => w.textContent).join(" ");
      wrap.appendChild(inner); el.appendChild(wrap); inners.push(inner);
    });
    return inners;
  }

  // machine à écrire avec curseur clignotant
  function typewriter(el, full) {
    el.textContent = "";
    const caret = document.createElement("span"); caret.className = "type-caret";
    el.appendChild(caret);
    let i = 0;
    (function step() {
      if (i >= full.length) return;
      caret.insertAdjacentText("beforebegin", full[i]);
      const ch = full[i]; i++;
      setTimeout(step, ch === " " ? 16 : (".,;—".includes(ch) ? 90 : 11));
    })();
  }

  /* -------------------- Filtres -------------------- */
  const present = CAT_ORDER.filter((c) => projects.some((p) => p.cat === c));
  const filterEl = document.getElementById("filter");
  const mkBtn = (f, label, active) => {
    const b = document.createElement("button");
    b.className = "filter__btn" + (active ? " is-active" : "");
    b.dataset.filter = f; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", active ? "true" : "false");
    b.textContent = label; return b;
  };
  filterEl.appendChild(mkBtn("all", "Tout", true));
  present.forEach((c) => filterEl.appendChild(mkBtn(c, CAT_LABELS[c], false)));

  /* -------------------- Séquence -------------------- */
  const list = document.getElementById("works");
  projects.forEach((p, i) => {
    const a = document.createElement("a");
    a.className = "work";
    a.href = `projet.html?id=${p.slug}`;
    a.dataset.category = p.cat;
    const isVid = p.cat === "video" || p.cat === "motion";
    const bunnyId = isVid && p.bunny && p.bunny[0];
    const vimeoId = isVid && !bunnyId && p.vimeo && p.vimeo[0];
    const ytId = isVid && !bunnyId && !vimeoId && p.yt && p.yt[0];
    const isVideo = !!(bunnyId || vimeoId || ytId);
    const cov = cover(p);
    const num = String(i + 1).padStart(2, "0");
    const imgTag = (src) => `<img class="work__img" src="${src}" alt="${esc(p.title)} — ${esc(p.type)}" loading="lazy" />`;

    let mediaHtml;
    if (p.duo && isVideo && p.bunny && p.bunny.length >= 2) {
      // deux vidéos verticales côte à côte
      const cells = p.bunny.slice(0, 2).map((id) =>
        `<div class="work__cell work__vid is-bunny" data-bunny="${id}"><span class="work__ph"></span></div>`).join("");
      mediaHtml = `<div class="work__media work__media--duo is-video">${cells}</div>`;
    } else if (p.duo && isVideo && p.vimeo && p.vimeo.length >= 2) {
      // deux vidéos verticales côte à côte
      const cells = p.vimeo.slice(0, 2).map((id) =>
        `<div class="work__cell work__vid is-vimeo" data-vimeo="${id}"><span class="work__ph"></span></div>`).join("");
      mediaHtml = `<div class="work__media work__media--duo is-video">${cells}</div>`;
    } else if (p.duo && p.images >= 2) {
      // deux images verticales côte à côte (paire personnalisable)
      const pair = p.duoPair || [1, 2];
      const cells = pair.map((n) =>
        `<div class="work__cell">${imgTag(`assets/projets/${p.slug}/${String(n).padStart(2,"0")}.webp`)}</div>`).join("");
      mediaHtml = `<div class="work__media work__media--duo">${cells}</div>`;
    } else if (isVideo) {
      const attr = bunnyId ? `data-bunny="${bunnyId}"` : (vimeoId ? `data-vimeo="${vimeoId}"` : `data-yt="${ytId}"`);
      const cls = bunnyId ? " is-bunny" : (vimeoId ? " is-vimeo" : "");
      const inner = cov ? imgTag(cov) : `<span class="work__ph"></span>`;
      mediaHtml = `<div class="work__media work__vid is-video${cls}" ${attr}>${inner}</div>`;
    } else {
      mediaHtml = `<div class="work__media">${cov ? imgTag(cov) : `<span class="work__ph"></span>`}</div>`;
    }

    a.innerHTML = `${mediaHtml}
      <div class="work__row">
        <div class="work__left">
          <span class="work__num lbl">${num}</span>
          <h3 class="work__title">${esc(p.title)}</h3>
        </div>
        <div class="work__meta">
          <span class="work__type lbl">${esc(p.type)}</span>
          <p class="work__desc">${esc(p.desc)}</p>
          <span class="work__view lbl">Voir le projet →</span>
        </div>
      </div>`;
    list.appendChild(a);
  });
  const works = Array.from(list.querySelectorAll(".work"));

  /* -------------------- Vidéos : lecture auto muette quand visible -------------------- */
  const vidHosts = Array.from(list.querySelectorAll(".work__vid"));
  if (vidHosts.length && !prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const host = e.target;
        if (e.isIntersecting) {
          if (!host.querySelector("iframe")) {
            const bunny = host.dataset.bunny, vimeo = host.dataset.vimeo, yt = host.dataset.yt;
            const f = document.createElement("iframe");
            f.className = "work__video";
            if (bunny) {
              f.src = `https://player.mediadelivery.net/embed/${window.BUNNY_LIBRARY}/${bunny}?autoplay=true&loop=true&muted=true&preload=true&responsive=false`;
              f.setAttribute("allow", "accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen;");
            } else if (vimeo) {
              f.src = `https://player.vimeo.com/video/${vimeo}?background=1&autoplay=1&muted=1&loop=1&autopause=0&dnt=1`;
              f.setAttribute("allow", "autoplay; picture-in-picture");
            } else {
              f.src = `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&loop=1&playlist=${yt}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`;
              f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
              f.addEventListener("load", () => setTimeout(() => host.classList.add("is-playing"), 1700));
            }
            f.setAttribute("tabindex", "-1");
            f.setAttribute("aria-hidden", "true");
            host.appendChild(f);
          }
        } else {
          const f = host.querySelector("iframe");
          if (f) { f.remove(); host.classList.remove("is-playing"); }
        }
      });
    }, { rootMargin: "10% 0px", threshold: 0.25 });
    vidHosts.forEach((h) => io.observe(h));
  }

  /* -------------------- Filtre comportement -------------------- */
  Array.from(filterEl.querySelectorAll(".filter__btn")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterEl.querySelectorAll(".filter__btn").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active); b.setAttribute("aria-selected", active ? "true" : "false");
      });
      works.forEach((w) => w.classList.toggle("is-hidden", !(f === "all" || w.dataset.category === f)));
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* -------------------- Nav : blanc/noir -------------------- */
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");
  function updateNav() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    nav.classList.toggle("is-solid", y > hero.offsetHeight - 90);
  }
  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  /* -------------------- À propos : slideshow (3 photos, 3 s) -------------------- */
  const slideshow = document.querySelector("[data-slideshow]");
  if (slideshow && !prefersReduced) {
    const imgs = Array.from(slideshow.querySelectorAll("img"));
    if (imgs.length > 1) {
      let si = 0;
      setInterval(() => {
        imgs[si].classList.remove("is-active");
        si = (si + 1) % imgs.length;
        imgs[si].classList.add("is-active");
      }, 3000);
    }
  }

  /* -------------------- Morph du logo (centre géant -> nav) -------------------- */
  function setupLogoMorph() {
    const logo = document.querySelector(".nav__brand .logo-svg");
    if (!logo || !hasGSAP || prefersReduced) return;
    let tween;
    function build() {
      if (tween) { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); }
      gsap.set(logo, { clearProps: "transform" });
      const base = logo.getBoundingClientRect();
      const cx = base.left + base.width / 2, cy = base.top + base.height / 2;
      const tx = window.innerWidth / 2 - cx;
      const ty = window.innerHeight * 0.42 - cy;
      const scale = Math.min(window.innerWidth * 0.58 / base.width, window.innerHeight * 0.42 / base.height);
      tween = gsap.fromTo(logo,
        { x: tx, y: ty, scale: scale },
        { x: 0, y: 0, scale: 1, ease: "none", immediateRender: true,
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    }
    build();
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(build, 200); });
  }
  if (document.querySelector(".nav__brand .logo-svg")) setupLogoMorph();
  else window.addEventListener("logo:ready", setupLogoMorph, { once: true });

  /* -------------------- Sans motion -------------------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
    works.forEach((w) => w.classList.add("is-in"));
    return;
  }

  /* -------------------- Smooth scroll + GSAP -------------------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", () => { ScrollTrigger.update(); updateNav(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => { const t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t); } });
    });
  }

  /* -------------------- Hero baseline -------------------- */
  gsap.from(".hero__baseline", { opacity: 0, y: 24, duration: 1.2, ease: "power2.out", delay: 0.5 });
  gsap.to(".hero__baseline", { opacity: 0, y: -30, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "45% top", scrub: true } });

  /* -------------------- À propos -------------------- */
  // À propos — préparé après le chargement (déclenché au scroll, pas au load)
  function setupAbout() {
    document.querySelectorAll("[data-lines]").forEach((el) => {
      const lines = splitLines(el);
      gsap.set(lines, { x: 80, opacity: 0 });
      ScrollTrigger.create({ trigger: el, start: "top 78%", once: true,
        onEnter: () => gsap.to(lines, { x: 0, opacity: 1, duration: 1.5, ease: "expo.out", stagger: 0.3 }) });
    });
    document.querySelectorAll("[data-typewriter]").forEach((el) => {
      const full = el.textContent.trim();
      el.style.minHeight = el.offsetHeight + "px";
      el.textContent = "";
      ScrollTrigger.create({ trigger: el, start: "top 76%", once: true, onEnter: () => typewriter(el, full) });
    });
    ScrollTrigger.refresh();
  }
  if (document.readyState === "complete") setupAbout();
  else window.addEventListener("load", setupAbout, { once: true });

  // recalcule les positions au fur et à mesure du chargement des images (page très longue)
  let refreshT;
  const refresh = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 200); };
  list.querySelectorAll("img").forEach((img) => { if (!img.complete) img.addEventListener("load", refresh, { once: true }); });
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-revealed") });
  });

  /* -------------------- Apparition des travaux -------------------- */
  works.forEach((w) => {
    ScrollTrigger.create({ trigger: w, start: "top 80%", once: true, onEnter: () => w.classList.add("is-in") });
  });
})();
