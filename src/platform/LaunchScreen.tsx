"use client";

import { useCallback, useState } from "react";

/**
 * What a verified, entitled member sees **inside the Whop app**.
 *
 * TalkWise Play deliberately does not play here. Every browser on iOS runs
 * on WebKit, and inside Whop's embedded webview the speech APIs a child
 * needs are not usable — so playing in-frame would mean a game whose whole
 * point (talking) is broken. Instead this hands the member off to their own
 * browser, where the microphone works, carrying a one-time credential so
 * the session on the other side is still a paid one.
 */
export function LaunchScreen() {
  const [state, setState] = useState<"idle" | "opening" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleLaunch = useCallback(async () => {
    setState("opening");
    setMessage(null);

    try {
      const response = await fetch("/api/launch", { method: "POST" });
      const body = (await response.json()) as {
        launchUrl?: string;
        error?: string;
      };

      if (!response.ok || !body.launchUrl) {
        setState("error");
        setMessage(body.error ?? "Could not open TalkWise Play right now.");
        return;
      }

      // Opened from a real tap, so this is a user-gesture navigation — which
      // is what lets the host app hand it to the system browser instead of
      // swallowing it or having it blocked as a popup.
      const opened = window.open(body.launchUrl, "_blank", "noopener,noreferrer");
      if (!opened) {
        // Some embedded webviews refuse window.open outright. Navigating the
        // frame itself still reaches the launch route, and hosts that treat
        // external URLs specially will escalate it to the real browser.
        window.location.href = body.launchUrl;
        return;
      }
      setState("idle");
    } catch {
      setState("error");
      setMessage("Could not reach TalkWise Play. Please try again.");
    }
  }, []);

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-gradient-to-b from-[#141420] via-[#1b1b34] to-[#141420] p-6">
      <div className="w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
        <p className="text-[0.65rem] font-black tracking-[0.28em] text-[#8a8aa0] uppercase">
          TalkWise Academy
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#141420]">
          TalkWise <span className="text-[#f5c33b]">Play</span>
        </h1>

        <div className="mt-5 text-6xl" aria-hidden>
          🎤
        </div>

        <p className="mt-4 text-base font-semibold text-[#4a4a60]">
          TalkWise Play opens in your normal browser, where the microphone
          works properly for speech practice.
        </p>

        <button
          type="button"
          onClick={handleLaunch}
          disabled={state === "opening"}
          className={`mt-6 w-full rounded-2xl border-b-8 px-6 py-5 text-xl font-black text-white shadow-lg transition-transform ${
            state === "opening"
              ? "cursor-wait border-[#25a25a]/60 bg-[#2ecc71]/70"
              : "border-[#25a25a] bg-[#2ecc71] active:translate-y-1 active:border-b-4"
          }`}
        >
          {state === "opening" ? "Opening…" : "OPEN TALKWISE PLAY"}
        </button>

        {message ? (
          <p
            role="status"
            className="mt-3 rounded-xl bg-[#fff1f0] px-4 py-3 text-sm font-bold text-[#c0392b]"
          >
            {message}
          </p>
        ) : null}

        <p className="mt-4 text-xs font-semibold text-[#8a8aa0]">
          Your progress is saved to your TalkWise Academy account, so it
          follows you between devices.
        </p>
      </div>
    </main>
  );
}
