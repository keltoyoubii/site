import { Store, SEED_PROGRAMS, localDateKey } from "./storage.js";
import { RestTimer, playBeep, vibrate, formatTime, requestWakeLock, releaseWakeLock } from "./timer.js";
import { lineChart, barChart } from "./charts.js";
import { MUSCLES, muscleBadge, inferMuscle } from "./muscles.js";

const root = document.getElementById("app");

/* ============================== Router ============================== */

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const [name, ...rest] = h.split("/").filter(Boolean);
  return { name: name || "home", params: rest };
}

function navigate(path) {
  location.hash = path;
}

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  render();
  registerSW();
});

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

/* ============================== Toast ============================== */

let toastTimer = null;
function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 2200);
}

/* ============================== Helpers ============================== */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fmtDateLong(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

function topbar({ title, subtitle, back, right }) {
  const bar = el("div", { class: "topbar" });
  if (back) {
    bar.appendChild(el("button", { class: "icon-btn", "aria-label": "Retour", onclick: back }, "←"));
  }
  const titleWrap = el("div", {}, [
    el("div", { class: "topbar__title" }, title),
    subtitle ? el("div", { class: "topbar__sub" }, subtitle) : null,
  ]);
  titleWrap.style.flex = "1";
  bar.appendChild(titleWrap);
  if (right) bar.appendChild(right);
  return bar;
}

/* ============================== Views ============================== */

let activeTimers = [];
function stopActiveTimers() {
  activeTimers.forEach((t) => t.stop());
  activeTimers = [];
}

function render() {
  stopActiveTimers();
  const { name, params } = parseHash();
  root.innerHTML = "";
  const view = VIEWS[name] || VIEWS.home;
  root.appendChild(view(...params));
}

const VIEWS = {
  home: viewDashboard,
  programmes: viewProgramsList,
  programme: viewProgramEditor,
  seance: viewSession,
  historique: viewHistory,
  exercice: viewExerciseProgress,
  reglages: viewSettings,
  modeles: viewPresets,
};

function uniqueMuscles(exercises) {
  return [...new Set(exercises.map((e) => e.muscle).filter(Boolean))];
}

/* --------- Dashboard (accueil) --------- */

function startOfWeek(date) {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameWeek(a, b) {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

function sessionVolume(s) {
  return s.exercises.reduce((sum, e) => sum + e.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0);
}

function computeWeeklyVolume(history, weeksCount) {
  const weeks = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    weeks.push(startOfWeek(new Date(Date.now() - i * 7 * 86400000)));
  }
  return weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const vol = history
      .filter((s) => { const d = new Date(s.startedAt); return d >= weekStart && d < weekEnd; })
      .reduce((sum, s) => sum + sessionVolume(s), 0);
    return { x: weekStart, y: Math.round(vol), label: weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) };
  });
}

function viewDashboard() {
  const view = el("div", { class: "view" });
  view.appendChild(
    topbar({
      title: "Muscu",
      subtitle: "Ton tableau de bord.",
      right: el("button", { class: "icon-btn", onclick: () => navigate("/reglages") }, "⚙"),
    })
  );

  const active = Store.getActive();
  if (active) {
    const program = Store.getProgram(active.programId);
    view.appendChild(
      el("div", { class: "banner" }, [
        el("div", { class: "banner__text" }, [
          el("b", {}, "Séance en cours"),
          `${program ? program.name : "Programme"} — reprends où tu en étais`,
        ]),
        el("button", { class: "btn btn--primary btn--sm", onclick: () => navigate(`/seance/${active.programId}`) }, "Reprendre"),
      ])
    );
  }

  /* ---- Calendrier : clique un jour pour choisir / démarrer une séance ---- */

  const viewedDate = new Date();
  viewedDate.setDate(1);
  let selectedKey = localDateKey(new Date());

  const navRow = el("div", { class: "cal-nav" });
  const monthLabel = el("div", { class: "cal-nav__label" });
  const prevBtn = el("button", { class: "icon-btn", type: "button", "aria-label": "Mois précédent" }, "‹");
  const nextBtn = el("button", { class: "icon-btn", type: "button", "aria-label": "Mois suivant" }, "›");
  navRow.appendChild(prevBtn);
  navRow.appendChild(monthLabel);
  navRow.appendChild(nextBtn);

  const grid = el("div", { class: "cal-grid" });
  const calCard = el("div", { class: "card stack" }, [
    navRow,
    el("div", { class: "cal-weekdays" }, ["L", "M", "M", "J", "V", "S", "D"].map((d) => el("span", {}, d))),
    grid,
  ]);
  view.appendChild(calCard);

  const panelWrap = el("div", { class: "day-panel" });
  view.appendChild(panelWrap);

  function redrawGrid() {
    monthLabel.textContent = viewedDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    grid.innerHTML = "";
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const offset = (firstOfMonth.getDay() + 6) % 7; // lundi = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = localDateKey(new Date());
    const schedule = Store.getSchedule();

    for (let i = 0; i < offset; i++) {
      grid.appendChild(el("button", { class: "cal-cell", type: "button", disabled: "true" }, ""));
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const key = localDateKey(new Date(year, month, day));
      const hasSession = Store.sessionsOnDate(key).length > 0;
      const hasPlan = !!schedule[key];
      grid.appendChild(
        el("button", {
          class: `cal-cell${key === todayKey ? " is-today" : ""}${key === selectedKey ? " is-selected" : ""}`,
          type: "button",
          onclick: () => { selectedKey = key; redrawGrid(); redrawPanel(); },
        }, [
          el("span", {}, String(day)),
          el("span", { class: `cal-cell__dot${hasSession ? " is-done" : hasPlan ? " is-planned" : ""}` }),
        ])
      );
    }
  }

  function redrawPanel() {
    panelWrap.innerHTML = "";
    const d = new Date(`${selectedKey}T00:00:00`);
    const isToday = selectedKey === localDateKey(new Date());
    panelWrap.appendChild(el("div", { class: "day-panel__title" }, d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })));

    const sessions = Store.sessionsOnDate(selectedKey);
    if (sessions.length > 0) {
      sessions.forEach((s) => {
        const volume = sessionVolume(s);
        const nSets = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
        panelWrap.appendChild(
          el("div", { class: "card session-item" }, [
            el("div", { class: "session-item__name" }, `✓ ${s.programName}`),
            el("div", { class: "session-item__stats" }, [
              el("span", {}, `${nSets} séries`),
              el("span", {}, `${Math.round(volume).toLocaleString("fr-FR")} kg volume`),
            ]),
            el("div", { class: "stack", style: "gap:6px; margin-top:8px;" }, s.exercises.map((e) =>
              el("div", { class: "exercise-row-inline" }, [
                muscleBadge(e.muscle, "sm"),
                el("div", { class: "program-card__meta" }, `${e.name} — ${e.sets.map((st) => `${st.weight}kg×${st.reps}`).join(", ")}`),
              ])
            )),
          ])
        );
      });
      return;
    }

    const schedule = Store.getSchedule();
    const plannedProgram = schedule[selectedKey] ? Store.getProgram(schedule[selectedKey]) : null;

    if (plannedProgram) {
      panelWrap.appendChild(
        el("div", { class: "card program-card" }, [
          el("div", { class: "text-dim" }, "Programme prévu"),
          el("div", { class: "program-card__name" }, plannedProgram.name),
          !isToday ? el("div", { class: "text-dim", style: "font-size:.78rem;" }, "La séance sera enregistrée à la date d'aujourd'hui.") : null,
          el("div", { class: "program-card__actions" }, [
            el("button", { class: "btn btn--primary", onclick: () => startSession(plannedProgram.id) }, "▶ Commencer maintenant"),
            el("button", { class: "btn btn--ghost btn--sm", onclick: () => { Store.clearScheduledProgram(selectedKey); redrawGrid(); redrawPanel(); } }, "Retirer"),
          ]),
        ])
      );
      return;
    }

    const programs = Store.getPrograms();
    if (programs.length === 0) {
      panelWrap.appendChild(
        el("div", { class: "empty" }, [
          el("div", {}, "Crée d'abord un programme pour pouvoir choisir ta séance."),
          el("button", { class: "btn btn--primary btn--sm", style: "margin-top:12px;", onclick: () => navigate("/programme/new") }, "+ Créer un programme"),
        ])
      );
      return;
    }
    panelWrap.appendChild(el("div", { class: "text-dim" }, "Quel programme ce jour-là ?"));
    const picker = el("div", { class: "chip-group" });
    programs.forEach((p) => {
      picker.appendChild(
        el("button", { class: "chip", type: "button", onclick: () => { Store.setScheduledProgram(selectedKey, p.id); redrawGrid(); redrawPanel(); } }, p.name)
      );
    });
    panelWrap.appendChild(picker);
  }

  prevBtn.addEventListener("click", () => { viewedDate.setMonth(viewedDate.getMonth() - 1); redrawGrid(); });
  nextBtn.addEventListener("click", () => { viewedDate.setMonth(viewedDate.getMonth() + 1); redrawGrid(); });

  redrawGrid();
  redrawPanel();

  /* ---- Progression générale ---- */

  const history = Store.getHistory();
  if (history.length > 0) {
    view.appendChild(el("div", { class: "section-title" }, "Progression générale"));

    const now = new Date();
    const volume30 = history
      .filter((s) => Date.now() - new Date(s.startedAt).getTime() <= 30 * 86400000)
      .reduce((sum, s) => sum + sessionVolume(s), 0);
    const weekCount = history.filter((s) => isSameWeek(new Date(s.startedAt), now)).length;

    view.appendChild(
      el("div", { class: "summary-grid" }, [
        el("div", { class: "summary-stat" }, [el("span", { class: "n" }, String(history.length)), el("span", { class: "l" }, "séances au total")]),
        el("div", { class: "summary-stat" }, [el("span", { class: "n" }, String(weekCount)), el("span", { class: "l" }, "cette semaine")]),
        el("div", { class: "summary-stat" }, [el("span", { class: "n" }, Math.round(volume30).toLocaleString("fr-FR")), el("span", { class: "l" }, "kg (30 j.)")]),
      ])
    );

    view.appendChild(
      el("div", { class: "card stack" }, [
        el("div", { class: "text-dim" }, "Volume par semaine"),
        barChart(computeWeeklyVolume(history, 8), { unit: " kg" }),
      ])
    );

    view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/historique") }, "Voir tout l'historique →"));
  } else {
    view.appendChild(el("div", { class: "empty" }, "Ta progression apparaîtra ici après ta première séance."));
  }

  view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/programmes") }, "🗂 Mes programmes"));

  return view;
}

/* --------- Mes programmes --------- */

function viewProgramsList() {
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: "Mes programmes", back: () => navigate("/") }));

  const programs = Store.getPrograms();
  const list = el("div", { class: "stack" });

  if (programs.length === 0) {
    list.appendChild(
      el("div", { class: "empty" }, [
        el("div", {}, "Aucun programme pour l'instant."),
        el("div", { class: "row", style: "justify-content:center; margin-top:14px; gap:10px;" }, [
          el("button", { class: "btn btn--primary", onclick: () => navigate("/programme/new") }, "+ Créer un programme"),
        ]),
        el("button", { class: "btn btn--ghost btn--sm", style: "margin-top:10px;", onclick: () => navigate("/modeles") }, "Ou charger un modèle"),
      ])
    );
  } else {
    programs.forEach((p) => {
      const nSets = p.exercises.reduce((s, e) => s + e.targetSets, 0);
      const badgeRow = el("div", { class: "muscle-badge-row" });
      uniqueMuscles(p.exercises).forEach((m) => badgeRow.appendChild(muscleBadge(m, "sm")));
      list.appendChild(
        el("div", { class: "card program-card" }, [
          el("div", { class: "program-card__name" }, p.name),
          el("div", { class: "program-card__meta" }, `${p.exercises.length} exercices · ${nSets} séries au total`),
          badgeRow.children.length ? badgeRow : null,
          el("div", { class: "program-card__actions" }, [
            el("button", { class: "btn btn--ghost btn--sm", onclick: () => navigate(`/programme/${p.id}`) }, "Modifier"),
          ]),
        ])
      );
    });
  }
  view.appendChild(list);
  view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/programme/new") }, "+ Nouveau programme"));
  view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/modeles") }, "📋 Modèles (Full Body, Push/Pull/Legs...)"));

  return view;
}

/* --------- Modèles / presets --------- */

function viewPresets() {
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: "Modèles de programme", subtitle: "Ajoute-les tels quels, puis modifie-les à ta guise.", back: () => navigate("/programmes") }));

  const list = el("div", { class: "stack" });
  SEED_PROGRAMS.forEach((preset) => {
    const nSets = preset.exercises.reduce((s, e) => s + e.targetSets, 0);
    const badgeRow = el("div", { class: "muscle-badge-row" });
    uniqueMuscles(preset.exercises).forEach((m) => badgeRow.appendChild(muscleBadge(m, "sm")));
    list.appendChild(
      el("div", { class: "card program-card" }, [
        el("div", { class: "program-card__name" }, preset.name),
        el("div", { class: "program-card__meta" }, `${preset.exercises.length} exercices · ${nSets} séries · ${preset.exercises.map((e) => e.name).join(", ")}`),
        badgeRow,
        el("div", { class: "program-card__actions" }, [
          el("button", {
            class: "btn btn--primary",
            onclick: () => {
              Store.saveProgram({ ...preset, id: Store.uid(), exercises: preset.exercises.map((e) => ({ ...e, id: Store.uid() })) });
              toast(`« ${preset.name} » ajouté à tes programmes`);
              navigate("/programmes");
            },
          }, "+ Ajouter à mes programmes"),
        ]),
      ])
    );
  });
  view.appendChild(list);

  return view;
}

function startSession(programId) {
  const existing = Store.getActive();
  if (existing && existing.programId !== programId) {
    if (!confirm("Une autre séance est déjà en cours. L'abandonner et démarrer celle-ci ?")) return;
    Store.setActive(null);
  }
  navigate(`/seance/${programId}`);
}

/* --------- Program editor --------- */

function blankExercise() {
  return { id: Store.uid(), name: "", targetSets: 3, targetReps: "10", restSeconds: 90, note: "", muscle: null };
}

function viewProgramEditor(id) {
  const isNew = id === "new";
  const program = isNew
    ? { id: Store.uid(), name: "", exercises: [blankExercise()] }
    : structuredClone(Store.getProgram(id) || { id: Store.uid(), name: "", exercises: [blankExercise()] });

  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: isNew ? "Nouveau programme" : "Modifier le programme", back: () => navigate("/programmes") }));

  const nameInput = el("input", { type: "text", placeholder: "Nom du programme (ex : Push / Pull / Legs)", value: program.name });
  view.appendChild(el("label", { class: "field" }, ["Nom", nameInput]));

  const exList = el("div", { class: "stack" });
  view.appendChild(exList);

  function renumberAndRedraw() {
    exList.innerHTML = "";
    program.exercises.forEach((ex, i) => exList.appendChild(exerciseRow(ex, i)));
  }

  function exerciseRow(ex, i) {
    const row = el("div", { class: "exercise-row" });
    let muscleManuallySet = !!ex.muscle;
    const badge = muscleBadge(ex.muscle, "md");
    const nameField = el("input", {
      type: "text",
      placeholder: `Exercice ${i + 1}`,
      value: ex.name,
      oninput: (e) => {
        ex.name = e.target.value;
        if (!muscleManuallySet) {
          ex.muscle = inferMuscle(ex.name);
          const fresh = muscleBadge(ex.muscle, "md");
          badge.innerHTML = fresh.innerHTML;
          badge.className = fresh.className;
          badge.title = fresh.title || "";
          muscleChips.querySelectorAll(".chip").forEach((c, idx) => c.classList.toggle("is-active", MUSCLES[idx].key === ex.muscle));
        }
      },
    });

    row.appendChild(
      el("div", { class: "exercise-row__head" }, [
        el("div", { class: "exercise-row__order" }, [
          el("button", { class: "btn btn--sm btn--ghost", disabled: i === 0 ? "true" : null, onclick: () => { [program.exercises[i - 1], program.exercises[i]] = [program.exercises[i], program.exercises[i - 1]]; renumberAndRedraw(); } }, "↑"),
          el("button", { class: "btn btn--sm btn--ghost", disabled: i === program.exercises.length - 1 ? "true" : null, onclick: () => { [program.exercises[i + 1], program.exercises[i]] = [program.exercises[i], program.exercises[i + 1]]; renumberAndRedraw(); } }, "↓"),
        ]),
        badge,
        nameField,
        el("button", { class: "icon-btn", "aria-label": "Supprimer", onclick: () => { program.exercises.splice(i, 1); renumberAndRedraw(); } }, "✕"),
      ])
    );

    const muscleChips = el("div", { class: "chip-group" }, MUSCLES.map((m) =>
      el("button", { class: `chip${ex.muscle === m.key ? " is-active" : ""}`, type: "button", onclick: (e) => {
        ex.muscle = m.key;
        muscleManuallySet = true;
        const fresh = muscleBadge(ex.muscle, "md");
        badge.innerHTML = fresh.innerHTML;
        badge.className = fresh.className;
        badge.title = fresh.title;
        e.currentTarget.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
        e.currentTarget.classList.add("is-active");
      } }, m.label)
    ));
    row.appendChild(el("label", { class: "field" }, ["Muscle ciblé", muscleChips]));

    const setsInput = el("input", { type: "number", min: "1", value: ex.targetSets, oninput: (e) => (ex.targetSets = Math.max(1, parseInt(e.target.value) || 1)) });
    const repsInput = el("input", { type: "text", value: ex.targetReps, placeholder: "8-10", oninput: (e) => (ex.targetReps = e.target.value) });
    const restLabel = el("div", { class: "text-dim", style: "font-size:.8rem;" }, formatRest(ex.restSeconds));
    const restField = el("div", {}, [
      restLabel,
      el("div", { class: "chip-group" }, [30, 60, 90, 120, 180, 240].map((s) =>
        el("button", { class: `chip${ex.restSeconds === s ? " is-active" : ""}`, type: "button", onclick: (e) => {
          ex.restSeconds = s;
          restLabel.textContent = formatRest(s);
          e.currentTarget.parentElement.querySelectorAll(".chip").forEach((c) => c.classList.remove("is-active"));
          e.currentTarget.classList.add("is-active");
        } }, formatRest(s))
      )),
    ]);

    row.appendChild(
      el("div", { class: "exercise-row__grid" }, [
        el("label", { class: "field" }, ["Séries", setsInput]),
        el("label", { class: "field" }, ["Reps cible", repsInput]),
        el("label", { class: "field" }, ["Repos", restField]),
      ])
    );

    return row;
  }

  renumberAndRedraw();

  view.appendChild(
    el("button", { class: "btn btn--ghost btn--block", onclick: () => { program.exercises.push(blankExercise()); renumberAndRedraw(); } }, "+ Ajouter un exercice")
  );

  view.appendChild(el("div", { class: "divider" }));

  const actions = el("div", { class: "stack" });
  actions.appendChild(
    el("button", {
      class: "btn btn--primary btn--block btn--lg",
      onclick: () => {
        program.name = nameInput.value.trim() || "Programme sans nom";
        program.exercises = program.exercises.filter((e) => e.name.trim() !== "");
        if (program.exercises.length === 0) {
          toast("Ajoute au moins un exercice");
          return;
        }
        Store.saveProgram(program);
        toast("Programme enregistré");
        navigate("/programmes");
      },
    }, "Enregistrer")
  );
  if (!isNew) {
    actions.appendChild(
      el("button", { class: "btn btn--danger btn--block", onclick: () => {
        if (confirm("Supprimer ce programme ?")) {
          Store.deleteProgram(program.id);
          navigate("/programmes");
        }
      } }, "Supprimer le programme")
    );
  }
  view.appendChild(actions);

  return view;
}

function formatRest(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m${String(s).padStart(2, "0")}` : `${m} min`;
}

/* --------- Session runner : toutes les cartes sur une seule page --------- */

function parsePrimaryReps(target) {
  const match = String(target).match(/\d+/);
  return match ? parseInt(match[0]) : 10;
}
function roundTo(v, step) {
  return Math.round(v / step) * step;
}

function newExerciseState() {
  // phase: "idle" | "armed" | "resting" — persisté pour survivre à un rendu
  // global déclenché par une AUTRE carte (ex. fin du repos d'un autre exercice).
  return { setIndex: 0, phase: "idle", armedWeight: null, armedReps: null, restEndsAt: null, restDurationMs: null, restConsumed: false };
}

function viewSession(programId) {
  const program = Store.getProgram(programId);
  const view = el("div", { class: "view" });

  if (!program) {
    view.appendChild(topbar({ title: "Séance", back: () => navigate("/") }));
    view.appendChild(el("div", { class: "empty" }, "Programme introuvable."));
    return view;
  }

  let session = Store.getActive();
  if (!session || session.programId !== programId) {
    session = {
      programId,
      startedAt: new Date().toISOString(),
      finished: false,
      log: program.exercises.map((ex) => ({ exerciseId: ex.id, name: ex.name, muscle: ex.muscle || null, restSeconds: ex.restSeconds, sets: [] })),
      exerciseState: program.exercises.map(() => newExerciseState()),
    };
    Store.setActive(session);
  }
  if (!session.exerciseState) {
    // reprise d'une séance créée avant ce format (ancien flux séquentiel)
    session.exerciseState = program.exercises.map(() => newExerciseState());
    session.finished = false;
    Store.setActive(session);
  }
  requestWakeLock();

  if (session.finished) {
    return renderSummary(program, session);
  }

  const totalSets = program.exercises.reduce((s, e) => s + e.targetSets, 0);
  const doneSets = session.log.reduce((s, e) => s + e.sets.length, 0);
  const allDone = session.exerciseState.every((st, i) => st.setIndex >= program.exercises[i].targetSets);

  view.appendChild(
    topbar({
      title: program.name,
      subtitle: `${doneSets} / ${totalSets} séries`,
      back: () => {
        if (confirm("Quitter la séance ? Ta progression reste enregistrée, tu pourras reprendre.")) {
          releaseWakeLock();
          navigate("/");
        }
      },
    })
  );

  const list = el("div", { class: "stack" });
  program.exercises.forEach((exercise, i) => list.appendChild(renderExerciseCard(program, session, exercise, i)));
  view.appendChild(list);

  view.appendChild(
    el("button", {
      class: `btn btn--block btn--lg ${allDone ? "btn--primary" : "btn--ghost"}`,
      onclick: () => finishSession(program, session, allDone),
    }, allDone ? "🏁 Voir le résumé" : "Terminer la séance maintenant")
  );

  return view;
}

function renderExerciseCard(program, session, exercise, index) {
  const state = session.exerciseState[index];
  const exLog = session.log[index];
  const isDone = state.setIndex >= exercise.targetSets;

  const card = el("div", { class: `card ex-card${isDone ? " is-complete" : ""}` });

  card.appendChild(
    el("div", { class: "ex-card__head" }, [
      muscleBadge(exercise.muscle, "md"),
      el("div", { class: "stack", style: "gap:2px; flex:1;" }, [
        el("div", { class: "ex-card__name" }, exercise.name),
        el("div", { class: "ex-card__meta" }, `${exercise.targetSets} × ${exercise.targetReps} · repos ${formatRest(exercise.restSeconds)}`),
      ]),
      isDone ? el("span", { class: "ex-card__check" }, "✓") : null,
    ])
  );

  const dots = el("div", { class: "set-dots" });
  for (let s = 0; s < exercise.targetSets; s++) {
    dots.appendChild(el("span", { class: `set-dot${s < state.setIndex ? " is-done" : ""}${s === state.setIndex && !isDone ? " is-current" : ""}` }));
  }
  card.appendChild(dots);

  if (isDone) {
    card.appendChild(
      el("div", { class: "text-dim text-center", style: "font-size:.85rem;" }, exLog.sets.map((s) => `${s.weight}kg×${s.reps}`).join(" · "))
    );
    return card;
  }

  const lastWeight = Store.lastWeightFor(exercise.name);
  const prevSetThisSession = exLog.sets[state.setIndex - 1];
  const isArmed = state.phase === "armed";
  let weight = isArmed && state.armedWeight != null ? state.armedWeight : prevSetThisSession ? prevSetThisSession.weight : lastWeight ?? 20;
  let reps = isArmed && state.armedReps != null ? state.armedReps : parsePrimaryReps(exercise.targetReps);

  const weightValue = el("span", { class: "n" }, String(weight));
  const repsValue = el("span", { class: "n" }, String(reps));

  const weightStepper = el("div", { class: "stepper stepper--sm" }, [
    el("button", { class: "stepper__btn", type: "button", onclick: () => { weight = Math.max(0, roundTo(weight - 2.5, 2.5)); weightValue.textContent = weight; } }, "−"),
    el("div", { class: "stepper__value" }, [weightValue, el("span", { class: "u" }, "kg")]),
    el("button", { class: "stepper__btn", type: "button", onclick: () => { weight = roundTo(weight + 2.5, 2.5); weightValue.textContent = weight; } }, "+"),
  ]);
  const repsStepper = el("div", { class: "stepper stepper--sm" }, [
    el("button", { class: "stepper__btn", type: "button", onclick: () => { reps = Math.max(0, reps - 1); repsValue.textContent = reps; } }, "−"),
    el("div", { class: "stepper__value" }, [repsValue, el("span", { class: "u" }, "reps")]),
    el("button", { class: "stepper__btn", type: "button", onclick: () => { reps += 1; repsValue.textContent = reps; } }, "+"),
  ]);
  const steppersRow = el("div", { class: "row", style: "gap:8px;" }, [weightStepper, repsStepper]);
  card.appendChild(steppersRow);

  if (lastWeight !== null) {
    card.appendChild(el("div", { class: "last-time" }, `Dernière fois : ${lastWeight} kg`));
  }

  const actionSlot = el("div", {});
  card.appendChild(actionSlot);

  function setSteppersDisabled(disabled) {
    steppersRow.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
  }

  function renderGoButton() {
    actionSlot.innerHTML = "";
    setSteppersDisabled(false);
    actionSlot.appendChild(
      el("button", {
        class: "btn btn--primary btn--lg btn--block",
        onclick: () => {
          state.phase = "armed";
          state.armedWeight = weight;
          state.armedReps = reps;
          Store.setActive(session);
          setSteppersDisabled(true);
          renderArmedButton();
        },
      }, `GO — Série ${state.setIndex + 1}`)
    );
  }

  function renderArmedButton() {
    actionSlot.innerHTML = "";
    actionSlot.appendChild(
      el("button", {
        class: "btn btn--armed btn--lg btn--block",
        onclick: () => {
          exLog.sets.push({ weight, reps, ts: new Date().toISOString() });
          state.phase = "resting";
          state.armedWeight = null;
          state.armedReps = null;
          state.restConsumed = false;
          state.restDurationMs = exercise.restSeconds * 1000;
          state.restEndsAt = Date.now() + state.restDurationMs;
          Store.setActive(session);
          renderTimerBar();
        },
      }, "Fin de série — Repos")
    );
  }

  function renderTimerBar() {
    actionSlot.innerHTML = "";
    const bar = el("div", { class: "timerbar" });
    const fill = el("div", { class: "timerbar__fill" });
    const label = el("div", { class: "timerbar__label" }, "0:00");
    bar.appendChild(fill);
    bar.appendChild(label);
    actionSlot.appendChild(bar);

    const skipBtn = el("button", { class: "btn btn--ghost btn--sm", style: "margin-top:8px; width:100%;", onclick: () => timer.skip() }, "Passer le repos");
    actionSlot.appendChild(skipBtn);

    const timer = new RestTimer({
      onTick: (remainingMs, durationMs) => {
        label.textContent = formatTime(remainingMs);
        fill.style.width = `${Math.min(100, Math.max(0, (1 - remainingMs / durationMs) * 100))}%`;
      },
      onDone: () => {
        fill.style.width = "100%";
        bar.classList.add("is-done");
        skipBtn.classList.add("hidden");
        if (!state.restConsumed) {
          state.restConsumed = true;
          state.setIndex += 1;
          state.phase = "idle";
          state.restEndsAt = null;
          state.restDurationMs = null;
          Store.setActive(session);
          playBeep();
          vibrate([200, 100, 200, 100, 400]);
        }
        setTimeout(() => render(), 650);
      },
    });
    activeTimers.push(timer);
    timer.resume(state.restEndsAt, state.restDurationMs);
  }

  if (state.phase === "resting" && state.restEndsAt) {
    setSteppersDisabled(true);
    renderTimerBar();
  } else if (state.phase === "armed") {
    setSteppersDisabled(true);
    renderArmedButton();
  } else {
    renderGoButton();
  }

  return card;
}

function finishSession(program, session, skipConfirm) {
  if (!skipConfirm && !confirm("Terminer la séance maintenant ? Les séries déjà notées seront enregistrées.")) return;
  session.finished = true;
  Store.setActive(session);
  render();
}

function renderSummary(program, session) {
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: "Séance terminée" }));

  const totalSets = session.log.reduce((s, e) => s + e.sets.length, 0);
  const totalVolume = session.log.reduce((s, e) => s + e.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0);
  const durationMs = Date.now() - new Date(session.startedAt).getTime();

  view.appendChild(
    el("div", { class: "summary-grid" }, [
      el("div", { class: "summary-stat" }, [el("span", { class: "n" }, String(totalSets)), el("span", { class: "l" }, "séries")]),
      el("div", { class: "summary-stat" }, [el("span", { class: "n" }, Math.round(totalVolume).toLocaleString("fr-FR")), el("span", { class: "l" }, "kg soulevés (volume)")]),
      el("div", { class: "summary-stat" }, [el("span", { class: "n" }, fmtDuration(durationMs)), el("span", { class: "l" }, "durée")]),
      el("div", { class: "summary-stat" }, [el("span", { class: "n" }, String(session.log.filter((e) => e.sets.length > 0).length)), el("span", { class: "l" }, "exercices faits")]),
    ])
  );

  const detail = el("div", { class: "stack" });
  session.log.filter((e) => e.sets.length > 0).forEach((e) => {
    detail.appendChild(
      el("div", { class: "card exercise-row-inline" }, [
        muscleBadge(e.muscle, "sm"),
        el("div", { class: "stack", style: "gap:4px;" }, [
          el("div", { class: "program-card__name" }, e.name),
          el("div", { class: "program-card__meta" }, e.sets.map((s) => `${s.weight}kg×${s.reps}`).join(" · ")),
        ]),
      ])
    );
  });
  view.appendChild(detail);

  view.appendChild(
    el("button", {
      class: "btn btn--primary btn--lg btn--block",
      onclick: () => {
        releaseWakeLock();
        const finished = {
          id: Store.uid(),
          programId: program.id,
          programName: program.name,
          startedAt: session.startedAt,
          endedAt: new Date().toISOString(),
          exercises: session.log.filter((e) => e.sets.length > 0),
        };
        Store.addHistorySession(finished);
        Store.setActive(null);
        toast("Séance enregistrée 💪");
        navigate("/");
      },
    }, "Enregistrer et terminer")
  );

  return view;
}

/* --------- History --------- */

function viewHistory() {
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: "Historique", back: () => navigate("/") }));

  const history = Store.getHistory().slice().reverse();
  if (history.length === 0) {
    view.appendChild(el("div", { class: "empty" }, "Aucune séance enregistrée pour le moment."));
    return view;
  }

  const exerciseNames = [...new Set(Store.getHistory().flatMap((s) => s.exercises.map((e) => e.name)))].sort();
  const picker = el("div", { class: "chip-group" });
  exerciseNames.forEach((name) => {
    picker.appendChild(el("button", { class: "chip", type: "button", onclick: () => navigate(`/exercice/${encodeURIComponent(name)}`) }, name));
  });
  if (exerciseNames.length) {
    view.appendChild(el("div", { class: "card stack" }, [el("div", { class: "text-dim" }, "Progression par exercice"), picker]));
  }

  const list = el("div", { class: "stack" });
  history.forEach((s) => {
    const volume = s.exercises.reduce((sum, e) => sum + e.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0);
    const nSets = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
    list.appendChild(
      el("div", { class: "card session-item" }, [
        el("div", { class: "session-item__head" }, [
          el("div", { class: "session-item__name" }, s.programName),
          el("div", { class: "session-item__date" }, fmtDateLong(s.startedAt)),
        ]),
        el("div", { class: "session-item__stats" }, [
          el("span", {}, `${nSets} séries`),
          el("span", {}, `${Math.round(volume).toLocaleString("fr-FR")} kg volume`),
          el("span", {}, fmtDuration(new Date(s.endedAt) - new Date(s.startedAt))),
        ]),
        el("button", { class: "btn btn--ghost btn--sm", style: "align-self:flex-start; margin-top:6px;", onclick: () => {
          if (confirm("Supprimer cette séance de l'historique ?")) {
            Store.deleteHistorySession(s.id);
            render();
          }
        } }, "Supprimer"),
      ])
    );
  });
  view.appendChild(list);

  return view;
}

function viewExerciseProgress(encodedName) {
  const name = decodeURIComponent(encodedName);
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: name, subtitle: "Progression", back: () => navigate("/historique") }));

  const history = Store.getHistory();
  const points = [];
  history.forEach((s) => {
    const ex = s.exercises.find((e) => e.name === name);
    if (!ex || !ex.sets.length) return;
    const maxWeight = Math.max(...ex.sets.map((set) => set.weight));
    points.push({ x: s.startedAt, y: maxWeight, label: fmtDate(s.startedAt) });
  });

  const volumePoints = history.map((s) => {
    const ex = s.exercises.find((e) => e.name === name);
    if (!ex) return null;
    const volume = ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
    return { x: s.startedAt, y: Math.round(volume), label: fmtDate(s.startedAt) };
  }).filter(Boolean);

  view.appendChild(el("div", { class: "card stack" }, [
    el("div", { class: "text-dim" }, "Charge max par séance (kg)"),
    lineChart(points, { unit: " kg" }),
  ]));
  view.appendChild(el("div", { class: "card stack" }, [
    el("div", { class: "text-dim" }, "Volume total par séance (kg)"),
    barChart(volumePoints, { unit: " kg" }),
  ]));

  return view;
}

/* --------- Settings --------- */

function viewSettings() {
  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: "Réglages", back: () => navigate("/") }));

  const settings = Store.getSettings();

  view.appendChild(
    el("div", { class: "card stack" }, [
      toggleRow("Vibration en fin de repos", settings.vibration, (v) => { settings.vibration = v; Store.saveSettings(settings); }),
      toggleRow("Garder l'écran allumé pendant la séance", settings.keepAwake, (v) => { settings.keepAwake = v; Store.saveSettings(settings); }),
    ])
  );

  view.appendChild(
    el("div", { class: "card stack" }, [
      el("div", { class: "text-dim" }, "Sauvegarde"),
      el("button", { class: "btn btn--ghost btn--block", onclick: exportData }, "Exporter mes données (.json)"),
      el("label", { class: "btn btn--ghost btn--block" }, [
        "Importer un fichier .json",
        el("input", { type: "file", accept: "application/json", style: "display:none;", onchange: importData }),
      ]),
    ])
  );

  view.appendChild(
    el("button", { class: "btn btn--danger btn--block", onclick: () => {
      if (confirm("Tout supprimer (programmes + historique) ? Cette action est irréversible.")) {
        localStorage.removeItem(Store.KEYS.programs);
        localStorage.removeItem(Store.KEYS.history);
        localStorage.removeItem(Store.KEYS.active);
        localStorage.removeItem(Store.KEYS.schedule);
        toast("Données effacées");
        navigate("/");
      }
    } }, "Effacer toutes les données")
  );

  return view;
}

function toggleRow(label, value, onChange) {
  const input = el("input", { type: "checkbox" });
  input.checked = value;
  input.addEventListener("change", () => onChange(input.checked));
  input.style.width = "22px";
  input.style.height = "22px";
  return el("div", { class: "row" }, [el("div", { class: "spacer" }, label), input]);
}

function exportData() {
  const blob = new Blob([Store.exportAll()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `muscu-export-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      Store.importAll(reader.result);
      toast("Import réussi");
      navigate("/");
    } catch {
      toast("Fichier invalide");
    }
  };
  reader.readAsText(file);
}
