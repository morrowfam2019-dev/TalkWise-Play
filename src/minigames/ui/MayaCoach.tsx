"use client";

/**
 * Miss Maya, as the mini-games use her.
 *
 * §18 is specific: she is the instructional anchor, she does not narrate
 * every second, and voice fatigue is a real risk when a child replays a
 * thirty-second game eight times.
 *
 * ## She never speaks on her own
 *
 * There is no automatic narration anywhere in this collection. Instruction
 * lines, praise and reveals are **text on screen**, not speech. The only
 * sound Miss Maya makes is when a child presses the speaker button to hear
 * the sound, word or sentence they are practising — see `maya-voice.ts` for
 * why that rule is absolute.
 *
 * ## A speaker button that does nothing is worse than no speaker button
 *
 * Most mini-game pack words have no recording. So `speakerFor` returns null
 * for those, `MayaCoach` renders no button, and a child is never invited to
 * press something silent. When the recordings land, the buttons appear on
 * their own.
 */

import Image from "next/image";
import {
  hasSentenceClip,
  hasWordClip,
  playExampleSentence,
  playExampleSound,
  playExampleWord,
} from "@/speech/maya-voice";
import type { MiniSpeechTarget } from "../speech";

/**
 * A function that plays one mini-game speech target in Miss Maya's voice,
 * or **null** when that target has no recording.
 *
 * Routing by target kind lives here so a sound goes through the sound path
 * (which knows about `/audio/maya/sounds/`), a word through the word path,
 * and a sentence through the sentence path — one switch, in one place,
 * rather than each mini-game guessing which of the three to call.
 */
export function speakerFor(
  target: MiniSpeechTarget | null | undefined,
): (() => void) | null {
  if (!target) return null;

  if (target.kind === "sound") {
    // All seven supported sounds are recorded, so this is always available.
    return () => void playExampleSound(target.text);
  }
  if (target.kind === "sentence") {
    if (!hasSentenceClip(target.text)) return null;
    return () => void playExampleSentence(target.text);
  }
  if (!hasWordClip(target.text)) return null;
  return () => void playExampleWord(target.text);
}

/** A speaker for one bare word, for the games that practise a word that is
 * not a full speech target (a colour name, an object a child just found). */
export function speakerForWord(word: string): (() => void) | null {
  if (!hasWordClip(word)) return null;
  return () => void playExampleWord(word);
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
 * Miss Maya saying one line.
 *
 * `speak` is nullable on purpose and the button only renders when it is
 * not null — see the note at the top of this file.
 */
export function MayaCoach({
  line,
  speak,
  tone = "instruction",
}: {
  line: string;
  /** What pressing the speaker plays, or null when nothing is recorded. */
  speak?: (() => void) | null;
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
      {speak ? (
        <button
          type="button"
          onClick={speak}
          aria-label="Hear Miss Maya say it"
          className={`shrink-0 rounded-xl px-3 py-3 text-lg font-black text-white ${
            praise ? "bg-[#2ecc71]" : "bg-[#2f7fd4]"
          }`}
        >
          🔊
        </button>
      ) : null}
    </div>
  );
}
