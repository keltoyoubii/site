/* =========================================================================
   Logo : injection inline (pour animer les lettres) + flottement + répulsion
   au curseur. Gère chaque [data-logo] trouvé indépendamment (le grand logo
   du hero et le petit du header en ont chacun un, positionnés en CSS).
   ========================================================================= */
(function () {
  "use strict";
  const holders = document.querySelectorAll("[data-logo]");
  if (!holders.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const VBW = 1263, VBH = 610;

  fetch("assets/logo.svg")
    .then((r) => r.text())
    .then((svgText) => {
      holders.forEach((h) => {
        h.innerHTML = svgText;
        const svg = h.querySelector("svg");
        if (!svg) return;
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.classList.add("logo-svg");
        setupFloat(svg);
      });
    })
    .catch(() => {});

  function setupFloat(svg) {
    const paths = Array.from(svg.querySelectorAll("path"));
    if (!paths.length) return;

    const data = paths.map((p) => {
      let cx = VBW / 2, cy = VBH / 2;
      try { const b = p.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } catch (e) {}
      p.style.willChange = "transform";
      return { p, cx, cy, phase: Math.random() * Math.PI * 2,
        ampX: 2 + Math.random() * 4, ampY: 3 + Math.random() * 5,
        spd: 0.35 + Math.random() * 0.4, rx: 0, ry: 0 };
    });

    let mouse = null;
    if (canHover && !reduce) {
      svg.addEventListener("pointermove", (e) => {
        const r = svg.getBoundingClientRect();
        mouse = { x: (e.clientX - r.left) / r.width * VBW, y: (e.clientY - r.top) / r.height * VBH };
      });
      svg.addEventListener("pointerleave", () => { mouse = null; });
    }

    // Léger flottement d'ambiance en continu ; répulsion au survol de la souris en plus, sur desktop.
    const R = 360, PUSH = 85;
    const t0 = performance.now();
    function frame(t) {
      const time = (t - t0) / 1000;
      for (const d of data) {
        const fx = Math.sin(time * d.spd + d.phase) * d.ampX;
        const fy = Math.cos(time * d.spd * 0.9 + d.phase) * d.ampY;
        let tx = 0, ty = 0;
        if (mouse) {
          const dx = d.cx - mouse.x, dy = d.cy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < R) { const f = (1 - dist / R); const n = dist || 1; tx = dx / n * f * PUSH; ty = dy / n * f * PUSH; }
        }
        d.rx += (tx - d.rx) * 0.12; d.ry += (ty - d.ry) * 0.12;
        d.p.style.transform = `translate(${(fx + d.rx).toFixed(2)}px, ${(fy + d.ry).toFixed(2)}px)`;
      }
      requestAnimationFrame(frame);
    }
    if (!reduce) requestAnimationFrame(frame);
  }
})();
