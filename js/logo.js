/* =========================================================================
   Logo : injection inline (pour animer les lettres) + flottement + répulsion
   au curseur. Émet "logo:ready" quand injecté (pour le morph dans main.js).
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
      window.dispatchEvent(new Event("logo:ready"));
    })
    .catch(() => { window.dispatchEvent(new Event("logo:ready")); });

  function setupFloat(svg) {
    const paths = Array.from(svg.querySelectorAll("path"));
    if (!paths.length) return;

    const data = paths.map((p) => {
      let cx = VBW / 2, cy = VBH / 2;
      try { const b = p.getBBox(); cx = b.x + b.width / 2; cy = b.y + b.height / 2; } catch (e) {}
      p.style.willChange = "transform";
      return { p, cx, cy, rx: 0, ry: 0 };
    });

    let mouse = null;
    if (canHover && !reduce) {
      svg.addEventListener("pointermove", (e) => {
        const r = svg.getBoundingClientRect();
        mouse = { x: (e.clientX - r.left) / r.width * VBW, y: (e.clientY - r.top) / r.height * VBH };
      });
      svg.addEventListener("pointerleave", () => { mouse = null; });
    }

    // Logo fixe/ancré au repos ; seule la répulsion au survol de la souris (desktop) le fait bouger.
    const R = 360, PUSH = 85;
    function frame() {
      for (const d of data) {
        let tx = 0, ty = 0;
        if (mouse) {
          const dx = d.cx - mouse.x, dy = d.cy - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < R) { const f = (1 - dist / R); const n = dist || 1; tx = dx / n * f * PUSH; ty = dy / n * f * PUSH; }
        }
        d.rx += (tx - d.rx) * 0.12; d.ry += (ty - d.ry) * 0.12;
        d.p.style.transform = (d.rx || d.ry) ? `translate(${d.rx.toFixed(2)}px, ${d.ry.toFixed(2)}px)` : "";
      }
      requestAnimationFrame(frame);
    }
    if (canHover && !reduce) requestAnimationFrame(frame);
  }
})();
