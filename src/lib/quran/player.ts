/**
 * Framework-free ayah-by-ayah audio queue.
 *
 * - One shared <audio> element for the whole tab. iOS/Safari only lets an element
 *   that was started by a tap keep playing on its own, so reusing it lets the
 *   queue (and the "continue on the next page" hand-off) keep going.
 * - If a file fails to load, the next source of the reciter is tried before
 *   giving up (see RECITERS in audio.ts).
 */
import { DEFAULT_RECITER_ID, getReciter } from "./audio";

export type AudioStatus = "idle" | "loading" | "playing" | "paused" | "error";

export interface QueueItem {
  surah: number;
  ayah: number;
}

export interface PlayerState {
  /** Position in the queue of the ayah being loaded/played, or null when idle. */
  index: number | null;
  status: AudioStatus;
}

/** The subset of HTMLAudioElement the player needs (lets tests use a fake). */
export interface AudioLike extends EventTarget {
  src: string;
  readonly ended?: boolean;
  play(): Promise<void> | void;
  pause(): void;
}

let sharedAudio: AudioLike | null = null;
function getSharedAudio(): AudioLike {
  if (!sharedAudio) {
    const el = new Audio();
    el.preload = "auto";
    sharedAudio = el;
  }
  return sharedAudio;
}

const IDLE: PlayerState = { index: null, status: "idle" };

export class AyahPlayer {
  /** Called once when the last ayah of the queue has finished (not on stop()). */
  onQueueEnd?: () => void;

  private queue: QueueItem[] = [];
  private reciterId = DEFAULT_RECITER_ID;
  private audio: AudioLike | null = null;
  private detach: Array<() => void> = [];
  private attempt = 0;
  /** Bumped on every load; late errors from an older load are ignored. */
  private token = 0;
  private handledErrorToken = -1;
  /** The reciter changed while paused: the loaded file is the old voice. */
  private stale = false;
  private state: PlayerState = IDLE;
  private listeners = new Set<() => void>();

  constructor(private readonly createAudio: () => AudioLike = getSharedAudio) {}

  getState = (): PlayerState => this.state;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private set(next: PlayerState) {
    if (next.index === this.state.index && next.status === this.state.status) return;
    this.state = next;
    this.listeners.forEach((l) => l());
  }

  setOnQueueEnd(fn: (() => void) | undefined) {
    this.onQueueEnd = fn;
  }

  setQueue(queue: QueueItem[]) {
    const current = this.state.index === null ? null : this.queue[this.state.index];
    this.queue = queue;
    if (!current) return;
    const idx = queue.findIndex((q) => q.surah === current.surah && q.ayah === current.ayah);
    if (idx === -1) this.stop();
    else this.set({ ...this.state, index: idx });
  }

  setReciter(id: string) {
    if (id === this.reciterId) return;
    this.reciterId = id;
    const { index, status } = this.state;
    if (index === null) return;
    if (status === "playing" || status === "loading") this.load(index, 0);
    else this.stale = true;
  }

  play(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= this.queue.length) return;
    this.load(index, 0);
  }

  /** Play/pause control for one ayah row: starts it, or toggles if it is the current one. */
  toggle(index: number) {
    if (this.state.index === index && this.state.status !== "error" && this.state.status !== "idle") {
      if (this.state.status === "paused") this.resume();
      else this.pause();
      return;
    }
    this.play(index);
  }

  pause() {
    if (this.state.index === null) return;
    this.audio?.pause();
    if (this.state.status === "playing" || this.state.status === "loading") {
      this.set({ index: this.state.index, status: "paused" });
    }
  }

  resume() {
    const { index, status } = this.state;
    if (index === null) return;
    if (this.stale || status === "error") {
      this.load(index, 0);
      return;
    }
    this.set({ index, status: "loading" });
    this.runPlay(this.token);
  }

  next() {
    const { index } = this.state;
    if (index === null) return;
    if (index + 1 < this.queue.length) this.load(index + 1, 0);
    else {
      this.stop();
      this.onQueueEnd?.();
    }
  }

  prev() {
    const { index } = this.state;
    if (index === null) return;
    this.load(Math.max(0, index - 1), 0);
  }

  stop() {
    this.token++;
    this.audio?.pause();
    this.set(IDLE);
  }

  /** Stops playback and unhooks listeners. The player can be reused afterwards. */
  destroy() {
    this.stop();
    this.detach.forEach((d) => d());
    this.detach = [];
    this.audio = null;
    this.listeners.clear();
  }

  // --- internals -----------------------------------------------------------

  private ensureAudio(): AudioLike {
    if (this.audio) return this.audio;
    const audio = this.createAudio();
    this.audio = audio;
    const on = (type: string, fn: () => void) => {
      audio.addEventListener(type, fn);
      this.detach.push(() => audio.removeEventListener(type, fn));
    };
    on("playing", () => {
      if (this.state.index !== null) this.set({ index: this.state.index, status: "playing" });
    });
    on("waiting", () => {
      if (this.state.index !== null && this.state.status === "playing") {
        this.set({ index: this.state.index, status: "loading" });
      }
    });
    on("pause", () => {
      // The browser also fires "pause" right before "ended"; ignore that one.
      if (audio.ended) return;
      if (this.state.index !== null && this.state.status === "playing") {
        this.set({ index: this.state.index, status: "paused" });
      }
    });
    on("ended", () => {
      if (this.state.index !== null) this.next();
    });
    on("error", () => this.handleError(this.token));
    return audio;
  }

  private load(index: number, attempt: number) {
    const item = this.queue[index];
    if (!item) return;
    const source = getReciter(this.reciterId).sources[attempt];
    if (!source) {
      this.set({ index, status: "error" });
      return;
    }
    const audio = this.ensureAudio();
    const token = ++this.token;
    this.attempt = attempt;
    this.stale = false;
    this.set({ index, status: "loading" });
    audio.src = source(item.surah, item.ayah);
    this.runPlay(token);
  }

  private runPlay(token: number) {
    const audio = this.audio;
    if (!audio) return;
    try {
      const result = audio.play();
      if (result && typeof result.catch === "function") {
        result.catch((err: unknown) => this.onPlayRejected(err, token));
      }
    } catch {
      this.handleError(token);
    }
  }

  private onPlayRejected(err: unknown, token: number) {
    if (token !== this.token) return;
    const name = (err as { name?: string } | null)?.name;
    if (name === "AbortError") return; // superseded by another load or a pause()
    if (name === "NotAllowedError") {
      // Autoplay was blocked: leave the ayah selected so one tap on play works.
      if (this.state.index !== null) this.set({ index: this.state.index, status: "paused" });
      return;
    }
    this.handleError(token);
  }

  private handleError(token: number) {
    if (token !== this.token || this.handledErrorToken === token) return;
    this.handledErrorToken = token;
    const { index } = this.state;
    if (index === null) return;
    this.load(index, this.attempt + 1);
  }
}
