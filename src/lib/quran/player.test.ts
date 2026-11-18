import { describe, expect, it, vi } from "vitest";
import { AyahPlayer, type AudioLike } from "./player";
import { getReciter } from "./audio";

class FakeAudio extends EventTarget implements AudioLike {
  src = "";
  ended = false;
  loads: string[] = [];
  paused = true;
  play() {
    this.loads.push(this.src);
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
  fire(type: string) {
    this.dispatchEvent(new Event(type));
  }
}

const queue = [
  { surah: 1, ayah: 1 },
  { surah: 1, ayah: 2 },
  { surah: 1, ayah: 3 },
];

function setup() {
  const audio = new FakeAudio();
  const player = new AyahPlayer(() => audio);
  player.setQueue(queue);
  return { audio, player };
}

describe("AyahPlayer", () => {
  it("plays an ayah and reports status", () => {
    const { audio, player } = setup();
    expect(player.getState()).toEqual({ index: null, status: "idle" });
    player.play(1);
    expect(player.getState()).toEqual({ index: 1, status: "loading" });
    expect(audio.src).toBe(getReciter("alafasy").sources[0](1, 2));
    audio.fire("playing");
    expect(player.getState()).toEqual({ index: 1, status: "playing" });
  });

  it("moves to the next ayah when one ends and calls onQueueEnd once at the end", () => {
    const { audio, player } = setup();
    const end = vi.fn();
    player.onQueueEnd = end;
    player.play(0);
    audio.fire("playing");
    audio.fire("ended");
    expect(player.getState().index).toBe(1);
    audio.fire("ended");
    expect(player.getState().index).toBe(2);
    expect(end).not.toHaveBeenCalled();
    audio.fire("ended");
    expect(player.getState()).toEqual({ index: null, status: "idle" });
    expect(end).toHaveBeenCalledTimes(1);
  });

  it("ignores the pause event that precedes ended", () => {
    const { audio, player } = setup();
    player.play(0);
    audio.fire("playing");
    audio.ended = true;
    audio.fire("pause");
    expect(player.getState().status).toBe("playing");
  });

  it("falls back to the next source, then reports an error", () => {
    const { audio, player } = setup();
    const sources = getReciter("alafasy").sources;
    player.play(0);
    audio.fire("error");
    expect(audio.src).toBe(sources[1](1, 1));
    expect(player.getState()).toEqual({ index: 0, status: "loading" });
    audio.fire("error");
    expect(player.getState()).toEqual({ index: 0, status: "error" });
    // a failed ayah can be retried from the first source
    player.resume();
    expect(audio.src).toBe(sources[0](1, 1));
  });

  it("does not double-handle one failure (error event + rejected play)", async () => {
    const audio = new FakeAudio();
    audio.play = function (this: FakeAudio) {
      this.loads.push(this.src);
      return Promise.reject(Object.assign(new Error("bad"), { name: "NotSupportedError" }));
    };
    const player = new AyahPlayer(() => audio);
    player.setQueue(queue);
    player.play(0);
    audio.fire("error");
    await Promise.resolve();
    await Promise.resolve();
    // exactly one fallback hop happened per failing load, never skipping a source
    expect(audio.loads[0]).toBe(getReciter("alafasy").sources[0](1, 1));
    expect(audio.loads[1]).toBe(getReciter("alafasy").sources[1](1, 1));
  });

  it("pauses and resumes", () => {
    const { audio, player } = setup();
    player.play(0);
    audio.fire("playing");
    player.toggle(0);
    expect(player.getState().status).toBe("paused");
    expect(audio.paused).toBe(true);
    player.toggle(0);
    expect(player.getState().status).toBe("loading");
    audio.fire("playing");
    expect(player.getState().status).toBe("playing");
  });

  it("toggle on another ayah switches to it", () => {
    const { audio, player } = setup();
    player.play(0);
    audio.fire("playing");
    player.toggle(2);
    expect(player.getState()).toEqual({ index: 2, status: "loading" });
  });

  it("prev/next stay inside the queue", () => {
    const { player } = setup();
    player.play(0);
    player.prev();
    expect(player.getState().index).toBe(0);
    player.next();
    expect(player.getState().index).toBe(1);
    player.prev();
    expect(player.getState().index).toBe(0);
  });

  it("restarts the current ayah with the new reciter", () => {
    const { audio, player } = setup();
    player.play(1);
    audio.fire("playing");
    player.setReciter("husary");
    expect(audio.src).toBe(getReciter("husary").sources[0](1, 2));
    expect(player.getState()).toEqual({ index: 1, status: "loading" });
  });

  it("applies a reciter change made while paused on resume", () => {
    const { audio, player } = setup();
    player.play(1);
    audio.fire("playing");
    player.pause();
    player.setReciter("sudais");
    player.resume();
    expect(audio.src).toBe(getReciter("sudais").sources[0](1, 2));
  });

  it("stop() goes idle and never fires onQueueEnd", () => {
    const { audio, player } = setup();
    const end = vi.fn();
    player.onQueueEnd = end;
    player.play(0);
    player.stop();
    expect(player.getState()).toEqual({ index: null, status: "idle" });
    audio.fire("error"); // late event from the stopped load
    expect(player.getState().status).toBe("idle");
    expect(end).not.toHaveBeenCalled();
  });

  it("keeps the current ayah when the queue is replaced, stops if it vanished", () => {
    const { player } = setup();
    player.play(1);
    player.setQueue([{ surah: 1, ayah: 0 + 2 }, { surah: 1, ayah: 3 }]);
    expect(player.getState().index).toBe(0);
    player.setQueue([{ surah: 2, ayah: 1 }]);
    expect(player.getState().status).toBe("idle");
  });

  it("rejects out-of-range play() and can be reused after destroy()", () => {
    const { audio, player } = setup();
    player.play(-1);
    player.play(99);
    player.play(1.5);
    expect(player.getState().status).toBe("idle");
    player.destroy();
    audio.fire("playing"); // listeners are detached
    expect(player.getState().status).toBe("idle");
    player.setQueue(queue);
    player.play(0);
    expect(player.getState()).toEqual({ index: 0, status: "loading" });
  });

  it("notifies subscribers only on real changes", () => {
    const { audio, player } = setup();
    const fn = vi.fn();
    const off = player.subscribe(fn);
    player.play(0);
    const afterPlay = fn.mock.calls.length;
    audio.fire("playing");
    audio.fire("playing");
    expect(fn.mock.calls.length).toBe(afterPlay + 1);
    off();
    audio.fire("ended");
    expect(fn.mock.calls.length).toBe(afterPlay + 1);
  });
});
