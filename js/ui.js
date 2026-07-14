/* =========================================================================
   UI premium partagée (accueil + pages projet)
   — transitions de page, curseur contextuel, barre de progression,
     liens magnétiques, section active dans la nav
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const html = document.documentElement;

  /* -------------------- Transitions de page -------------------- */
  // entrée : la classe .js (posée dans <head>) masque le body, .is-ready le révèle
  const reveal = () => { html.classList.remove("is-leaving"); html.classList.add("is-ready"); };
  requestAnimationFrame(reveal);
  window.addEventListener("pageshow", reveal); // retour via bfcache

  // sortie : fondu avant de naviguer vers une autre page interne
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || a.target === "_blank") return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // ancre même page
    e.preventDefault();
    html.classList.add("is-leaving");
    setTimeout(() => { location.href = url.href; }, prefersReduced ? 0 : 380);
  });

  /* -------------------- Barre de progression de lecture -------------------- */
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  let barRaf = false;
  const updBar = () => {
    barRaf = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
  };
  window.addEventListener("scroll", () => { if (!barRaf) { barRaf = true; requestAnimationFrame(updBar); } }, { passive: true });
  window.addEventListener("resize", updBar);
  updBar();

  /* -------------------- Section active dans la nav (accueil) -------------------- */
  const spyLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const spySecs = spyLinks.map((l) => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  if (spyLinks.length && spySecs.length) {
    let spyRaf = false;
    const updSpy = () => {
      spyRaf = false;
      const y = window.scrollY + window.innerHeight * 0.35;
      let cur = null;
      spySecs.forEach((s) => { if (s.offsetTop <= y) cur = s.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = spySecs[spySecs.length - 1].id;
      spyLinks.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + cur));
    };
    window.addEventListener("scroll", () => { if (!spyRaf) { spyRaf = true; requestAnimationFrame(updSpy); } }, { passive: true });
    updSpy();
  }

  if (!finePointer || prefersReduced) return; // tactile / motion réduit : rien de plus

  /* -------------------- Curseur contextuel -------------------- */
  document.querySelectorAll(".work").forEach((el) => { el.dataset.cursor = "Voir →"; });
  document.querySelectorAll(".proj__next a").forEach((el) => { el.dataset.cursor = "Suivant →"; });
  document.querySelectorAll(".ytfacade").forEach((el) => { el.dataset.cursor = "Lire"; });

  const cur = document.createElement("div");
  cur.className = "cursor";
  cur.setAttribute("aria-hidden", "true");
  cur.innerHTML = '<span class="cursor__lbl"></span>';
  document.body.appendChild(cur);
  const lbl = cur.querySelector(".cursor__lbl");

  let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
  document.addEventListener("mousemove", (e) => {
    tx = e.clientX; ty = e.clientY;
    cur.classList.add("is-on");
    const t = e.target.closest("[data-cursor]");
    if (t && !t.classList.contains("is-playing")) {
      if (lbl.textContent !== t.dataset.cursor) lbl.textContent = t.dataset.cursor;
      cur.classList.add("is-label");
    } else {
      cur.classList.remove("is-label");
    }
  }, { passive: true });
  document.addEventListener("mouseleave", () => cur.classList.remove("is-on"));
  document.addEventListener("mousedown", () => cur.classList.add("is-down"));
  document.addEventListener("mouseup", () => cur.classList.remove("is-down"));
  (function loop() {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
})();
