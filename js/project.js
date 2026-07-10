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
  (p.vimeo || []).forEach((id) => {
    media += `<figure class="proj__video"><div class="embed"><iframe src="https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0" title="${esc(p.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></figure>`;
  });
  (p.yt || []).forEach((id) => {
    media += `<figure class="proj__video ytfacade" data-id="${id}">
      <img class="ytfacade__thumb" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" alt="${esc(p.title)}" loading="lazy" />
      <button class="ytfacade__btn" type="button" aria-label="Lire la vidéo"><span class="ytfacade__play" aria-hidden="true"></span></button>
    </figure>`;
  });
  for (let i = 1; i <= (p.images || 0); i++) {
    const n = String(i).padStart(2, "0");
    media += `<figure class="proj__img"><img src="assets/projets/${p.slug}/${n}.webp" alt="${esc(p.title)} — ${i}" loading="lazy" /></figure>`;
  }

  /* -------------------- Rendu -------------------- */
  document.getElementById("project").innerHTML = `
    <article class="proj">
      <header class="proj__head">
        <h1 class="proj__title">${esc(p.title)}</h1>
        <div class="proj__index lbl">${num} / ${total}</div>
      </header>
      <div class="proj__info">
        <div class="proj__meta">
          <div class="proj__meta-row"><span class="k lbl">Type</span><span class="v">${esc(p.type)}</span></div>
          ${p.year ? `<div class="proj__meta-row"><span class="k lbl">Année</span><span class="v">${esc(p.year)}</span></div>` : ""}
          ${p.ambiance ? `<div class="proj__meta-row"><span class="k lbl">Ambiance</span><span class="v"><em>${esc(p.ambiance)}</em></span></div>` : ""}
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
        <span class="lbl lbl">Projet suivant →</span>
        <span class="ttl">${esc(next.title)}</span>
      </a>
    </div>`;

  /* -------------------- Façade YouTube (charge le lecteur au clic) -------------------- */
  document.querySelectorAll(".ytfacade").forEach((f) => {
    const btn = f.querySelector(".ytfacade__btn");
    btn.addEventListener("click", () => {
      const id = f.dataset.id;
      f.innerHTML = `<div class="embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1&color=white&iv_load_policy=3" title="${esc(p.title)}" allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowfullscreen></iframe></div>`;
      f.classList.add("is-playing");
    });
  });

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
