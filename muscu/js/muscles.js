// Groupes musculaires + badges. Les pictogrammes viennent de js/icons.js
// (Game Icons), pas de tracés faits main.
import { patternSVG } from "./icons.js";

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

// Pictogramme représentatif d'un groupe musculaire, quand l'exercice n'a pas
// de mouvement connu (exercice personnalisé).
const MUSCLE_PATTERN = {
  chest: "fly",
  back: "pull-v",
  shoulders: "raise",
  biceps: "curl",
  triceps: "extension",
  legs: "leg",
  abs: "core",
};

const KEYWORDS = [
  [/tricep|pushdown|barre au front|kickback|prise serr/i, "triceps"],
  [/curl.*(bicep|marteau|pupitre|concentr|halt|barre|poulie)|biceps|curl marteau/i, "biceps"],
  [/leg curl|squat|leg|jambe|fente|presse à cuisse|mollet|ischio|fessier|hip thrust|adducteur|abducteur|roumain/i, "legs"],
  [/développ.*(couch|inclin|déclin)|pec|écart|pompe|dips/i, "chest"],
  [/militaire|épaule|élévation|elevation|oiseau|deltoïde|arnold|face pull|rowing menton/i, "shoulders"],
  [/tracti|rowing|tirage|dos|soulevé de terre|pull-over|lombaire/i, "back"],
  [/crunch|abdo|gainage|planche|obliqu|relevé de jambes|russian/i, "abs"],
];

export function inferMuscle(name) {
  const n = name || "";
  for (const [re, key] of KEYWORDS) {
    if (re.test(n)) return key;
  }
  return null;
}

// Badge rond avec le pictogramme du mouvement (si connu) ou du muscle.
export function muscleBadge(muscle, size = "md", pattern = null) {
  const span = document.createElement("span");
  const p = pattern || MUSCLE_PATTERN[muscle];
  span.className = `muscle-badge muscle-badge--${size}${p ? "" : " is-empty"}`;
  span.innerHTML = p ? patternSVG(p) : "";
  if (muscle) span.title = muscleLabel(muscle);
  return span;
}
