import { API_URL } from "@/lib/api";
import { isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";

const FLUSH_INTERVAL_MS = 30_000;
const MAX_INTENSITY = 500;

interface KeystrokeBatch {
  count: number;
}

async function submitTrainingIntensity(intensity: number) {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) {
    console.log("[keystrokes] skipping flush: no accessToken yet");
    return false;
  }

  const response = await fetch(`${API_URL}/pets/training`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ intensity }),
  });

  console.log(
    `[keystrokes] POST /pets/training intensity=${intensity} -> status ${response.status}`,
  );

  return response.status === 201;
}

export function useKeystrokeTraining() {
  const pendingRef = useRef(0);

  useEffect(() => {
    console.log(
      `[keystrokes] isTauri()=${isTauri()} typeof __TAURI_INTERNALS__=${typeof (window as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__}`,
    );

    if (!isTauri()) {
      // Keystroke capture is Rust/Tauri-side only, e.g. this is a plain
      // browser preview of the Vite dev server, not the Tauri webview.
      console.log("[keystrokes] not running inside Tauri, hook disabled");
      return;
    }

    console.log("[keystrokes] hook mounted, listening for keystroke-batch events");

    const flush = async () => {
      const count = pendingRef.current;
      console.log(`[keystrokes] flush tick, pending = ${count}`);
      if (count <= 0) return;

      const intensity = Math.min(count, MAX_INTENSITY);
      try {
        const ok = await submitTrainingIntensity(intensity);
        if (ok) {
          pendingRef.current = 0;
        }
        // on failure (incl. no accessToken yet), leave pendingRef as-is so
        // the count is retried on the next flush instead of being lost
      } catch (error) {
        console.log("[keystrokes] flush failed, will retry next interval", error);
      }
    };

    const unlistenPromise = listen<KeystrokeBatch>(
      "keystroke-batch",
      (event) => {
        pendingRef.current += event.payload.count;
        console.log(
          `[keystrokes] received batch of ${event.payload.count}, pending now = ${pendingRef.current}`,
        );
      },
    ).catch((error) => {
      console.log("[keystrokes] failed to register listener", error);
      return () => {};
    });

    const intervalId = setInterval(flush, FLUSH_INTERVAL_MS);

    const unlistenCloseRequestedPromise = getCurrentWindow()
      .onCloseRequested(async (event) => {
        event.preventDefault();
        await flush();
        await getCurrentWindow().destroy();
      })
      .catch((error) => {
        console.log("[keystrokes] failed to register close handler", error);
        return () => {};
      });

    return () => {
      clearInterval(intervalId);
      unlistenPromise.then((unlisten) => unlisten());
      unlistenCloseRequestedPromise.then((unlisten) => unlisten());
    };
  }, []);
}
