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

  document.title = `${p.title} — ${p.type} · Maëldan`;
  const yearEl = document.querySelector(".contact__year");
  if (yearEl) yearEl.textContent = "© Maëldan Delpy " + new Date().getFullYear();

  /* -------------------- SEO : méta dynamiques + données structurées -------------------- */
  const SITE = "https://maeldan.fr";
  const pageUrl = `${SITE}/projet.html?id=${encodeURIComponent(p.slug)}`;
  const coverUrl = p.cover ? `${SITE}/${p.cover}` : (p.images ? `${SITE}/assets/projets/${p.slug}/01.webp` : `${SITE}/assets/og.jpg`);
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", p.desc);
  const canon = document.createElement("link");
  canon.rel = "canonical"; canon.href = pageUrl;
  document.head.appendChild(canon);
  const setOg = (prop, val) => {
    let m = document.querySelector(`meta[property="${prop}"]`);
    if (!m) { m = document.createElement("meta"); m.setAttribute("property", prop); document.head.appendChild(m); }
    m.setAttribute("content", val);
  };
  setOg("og:title", `${p.title} — ${p.type} · Maëldan`);
  setOg("og:description", p.desc);
  setOg("og:url", pageUrl);
  setOg("og:image", coverUrl);
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "name": p.title,
    "headline": `${p.title} — ${p.type}`,
    "description": p.desc,
    "url": pageUrl,
    "image": coverUrl,
    "inLanguage": "fr-FR",
    "genre": p.type,
    ...(p.year ? { "dateCreated": String(p.year) } : {}),
    "creator": { "@type": "Person", "name": "Maëldan Delpy", "url": SITE + "/" }
  });
  document.head.appendChild(ld);

  const num = String(idx + 1).padStart(2, "0");
  const total = String(projects.length).padStart(2, "0");
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* -------------------- Médias -------------------- */
  let vids = "";
  (p.vimeo || []).forEach((id) => {
    vids += `<figure class="proj__video"><div class="embed"><iframe src="https://player.vimeo.com/video/${id}?dnt=1&title=0&byline=0&portrait=0" title="${esc(p.title)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></figure>`;
  });
  (p.yt || []).forEach((id) => {
    vids += `<figure class="proj__video ytfacade" data-id="${id}">
      <img class="ytfacade__thumb" src="https://i.ytimg.com/vi/${id}/maxresdefault.jpg" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${id}/hqdefault.jpg'" alt="${esc(p.title)}" loading="lazy" />
      <button class="ytfacade__btn" type="button" aria-label="Lire la vidéo"><span class="ytfacade__play" aria-hidden="true"></span></button>
    </figure>`;
  });
  // Groupe les verticaux/carrés par 2 ; les horizontaux occupent toute la largeur
  const shapes = p.shapes || "";
  const figure = (n) => `<figure class="proj__img"><img src="assets/projets/${p.slug}/${String(n).padStart(2,"0")}.webp" alt="${esc(p.title)} — ${n}" loading="lazy" /></figure>`;
  let imgs = "";
  let pend = [];
  const flush = () => {
    if (pend.length === 2) imgs += `<div class="proj__duo">${figure(pend[0])}${figure(pend[1])}</div>`;
    else if (pend.length === 1) imgs += `<div class="proj__duo proj__duo--one">${figure(pend[0])}</div>`;
    pend = [];
  };
  for (let i = 1; i <= (p.images || 0); i++) {
    if ((shapes[i - 1] || "v") === "h") { imgs += figure(i); }  // horizontale : pleine largeur (n'interrompt pas l'appairage)
    else { pend.push(i); if (pend.length === 2) flush(); }
  }
  flush();
  const media = p.videoEnd ? (imgs + vids) : (vids + imgs);

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
        ${(next.cover || next.images > 0) ? `<img class="proj__next-img" src="${next.cover || `assets/projets/${next.slug}/01.webp`}" alt="" aria-hidden="true" loading="lazy" />` : ""}
        <span class="lbl">Projet suivant →</span>
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

  /* -------------------- Lightbox galerie -------------------- */
  let lenis = null; // assigné plus bas si le smooth scroll est actif
  const figs = Array.from(document.querySelectorAll(".proj__img img"));
  if (figs.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", `Galerie — ${p.title}`);
    lb.innerHTML = `
      <div class="lightbox__stage"><img alt="" /></div>
      <button class="lightbox__close" type="button" aria-label="Fermer">✕</button>
      <button class="lightbox__prev" type="button" aria-label="Image précédente">←</button>
      <button class="lightbox__next" type="button" aria-label="Image suivante">→</button>
      <span class="lightbox__count lbl"></span>`;
    document.body.appendChild(lb);
    const img = lb.querySelector(".lightbox__stage img");
    const countEl = lb.querySelector(".lightbox__count");
    let cur = 0, isOpen = false;

    const show = (i) => {
      cur = (i + figs.length) % figs.length;
      img.src = figs[cur].currentSrc || figs[cur].src;
      img.alt = figs[cur].alt || "";
      countEl.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(figs.length).padStart(2, "0")}`;
      if ("animate" in img) img.animate(
        [{ opacity: 0, transform: "scale(0.985)" }, { opacity: 1, transform: "scale(1)" }],
        { duration: 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      [cur + 1, cur - 1].forEach((n) => { // précharge les voisines
        const f = figs[(n + figs.length) % figs.length];
        const pre = new Image(); pre.src = f.currentSrc || f.src;
      });
    };
    const openLb = (i) => {
      isOpen = true; show(i);
      lb.classList.add("is-open");
      document.documentElement.classList.add("lb-lock");
      if (lenis) lenis.stop();
      lb.querySelector(".lightbox__close").focus();
    };
    const closeLb = () => {
      isOpen = false;
      lb.classList.remove("is-open");
      document.documentElement.classList.remove("lb-lock");
      if (lenis) lenis.start();
    };

    figs.forEach((f, i) => { f.closest(".proj__img").addEventListener("click", () => openLb(i)); });
    img.addEventListener("click", () => show(cur + 1)); // clic sur l'image : suivante
    lb.querySelector(".lightbox__close").addEventListener("click", closeLb);
    lb.querySelector(".lightbox__prev").addEventListener("click", () => show(cur - 1));
    lb.querySelector(".lightbox__next").addEventListener("click", () => show(cur + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lightbox__stage")) closeLb(); });
    document.addEventListener("keydown", (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") closeLb();
      else if (e.key === "ArrowRight") { e.preventDefault(); show(cur + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(cur - 1); }
    });
    let swipeX = null;
    lb.addEventListener("touchstart", (e) => { swipeX = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (swipeX === null) return;
      const dx = e.changedTouches[0].clientX - swipeX; swipeX = null;
      if (Math.abs(dx) > 45) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  }

  /* -------------------- Motion -------------------- */
  if (prefersReduced || !hasGSAP) {
    document.querySelectorAll(".proj__video, .proj__img").forEach((el) => el.classList.add("is-in"));
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
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
