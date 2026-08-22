import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";

interface KeystrokeBatch {
  count: number;
}

export const useKeystrokeListener = ({
  onKeystrokeBatch,
}: {
  onKeystrokeBatch: (strokes: number) => unknown;
}) => {
  useEffect(() => {
    if (!isTauri()) return;

    const unlistenPromise = listen<KeystrokeBatch>(
      "keystroke-batch",
      (event) => {
        onKeystrokeBatch(event.payload.count);
      },
    );

    return () => {
      unlistenPromise.then((unlistenFn) => unlistenFn());
    };
  }, []);
};
