"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AyahPlayer, type PlayerState, type QueueItem } from "@/lib/quran/player";

/** React binding for the AyahPlayer queue (see lib/quran/player.ts). */
export function useAyahPlayer(queue: QueueItem[], reciterId: string, onQueueEnd?: () => void) {
  const [player] = useState(() => new AyahPlayer());

  useEffect(() => {
    player.setQueue(queue);
  }, [player, queue]);
  useEffect(() => {
    player.setReciter(reciterId);
  }, [player, reciterId]);
  useEffect(() => {
    player.setOnQueueEnd(onQueueEnd);
  }, [player, onQueueEnd]);
  useEffect(() => () => player.destroy(), [player]);

  const state: PlayerState = useSyncExternalStore(player.subscribe, player.getState, player.getState);
  return { player, index: state.index, status: state.status };
}
