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
 *
 * Getting there is two steps, not one, and that is deliberate: earlier this
 * screen tried to escape to the browser in a single tap by falling back to
 * `window.location.href` when `window.open` was blocked. Inside Whop's own
 * webview that fallback doesn't reliably escape at all — it just navigates
 * *this* frame to the one-time launch URL, which redeems it right there,
 * inside Whop, before the real browser ever gets a chance to. That is
 * exactly the "game plays live inside Whop" bug this screen exists to
 * prevent, and it was self-inflicted. This screen must never navigate its
 * own frame to the launch URL, under any circumstance — only a real,
 * visible link the member taps themselves is allowed to carry it, because
 * an embedding host's link-tap handling is far more consistently "hand this
 * to the real browser" than a script-driven popup or redirect ever is.
 */
export function LaunchScreen() {
  const [state, setState] = useState<"idle" | "opening" | "ready" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [launchUrl, setLaunchUrl] = useState<string | null>(null);

  const handleLaunch = useCallback(async () => {
    setState("opening");
    setMessage(null);
    setLaunchUrl(null);

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

      // Try the fast path once — a real popup from a real tap, which a
      // normal browser (and some embedding hosts) hands straight to the
      // system browser. If it's blocked or silently swallowed, that's fine:
      // there is no frame-navigation fallback here anymore. The link
      // rendered below is the guaranteed path either way.
      window.open(body.launchUrl, "_blank", "noopener,noreferrer");
      setLaunchUrl(body.launchUrl);
      setState("ready");
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

        {state === "ready" && launchUrl ? (
          // The real, guaranteed handoff — see the note above `handleLaunch`
          // on why this must be a plain tappable link rather than anything
          // script-driven navigating this frame.
          <a
            href={launchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-6 py-5 text-xl font-black text-white shadow-lg transition-transform active:translate-y-1 active:border-b-4"
          >
            TAP TO OPEN IN YOUR BROWSER
          </a>
        ) : (
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
        )}

        {state === "ready" ? (
          <button
            type="button"
            onClick={handleLaunch}
            className="mt-3 text-xs font-bold text-[#8a8aa0] underline"
          >
            Didn&apos;t open? Get a new link
          </button>
        ) : null}

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
