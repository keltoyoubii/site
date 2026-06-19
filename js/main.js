/* =========================================================================
   MaëlDan — interactions : grille, filtre, smooth scroll, kinetic reveals
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);

  /* -------------------- Année -------------------- */
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© " + new Date().getFullYear();

  /* -------------------- Découpe en mots (effet kinétique) -------------------- */
  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text
      .split(/\s+/)
      .map((w) => `<span class="word"><span class="word__in">${w}</span></span>`)
      .join(" ");
    return Array.from(el.querySelectorAll(".word__in"));
  }

  /* -------------------- Construction de la grille -------------------- */
  const grid = document.getElementById("grid");
  const projects = window.PROJECTS || [];

  projects.forEach((p, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.category = p.category;
    if (p.size) card.dataset.size = p.size;

    const num = String(i + 1).padStart(2, "0");
    card.innerHTML = `
      <div class="card__media">
        <span class="card__num">${num}</span>
        <img class="card__img" src="${p.image}" alt="${p.title} — ${p.label}" loading="lazy" />
      </div>
      <div class="card__meta">
        <span class="card__name">${p.title}</span>
        <span class="card__cat">${p.label}</span>
      </div>`;
    grid.appendChild(card);
  });

  const cards = Array.from(grid.querySelectorAll(".card"));

  /* -------------------- Filtre -------------------- */
  const filterBtns = Array.from(document.querySelectorAll(".filter__btn"));
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const f = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      cards.forEach((card) => {
        const match = f === "all" || card.dataset.category === f;
        card.classList.toggle("is-hidden", !match);
      });
      if (hasGSAP) ScrollTrigger.refresh();
    });
  });

  /* -------------------- Pas de motion : tout visible -------------------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-revealed"));
    cards.forEach((c) => c.classList.add("is-revealed"));
    document.querySelectorAll(".hero__title .line__in").forEach((el) => (el.style.transform = "none"));
    return;
  }

  /* -------------------- Smooth scroll (Lenis) + GSAP -------------------- */
  gsap.registerPlugin(ScrollTrigger);

  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); lenis.scrollTo(target); }
      });
    });
  }

  /* -------------------- Hero : entrée du titre -------------------- */
  gsap.set(".hero__title .line__in", { yPercent: 110 });
  gsap.to(".hero__title .line__in", {
    yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.15,
  });
  gsap.from(".hero__foot", { opacity: 0, y: 20, duration: 1, ease: "power2.out", delay: 0.9 });

  /* -------------------- Textes kinétiques (mots) -------------------- */
  document.querySelectorAll("[data-split]").forEach((el) => {
    const words = splitWords(el);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: el, start: "top 85%", once: true,
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.04 }),
    });
  });

  /* -------------------- Reveals simples -------------------- */
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => el.classList.add("is-revealed") });
  });

  /* -------------------- Reveals des cartes (masque) -------------------- */
  cards.forEach((card) => {
    ScrollTrigger.create({ trigger: card, start: "top 90%", once: true, onEnter: () => card.classList.add("is-revealed") });
  });

  /* -------------------- Parallaxe showreel + images -------------------- */
  const heroMedia = document.querySelector("[data-parallax]");
  if (heroMedia) {
    gsap.to(heroMedia, {
      yPercent: 16, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  cards.forEach((card) => {
    const img = card.querySelector(".card__img");
    if (!img) return;
    gsap.fromTo(img, { yPercent: -6 }, {
      yPercent: 6, ease: "none",
      scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
})();
