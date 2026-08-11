// Persistance locale (localStorage) — aucune donnée ne quitte l'appareil.

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
    const history = Store.getHistory();
    for (let i = history.length - 1; i >= 0; i--) {
      const ex = history[i].exercises.find((e) => e.name === exerciseName);
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
  },
};

export const SEED_PROGRAMS = [
  {
    id: "seed-full-body",
    name: "Full Body — débutant",
    exercises: [
      { id: uid(), name: "Squat", targetSets: 4, targetReps: "8-10", restSeconds: 120, note: "", muscle: "legs" },
      { id: uid(), name: "Développé couché", targetSets: 4, targetReps: "8-10", restSeconds: 120, note: "", muscle: "chest" },
      { id: uid(), name: "Rowing barre", targetSets: 4, targetReps: "10-12", restSeconds: 90, note: "", muscle: "back" },
      { id: uid(), name: "Développé militaire", targetSets: 3, targetReps: "10-12", restSeconds: 90, note: "", muscle: "shoulders" },
      { id: uid(), name: "Curl biceps", targetSets: 3, targetReps: "12-15", restSeconds: 60, note: "", muscle: "biceps" },
      { id: uid(), name: "Gainage", targetSets: 3, targetReps: "45s", restSeconds: 45, note: "", muscle: "abs" },
    ],
  },
  {
    id: "seed-ppl-push",
    name: "Push — Pecs / Épaules / Triceps",
    exercises: [
      { id: uid(), name: "Développé couché", targetSets: 4, targetReps: "6-8", restSeconds: 150, note: "", muscle: "chest" },
      { id: uid(), name: "Développé militaire haltères", targetSets: 3, targetReps: "8-10", restSeconds: 120, note: "", muscle: "shoulders" },
      { id: uid(), name: "Élévations latérales", targetSets: 4, targetReps: "12-15", restSeconds: 60, note: "", muscle: "shoulders" },
      { id: uid(), name: "Extension triceps à la poulie", targetSets: 3, targetReps: "12-15", restSeconds: 60, note: "", muscle: "triceps" },
      { id: uid(), name: "Rowing unilatéral haltère (rappel dos)", targetSets: 3, targetReps: "10-12", restSeconds: 75, note: "", muscle: "back" },
      { id: uid(), name: "Crunch à la poulie", targetSets: 3, targetReps: "15-20", restSeconds: 45, note: "", muscle: "abs" },
    ],
  },
  {
    id: "seed-ppl-pull",
    name: "Pull — Dos / Biceps",
    exercises: [
      { id: uid(), name: "Tractions lestées", targetSets: 4, targetReps: "6-8", restSeconds: 150, note: "", muscle: "back" },
      { id: uid(), name: "Rowing unilatéral haltère", targetSets: 4, targetReps: "8-10", restSeconds: 90, note: "", muscle: "back" },
      { id: uid(), name: "Curl biceps barre EZ", targetSets: 3, targetReps: "10-12", restSeconds: 60, note: "", muscle: "biceps" },
      { id: uid(), name: "Oiseau haltères (deltoïde postérieur)", targetSets: 3, targetReps: "12-15", restSeconds: 60, note: "", muscle: "shoulders" },
      { id: uid(), name: "Développé incliné haltères léger (rappel pecs)", targetSets: 3, targetReps: "10-12", restSeconds: 75, note: "", muscle: "chest" },
      { id: uid(), name: "Crunch à la poulie", targetSets: 3, targetReps: "15-20", restSeconds: 45, note: "", muscle: "abs" },
    ],
  },
  {
    id: "seed-ppl-legs",
    name: "Legs — Jambes / Fessiers",
    exercises: [
      { id: uid(), name: "Squat", targetSets: 4, targetReps: "6-8", restSeconds: 150, note: "", muscle: "legs" },
      { id: uid(), name: "Soulevé de terre roumain", targetSets: 3, targetReps: "8-10", restSeconds: 120, note: "", muscle: "legs" },
      { id: uid(), name: "Presse à cuisses / fentes marchées", targetSets: 3, targetReps: "10-12", restSeconds: 90, note: "", muscle: "legs" },
      { id: uid(), name: "Leg curl allongé", targetSets: 3, targetReps: "12-15", restSeconds: 75, note: "", muscle: "legs" },
      { id: uid(), name: "Mollets debout", targetSets: 4, targetReps: "15-20", restSeconds: 45, note: "", muscle: "legs" },
      { id: uid(), name: "Crunch à la poulie", targetSets: 3, targetReps: "15-20", restSeconds: 45, note: "", muscle: "abs" },
    ],
  },
];
