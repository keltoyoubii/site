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
  const cover = (p) => p.cover || `assets/projets/${p.slug}/01.webp`;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  function splitWords(el) {
    const text = el.textContent.trim();
    el.innerHTML = text.split(/\s+/).map((w) => `<span class="word"><span class="word__in">${w}</span></span>`).join(" ");
    return Array.from(el.querySelectorAll(".word__in"));
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
    if (p.size) a.dataset.size = p.size;
    const isVideo = p.cat === "video" && p.yt && p.yt.length;
    if (isVideo) a.dataset.yt = p.yt[0];
    const num = String(i + 1).padStart(2, "0");
    a.innerHTML = `
      <div class="work__media${isVideo ? " is-video" : ""}">
        <img class="work__img" src="${cover(p)}" alt="${esc(p.title)} — ${esc(p.type)}" loading="lazy" />
      </div>
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
  const videoWorks = works.filter((w) => w.dataset.yt);
  if (videoWorks.length && !prefersReduced && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const media = e.target.querySelector(".work__media");
        const id = e.target.dataset.yt;
        if (e.isIntersecting) {
          if (!media.querySelector("iframe")) {
            const f = document.createElement("iframe");
            f.className = "work__video";
            f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&modestbranding=1&playsinline=1&rel=0&iv_load_policy=3&disablekb=1&fs=0`;
            f.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
            f.setAttribute("tabindex", "-1");
            f.setAttribute("aria-hidden", "true");
            // le poster masque l'intro/branding YouTube, puis s'efface une fois la lecture lancée
            f.addEventListener("load", () => setTimeout(() => media.classList.add("is-playing"), 1700));
            media.appendChild(f);
          }
        } else {
          const f = media.querySelector("iframe");
          if (f) { f.remove(); media.classList.remove("is-playing"); }
        }
      });
    }, { rootMargin: "10% 0px", threshold: 0.35 });
    videoWorks.forEach((w) => io.observe(w));
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
    ScrollTrigger.create({ trigger: w, start: "top 80%", once: true, onEnter: () => w.classList.add("is-in") });
    const img = w.querySelector(".work__img");
    if (img) gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none",
      scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
  });
})();
