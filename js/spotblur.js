/* =========================================================================
   Blur localisé : une petite zone floue suit le curseur sur les gros titres
   Éléments ciblés : .spot
   ========================================================================= */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  if (reduce || !canHover) return;

  function setup(el) {
    if (el.dataset.spotReady) return;
    el.dataset.spotReady = "1";
    const blur = document.createElement("span");
    blur.className = "spot__blur";
    blur.setAttribute("aria-hidden", "true");
    blur.innerHTML = el.innerHTML;   // copie floutée par-dessus
    el.appendChild(blur);

    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--sx", (e.clientX - r.left) + "px");
      el.style.setProperty("--sy", (e.clientY - r.top) + "px");
      el.classList.add("spot--on");
    });
    el.addEventListener("pointerleave", () => el.classList.remove("spot--on"));
  }

  // rendu asynchrone possible (page projet) : on tente maintenant + petit délai
  const run = () => document.querySelectorAll(".spot").forEach(setup);
  run();
  window.addEventListener("load", run);
  setTimeout(run, 400);
})();
