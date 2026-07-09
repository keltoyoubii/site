/* =========================================================================
   Maëldan — accueil : grille, filtres dynamiques, smooth scroll, kinetic
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const projects = window.PROJECTS || [];

  const CAT_LABELS = { video: "Vidéo", motion: "Motion", graphisme: "Graphisme", photographie: "Photographie" };
  const CAT_ORDER = ["video", "motion", "graphisme", "photographie"];
  const cover = (p) => p.cover || `assets/projets/${p.slug}/01.webp`;

  /* -------------------- Année -------------------- */
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  /* -------------------- Découpe en mots -------------------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/)
      .map((w) => `<span class="word"><span class="word__in">${w}</span></span>`).join(" ");
    return Array.from(el.querySelectorAll(".word__in"));
  }

  /* -------------------- Filtres dynamiques (catégories présentes) -------------------- */
  const present = CAT_ORDER.filter((c) => projects.some((p) => p.cat === c));
  const filterEl = document.getElementById("filter");
  const mkBtn = (f, label, active) => {
    const b = document.createElement("button");
    b.className = "filter__btn" + (active ? " is-active" : "");
    b.dataset.filter = f; b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", active ? "true" : "false");
    b.textContent = label;
    return b;
  };
  filterEl.appendChild(mkBtn("all", "Tout", true));
  present.forEach((c) => filterEl.appendChild(mkBtn(c, CAT_LABELS[c], false)));

  /* -------------------- Grille -------------------- */
  const grid = document.getElementById("grid");
  projects.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.category = p.cat;
    if (p.size) card.dataset.size = p.size;
    const num = String(i + 1).padStart(2, "0");
    card.innerHTML = `
      <a class="card__link" href="projet.html?id=${p.slug}">
        <div class="card__media">
          <span class="card__num">${num}</span>
          <img class="card__img" src="${cover(p)}" alt="${p.title} — ${p.type}" loading="lazy" />
          <span class="card__view">Voir ↗</span>
        </div>
        <div class="card__meta">
          <span class="card__name">${p.title}</span>
          <span class="card__type mono">${p.type}</span>
        </div>
      </a>`;
    grid.appendChild(card);
  });
  const cards = Array.from(grid.querySelectorAll(".card"));

  /* -------------------- Comportement filtre -------------------- */
  Array.from(filterEl.querySelectorAll(".filter__btn")).forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterEl.querySelectorAll(".filter__btn").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      cards.forEach((card) => card.classList.toggle("is-hidden", !(f === "all" || card.dataset.category === f)));
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* -------------------- Sans motion : tout visible -------------------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
    cards.forEach((c) => c.classList.add("is-revealed"));
    return;
  }

  /* -------------------- Smooth scroll + GSAP -------------------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const t = document.querySelector(a.getAttribute("href"));
        if (t) { e.preventDefault(); lenis.scrollTo(t); }
      });
    });
  }

  /* -------------------- Hero -------------------- */
  gsap.set(".hero__title .line__in", { yPercent: 110 });
  gsap.to(".hero__title .line__in", { yPercent: 0, duration: 1.2, ease: "expo.out", delay: 0.15 });
  gsap.from(".hero__foot", { opacity: 0, y: 20, duration: 1, ease: "power2.out", delay: 0.8 });

  /* -------------------- Textes kinétiques -------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.04 }) });
  });
  document.querySelectorAll("[data-line]").forEach((el) => {
    const ins = el.querySelectorAll(".line__in");
    gsap.set(ins, { yPercent: 110 });
    ScrollTrigger.create({ trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(ins, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.1 }) });
  });

  /* -------------------- Reveals -------------------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-revealed") });
  });
  cards.forEach((card) => {
    ScrollTrigger.create({ trigger: card, start: "top 92%", once: true, onEnter: () => card.classList.add("is-revealed") });
  });

  /* -------------------- Parallaxe -------------------- */
  const heroMedia = document.querySelector("[data-parallax]");
  if (heroMedia) gsap.to(heroMedia, { yPercent: 16, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  cards.forEach((card) => {
    const img = card.querySelector(".card__img");
    if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } });
  });
})();
