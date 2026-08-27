"use client";

/**
 * Miss Maya, as the mini-games use her.
 *
 * §18 is specific: she is the instructional anchor, she does not narrate
 * every second, and voice fatigue is a real risk when a child replays a
 * thirty-second game eight times. So this component gives a mini-game two
 * things and nothing else — her face beside a prompt, and a button that
 * models the target on demand.
 *
 * It does **not** auto-speak. Every mini-game decides its own moments to
 * call `speakMiniTarget`, and the recommended set (§18: introduce, model,
 * replay, encourage, transition) is exactly five moments per session, not
 * five per second.
 *
 * Voicing goes through the shared `@/speech/maya-voice`, so a recorded clip
 * is preferred wherever one exists and browser speech is the fallback —
 * identical behaviour to GAME-001's challenge modal, with no second
 * convention invented here.
 */

import Image from "next/image";
import {
  playExampleSentence,
  playExampleSound,
  playExampleWord,
} from "@/speech/maya-voice";
import type { MiniSpeechTarget } from "../speech";

/**
 * Speaks one mini-game speech target in Miss Maya's voice.
 *
 * Routes by target kind so a sound is modelled as its letter *name* through
 * the sound path (which knows about `/audio/maya/sounds/`), a word through
 * the word path (which knows about `/audio/maya/`), and a sentence through
 * the sentence path. One switch, in one place, rather than each mini-game
 * guessing which of the three to call.
 */
export function speakMiniTarget(target: MiniSpeechTarget): void {
  if (target.kind === "sound") {
    playExampleSound(target.text.toLowerCase(), target.model);
    return;
  }
  if (target.kind === "sentence") {
    playExampleSentence(target.text);
    return;
  }
  playExampleWord(target.text);
}

/** Speaks an arbitrary instruction line, e.g. "Find something blue." */
export function speakInstruction(line: string): void {
  playExampleSentence(line);
}

export function MayaAvatar({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <Image
      src="/characters/miss-maya.png"
      alt="Miss Maya"
      width={64}
      height={64}
      className={`${className} shrink-0 rounded-full border-2 border-[#2f7fd4] object-cover`}
    />
  );
}

/**
 * Miss Maya saying one line, with a replay button.
 *
 * `onSpeak` is required rather than defaulted, so a mini-game cannot
 * accidentally ship a coach that shows a speaker icon and says nothing.
 */
export function MayaCoach({
  line,
  onSpeak,
  tone = "instruction",
}: {
  line: string;
  onSpeak: () => void;
  /** "instruction" is Maya telling you what to do; "praise" is her
   * celebrating. Only the colour changes — the words are the caller's. */
  tone?: "instruction" | "praise";
}) {
  const praise = tone === "praise";
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border-4 p-3 ${
        praise
          ? "border-[#2ecc71] bg-[#e8faf0]"
          : "border-[#2f7fd4] bg-[#eaf4ff]"
      }`}
    >
      <MayaAvatar className="h-12 w-12" />
      <div className="min-w-0 flex-1 text-left">
        <p
          className={`text-[0.6rem] font-black tracking-widest uppercase ${
            praise ? "text-[#25a25a]" : "text-[#2f7fd4]"
          }`}
        >
          Miss Maya says
        </p>
        <p className="text-lg leading-tight font-black text-[#141420]">{line}</p>
      </div>
      <button
        type="button"
        onClick={onSpeak}
        aria-label="Hear Miss Maya say it again"
        className={`shrink-0 rounded-xl px-3 py-3 text-lg font-black text-white ${
          praise ? "bg-[#2ecc71]" : "bg-[#2f7fd4]"
        }`}
      >
        🔊
      </button>
    </div>
  );
}
