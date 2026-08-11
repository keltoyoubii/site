// Petite taxonomie de groupes musculaires + icônes SVG minimalistes
// (lignes épurées, une seule couleur héritée via currentColor).

export const MUSCLES = [
  { key: "chest", label: "Pecs" },
  { key: "back", label: "Dos" },
  { key: "shoulders", label: "Épaules" },
  { key: "biceps", label: "Biceps" },
  { key: "triceps", label: "Triceps" },
  { key: "legs", label: "Jambes" },
  { key: "abs", label: "Abdos" },
];

const MUSCLE_LABELS = Object.fromEntries(MUSCLES.map((m) => [m.key, m.label]));
export function muscleLabel(key) {
  return MUSCLE_LABELS[key] || null;
}

const KEYWORDS = [
  [/développ.*couch|pec|écart|dips|pompe/i, "chest"],
  [/tracti|rowing|tirage|dos|lat\b|soulevé de terre|deadlift/i, "back"],
  [/militaire|épaule|elevation|élévation|oiseau|deltoïde|shoulder press|arnold/i, "shoulders"],
  [/curl.*bicep|biceps/i, "biceps"],
  [/tricep|pushdown|barre au front|dips? tricep/i, "triceps"],
  [/squat|leg|jambe|fente|presse à cuisse|mollet|ischio|fessier|hip thrust/i, "legs"],
  [/crunch|abdo|gainage|planche|obliqu/i, "abs"],
];

export function inferMuscle(name) {
  const n = (name || "").toLowerCase();
  for (const [re, key] of KEYWORDS) {
    if (re.test(n)) return key;
  }
  return null;
}

const PATHS = {
  chest: '<circle cx="9" cy="10.5" r="4.2" fill="none"/><circle cx="15" cy="10.5" r="4.2" fill="none"/>',
  back: '<path d="M6 6.5 9 4.5h6l3 2-1.6 14h-8.8z" fill="none"/><path d="M12 4.5v16"/>',
  shoulders: '<circle cx="6" cy="9" r="2.6" fill="none"/><circle cx="18" cy="9" r="2.6" fill="none"/><path d="M8.4 10.2C9.5 8.8 10.6 8.2 12 8.2s2.5.6 3.6 2"/><path d="M6 11.6V17M18 11.6V17"/>',
  biceps: '<g transform="rotate(-18 12 12)"><rect x="10" y="3.5" width="4" height="9" rx="2" fill="none"/><circle cx="12" cy="15.5" r="3.8" fill="none"/></g>',
  triceps: '<rect x="9.5" y="3" width="5" height="17" rx="2.5" fill="none"/><path d="M14.5 8c1.8.7 1.8 5.3 0 6"/>',
  legs: '<rect x="7.6" y="4" width="3.4" height="16" rx="1.7" fill="none"/><rect x="13" y="4" width="3.4" height="16" rx="1.7" fill="none"/>',
  abs: '<rect x="9" y="5" width="6" height="4" rx="1.2" fill="none"/><rect x="9" y="10.3" width="6" height="4" rx="1.2" fill="none"/><rect x="9" y="15.6" width="6" height="3.4" rx="1.2" fill="none"/>',
};

export function muscleIconSVG(key) {
  const inner = PATHS[key];
  if (!inner) return "";
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}

export function muscleBadge(key, size = "md") {
  const span = document.createElement("span");
  span.className = `muscle-badge muscle-badge--${size}${key ? "" : " is-empty"}`;
  span.innerHTML = key ? muscleIconSVG(key) : "";
  if (key) span.title = muscleLabel(key);
  return span;
}
