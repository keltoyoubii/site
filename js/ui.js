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

  /* -------------------- Feu d'artifice d'étoiles au clic -------------------- */
  // L'étoile (ico2) est injectée une fois en <symbol> ; chaque clic clone des <use> légers.
  if (!prefersReduced && "animate" in Element.prototype) {
    let starReady = false;
    const loadStar = (path) => fetch(path).then((r) => { if (!r.ok) throw 0; return r.text(); });
    loadStar("assets/ico2.svg").catch(() => loadStar("/assets/ico2.svg")).then((txt) => {
      const inner = txt.slice(txt.indexOf(">", txt.indexOf("<svg")) + 1, txt.lastIndexOf("</svg>"));
      const holder = document.createElement("div");
      holder.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
      holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"><symbol id="spark-star" viewBox="0 0 447 527">${inner}</symbol></svg>`;
      document.body.appendChild(holder);
      starReady = true;
    }).catch(() => {});

    const RATIO = 527 / 447;
    const mkStar = (w) => {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      const h = w * RATIO;
      s.setAttribute("viewBox", "0 0 447 527");
      s.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px;overflow:visible`;
      const u = document.createElementNS("http://www.w3.org/2000/svg", "use");
      u.setAttribute("href", "#spark-star");
      s.appendChild(u);
      return s;
    };

    document.addEventListener("pointerdown", (e) => {
      if (!starReady) return;
      const wrap = document.createElement("div");
      wrap.className = "spark";
      wrap.style.left = e.clientX + "px";
      wrap.style.top = e.clientY + "px";
      document.body.appendChild(wrap);

      // étoile principale : pop sur place
      const main = mkStar(34);
      wrap.appendChild(main);
      main.animate(
        [
          { transform: "scale(0) rotate(-40deg)", opacity: 1 },
          { transform: "scale(1.1) rotate(0deg)", opacity: 1, offset: 0.45 },
          { transform: "scale(0.9) rotate(14deg)", opacity: 0.9, offset: 0.7 },
          { transform: "scale(0) rotate(26deg)", opacity: 0 },
        ],
        { duration: 620, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );

      // particules : petites étoiles qui fusent en cercle
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.9;
        const d = 36 + Math.random() * 44;
        const dx = Math.cos(a) * d, dy = Math.sin(a) * d;
        const rot = (Math.random() * 140 - 70).toFixed(0);
        const p = mkStar(9 + Math.random() * 9);
        wrap.appendChild(p);
        p.animate(
          [
            { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
            { transform: `translate(${dx * 0.72}px, ${dy * 0.72}px) scale(0.72) rotate(${rot * 0.7}deg)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${dx}px, ${dy}px) scale(0.35) rotate(${rot}deg)`, opacity: 0 },
          ],
          { duration: 520 + Math.random() * 260, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
        );
      }
      setTimeout(() => wrap.remove(), 800);
    }, { passive: true });
  }
})();
