// Petits graphiques SVG faits main — pas de dépendance externe, marche hors-ligne.

function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

const NS_HTML = "http://www.w3.org/1999/xhtml";

/**
 * points: [{x: Date|number, y: number, label?: string}]
 */
export function lineChart(points, { width = 640, height = 220, unit = "" } = {}) {
  const pad = { top: 20, right: 16, bottom: 28, left: 40 };
  const svg = svgEl("svg", {
    viewBox: `0 0 ${width} ${height}`,
    class: "chart",
    role: "img",
    "aria-label": "Graphique de progression",
  });

  if (points.length === 0) {
    const empty = svgEl("text", { x: width / 2, y: height / 2, class: "chart__empty", "text-anchor": "middle" });
    empty.textContent = "Pas encore de données";
    svg.appendChild(empty);
    return svg;
  }

  const ys = points.map((p) => p.y);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }
  const padY = (maxY - minY) * 0.15;
  minY -= padY;
  maxY += padY;

  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = points.length;

  const xAt = (i) => pad.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v) => pad.top + innerH - ((v - minY) / (maxY - minY)) * innerH;

  // grid lines (3 horizontal)
  for (let g = 0; g <= 2; g++) {
    const v = minY + ((maxY - minY) * g) / 2;
    const y = yAt(v);
    svg.appendChild(svgEl("line", { x1: pad.left, x2: width - pad.right, y1: y, y2: y, class: "chart__grid" }));
    const label = svgEl("text", { x: pad.left - 8, y: y + 4, class: "chart__axis", "text-anchor": "end" });
    label.textContent = Math.round(v) + unit;
    svg.appendChild(label);
  }

  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.y)}`).join(" ");
  svg.appendChild(svgEl("path", { d, class: "chart__line", fill: "none" }));

  const areaD = `${d} L ${xAt(n - 1)} ${pad.top + innerH} L ${xAt(0)} ${pad.top + innerH} Z`;
  svg.appendChild(svgEl("path", { d: areaD, class: "chart__area" }));

  points.forEach((p, i) => {
    const cx = xAt(i);
    const cy = yAt(p.y);
    const dot = svgEl("circle", { cx, cy, r: 4, class: "chart__dot" });
    const title = svgEl("title", {});
    title.textContent = `${p.label || ""} — ${p.y}${unit}`;
    dot.appendChild(title);
    svg.appendChild(dot);

    if (n <= 8 || i === 0 || i === n - 1 || i === Math.floor(n / 2)) {
      const lbl = svgEl("text", { x: cx, y: height - 8, class: "chart__axis", "text-anchor": "middle" });
      lbl.textContent = p.label || "";
      svg.appendChild(lbl);
    }
  });

  return svg;
}

export function barChart(points, { width = 640, height = 220, unit = "" } = {}) {
  const pad = { top: 20, right: 16, bottom: 28, left: 40 };
  const svg = svgEl("svg", { viewBox: `0 0 ${width} ${height}`, class: "chart" });

  if (points.length === 0) {
    const empty = svgEl("text", { x: width / 2, y: height / 2, class: "chart__empty", "text-anchor": "middle" });
    empty.textContent = "Pas encore de données";
    svg.appendChild(empty);
    return svg;
  }

  const maxY = Math.max(...points.map((p) => p.y), 1);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const n = points.length;
  const gap = innerW / n / 4;
  const barW = innerW / n - gap;

  points.forEach((p, i) => {
    const x = pad.left + (i * innerW) / n + gap / 2;
    const barH = (p.y / maxY) * innerH;
    const y = pad.top + innerH - barH;
    const rect = svgEl("rect", { x, y, width: barW, height: Math.max(barH, 1), class: "chart__bar", rx: 3 });
    const title = svgEl("title", {});
    title.textContent = `${p.label || ""} — ${p.y}${unit}`;
    rect.appendChild(title);
    svg.appendChild(rect);

    if (n <= 8 || i === 0 || i === n - 1 || i === Math.floor(n / 2)) {
      const lbl = svgEl("text", { x: x + barW / 2, y: height - 8, class: "chart__axis", "text-anchor": "middle" });
      lbl.textContent = p.label || "";
      svg.appendChild(lbl);
    }
  });

  return svg;
}
