/* =========================================================================
   Maëldan — accueil : séquence de travaux, filtres, nav, animations scroll
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const projects = window.PROJECTS || [];

  const CAT_LABELS = { video: "Vidéo", motion: "Motion", graphisme: "Graphisme", photographie: "Photographie" };
  const CAT_ORDER = ["video", "motion", "graphisme", "photographie"];
  const cover = (p) => p.cover || `assets/projets/${p.slug}/01.webp`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* -------------------- Année -------------------- */
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  /* -------------------- Découpe en mots -------------------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="word"><span class="word__in">${w}</span></span>`).join(" ");
    return Array.from(el.querySelectorAll(".word__in"));
  }

  /* -------------------- Filtres dynamiques -------------------- */
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

  /* -------------------- Séquence de travaux -------------------- */
  const list = document.getElementById("works");
  projects.forEach((p, i) => {
    const a = document.createElement("a");
    a.className = "work";
    a.href = `projet.html?id=${p.slug}`;
    a.dataset.category = p.cat;
    if (p.size) a.dataset.size = p.size;
    const num = String(i + 1).padStart(2, "0");
    a.innerHTML = `
      <div class="work__media"><img class="work__img" src="${cover(p)}" alt="${esc(p.title)} — ${esc(p.type)}" loading="lazy" /></div>
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

  /* -------------------- Filtre -------------------- */
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

  /* -------------------- Nav : blanc sur showreel, noir sur fond clair -------------------- */
  const nav = document.getElementById("nav");
  const hero = document.querySelector(".hero");
  function updateNav() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    nav.classList.toggle("is-solid", y > hero.offsetHeight - 90);
  }
  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

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

  /* -------------------- Hero -------------------- */
  gsap.set(".hero__title .line__in", { yPercent: 110 });
  gsap.to(".hero__title .line__in", { yPercent: 0, duration: 1.2, ease: "expo.out", delay: 0.15 });
  gsap.from(".hero__foot", { opacity: 0, y: 20, duration: 1, ease: "power2.out", delay: 0.8 });

  /* -------------------- Texte kinétique (à propos) -------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.03 }) });
  });
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-revealed") });
  });

  /* -------------------- Apparition des travaux + parallaxe -------------------- */
  works.forEach((w) => {
    ScrollTrigger.create({ trigger: w, start: "top 82%", once: true, onEnter: () => w.classList.add("is-in") });
    const img = w.querySelector(".work__img");
    if (img) gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: "none",
      scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
  });
})();
