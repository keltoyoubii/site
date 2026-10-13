// Bibliothèque d'exercices classiques de salle (barre, haltères, machines,
// poulie, poids du corps). Chaque exercice a un muscle principal et un type de
// mouvement, qui sert à choisir son pictogramme.
// `aliases` : anciens noms utilisés dans l'app, pour garder l'historique et la
// progression rattachés au bon exercice.

export const PATTERN_LABELS = {
  "press-h": "Poussée horizontale",
  fly: "Écarté",
  "press-v": "Poussée verticale",
  raise: "Élévation",
  "pull-v": "Tirage vertical",
  "pull-h": "Tirage horizontal",
  curl: "Flexion du bras",
  extension: "Extension du bras",
  squat: "Squat",
  leg: "Machine jambes",
  lunge: "Fente",
  "leg-curl": "Flexion de jambe",
  calf: "Mollets",
  core: "Gainage / abdos",
};

const E = (name, muscle, pattern, aliases = []) => ({ name, muscle, pattern, aliases });

export const EXERCISE_LIBRARY = [
  // Pecs
  E("Développé couché (barre)", "chest", "press-h", ["Développé couché"]),
  E("Développé couché (haltères)", "chest", "press-h"),
  E("Développé incliné (barre)", "chest", "press-h"),
  E("Développé incliné (haltères)", "chest", "press-h", ["Développé incliné haltères léger (rappel pecs)"]),
  E("Développé décliné", "chest", "press-h"),
  E("Presse à pecs (machine)", "chest", "press-h"),
  E("Pompes", "chest", "press-h"),
  E("Dips (pecs)", "chest", "press-h"),
  E("Écarté couché (haltères)", "chest", "fly"),
  E("Écarté à la poulie vis-à-vis", "chest", "fly"),
  E("Pec deck (écarté machine)", "chest", "fly"),

  // Dos
  E("Tractions (pronation)", "back", "pull-v"),
  E("Tractions (supination)", "back", "pull-v"),
  E("Tractions lestées", "back", "pull-v"),
  E("Tirage vertical (poulie haute)", "back", "pull-v"),
  E("Pull-over", "back", "pull-v"),
  E("Rowing barre", "back", "pull-h"),
  E("Rowing haltère unilatéral", "back", "pull-h", ["Rowing unilatéral haltère", "Rowing unilatéral haltère (rappel dos)"]),
  E("Rowing T-bar", "back", "pull-h"),
  E("Rowing machine (assis)", "back", "pull-h"),
  E("Tirage horizontal (poulie basse)", "back", "pull-h"),
  E("Soulevé de terre", "back", "squat"),
  E("Hyperextensions lombaires", "back", "squat"),

  // Épaules
  E("Développé militaire (barre)", "shoulders", "press-v", ["Développé militaire"]),
  E("Développé militaire (haltères)", "shoulders", "press-v", ["Développé militaire haltères"]),
  E("Développé Arnold", "shoulders", "press-v"),
  E("Presse à épaules (machine)", "shoulders", "press-v"),
  E("Élévations latérales (haltères)", "shoulders", "raise", ["Élévations latérales"]),
  E("Élévations latérales (poulie)", "shoulders", "raise"),
  E("Élévations frontales", "shoulders", "raise"),
  E("Oiseau (élévations arrière)", "shoulders", "raise", ["Oiseau haltères (deltoïde postérieur)"]),
  E("Face pull (poulie)", "shoulders", "pull-h"),
  E("Rowing menton", "shoulders", "pull-h"),

  // Biceps
  E("Curl biceps (barre droite)", "biceps", "curl", ["Curl biceps"]),
  E("Curl biceps (barre EZ)", "biceps", "curl", ["Curl biceps barre EZ"]),
  E("Curl haltères alterné", "biceps", "curl"),
  E("Curl marteau", "biceps", "curl"),
  E("Curl pupitre (banc Scott)", "biceps", "curl"),
  E("Curl à la poulie basse", "biceps", "curl"),
  E("Curl concentré", "biceps", "curl"),

  // Triceps
  E("Extension triceps à la poulie (corde)", "triceps", "extension", ["Extension triceps à la poulie"]),
  E("Extension triceps à la poulie (barre)", "triceps", "extension"),
  E("Barre au front (skull crusher)", "triceps", "extension"),
  E("Extension verticale haltère", "triceps", "extension"),
  E("Kickback haltère", "triceps", "extension"),
  E("Développé couché prise serrée", "triceps", "press-h"),
  E("Dips (triceps)", "triceps", "press-h"),

  // Jambes
  E("Squat (barre)", "legs", "squat", ["Squat"]),
  E("Squat avant (front squat)", "legs", "squat"),
  E("Soulevé de terre roumain", "legs", "squat"),
  E("Hip thrust", "legs", "squat"),
  E("Presse à cuisses", "legs", "leg", ["Presse à cuisses / fentes marchées"]),
  E("Leg extension", "legs", "leg"),
  E("Adducteurs (machine)", "legs", "leg"),
  E("Abducteurs (machine)", "legs", "leg"),
  E("Fentes (haltères ou barre)", "legs", "lunge"),
  E("Fentes marchées", "legs", "lunge"),
  E("Squat bulgare", "legs", "lunge"),
  E("Leg curl allongé", "legs", "leg-curl"),
  E("Leg curl assis", "legs", "leg-curl"),
  E("Mollets debout", "legs", "calf"),
  E("Mollets assis", "legs", "calf"),

  // Abdos
  E("Crunch à la poulie", "abs", "core"),
  E("Crunch au sol", "abs", "core"),
  E("Crunch machine", "abs", "core"),
  E("Relevé de jambes suspendu", "abs", "core"),
  E("Relevé de jambes au sol", "abs", "core"),
  E("Gainage (planche)", "abs", "core", ["Gainage"]),
  E("Planche latérale", "abs", "core"),
  E("Russian twist", "abs", "core"),
  E("Roulette abdo (ab wheel)", "abs", "core"),
];

const BY_NAME = new Map();
for (const ex of EXERCISE_LIBRARY) {
  BY_NAME.set(ex.name.toLowerCase(), ex);
  for (const a of ex.aliases) BY_NAME.set(a.toLowerCase(), ex);
}

// Exercice de la bibliothèque correspondant à un nom (nom courant ou ancien nom).
export function findLibraryExercise(name) {
  return BY_NAME.get((name || "").trim().toLowerCase()) || null;
}

// Nom de référence d'un exercice : sert à regrouper l'historique d'un même
// exercice même s'il a été renommé entre-temps.
export function canonicalName(name) {
  const ex = findLibraryExercise(name);
  return ex ? ex.name : (name || "").trim();
}
