/* =========================================================================
   Page projet — rend le projet correspondant à ?id=slug
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const projects = window.PROJECTS || [];

  const params = new URLSearchParams(location.search);
  const slug = params.get("id");
  const idx = projects.findIndex((p) => p.slug === slug);

  if (idx === -1) { location.replace("index.html#travaux"); return; }
  const p = projects[idx];
  const next = projects[(idx + 1) % projects.length];

  document.title = `${p.title} — Maëldan`;
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  const num = String(idx + 1).padStart(2, "0");
  const total = String(projects.length).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* -------------------- Médias -------------------- */
  let media = "";
  (p.yt || []).forEach((id) => {
    media += `<div class="proj__video"><div class="embed"><iframe src="https://www.youtube.com/embed/${id}?rel=0" title="${esc(p.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div>`;
  });
  for (let i = 1; i <= (p.images || 0); i++) {
    const n = String(i).padStart(2, "0");
    const wide = (i === 1 && !p.yt) || i % 4 === 0 ? " wide" : "";
    media += `<figure class="proj__img${wide}"><img src="assets/projets/${p.slug}/${n}.webp" alt="${esc(p.title)} — ${i}" loading="lazy" /></figure>`;
  }

  /* -------------------- Rendu -------------------- */
  document.getElementById("project").innerHTML = `
    <article class="proj">
      <header class="proj__head">
        <h1 class="proj__title blurable">${esc(p.title)}</h1>
        <div class="proj__index mono">${num} / ${total}</div>
      </header>
      <div class="proj__info">
        <div class="proj__meta">
          <div class="proj__meta-row"><span class="k mono">Type</span><span class="v">${esc(p.type)}</span></div>
          ${p.year ? `<div class="proj__meta-row"><span class="k mono">Année</span><span class="v">${esc(p.year)}</span></div>` : ""}
          ${p.ambiance ? `<div class="proj__meta-row"><span class="k mono">Ambiance</span><span class="v"><em>${esc(p.ambiance)}</em></span></div>` : ""}
        </div>
        <div class="proj__desc">
          <p>${esc(p.desc)}</p>
          ${p.credits ? `<p class="proj__credits">${esc(p.credits)}</p>` : ""}
        </div>
      </div>
      <div class="proj__media">${media}</div>
    </article>
    <div class="proj__next">
      <a href="projet.html?id=${next.slug}">
        <span class="lbl mono">Projet suivant →</span>
        <span class="ttl">${esc(next.title)}</span>
      </a>
    </div>`;

  /* -------------------- Motion -------------------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll(".proj__video, .proj__img").forEach((el) => el.classList.add("is-in"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => { const t = document.querySelector(a.getAttribute("href")); if (t) { e.preventDefault(); lenis.scrollTo(t); } });
    });
  }
  gsap.from(".proj__title", { yPercent: 40, opacity: 0, duration: 1.1, ease: "expo.out" });
  gsap.from(".proj__info", { opacity: 0, y: 24, duration: 1, ease: "power2.out", delay: 0.15 });
  document.querySelectorAll(".proj__video, .proj__img").forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => el.classList.add("is-in") });
  });
})();
