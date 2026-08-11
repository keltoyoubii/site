// Minuteur de repos basé sur un timestamp absolu (résiste au verrouillage
// d'écran / mise en veille, contrairement à un setInterval qui dérive).

export class RestTimer {
  constructor({ onTick, onDone }) {
    this.onTick = onTick;
    this.onDone = onDone;
    this.endsAt = null;
    this.durationMs = 0;
    this.raf = null;
    this.done = true;
  }

  start(seconds) {
    this.stop();
    this.durationMs = seconds * 1000;
    this.endsAt = Date.now() + this.durationMs;
    this.done = false;
    this._loop();
  }

  // Reprend un minuteur déjà en cours après un rechargement de page.
  resume(endsAt, durationMs) {
    this.stop();
    this.endsAt = endsAt;
    this.durationMs = durationMs;
    if (endsAt <= Date.now()) {
      this.done = true;
      this.onDone?.();
      return;
    }
    this.done = false;
    this._loop();
  }

  addSeconds(delta) {
    if (!this.endsAt) return;
    this.endsAt += delta * 1000;
  }

  skip() {
    this.stop();
    this.done = true;
    this.onDone?.();
  }

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
  }

  _loop() {
    const tick = () => {
      const remainingMs = Math.max(0, this.endsAt - Date.now());
      this.onTick?.(remainingMs, this.durationMs);
      if (remainingMs <= 0) {
        this.done = true;
        this.onDone?.();
        return;
      }
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }
}

let audioCtx = null;
export function playBeep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    [0, 0.18, 0.36].forEach((offset, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = i === 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.16);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.2);
    });
  } catch {
    /* audio indisponible, tant pis */
  }
}

export function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

export function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

let wakeLock = null;
export async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {
    /* refusé ou indisponible, on continue sans */
  }
}
export function releaseWakeLock() {
  try {
    wakeLock?.release();
  } catch {
    /* déjà relâché */
  }
  wakeLock = null;
}
document.addEventListener("visibilitychange", async () => {
  if (wakeLock !== null && document.visibilityState === "visible") {
    await requestWakeLock();
  }
});
