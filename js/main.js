/* =========================================================================
   MaëlDan — interactions : grille, filtre, smooth scroll, reveals
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------- Année contact -------------------- */
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© " + new Date().getFullYear();

  /* -------------------- Construction de la grille -------------------- */
  const grid = document.getElementById("grid");
  const projects = window.PROJECTS || [];

  projects.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.category = p.category;
    if (p.size) card.dataset.size = p.size;

    card.innerHTML = `
      <div class="card__media">
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

      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  });

  /* -------------------- Smooth scroll (Lenis) + GSAP -------------------- */
  if (!prefersReduced && window.Lenis && window.gsap) {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // ancres -> scroll fluide
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (target) { e.preventDefault(); lenis.scrollTo(target, { offset: 0 }); }
      });
    });
  } else {
    // pas de smooth scroll : ancres natives
    document.documentElement.style.scrollBehavior = prefersReduced ? "auto" : "smooth";
  }

  /* -------------------- Reveals au scroll -------------------- */
  const revealEls = [...cards, ...document.querySelectorAll("[data-reveal]")];

  if (prefersReduced || !window.gsap) {
    revealEls.forEach((el) => el.classList.add("is-revealed"));
  } else {
    revealEls.forEach((el, i) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () => {
          // léger stagger pour les cartes d'une même rangée
          el.style.transitionDelay = (i % 3) * 0.06 + "s";
          el.classList.add("is-revealed");
        },
      });
    });

    /* -------------------- Parallaxe douce du showreel -------------------- */
    const heroMedia = document.querySelector("[data-parallax]");
    if (heroMedia) {
      gsap.to(heroMedia, {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }
  }
})();
