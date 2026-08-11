import { Store, SEED_PROGRAM } from "./storage.js";
import { RestTimer, playBeep, vibrate, formatTime, requestWakeLock, releaseWakeLock } from "./timer.js";
import { lineChart, barChart } from "./charts.js";

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

function render() {
  const { name, params } = parseHash();
  root.innerHTML = "";
  const view = VIEWS[name] || VIEWS.home;
  root.appendChild(view(...params));
}

const VIEWS = {
  home: viewHome,
  programme: viewProgramEditor,
  seance: viewSession,
  historique: viewHistory,
  exercice: viewExerciseProgress,
  reglages: viewSettings,
};

/* --------- Home --------- */

function viewHome() {
  const view = el("div", { class: "view" });
  view.appendChild(
    topbar({
      title: "Muscu",
      subtitle: "Tes séances, tes charges, ton rythme.",
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

  const programs = Store.getPrograms();
  const list = el("div", { class: "stack" });

  if (programs.length === 0) {
    list.appendChild(
      el("div", { class: "empty" }, [
        el("div", {}, "Aucun programme pour l'instant."),
        el("div", { class: "row", style: "justify-content:center; margin-top:14px; gap:10px;" }, [
          el("button", { class: "btn btn--primary", onclick: () => navigate("/programme/new") }, "+ Créer un programme"),
        ]),
        el("button", {
          class: "btn btn--ghost btn--sm",
          style: "margin-top:10px;",
          onclick: () => {
            Store.saveProgram({ ...SEED_PROGRAM, id: Store.uid() });
            toast("Programme d'exemple ajouté");
            render();
          },
        }, "Ou charger un programme d'exemple"),
      ])
    );
  } else {
    programs.forEach((p) => {
      const nSets = p.exercises.reduce((s, e) => s + e.targetSets, 0);
      list.appendChild(
        el("div", { class: "card program-card" }, [
          el("div", { class: "program-card__name" }, p.name),
          el("div", { class: "program-card__meta" }, `${p.exercises.length} exercices · ${nSets} séries au total`),
          el("div", { class: "program-card__actions" }, [
            el("button", { class: "btn btn--primary", onclick: () => startSession(p.id) }, "▶ Commencer"),
            el("button", { class: "btn btn--ghost btn--sm", onclick: () => navigate(`/programme/${p.id}`) }, "Modifier"),
          ]),
        ])
      );
    });
  }
  view.appendChild(list);

  if (programs.length > 0) {
    view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/programme/new") }, "+ Nouveau programme"));
  }

  view.appendChild(el("button", { class: "btn btn--ghost btn--block", onclick: () => navigate("/historique") }, "📈 Historique & progression"));

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
  return { id: Store.uid(), name: "", targetSets: 3, targetReps: "10", restSeconds: 90, note: "" };
}

function viewProgramEditor(id) {
  const isNew = id === "new";
  const program = isNew
    ? { id: Store.uid(), name: "", exercises: [blankExercise()] }
    : structuredClone(Store.getProgram(id) || { id: Store.uid(), name: "", exercises: [blankExercise()] });

  const view = el("div", { class: "view" });
  view.appendChild(topbar({ title: isNew ? "Nouveau programme" : "Modifier le programme", back: () => navigate("/") }));

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
    const nameField = el("input", { type: "text", placeholder: `Exercice ${i + 1}`, value: ex.name, oninput: (e) => (ex.name = e.target.value) });

    row.appendChild(
      el("div", { class: "exercise-row__head" }, [
        el("div", { class: "exercise-row__order" }, [
          el("button", { class: "btn btn--sm btn--ghost", disabled: i === 0 ? "true" : null, onclick: () => { [program.exercises[i - 1], program.exercises[i]] = [program.exercises[i], program.exercises[i - 1]]; renumberAndRedraw(); } }, "↑"),
          el("button", { class: "btn btn--sm btn--ghost", disabled: i === program.exercises.length - 1 ? "true" : null, onclick: () => { [program.exercises[i + 1], program.exercises[i]] = [program.exercises[i], program.exercises[i + 1]]; renumberAndRedraw(); } }, "↓"),
        ]),
        nameField,
        el("button", { class: "icon-btn", "aria-label": "Supprimer", onclick: () => { program.exercises.splice(i, 1); renumberAndRedraw(); } }, "✕"),
      ])
    );

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
        navigate("/");
      },
    }, "Enregistrer")
  );
  if (!isNew) {
    actions.appendChild(
      el("button", { class: "btn btn--danger btn--block", onclick: () => {
        if (confirm("Supprimer ce programme ?")) {
          Store.deleteProgram(program.id);
          navigate("/");
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

/* --------- Session runner --------- */

let sessionTimer = null;

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
      exerciseIndex: 0,
      setIndex: 0,
      phase: "work", // "work" | "rest"
      restEndsAt: null,
      restDurationMs: null,
      restConsumed: false,
      log: program.exercises.map((ex) => ({ exerciseId: ex.id, name: ex.name, restSeconds: ex.restSeconds, sets: [] })),
    };
    Store.setActive(session);
    requestWakeLock();
  } else {
    requestWakeLock();
  }

  if (session.exerciseIndex >= program.exercises.length) {
    return renderSummary(program, session);
  }

  const exercise = program.exercises[session.exerciseIndex];
  const exLog = session.log[session.exerciseIndex];

  view.appendChild(
    topbar({
      title: program.name,
      subtitle: `Exercice ${session.exerciseIndex + 1} / ${program.exercises.length}`,
      back: () => {
        if (confirm("Quitter la séance ? Ta progression reste enregistrée, tu pourras reprendre.")) {
          releaseWakeLock();
          navigate("/");
        }
      },
      right: el("button", { class: "icon-btn", "aria-label": "Terminer", onclick: () => endSessionEarly(program, session) }, "⏹"),
    })
  );

  if (session.phase === "rest") {
    view.appendChild(renderRest(program, session, exercise, exLog));
  } else {
    view.appendChild(renderWork(program, session, exercise, exLog));
  }

  return view;
}

function renderWork(program, session, exercise, exLog) {
  const wrap = el("div", { class: "stack" });

  wrap.appendChild(el("div", { class: "exercise-title" }, exercise.name));
  wrap.appendChild(el("div", { class: "exercise-target" }, `${exercise.targetSets} séries × ${exercise.targetReps} reps · repos ${formatRest(exercise.restSeconds)}`));

  const dots = el("div", { class: "set-dots" });
  for (let i = 0; i < exercise.targetSets; i++) {
    dots.appendChild(el("span", { class: `set-dot${i < session.setIndex ? " is-done" : ""}${i === session.setIndex ? " is-current" : ""}` }));
  }
  wrap.appendChild(dots);
  wrap.appendChild(el("div", { class: "session-progress" }, `Série ${session.setIndex + 1} / ${exercise.targetSets}`));

  const lastWeight = Store.lastWeightFor(exercise.name);
  const prevSetThisSession = exLog.sets[session.setIndex - 1];
  const suggestedWeight = prevSetThisSession ? prevSetThisSession.weight : lastWeight ?? 20;

  let weight = suggestedWeight;
  let reps = parsePrimaryReps(exercise.targetReps);

  const weightValue = el("span", { class: "n" }, String(weight));
  const repsValue = el("span", { class: "n" }, String(reps));

  const weightStepper = el("div", { class: "stepper" }, [
    el("button", { class: "stepper__btn", type: "button", onclick: () => { weight = Math.max(0, roundTo(weight - 2.5, 2.5)); weightValue.textContent = weight; } }, "−"),
    el("div", { class: "stepper__value" }, [weightValue, el("span", { class: "u" }, "kg")]),
    el("button", { class: "stepper__btn", type: "button", onclick: () => { weight = roundTo(weight + 2.5, 2.5); weightValue.textContent = weight; } }, "+"),
  ]);
  const repsStepper = el("div", { class: "stepper" }, [
    el("button", { class: "stepper__btn", type: "button", onclick: () => { reps = Math.max(0, reps - 1); repsValue.textContent = reps; } }, "−"),
    el("div", { class: "stepper__value" }, [repsValue, el("span", { class: "u" }, "reps")]),
    el("button", { class: "stepper__btn", type: "button", onclick: () => { reps += 1; repsValue.textContent = reps; } }, "+"),
  ]);

  wrap.appendChild(weightStepper);
  wrap.appendChild(repsStepper);

  if (lastWeight !== null) {
    wrap.appendChild(el("div", { class: "last-time" }, `Dernière fois sur cet exercice : ${lastWeight} kg`));
  }

  wrap.appendChild(
    el("button", {
      class: "btn btn--primary btn--lg btn--block",
      onclick: () => {
        exLog.sets.push({ weight, reps, ts: new Date().toISOString() });

        const isLastSet = session.setIndex >= exercise.targetSets - 1;
        const isLastExercise = session.exerciseIndex >= program.exercises.length - 1;

        if (isLastSet && isLastExercise) {
          session.exerciseIndex += 1;
          session.phase = "work";
          session.setIndex = 0;
          Store.setActive(session);
          render();
          return;
        }

        session.phase = "rest";
        session.restConsumed = false;
        session.restDurationMs = exercise.restSeconds * 1000;
        session.restEndsAt = Date.now() + session.restDurationMs;
        Store.setActive(session);
        render();
      },
    }, `✓ Valider la série ${session.setIndex + 1}`)
  );

  if (session.setIndex > 0 || exLog.sets.length > 0) {
    wrap.appendChild(
      el("button", { class: "btn btn--ghost btn--sm btn--block", onclick: () => nextExercise(program, session) }, "Passer à l'exercice suivant →")
    );
  }

  return wrap;
}

function parsePrimaryReps(target) {
  const match = String(target).match(/\d+/);
  return match ? parseInt(match[0]) : 10;
}
function roundTo(v, step) {
  return Math.round(v / step) * step;
}

function renderRest(program, session, exercise, exLog) {
  const wrap = el("div", { class: "timer-wrap" });

  const ring = el("div", { class: "timer-ring" });
  const r = 100;
  const circumference = 2 * Math.PI * r;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 220 220");
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bg.setAttribute("class", "bg");
  bg.setAttribute("cx", "110"); bg.setAttribute("cy", "110"); bg.setAttribute("r", r);
  const fg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  fg.setAttribute("class", "fg");
  fg.setAttribute("cx", "110"); fg.setAttribute("cy", "110"); fg.setAttribute("r", r);
  fg.setAttribute("stroke-dasharray", String(circumference));
  svg.appendChild(bg); svg.appendChild(fg);
  ring.appendChild(svg);

  const timeLabel = el("div", { class: "timer-ring__time" }, "0:00");
  ring.appendChild(el("div", { class: "timer-ring__label" }, [timeLabel, el("div", { class: "timer-ring__caption" }, "repos")]));
  wrap.appendChild(el("div", { class: "exercise-title", style: "font-size:1.2rem;" }, exercise.name));
  wrap.appendChild(ring);

  const doneMsg = el("div", { class: "text-center", style: "min-height:1.3em;" });
  wrap.appendChild(doneMsg);

  const controls = el("div", { class: "timer-controls" });
  const minus15 = el("button", { class: "btn btn--ghost", onclick: () => { sessionTimer?.addSeconds(-15); } }, "−15s");
  const plus15 = el("button", { class: "btn btn--ghost", onclick: () => { sessionTimer?.addSeconds(15); } }, "+15s");
  const skipBtn = el("button", { class: "btn btn--danger", onclick: () => sessionTimer?.skip() }, "Passer le repos");
  controls.appendChild(minus15);
  controls.appendChild(plus15);
  controls.appendChild(skipBtn);
  wrap.appendChild(controls);

  const nextBtn = el("button", {
    class: "btn btn--primary btn--lg btn--block hidden",
    onclick: () => advanceAfterRest(program, session),
  }, "Série suivante →");
  wrap.appendChild(nextBtn);

  sessionTimer = new RestTimer({
    onTick: (remainingMs, durationMs) => {
      timeLabel.textContent = formatTime(remainingMs);
      const progress = 1 - remainingMs / durationMs;
      fg.setAttribute("stroke-dashoffset", String(circumference * (1 - progress)));
    },
    onDone: () => {
      ring.classList.add("is-done");
      timeLabel.textContent = "0:00";
      doneMsg.textContent = "Repos terminé — série comptée ✓";
      playBeep();
      vibrate([200, 100, 200, 100, 400]);
      minus15.disabled = true;
      plus15.disabled = true;
      skipBtn.classList.add("hidden");
      nextBtn.classList.remove("hidden");
      if (!session.restConsumed) {
        session.restConsumed = true;
        session.setIndex += 1;
        Store.setActive(session);
      }
      const isLastExercise = session.exerciseIndex >= program.exercises.length - 1;
      const isLastSet = session.setIndex >= exercise.targetSets;
      if (isLastSet && !isLastExercise) {
        nextBtn.textContent = `${program.exercises[session.exerciseIndex + 1].name} →`;
      } else if (isLastSet && isLastExercise) {
        nextBtn.textContent = "Voir le résumé →";
      }
    },
  });

  if (session.restEndsAt && session.restEndsAt > Date.now()) {
    sessionTimer.resume(session.restEndsAt, session.restDurationMs);
  } else if (session.restEndsAt) {
    // le chrono s'est terminé pendant que l'app était fermée / en arrière-plan
    sessionTimer.done = true;
    fg.setAttribute("stroke-dashoffset", "0");
    ring.classList.add("is-done");
    timeLabel.textContent = "0:00";
    doneMsg.textContent = "Repos terminé — série comptée ✓";
    minus15.disabled = true;
    plus15.disabled = true;
    skipBtn.classList.add("hidden");
    nextBtn.classList.remove("hidden");
    if (!session.restConsumed) {
      session.restConsumed = true;
      session.setIndex += 1;
      Store.setActive(session);
    }
    const isLastExercise2 = session.exerciseIndex >= program.exercises.length - 1;
    const isLastSet2 = session.setIndex >= exercise.targetSets;
    if (isLastSet2 && !isLastExercise2) {
      nextBtn.textContent = `${program.exercises[session.exerciseIndex + 1].name} →`;
    } else if (isLastSet2 && isLastExercise2) {
      nextBtn.textContent = "Voir le résumé →";
    }
  }

  return wrap;
}

function advanceAfterRest(program, session) {
  sessionTimer?.stop();
  const exercise = program.exercises[session.exerciseIndex];
  if (session.setIndex >= exercise.targetSets) {
    session.exerciseIndex += 1;
    session.setIndex = 0;
  }
  session.phase = "work";
  session.restEndsAt = null;
  session.restDurationMs = null;
  Store.setActive(session);
  render();
}

function nextExercise(program, session) {
  sessionTimer?.stop();
  session.exerciseIndex += 1;
  session.setIndex = 0;
  session.phase = "work";
  session.restEndsAt = null;
  Store.setActive(session);
  render();
}

function endSessionEarly(program, session) {
  if (!confirm("Terminer la séance maintenant ? Les séries déjà notées seront enregistrées.")) return;
  sessionTimer?.stop();
  session.exerciseIndex = program.exercises.length;
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
      el("div", { class: "card" }, [
        el("div", { class: "program-card__name" }, e.name),
        el("div", { class: "program-card__meta" }, e.sets.map((s) => `${s.weight}kg×${s.reps}`).join(" · ")),
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
