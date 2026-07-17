/* =========================================================================
   UI premium partagée (accueil + pages projet)
   — transitions de page, barre de progression, section active dans la nav
   ========================================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
})();
