// Persistance locale (localStorage) : aucune donnée ne quitte l'appareil.
import { findLibraryExercise, canonicalName } from "./exercises.js";

const KEYS = {
  programs: "muscu:programs",
  history: "muscu:history",
  active: "muscu:active",
  settings: "muscu:settings",
  schedule: "muscu:schedule",
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Clé de jour calendaire en heure locale (évite le décalage UTC de toISOString).
export function localDateKey(isoOrDate) {
  const d = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const Store = {
  KEYS,
  uid,

  getPrograms() {
    return read(KEYS.programs, []);
  },
  saveProgram(program) {
    const list = Store.getPrograms();
    const i = list.findIndex((p) => p.id === program.id);
    if (i >= 0) list[i] = program;
    else list.push(program);
    write(KEYS.programs, list);
  },
  deleteProgram(id) {
    write(KEYS.programs, Store.getPrograms().filter((p) => p.id !== id));
  },
  getProgram(id) {
    return Store.getPrograms().find((p) => p.id === id) || null;
  },

  getHistory() {
    return read(KEYS.history, []);
  },
  addHistorySession(session) {
    const list = Store.getHistory();
    list.push(session);
    write(KEYS.history, list);
  },
  deleteHistorySession(id) {
    write(KEYS.history, Store.getHistory().filter((s) => s.id !== id));
  },

  getActive() {
    return read(KEYS.active, null);
  },
  setActive(session) {
    if (session) write(KEYS.active, session);
    else localStorage.removeItem(KEYS.active);
  },

  getSettings() {
    return read(KEYS.settings, { sound: true, vibration: true, keepAwake: true });
  },
  saveSettings(settings) {
    write(KEYS.settings, settings);
  },

  getSchedule() {
    return read(KEYS.schedule, {});
  },
  setScheduledProgram(dateKey, programId) {
    const schedule = Store.getSchedule();
    schedule[dateKey] = programId;
    write(KEYS.schedule, schedule);
  },
  clearScheduledProgram(dateKey) {
    const schedule = Store.getSchedule();
    delete schedule[dateKey];
    write(KEYS.schedule, schedule);
  },

  sessionsOnDate(dateKey) {
    return Store.getHistory().filter((s) => localDateKey(s.startedAt) === dateKey);
  },

  lastWeightFor(exerciseName) {
    const target = canonicalName(exerciseName);
    const history = Store.getHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      const ex = history[i].exercises.find((e) => canonicalName(e.name) === target);
      if (ex && ex.sets.length) return ex.sets[ex.sets.length - 1].weight;
    }
    return null;
  },

  exportAll() {
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        programs: Store.getPrograms(),
        history: Store.getHistory(),
        settings: Store.getSettings(),
        schedule: Store.getSchedule(),
      },
      null,
      2
    );
  },
  importAll(json) {
    const data = JSON.parse(json);
    if (data.programs) write(KEYS.programs, data.programs);
    if (data.history) write(KEYS.history, data.history);
    if (data.settings) write(KEYS.settings, data.settings);
    if (data.schedule) write(KEYS.schedule, data.schedule);
    Store.migrate();
  },

  // Remet à niveau les données déjà enregistrées sur l'appareil quand le
  // format évolue. Idempotent : peut tourner à chaque démarrage.
  migrate() {
    const programs = Store.getPrograms();
    let changed = false;
    for (const p of programs) {
      if (OLD_PROGRAM_NAMES[p.name]) {
        p.name = OLD_PROGRAM_NAMES[p.name];
        changed = true;
      }
      for (const ex of p.exercises) {
        const rappel = (ex.name.match(/\((rappel [^)]+)\)/i) || [])[1];
        const lib = findLibraryExercise(ex.name);
        if (lib && (ex.name !== lib.name || ex.pattern !== lib.pattern)) {
          ex.name = lib.name;
          ex.pattern = lib.pattern;
          ex.muscle = ex.muscle || lib.muscle;
          changed = true;
        }
        if (rappel && !ex.note) {
          ex.note = rappel.charAt(0).toUpperCase() + rappel.slice(1);
          changed = true;
        }
      }
    }
    if (changed) write(KEYS.programs, programs);

    const history = Store.getHistory();
    let historyChanged = false;
    for (const s of history) {
      if (OLD_PROGRAM_NAMES[s.programName]) {
        s.programName = OLD_PROGRAM_NAMES[s.programName];
        historyChanged = true;
      }
    }
    if (historyChanged) write(KEYS.history, history);
  },
};

const OLD_PROGRAM_NAMES = {
  "Full Body — débutant": "Full body",
  "Push — Pecs / Épaules / Triceps": "Push",
  "Pull — Dos / Biceps": "Pull",
  "Legs — Jambes / Fessiers": "Legs",
};

// Exercice de programme construit depuis la bibliothèque.
function lib(name, targetSets, targetReps, restSeconds, note = "") {
  const ex = findLibraryExercise(name);
  return { id: uid(), name: ex.name, muscle: ex.muscle, pattern: ex.pattern, targetSets, targetReps, restSeconds, note };
}

export const SEED_PROGRAMS = [
  {
    id: "seed-full-body",
    name: "Full body",
    description: "Tout le corps en une séance, idéal pour débuter.",
    exercises: [
      lib("Squat (barre)", 4, "8-10", 120),
      lib("Développé couché (barre)", 4, "8-10", 120),
      lib("Rowing barre", 4, "10-12", 90),
      lib("Développé militaire (barre)", 3, "10-12", 90),
      lib("Curl biceps (barre droite)", 3, "12-15", 60),
      lib("Gainage (planche)", 3, "45s", 45),
    ],
  },
  {
    id: "seed-ppl-push",
    name: "Push",
    description: "Pecs, épaules, triceps.",
    exercises: [
      lib("Développé couché (barre)", 4, "6-8", 150),
      lib("Développé militaire (haltères)", 3, "8-10", 120),
      lib("Élévations latérales (haltères)", 4, "12-15", 60),
      lib("Extension triceps à la poulie (corde)", 3, "12-15", 60),
      lib("Rowing haltère unilatéral", 3, "10-12", 75, "Rappel dos"),
      lib("Crunch à la poulie", 3, "15-20", 45, "Finisher"),
    ],
  },
  {
    id: "seed-ppl-pull",
    name: "Pull",
    description: "Dos, biceps, arrière d'épaule.",
    exercises: [
      lib("Tractions lestées", 4, "6-8", 150),
      lib("Rowing haltère unilatéral", 4, "8-10", 90),
      lib("Curl biceps (barre EZ)", 3, "10-12", 60),
      lib("Oiseau (élévations arrière)", 3, "12-15", 60),
      lib("Développé incliné (haltères)", 3, "10-12", 75, "Rappel pecs"),
      lib("Crunch à la poulie", 3, "15-20", 45, "Finisher"),
    ],
  },
  {
    id: "seed-ppl-legs",
    name: "Legs",
    description: "Quadriceps, ischios, fessiers, mollets.",
    exercises: [
      lib("Squat (barre)", 4, "6-8", 150),
      lib("Soulevé de terre roumain", 3, "8-10", 120),
      lib("Presse à cuisses", 3, "10-12", 90),
      lib("Leg curl allongé", 3, "12-15", 75),
      lib("Mollets debout", 4, "15-20", 45),
      lib("Crunch à la poulie", 3, "15-20", 45, "Finisher"),
    ],
  },
];
