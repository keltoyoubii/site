import { Store, SEED_PROGRAMS, localDateKey } from "./storage.js";
import { RestTimer, playBeep, vibrate, formatTime, requestWakeLock, releaseWakeLock } from "./timer.js";
import { lineChart, barChart } from "./charts.js";
import { MUSCLES, muscleBadge, muscleLabel, inferMuscle } from "./muscles.js";
import { EXERCISE_LIBRARY, PATTERN_LABELS, findLibraryExercise, canonicalName } from "./exercises.js";
import { icon } from "./icons.js";

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

window.addEventListener("hashchange", () => render({ scrollTop: true }));
window.addEventListener("DOMContentLoaded", () => {
  Store.migrate();
  render();
  registerSW();
});

function registerSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

const TABS = [
  { key: "home", path: "/", label: "Accueil", icon: "house" },
  { key: "programmes", path: "/programmes", label: "Programmes", icon: "list-checks" },
  { key: "bibliotheque", path: "/bibliotheque", label: "Exercices", icon: "barbell" },
  { key: "historique", path: "/historique", label: "Progrès", icon: "chart-line-up" },
];

// Onglet actif pour chaque route ; les routes absentes (séance, éditeur)
// s'affichent en plein écran, sans barre d'onglets.
const TAB_FOR_ROUTE = {
  home: "home",
  reglages: "home",
  programmes: "programmes",
  modeles: "programmes",
  bibliotheque: "bibliotheque",
  historique: "historique",
  exercice: "historique",
};

let activeTimers = [];
function stopActiveTimers() {
  activeTimers.forEach((t) => t.stop());
  activeTimers = [];
}

function render({ scrollTop = false } = {}) {
  stopActiveTimers();
  closeAllModals();
  const { name, params } = parseHash();
  const routeName = VIEWS[name] ? name : "home";
  root.innerHTML = "";
  root.appendChild(VIEWS[routeName](...params));
  const tab = TAB_FOR_ROUTE[routeName];
  document.body.classList.toggle("has-tabbar", !!tab);
  if (tab) root.appendChild(tabBar(tab));
  if (scrollTop) window.scrollTo(0, 0);
}

function tabBar(active) {
  return el("nav", { class: "tabbar", "aria-label": "Navigation principale" }, TABS.map((t) =>
    el("a", {
      class: `tabbar__item${t.key === active ? " is-active" : ""}`,
      href: `#${t.path}`,
      "aria-current": t.key === active ? "page" : null,
    }, [icon(t.icon), el("span", {}, t.label)])
  ));
}

/* ============================== Helpers ============================== */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

function iconButton(name, label, onclick, disabled = false) {
  return el("button", { class: "icon-btn", type: "button", "aria-label": label, title: label, disabled, onclick }, [icon(name)]);
}

function norm(s) {
  return (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}
function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtDuration(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}
function formatRest(seconds) {
  if (seconds < 60) return `${seconds} s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m} min ${String(s).padStart(2, "0")}` : `${m} min`;
}
function num(n) {
  return Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}
function kg(n) {
  return `${num(n)} kg`;
}
function plural(n, word) {
  return `${n} ${word}${n > 1 ? "s" : ""}`;
}

function sessionVolume(s) {
  return s.exercises.reduce((sum, e) => sum + e.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0);
}

function uniqueMuscles(exercises) {
  return [...new Set(exercises.map((e) => e.muscle).filter(Boolean))];
}

function muscleBadgeRow(exercises) {
  const row = el("div", { class: "muscle-badge-row" });
  uniqueMuscles(exercises).forEach((m) => row.appendChild(muscleBadge(m, "sm")));
  return row.children.length ? row : null;
}

function topbar({ title, subtitle, back, right }) {
  return el("header", { class: "topbar" }, [
    back ? iconButton("caret-left", "Retour", back) : null,
    el("div", { class: "topbar__titles" }, [
      el("h1", { class: "topbar__title" }, title),
      subtitle ? el("div", { class: "topbar__sub" }, subtitle) : null,
    ]),
    right || null,
  ]);
}

function settings() {
  return Store.getSettings();
}

/* ============================== Toast ============================== */

let toastTimer = null;
function toast(msg, action = null) {
  let node = document.querySelector(".toast");
  if (!node) {
    node = el("div", { class: "toast", role: "status" });
    document.body.appendChild(node);
  }
  node.innerHTML = "";
  node.appendChild(el("span", {}, msg));
  if (action) {
    node.appendChild(el("button", { class: "toast__action", type: "button", onclick: () => { node.classList.remove("is-visible"); action.onClick(); } }, action.label));
  }
  node.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("is-visible"), action ? 4500 : 2400);
}

/* ============================== Feuilles modales ============================== */

const openModals = new Set();

function openModal(content, { footer = null, onClose = null } = {}) {
  const sheet = el("div", { class: "modal-sheet", role: "dialog", "aria-modal": "true" }, [el("div", { class: "modal-body" }, [content])]);
  if (footer) sheet.appendChild(el("div", { class: "modal-footer" }, [footer]));
  const backdrop = el("div", { class: "modal-backdrop" }, [sheet]);
  function onKey(e) {
    if (e.key === "Escape") close();
  }
  function close() {
    if (!openModals.has(close)) return;
    openModals.delete(close);
    backdrop.remove();
    document.removeEventListener("keydown", onKey);
    document.body.classList.toggle("modal-open", openModals.size > 0);
    onClose?.();
  }
  backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(backdrop);
  document.body.classList.add("modal-open");
  openModals.add(close);
  return close;
}

function closeAllModals() {
  [...openModals].forEach((close) => close());
}

function sheetHeader(title, onClose) {
  return el("div", { class: "sheet-head" }, [
    el("h2", { class: "sheet-head__title" }, title),
    iconButton("x", "Fermer", onClose),
  ]);
}

// Remplace window.confirm : même logique, mais dans le style de l'app.
function confirmSheet(message, { confirmLabel = "Confirmer", detail = "", danger = false } = {}) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (value) => {
      if (answered) return;
      answered = true;
      resolve(value);
      close();
    };
    const content = el("div", { class: "stack" }, [
      el("h2", { class: "sheet-head__title" }, message),
      detail ? el("p", { class: "text-dim sheet-text" }, detail) : null,
      el("div", { class: "confirm-actions" }, [
        el("button", { class: "btn btn--ghost", type: "button", onclick: () => answer(false) }, "Annuler"),
        el("button", { class: `btn ${danger ? "btn--danger" : "btn--primary"}`, type: "button", onclick: () => answer(true) }, confirmLabel),
      ]),
    ]);
    const close = openModal(content, { onClose: () => answer(false) });
  });
}

/* ============================== Vues ============================== */

const VIEWS = {
  home: viewDashboard,
  programmes: viewProgramsList,
  programme: viewProgramEditor,
  modeles: viewPresets,
  bibliotheque: viewLibrary,
  seance: viewSession,
  historique: viewHistory,
  exercice: viewExerciseProgress,
  reglages: viewSettings,
};

/* --------- Tableau de bord --------- */

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // lundi = 0
  d.setHours(0, 0, 0, 0);
  return d;
}

function computeWeeklyVolume(history, weeksCount) {
  const weeks = [];
  for (let i = weeksCount - 1; i >= 0; i--) weeks.push(startOfWeek(new Date(Date.now() - i * 7 * 86400000)));
  return weeks.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const vol = history
      .filter((s) => { const d = new Date(s.startedAt); return d >= weekStart && d < weekEnd; })
      .reduce((sum, s) => sum + sessionVolume(s), 0);
    return { x: weekStart, y: Math.round(vol), label: weekStart.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) };
  });
}

function viewDashboard() {
  const view = el("main", { class: "view" });
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  view.appendChild(topbar({ title: "Muscu", subtitle: today, right: iconButton("gear-six", "Réglages", () => navigate("/reglages")) }));

  const active = Store.getActive();
  if (active) {
    const program = Store.getProgram(active.programId);
    view.appendChild(
      el("div", { class: "banner" }, [
        el("div", { class: "banner__text" }, [el("b", {}, "Séance en cours"), program ? program.name : "Programme"]),
        el("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => navigate(`/seance/${active.programId}`) }, [icon("play"), "Reprendre"]),
      ])
    );
  }

  /* ---- Calendrier : un jour = une séance ---- */

  const viewedDate = new Date();
  viewedDate.setDate(1);
  let selectedKey = localDateKey(new Date());

  const monthLabel = el("h2", { class: "cal-nav__label" });
  const grid = el("div", { class: "cal-grid" });
  view.appendChild(
    el("section", { class: "card stack", "aria-label": "Calendrier" }, [
      el("div", { class: "cal-nav" }, [
        iconButton("caret-left", "Mois précédent", () => { viewedDate.setMonth(viewedDate.getMonth() - 1); redrawGrid(); }),
        monthLabel,
        iconButton("caret-right", "Mois suivant", () => { viewedDate.setMonth(viewedDate.getMonth() + 1); redrawGrid(); }),
      ]),
      el("div", { class: "cal-weekdays", "aria-hidden": "true" }, ["L", "M", "M", "J", "V", "S", "D"].map((d) => el("span", {}, d))),
      grid,
      el("div", { class: "cal-legend" }, [
        el("span", {}, [el("span", { class: "cal-cell__dot is-done" }), "Séance faite"]),
        el("span", {}, [el("span", { class: "cal-cell__dot is-planned" }), "Prévue"]),
      ]),
    ])
  );

  const panelWrap = el("section", { class: "day-panel", "aria-live": "polite" });
  view.appendChild(panelWrap);

  function redrawGrid() {
    monthLabel.textContent = viewedDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    grid.innerHTML = "";
    const year = viewedDate.getFullYear();
    const month = viewedDate.getMonth();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = localDateKey(new Date());
    const schedule = Store.getSchedule();

    for (let i = 0; i < offset; i++) grid.appendChild(el("span", { class: "cal-cell is-blank" }));
    for (let day = 1; day <= daysInMonth; day++) {
      const key = localDateKey(new Date(year, month, day));
      const hasSession = Store.sessionsOnDate(key).length > 0;
      const hasPlan = !!schedule[key];
      grid.appendChild(
        el("button", {
          class: `cal-cell${key === todayKey ? " is-today" : ""}${key === selectedKey ? " is-selected" : ""}`,
          type: "button",
          "aria-pressed": String(key === selectedKey),
          "aria-label": new Date(year, month, day).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
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
    const isToday = selectedKey === localDateKey(new Date());
    const d = new Date(`${selectedKey}T00:00:00`);
    panelWrap.appendChild(el("h2", { class: "section-title" }, isToday ? "Aujourd'hui" : d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })));

    const sessions = Store.sessionsOnDate(selectedKey);
    if (sessions.length > 0) {
      sessions.forEach((s) => panelWrap.appendChild(sessionRecapCard(s)));
      return;
    }

    const programs = Store.getPrograms();
    if (programs.length === 0) {
      panelWrap.appendChild(
        el("div", { class: "empty" }, [
          el("p", {}, "Crée un programme pour pouvoir lancer ta séance."),
          el("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => navigate("/programmes") }, "Voir les programmes"),
        ])
      );
      return;
    }

    const schedule = Store.getSchedule();
    const planned = schedule[selectedKey] ? Store.getProgram(schedule[selectedKey]) : null;

    if (planned) {
      panelWrap.appendChild(
        el("div", { class: "card program-row is-planned" }, [
          el("div", { class: "program-row__info" }, [
            el("div", { class: "program-row__eyebrow" }, "Prévu"),
            el("div", { class: "program-row__name" }, planned.name),
            el("div", { class: "program-row__meta" }, `${plural(planned.exercises.length, "exercice")}, ${plural(planned.exercises.reduce((s, e) => s + e.targetSets, 0), "série")}`),
          ]),
          el("div", { class: "program-row__actions" }, [
            el("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => startSession(planned.id) }, [icon("play"), "Démarrer"]),
            el("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => { Store.clearScheduledProgram(selectedKey); redrawGrid(); redrawPanel(); } }, "Retirer"),
          ]),
        ])
      );
      if (!isToday) panelWrap.appendChild(el("p", { class: "hint" }, "Démarrer maintenant enregistre la séance à la date d'aujourd'hui."));
      return;
    }

    if (isToday) {
      panelWrap.appendChild(el("p", { class: "text-dim" }, "Choisis ta séance du jour."));
      programs.forEach((p) => {
        panelWrap.appendChild(
          el("div", { class: "card program-row" }, [
            el("div", { class: "program-row__info" }, [
              el("div", { class: "program-row__name" }, p.name),
              el("div", { class: "program-row__meta" }, `${plural(p.exercises.length, "exercice")}, ${plural(p.exercises.reduce((s, e) => s + e.targetSets, 0), "série")}`),
              muscleBadgeRow(p.exercises),
            ]),
            el("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => startSession(p.id) }, [icon("play"), "Démarrer"]),
          ])
        );
      });
      return;
    }

    panelWrap.appendChild(el("p", { class: "text-dim" }, "Planifier une séance ce jour-là :"));
    panelWrap.appendChild(
      el("div", { class: "chip-group" }, programs.map((p) =>
        el("button", { class: "chip", type: "button", onclick: () => { Store.setScheduledProgram(selectedKey, p.id); redrawGrid(); redrawPanel(); } }, p.name)
      ))
    );
  }

  redrawGrid();
  redrawPanel();

  /* ---- Progression générale ---- */

  const history = Store.getHistory();
  const progress = el("section", { class: "stack", "aria-label": "Progression" }, [el("h2", { class: "section-title" }, "Progression")]);
  if (history.length > 0) {
    const now = new Date();
    const volume30 = history.filter((s) => Date.now() - new Date(s.startedAt).getTime() <= 30 * 86400000).reduce((sum, s) => sum + sessionVolume(s), 0);
    const weekCount = history.filter((s) => startOfWeek(new Date(s.startedAt)).getTime() === startOfWeek(now).getTime()).length;
    progress.appendChild(
      el("div", { class: "stat-grid" }, [
        statTile(String(weekCount), "cette semaine"),
        statTile(String(history.length), "séances au total"),
        statTile(`${Math.round(volume30).toLocaleString("fr-FR")} kg`, "soulevés en 30 jours"),
      ])
    );
    progress.appendChild(el("div", { class: "card stack" }, [el("div", { class: "card-label" }, "Volume par semaine (kg)"), barChart(computeWeeklyVolume(history, 8), { unit: " kg" })]));
    progress.appendChild(el("a", { class: "btn btn--ghost btn--block", href: "#/historique" }, ["Voir le détail par exercice", icon("caret-right")]));
  } else {
    progress.appendChild(el("div", { class: "empty" }, "Ta progression apparaîtra ici après ta première séance."));
  }
  view.appendChild(progress);

  return view;
}

function statTile(value, label) {
  return el("div", { class: "stat" }, [el("span", { class: "stat__value" }, value), el("span", { class: "stat__label" }, label)]);
}

function sessionRecapCard(s) {
  const nSets = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
  return el("div", { class: "card stack session-recap" }, [
    el("div", { class: "session-recap__head" }, [
      icon("check-circle", "ico--accent"),
      el("div", { class: "program-row__name" }, s.programName),
    ]),
    el("div", { class: "program-row__meta" }, `${plural(nSets, "série")}, ${Math.round(sessionVolume(s)).toLocaleString("fr-FR")} kg de volume`),
    el("ul", { class: "recap-list" }, s.exercises.map((e) =>
      el("li", { class: "recap-list__item" }, [
        muscleBadge(e.muscle, "sm", e.pattern || findLibraryExercise(e.name)?.pattern),
        el("div", {}, [
          el("div", { class: "recap-list__name" }, e.name),
          el("div", { class: "recap-list__sets" }, e.sets.map((st) => `${kg(st.weight)} × ${st.reps}`).join(", ")),
        ]),
      ])
    )),
  ]);
}

async function startSession(programId) {
  const existing = Store.getActive();
  if (existing && existing.programId !== programId) {
    const ok = await confirmSheet("Une autre séance est en cours", {
      detail: "La démarrer abandonne la séance en cours sans l'enregistrer.",
      confirmLabel: "Abandonner et démarrer",
      danger: true,
    });
    if (!ok) return;
    Store.setActive(null);
  }
  navigate(`/seance/${programId}`);
}

/* --------- Mes programmes --------- */

function viewProgramsList() {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Programmes", subtitle: "Touche un programme pour le modifier." }));

  const programs = Store.getPrograms();
  if (programs.length === 0) {
    view.appendChild(
      el("div", { class: "empty" }, [
        el("p", {}, "Aucun programme pour l'instant."),
        el("div", { class: "empty__actions" }, [
          el("button", { class: "btn btn--primary", type: "button", onclick: () => navigate("/programme/new") }, [icon("plus"), "Créer un programme"]),
          el("button", { class: "btn btn--ghost", type: "button", onclick: () => navigate("/modeles") }, "Partir d'un modèle"),
        ]),
      ])
    );
    return view;
  }

  const list = el("div", { class: "stack" });
  programs.forEach((p) => {
    list.appendChild(
      el("a", { class: "card program-row program-row--link", href: `#/programme/${p.id}` }, [
        el("div", { class: "program-row__info" }, [
          el("div", { class: "program-row__name" }, p.name),
          el("div", { class: "program-row__meta" }, `${plural(p.exercises.length, "exercice")}, ${plural(p.exercises.reduce((s, e) => s + e.targetSets, 0), "série")}`),
          muscleBadgeRow(p.exercises),
        ]),
        icon("caret-right", "ico--dim"),
      ])
    );
  });
  view.appendChild(list);
  view.appendChild(
    el("div", { class: "button-pair" }, [
      el("button", { class: "btn btn--ghost", type: "button", onclick: () => navigate("/programme/new") }, [icon("plus"), "Nouveau"]),
      el("button", { class: "btn btn--ghost", type: "button", onclick: () => navigate("/modeles") }, "Modèles"),
    ])
  );
  return view;
}

/* --------- Modèles --------- */

function viewPresets() {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Modèles", subtitle: "Ajoute-les puis adapte-les à ta guise.", back: () => navigate("/programmes") }));

  const list = el("div", { class: "stack" });
  SEED_PROGRAMS.forEach((preset) => {
    list.appendChild(
      el("div", { class: "card program-row" }, [
        el("div", { class: "program-row__info" }, [
          el("div", { class: "program-row__name" }, preset.name),
          el("div", { class: "program-row__meta" }, preset.description),
          el("div", { class: "program-row__meta" }, preset.exercises.map((e) => e.name).join(", ")),
          muscleBadgeRow(preset.exercises),
        ]),
        el("button", {
          class: "btn btn--primary btn--sm",
          type: "button",
          onclick: () => {
            const { description, ...rest } = preset;
            Store.saveProgram({ ...rest, id: Store.uid(), exercises: preset.exercises.map((e) => ({ ...e, id: Store.uid() })) });
            toast(`${preset.name} ajouté à tes programmes`);
            navigate("/programmes");
          },
        }, [icon("plus"), "Ajouter"]),
      ])
    );
  });
  view.appendChild(list);
  return view;
}

/* --------- Bibliothèque d'exercices --------- */

// Valeurs par défaut sensées selon le type de mouvement.
function defaultsFor(pattern) {
  if (["press-h", "press-v", "pull-v", "pull-h", "squat"].includes(pattern)) return { targetSets: 4, targetReps: "6-10", restSeconds: 120 };
  if (pattern === "calf") return { targetSets: 4, targetReps: "12-15", restSeconds: 45 };
  if (pattern === "core") return { targetSets: 3, targetReps: "15-20", restSeconds: 45 };
  return { targetSets: 3, targetReps: "10-12", restSeconds: 75 };
}

function exerciseFromLibrary(ex) {
  return { id: Store.uid(), name: ex.name, muscle: ex.muscle, pattern: ex.pattern, note: "", ...defaultsFor(ex.pattern) };
}

// Liste filtrable (recherche + groupe musculaire), partagée entre l'onglet
// Exercices et la feuille d'ajout de l'éditeur.
function libraryBrowser({ selectable = false, selected = new Set(), onPick, onChange }) {
  let filter = "all";
  const search = el("input", { type: "search", class: "search-input", placeholder: "Rechercher (ex. curl, squat)", "aria-label": "Rechercher un exercice", autocomplete: "off" });
  const chips = el("div", { class: "chip-scroll", role: "group", "aria-label": "Filtrer par muscle" });
  const list = el("div", { class: "lib-list" });

  function drawChips() {
    chips.innerHTML = "";
    [{ key: "all", label: "Tous" }, ...MUSCLES].forEach((m) => {
      chips.appendChild(
        el("button", {
          class: `chip${filter === m.key ? " is-active" : ""}`,
          type: "button",
          "aria-pressed": String(filter === m.key),
          onclick: () => { filter = m.key; drawChips(); drawList(); },
        }, m.label)
      );
    });
  }

  function drawList() {
    list.innerHTML = "";
    const q = norm(search.value);
    let count = 0;
    (filter === "all" ? MUSCLES : MUSCLES.filter((m) => m.key === filter)).forEach((m) => {
      const items = EXERCISE_LIBRARY.filter((ex) => ex.muscle === m.key && (!q || norm(ex.name).includes(q)));
      if (!items.length) return;
      count += items.length;
      if (filter === "all") list.appendChild(el("h3", { class: "lib-group" }, m.label));
      items.forEach((ex) => list.appendChild(libRow(ex)));
    });
    if (!count) list.appendChild(el("div", { class: "empty empty--compact" }, "Aucun exercice ne correspond. Tu peux créer un exercice personnalisé."));
  }

  function libRow(ex) {
    const isSel = selected.has(ex.name);
    return el("button", {
      class: `lib-row${isSel ? " is-selected" : ""}`,
      type: "button",
      "aria-pressed": selectable ? String(isSel) : null,
      onclick: () => {
        if (!selectable) return onPick(ex);
        if (isSel) selected.delete(ex.name);
        else selected.add(ex.name);
        drawList();
        onChange?.(selected);
      },
    }, [
      muscleBadge(ex.muscle, "md", ex.pattern),
      el("span", { class: "lib-row__text" }, [
        el("span", { class: "lib-row__name" }, ex.name),
        el("span", { class: "lib-row__meta" }, PATTERN_LABELS[ex.pattern]),
      ]),
      selectable ? el("span", { class: "lib-row__check" }, isSel ? [icon("check")] : []) : icon("caret-right", "ico--dim"),
    ]);
  }

  search.addEventListener("input", drawList);
  drawChips();
  drawList();
  return el("div", { class: "stack lib-browser" }, [search, chips, list]);
}

function openLibraryPicker({ title, onConfirm, onCustom, multi = true }) {
  if (!multi) {
    const content = el("div", { class: "stack" }, [
      sheetHeader(title, () => close()),
      libraryBrowser({ onPick: (ex) => { close(); onConfirm([ex]); } }),
    ]);
    const close = openModal(content);
    return;
  }
  const selected = new Set();
  const addBtn = el("button", {
    class: "btn btn--primary btn--block",
    type: "button",
    disabled: true,
    onclick: () => {
      const picked = EXERCISE_LIBRARY.filter((e) => selected.has(e.name));
      close();
      onConfirm(picked);
    },
  }, "Sélectionne des exercices");
  const browser = libraryBrowser({
    selectable: true,
    selected,
    onChange: (s) => {
      addBtn.disabled = s.size === 0;
      addBtn.textContent = s.size ? `Ajouter ${plural(s.size, "exercice")}` : "Sélectionne des exercices";
    },
  });
  const content = el("div", { class: "stack" }, [
    sheetHeader(title, () => close()),
    browser,
    el("button", { class: "btn btn--ghost btn--block", type: "button", onclick: () => { close(); onCustom(); } }, [icon("plus"), "Exercice personnalisé"]),
  ]);
  const close = openModal(content, { footer: addBtn });
}

function viewLibrary() {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Exercices", subtitle: `${EXERCISE_LIBRARY.length} exercices classiques de salle` }));
  view.appendChild(libraryBrowser({ onPick: openExerciseDetail }));
  return view;
}

function openExerciseDetail(ex) {
  const last = Store.lastWeightFor(ex.name);
  const programs = Store.getPrograms();
  const progList = el("div", { class: "stack stack--tight" }, programs.map((p) => {
    const already = p.exercises.some((e) => canonicalName(e.name) === ex.name);
    return el("button", {
      class: "btn btn--ghost btn--block btn--between",
      type: "button",
      disabled: already,
      onclick: () => {
        const fresh = Store.getProgram(p.id);
        fresh.exercises.push(exerciseFromLibrary(ex));
        Store.saveProgram(fresh);
        close();
        toast(`${ex.name} ajouté à ${p.name}`);
      },
    }, [el("span", {}, p.name), already ? el("span", { class: "text-dim" }, "Déjà dedans") : icon("plus")]);
  }));

  const content = el("div", { class: "stack" }, [
    sheetHeader(ex.name, () => close()),
    el("div", { class: "ex-hero" }, [
      muscleBadge(ex.muscle, "xl", ex.pattern),
      el("div", { class: "stack stack--tight" }, [
        el("span", { class: "tag tag--accent" }, muscleLabel(ex.muscle)),
        el("span", { class: "text-dim" }, PATTERN_LABELS[ex.pattern]),
        last !== null ? el("span", {}, `Dernière charge : ${kg(last)}`) : null,
      ]),
    ]),
    last !== null
      ? el("button", { class: "btn btn--ghost btn--block", type: "button", onclick: () => { close(); navigate(`/exercice/${encodeURIComponent(ex.name)}`); } }, [icon("chart-line-up"), "Voir ma progression"])
      : null,
    el("h3", { class: "field-label" }, "Ajouter à un programme"),
    programs.length ? progList : el("p", { class: "text-dim" }, "Crée d'abord un programme."),
  ]);
  const close = openModal(content);
}

/* --------- Éditeur de programme --------- */

function viewProgramEditor(id) {
  const isNew = id === "new";
  const stored = isNew ? null : Store.getProgram(id);
  const program = stored ? structuredClone(stored) : { id: Store.uid(), name: "", exercises: [] };
  const initial = JSON.stringify(program);
  const isDirty = () => JSON.stringify(program) !== initial;

  const view = el("main", { class: "view view--with-footer" });
  view.appendChild(
    topbar({
      title: isNew ? "Nouveau programme" : "Modifier",
      back: async () => {
        if (isDirty() && !(await confirmSheet("Quitter sans enregistrer ?", { detail: "Tes modifications seront perdues.", confirmLabel: "Quitter", danger: true }))) return;
        navigate("/programmes");
      },
    })
  );

  const nameInput = el("input", { id: "program-name", type: "text", value: program.name, placeholder: "Push, Pull, Legs...", oninput: (e) => (program.name = e.target.value) });
  view.appendChild(el("div", { class: "field" }, [el("label", { class: "field-label", for: "program-name" }, "Nom du programme"), nameInput]));

  const countLabel = el("h2", { class: "section-title" });
  const list = el("div", { class: "ex-list" });
  view.appendChild(countLabel);
  view.appendChild(list);

  view.appendChild(
    el("button", {
      class: "btn btn--block btn--dashed",
      type: "button",
      onclick: () => openLibraryPicker({
        title: "Ajouter des exercices",
        onConfirm: (picked) => {
          picked.forEach((ex) => program.exercises.push(exerciseFromLibrary(ex)));
          redraw();
          toast(`${plural(picked.length, "exercice")} ajouté${picked.length > 1 ? "s" : ""}`);
        },
        onCustom: () => {
          const ex = { id: Store.uid(), name: "", muscle: null, pattern: null, note: "", ...defaultsFor(null) };
          program.exercises.push(ex);
          redraw();
          openExerciseSettings(ex);
        },
      }),
    }, [icon("plus"), "Ajouter des exercices"])
  );

  if (!isNew) {
    view.appendChild(
      el("button", {
        class: "btn btn--danger btn--block",
        type: "button",
        onclick: async () => {
          if (!(await confirmSheet(`Supprimer « ${program.name || "ce programme"} » ?`, { detail: "L'historique de tes séances est conservé.", confirmLabel: "Supprimer", danger: true }))) return;
          Store.deleteProgram(program.id);
          toast("Programme supprimé");
          navigate("/programmes");
        },
      }, [icon("trash"), "Supprimer le programme"])
    );
  }

  view.appendChild(
    el("div", { class: "sticky-footer" }, [
      el("button", {
        class: "btn btn--primary btn--block btn--lg",
        type: "button",
        onclick: () => {
          program.name = nameInput.value.trim();
          if (!program.name) {
            nameInput.focus();
            toast("Donne un nom au programme");
            return;
          }
          program.exercises = program.exercises.filter((e) => e.name.trim() !== "");
          if (program.exercises.length === 0) {
            toast("Ajoute au moins un exercice");
            return;
          }
          Store.saveProgram(program);
          toast("Programme enregistré");
          navigate("/programmes");
        },
      }, "Enregistrer"),
    ])
  );

  function move(i, delta) {
    const j = i + delta;
    [program.exercises[i], program.exercises[j]] = [program.exercises[j], program.exercises[i]];
    redraw();
  }

  function remove(i) {
    const [removed] = program.exercises.splice(i, 1);
    redraw();
    toast(`${removed.name || "Exercice"} retiré`, {
      label: "Annuler",
      onClick: () => { program.exercises.splice(i, 0, removed); redraw(); },
    });
  }

  function redraw() {
    list.innerHTML = "";
    const n = program.exercises.length;
    const totalSets = program.exercises.reduce((s, e) => s + e.targetSets, 0);
    countLabel.textContent = n ? `${plural(n, "exercice")}, ${plural(totalSets, "série")}` : "Exercices";
    if (!n) {
      list.appendChild(el("div", { class: "empty empty--compact" }, "Aucun exercice. Ajoute-en depuis la bibliothèque."));
      return;
    }
    program.exercises.forEach((ex, i) => {
      list.appendChild(
        el("div", { class: "ex-row" }, [
          el("button", { class: "ex-row__main", type: "button", onclick: () => openExerciseSettings(ex) }, [
            muscleBadge(ex.muscle, "md", ex.pattern),
            el("span", { class: "ex-row__text" }, [
              el("span", { class: "ex-row__name" }, ex.name || "Exercice sans nom"),
              el("span", { class: "ex-row__meta" }, [
                `${ex.targetSets} × ${ex.targetReps}, repos ${formatRest(ex.restSeconds)}`,
                ex.note ? el("span", { class: "tag" }, ex.note) : null,
              ]),
            ]),
          ]),
          el("div", { class: "ex-row__actions" }, [
            iconButton("arrow-up", "Monter", () => move(i, -1), i === 0),
            iconButton("arrow-down", "Descendre", () => move(i, 1), i === n - 1),
            iconButton("trash", `Retirer ${ex.name}`, () => remove(i)),
          ]),
        ])
      );
    });
  }

  // Réglages d'un exercice du programme (séries, reps, repos, note...).
  function openExerciseSettings(ex) {
    let muscleManual = !!ex.muscle;
    const badgeSlot = el("div", {}, [muscleBadge(ex.muscle, "lg", ex.pattern)]);
    const refreshBadge = () => { badgeSlot.innerHTML = ""; badgeSlot.appendChild(muscleBadge(ex.muscle, "lg", ex.pattern)); };

    const nameField = el("input", {
      id: "ex-name",
      type: "text",
      value: ex.name,
      placeholder: "Ex. Rowing Yates",
      oninput: (e) => {
        ex.name = e.target.value;
        const libEx = findLibraryExercise(ex.name);
        ex.pattern = libEx ? libEx.pattern : null;
        if (!muscleManual) {
          ex.muscle = libEx ? libEx.muscle : inferMuscle(ex.name);
          drawMuscles();
        }
        refreshBadge();
      },
    });

    const muscleChips = el("div", { class: "chip-group" });
    function drawMuscles() {
      muscleChips.innerHTML = "";
      MUSCLES.forEach((m) => muscleChips.appendChild(
        el("button", {
          class: `chip${ex.muscle === m.key ? " is-active" : ""}`,
          type: "button",
          "aria-pressed": String(ex.muscle === m.key),
          onclick: () => { ex.muscle = m.key; muscleManual = true; drawMuscles(); refreshBadge(); },
        }, m.label)
      ));
    }
    drawMuscles();

    const setsValue = el("span", { class: "stepper__num" }, String(ex.targetSets));
    const setsStepper = el("div", { class: "stepper stepper--inline" }, [
      iconButton("minus", "Une série de moins", () => { ex.targetSets = Math.max(1, ex.targetSets - 1); setsValue.textContent = ex.targetSets; }),
      setsValue,
      iconButton("plus", "Une série de plus", () => { ex.targetSets = Math.min(10, ex.targetSets + 1); setsValue.textContent = ex.targetSets; }),
    ]);

    const repsInput = el("input", { id: "ex-reps", type: "text", inputmode: "text", value: ex.targetReps, placeholder: "8-10", oninput: (e) => (ex.targetReps = e.target.value.trim() || "10") });

    const restChips = el("div", { class: "chip-group" });
    function drawRest() {
      restChips.innerHTML = "";
      [30, 45, 60, 75, 90, 120, 150, 180, 240].forEach((s) => restChips.appendChild(
        el("button", { class: `chip${ex.restSeconds === s ? " is-active" : ""}`, type: "button", "aria-pressed": String(ex.restSeconds === s), onclick: () => { ex.restSeconds = s; drawRest(); } }, formatRest(s))
      ));
    }
    drawRest();

    const noteInput = el("input", { id: "ex-note", type: "text", value: ex.note || "", placeholder: "Rappel dos, Finisher...", oninput: (e) => (ex.note = e.target.value) });

    const content = el("div", { class: "stack" }, [
      sheetHeader(ex.name || "Nouvel exercice", () => close()),
      el("div", { class: "ex-hero" }, [badgeSlot, el("div", { class: "field", style: "flex:1;" }, [el("label", { class: "field-label", for: "ex-name" }, "Nom"), nameField])]),
      el("div", { class: "field" }, [el("span", { class: "field-label" }, "Muscle ciblé"), muscleChips]),
      el("div", { class: "field-pair" }, [
        el("div", { class: "field" }, [el("span", { class: "field-label" }, "Séries"), setsStepper]),
        el("div", { class: "field" }, [el("label", { class: "field-label", for: "ex-reps" }, "Répétitions"), repsInput]),
      ]),
      el("div", { class: "field" }, [el("span", { class: "field-label" }, "Repos entre les séries"), restChips]),
      el("div", { class: "field" }, [el("label", { class: "field-label", for: "ex-note" }, "Note (optionnelle)"), noteInput]),
      el("button", {
        class: "btn btn--ghost btn--block",
        type: "button",
        onclick: () => {
          close();
          openLibraryPicker({
            title: "Remplacer par",
            multi: false,
            onConfirm: ([picked]) => {
              if (!picked) return;
              Object.assign(ex, { name: picked.name, muscle: picked.muscle, pattern: picked.pattern });
              redraw();
              toast(`Remplacé par ${picked.name}`);
            },
            onCustom: () => openExerciseSettings(ex),
          });
        },
      }, [icon("arrows-clockwise"), "Remplacer l'exercice"]),
    ]);
    const close = openModal(content, {
      footer: el("button", { class: "btn btn--primary btn--block", type: "button", onclick: () => close() }, "Valider"),
      onClose: () => redraw(),
    });
    if (!ex.name) setTimeout(() => nameField.focus(), 50);
  }

  redraw();
  return view;
}

/* --------- Séance : tous les exercices sur une seule page --------- */

function parsePrimaryReps(target) {
  const match = String(target).match(/\d+/);
  return match ? parseInt(match[0]) : 10;
}
function roundTo(v, step) {
  return Math.round(v / step) * step;
}

function newExerciseState() {
  // phase : "idle" | "armed" | "resting". Persisté pour survivre à un rendu
  // global déclenché par une autre carte (fin du repos d'un autre exercice).
  return { setIndex: 0, phase: "idle", armedWeight: null, armedReps: null, restEndsAt: null, restDurationMs: null, restConsumed: false };
}

function viewSession(programId) {
  const program = Store.getProgram(programId);
  const view = el("main", { class: "view" });

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
      log: program.exercises.map((ex) => ({ exerciseId: ex.id, name: ex.name, muscle: ex.muscle || null, pattern: ex.pattern || null, restSeconds: ex.restSeconds, sets: [] })),
      exerciseState: program.exercises.map(() => newExerciseState()),
    };
    Store.setActive(session);
  }
  if (!session.exerciseState) {
    session.exerciseState = program.exercises.map(() => newExerciseState());
    session.finished = false;
    Store.setActive(session);
  }
  if (settings().keepAwake) requestWakeLock();

  if (session.finished) return renderSummary(program, session);

  const totalSets = program.exercises.reduce((s, e) => s + e.targetSets, 0);
  const doneSets = session.log.reduce((s, e) => s + e.sets.length, 0);
  const allDone = session.exerciseState.every((st, i) => st.setIndex >= program.exercises[i].targetSets);

  view.appendChild(
    topbar({
      title: program.name,
      subtitle: `${doneSets} / ${totalSets} séries`,
      back: () => { releaseWakeLock(); navigate("/"); },
    })
  );
  view.appendChild(el("div", { class: "progress-line", role: "progressbar", "aria-valuemin": "0", "aria-valuemax": String(totalSets), "aria-valuenow": String(doneSets) }, [
    el("span", { style: `width:${totalSets ? (doneSets / totalSets) * 100 : 0}%` }),
  ]));

  const list = el("div", { class: "stack" });
  program.exercises.forEach((exercise, i) => list.appendChild(renderExerciseCard(program, session, exercise, i)));
  view.appendChild(list);

  view.appendChild(
    el("button", {
      class: `btn btn--block btn--lg ${allDone ? "btn--primary" : "btn--ghost"}`,
      type: "button",
      onclick: () => finishSession(session, allDone),
    }, allDone ? [icon("flag-checkered"), "Voir le résumé"] : "Terminer la séance")
  );

  return view;
}

function renderExerciseCard(program, session, exercise, index) {
  const state = session.exerciseState[index];
  const exLog = session.log[index];
  const isDone = state.setIndex >= exercise.targetSets;
  const pattern = exercise.pattern || findLibraryExercise(exercise.name)?.pattern || null;

  const card = el("article", { class: `card ex-card${isDone ? " is-complete" : ""}${state.phase !== "idle" ? " is-active" : ""}` });

  card.appendChild(
    el("div", { class: "ex-card__head" }, [
      muscleBadge(exercise.muscle, "md", pattern),
      el("div", { class: "ex-card__titles" }, [
        el("h2", { class: "ex-card__name" }, exercise.name),
        el("div", { class: "ex-card__meta" }, [
          `${exercise.targetSets} × ${exercise.targetReps}, repos ${formatRest(exercise.restSeconds)}`,
          exercise.note ? el("span", { class: "tag" }, exercise.note) : null,
        ]),
      ]),
      isDone ? icon("check-circle", "ico--accent ico--lg") : null,
    ])
  );

  const dots = el("div", { class: "set-dots", "aria-hidden": "true" });
  for (let s = 0; s < exercise.targetSets; s++) {
    dots.appendChild(el("span", { class: `set-dot${s < state.setIndex ? " is-done" : ""}${s === state.setIndex && !isDone ? " is-current" : ""}` }));
  }

  if (isDone) {
    card.appendChild(dots);
    card.appendChild(el("div", { class: "ex-card__log" }, exLog.sets.map((s) => `${kg(s.weight)} × ${s.reps}`).join(", ")));
    return card;
  }

  card.appendChild(el("div", { class: "ex-card__progress" }, [dots, el("span", {}, `Série ${state.setIndex + 1} sur ${exercise.targetSets}`)]));

  const lastWeight = Store.lastWeightFor(exercise.name);
  const prevSetThisSession = exLog.sets[state.setIndex - 1];
  const isArmed = state.phase === "armed";
  let weight = isArmed && state.armedWeight != null ? state.armedWeight : prevSetThisSession ? prevSetThisSession.weight : lastWeight ?? 20;
  let reps = isArmed && state.armedReps != null ? state.armedReps : prevSetThisSession ? prevSetThisSession.reps : parsePrimaryReps(exercise.targetReps);

  const weightValue = el("span", { class: "n" }, num(weight));
  const repsValue = el("span", { class: "n" }, String(reps));
  const weightStepper = el("div", { class: "stepper" }, [
    iconButton("minus", "Moins 2,5 kg", () => { weight = Math.max(0, roundTo(weight - 2.5, 2.5)); weightValue.textContent = num(weight); }),
    el("div", { class: "stepper__value" }, [weightValue, el("span", { class: "u" }, "kg")]),
    iconButton("plus", "Plus 2,5 kg", () => { weight = roundTo(weight + 2.5, 2.5); weightValue.textContent = num(weight); }),
  ]);
  const repsStepper = el("div", { class: "stepper" }, [
    iconButton("minus", "Une répétition de moins", () => { reps = Math.max(0, reps - 1); repsValue.textContent = reps; }),
    el("div", { class: "stepper__value" }, [repsValue, el("span", { class: "u" }, "reps")]),
    iconButton("plus", "Une répétition de plus", () => { reps += 1; repsValue.textContent = reps; }),
  ]);
  const steppersRow = el("div", { class: "stepper-pair" }, [weightStepper, repsStepper]);
  card.appendChild(steppersRow);
  if (lastWeight !== null) card.appendChild(el("div", { class: "hint" }, `Dernière fois : ${kg(lastWeight)}`));

  const actionSlot = el("div", { class: "ex-card__action" });
  card.appendChild(actionSlot);

  function setSteppersDisabled(disabled) {
    steppersRow.querySelectorAll("button").forEach((b) => (b.disabled = disabled));
  }

  function renderGoButton() {
    actionSlot.innerHTML = "";
    setSteppersDisabled(false);
    actionSlot.appendChild(
      el("button", {
        class: "btn btn--primary btn--lg btn--block btn--go",
        type: "button",
        onclick: () => {
          state.phase = "armed";
          state.armedWeight = weight;
          state.armedReps = reps;
          Store.setActive(session);
          card.classList.add("is-active");
          setSteppersDisabled(true);
          renderArmedButton();
        },
      }, "GO")
    );
  }

  function renderArmedButton() {
    actionSlot.innerHTML = "";
    actionSlot.appendChild(
      el("button", {
        class: "btn btn--armed btn--lg btn--block",
        type: "button",
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
      }, "Fin de série")
    );
  }

  function renderTimerBar() {
    actionSlot.innerHTML = "";
    // Deux couches de texte : claire sur le fond, foncée sur la partie remplie.
    const label = el("div", { class: "timerbar__label" }, [icon("timer"), el("span", {}, "0:00")]);
    const labelOnFill = el("div", { class: "timerbar__label", "aria-hidden": "true" }, [icon("timer"), el("span", {}, "0:00")]);
    const fill = el("div", { class: "timerbar__fill" }, [labelOnFill]);
    const bar = el("div", { class: "timerbar", role: "timer", "aria-label": "Temps de repos restant" }, [label, fill]);
    actionSlot.appendChild(bar);
    const skipBtn = el("button", { class: "btn btn--ghost btn--sm btn--block", type: "button", onclick: () => timer.skip() }, [icon("skip-forward"), "Passer le repos"]);
    actionSlot.appendChild(skipBtn);

    const timer = new RestTimer({
      onTick: (remainingMs, durationMs) => {
        const t = formatTime(remainingMs);
        label.lastChild.textContent = t;
        labelOnFill.lastChild.textContent = t;
        const remaining = Math.min(1, Math.max(0, remainingMs / durationMs));
        fill.style.clipPath = `inset(0 ${remaining * 100}% 0 0)`;
      },
      onDone: () => {
        fill.style.clipPath = "inset(0 0 0 0)";
        bar.classList.add("is-done");
        skipBtn.classList.add("hidden");
        if (!state.restConsumed) {
          state.restConsumed = true;
          state.setIndex += 1;
          state.phase = "idle";
          state.restEndsAt = null;
          state.restDurationMs = null;
          Store.setActive(session);
          const s = settings();
          if (s.sound) playBeep();
          if (s.vibration) vibrate([200, 100, 200, 100, 400]);
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

async function finishSession(session, allDone) {
  if (!allDone && !(await confirmSheet("Terminer la séance maintenant ?", { detail: "Les séries déjà notées seront conservées.", confirmLabel: "Terminer" }))) return;
  session.finished = true;
  Store.setActive(session);
  render({ scrollTop: true });
}

function renderSummary(program, session) {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Séance terminée", subtitle: program.name }));

  const done = session.log.filter((e) => e.sets.length > 0);
  const totalSets = done.reduce((s, e) => s + e.sets.length, 0);
  const totalVolume = done.reduce((s, e) => s + e.sets.reduce((s2, set) => s2 + set.weight * set.reps, 0), 0);

  view.appendChild(
    el("div", { class: "stat-grid stat-grid--2" }, [
      statTile(String(totalSets), totalSets > 1 ? "séries" : "série"),
      statTile(`${Math.round(totalVolume).toLocaleString("fr-FR")} kg`, "de volume"),
      statTile(fmtDuration(Date.now() - new Date(session.startedAt).getTime()), "de séance"),
      statTile(String(done.length), done.length > 1 ? "exercices faits" : "exercice fait"),
    ])
  );

  view.appendChild(
    el("ul", { class: "recap-list card" }, done.map((e) =>
      el("li", { class: "recap-list__item" }, [
        muscleBadge(e.muscle, "sm", e.pattern),
        el("div", {}, [
          el("div", { class: "recap-list__name" }, e.name),
          el("div", { class: "recap-list__sets" }, e.sets.map((s) => `${kg(s.weight)} × ${s.reps}`).join(", ")),
        ]),
      ])
    ))
  );

  view.appendChild(
    el("button", {
      class: "btn btn--primary btn--lg btn--block",
      type: "button",
      onclick: () => {
        releaseWakeLock();
        Store.addHistorySession({
          id: Store.uid(),
          programId: program.id,
          programName: program.name,
          startedAt: session.startedAt,
          endedAt: new Date().toISOString(),
          exercises: done,
        });
        Store.setActive(null);
        toast("Séance enregistrée");
        navigate("/");
      },
    }, "Enregistrer la séance")
  );
  view.appendChild(
    el("button", {
      class: "btn btn--ghost btn--block",
      type: "button",
      onclick: async () => {
        if (!(await confirmSheet("Ne pas enregistrer cette séance ?", { detail: "Les séries notées seront perdues.", confirmLabel: "Supprimer", danger: true }))) return;
        releaseWakeLock();
        Store.setActive(null);
        navigate("/");
      },
    }, "Ne pas enregistrer")
  );
  return view;
}

/* --------- Progrès / historique --------- */

function viewHistory() {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Progrès" }));

  const all = Store.getHistory();
  if (all.length === 0) {
    view.appendChild(el("div", { class: "empty" }, "Aucune séance enregistrée pour le moment. Lance ta première séance depuis le calendrier."));
    return view;
  }

  const names = [...new Set(all.flatMap((s) => s.exercises.map((e) => canonicalName(e.name))))].sort((a, b) => a.localeCompare(b, "fr"));
  view.appendChild(
    el("section", { class: "stack" }, [
      el("h2", { class: "section-title" }, "Progression par exercice"),
      el("div", { class: "lib-list" }, names.map((name) => {
        const libEx = findLibraryExercise(name);
        const last = Store.lastWeightFor(name);
        return el("a", { class: "lib-row", href: `#/exercice/${encodeURIComponent(name)}` }, [
          muscleBadge(libEx?.muscle || inferMuscle(name), "md", libEx?.pattern),
          el("span", { class: "lib-row__text" }, [el("span", { class: "lib-row__name" }, name), el("span", { class: "lib-row__meta" }, last !== null ? `Dernière charge : ${kg(last)}` : "")]),
          icon("caret-right", "ico--dim"),
        ]);
      })),
    ])
  );

  view.appendChild(el("h2", { class: "section-title" }, "Séances"));
  const list = el("div", { class: "stack" });
  all.slice().reverse().forEach((s) => {
    const nSets = s.exercises.reduce((sum, e) => sum + e.sets.length, 0);
    list.appendChild(
      el("div", { class: "card session-item" }, [
        el("div", { class: "session-item__info" }, [
          el("div", { class: "program-row__name" }, s.programName),
          el("div", { class: "program-row__meta" }, `${fmtDateLong(s.startedAt)}, ${plural(nSets, "série")}, ${Math.round(sessionVolume(s)).toLocaleString("fr-FR")} kg, ${fmtDuration(new Date(s.endedAt) - new Date(s.startedAt))}`),
        ]),
        iconButton("trash", "Supprimer cette séance", async () => {
          if (!(await confirmSheet("Supprimer cette séance de l'historique ?", { confirmLabel: "Supprimer", danger: true }))) return;
          Store.deleteHistorySession(s.id);
          render();
        }),
      ])
    );
  });
  view.appendChild(list);
  return view;
}

function viewExerciseProgress(encodedName) {
  const name = canonicalName(decodeURIComponent(encodedName || ""));
  const libEx = findLibraryExercise(name);
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: name, subtitle: libEx ? PATTERN_LABELS[libEx.pattern] : "Progression", back: () => history.length > 1 ? history.back() : navigate("/historique") }));

  const points = [];
  const volumePoints = [];
  Store.getHistory().forEach((s) => {
    const ex = s.exercises.find((e) => canonicalName(e.name) === name);
    if (!ex || !ex.sets.length) return;
    points.push({ x: s.startedAt, y: Math.max(...ex.sets.map((set) => set.weight)), label: fmtDate(s.startedAt) });
    volumePoints.push({ x: s.startedAt, y: Math.round(ex.sets.reduce((sum, set) => sum + set.weight * set.reps, 0)), label: fmtDate(s.startedAt) });
  });

  if (points.length >= 2) {
    const diff = points[points.length - 1].y - points[0].y;
    view.appendChild(
      el("div", { class: "stat-grid stat-grid--2" }, [
        statTile(kg(points[points.length - 1].y), "charge max récente"),
        statTile(`${diff >= 0 ? "+" : ""}${kg(diff)}`, `depuis le ${points[0].label}`),
      ])
    );
  }
  view.appendChild(el("div", { class: "card stack" }, [el("div", { class: "card-label" }, "Charge max par séance (kg)"), lineChart(points, { unit: " kg" })]));
  view.appendChild(el("div", { class: "card stack" }, [el("div", { class: "card-label" }, "Volume par séance (kg)"), barChart(volumePoints, { unit: " kg" })]));
  return view;
}

/* --------- Réglages --------- */

function viewSettings() {
  const view = el("main", { class: "view" });
  view.appendChild(topbar({ title: "Réglages", back: () => navigate("/") }));

  const s = settings();
  const save = () => Store.saveSettings(s);
  view.appendChild(
    el("section", { class: "card stack" }, [
      switchRow("Son en fin de repos", s.sound !== false, (v) => { s.sound = v; save(); }),
      switchRow("Vibration en fin de repos", s.vibration !== false, (v) => { s.vibration = v; save(); }),
      switchRow("Garder l'écran allumé pendant la séance", s.keepAwake !== false, (v) => { s.keepAwake = v; save(); }),
    ])
  );

  view.appendChild(
    el("section", { class: "card stack" }, [
      el("h2", { class: "card-label" }, "Sauvegarde"),
      el("p", { class: "text-dim sheet-text" }, "Tes données restent sur ce téléphone. Exporte-les pour les garder ou les transférer."),
      el("button", { class: "btn btn--ghost btn--block", type: "button", onclick: exportData }, [icon("download-simple"), "Exporter mes données"]),
      el("label", { class: "btn btn--ghost btn--block" }, [
        icon("upload-simple"),
        "Importer un fichier",
        el("input", { type: "file", accept: "application/json", class: "visually-hidden", onchange: importData }),
      ]),
    ])
  );

  view.appendChild(
    el("button", {
      class: "btn btn--danger btn--block",
      type: "button",
      onclick: async () => {
        if (!(await confirmSheet("Tout effacer ?", { detail: "Programmes, historique et planning seront supprimés. Action irréversible.", confirmLabel: "Tout effacer", danger: true }))) return;
        [Store.KEYS.programs, Store.KEYS.history, Store.KEYS.active, Store.KEYS.schedule].forEach((k) => localStorage.removeItem(k));
        toast("Données effacées");
        navigate("/");
      },
    }, "Effacer toutes les données")
  );

  view.appendChild(
    el("section", { class: "credits" }, [
      el("h2", { class: "card-label" }, "Crédits"),
      el("p", {}, ["Pictogrammes d'exercices : ", el("a", { href: "https://game-icons.net", target: "_blank", rel: "noopener" }, "Game Icons"), " (Lorc, Delapouite et contributeurs), licence CC BY 3.0."]),
      el("p", {}, ["Icônes : ", el("a", { href: "https://phosphoricons.com", target: "_blank", rel: "noopener" }, "Phosphor"), " (MIT). Police : Geist (SIL OFL)."]),
    ])
  );
  return view;
}

function switchRow(label, value, onChange) {
  const input = el("input", { type: "checkbox", role: "switch", class: "switch" });
  input.checked = value;
  input.addEventListener("change", () => onChange(input.checked));
  return el("label", { class: "switch-row" }, [el("span", {}, label), input]);
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
