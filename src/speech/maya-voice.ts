/**
 * Miss Maya's voice — recorded clips with a browser text-to-speech
 * fallback for any word that doesn't have one yet. Shared by every game
 * that wants her to say a word out loud (the adventure engine's
 * `ChallengeModal`, Speech Basketball's word prompt) so there's exactly one
 * place that knows the clip naming convention and the fallback voice.
 */

/** Best-effort female voice, used only when no recorded clip exists. */
function speakExampleWord(word: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.85;
    utterance.pitch = 1.15;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) =>
      /female|samantha|victoria|zira|karen|moira|tessa|susan/i.test(voice.name),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Speech synthesis is best-effort — the caller's own UI still shows the word.
  }
}

/** Plays the recorded "Miss Maya" clip for a word; falls back to browser
 * text-to-speech if that word hasn't been recorded yet. */
export function playExampleWord(word: string) {
  if (typeof window === "undefined") return;
  const clip = new Audio(`/audio/maya/${word.toLowerCase()}.mp3`);
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    speakExampleWord(word);
  };
  clip.addEventListener("error", fallback);
  clip.play().catch(fallback);
}

// ---------------------------------------------------------------------------
// Sound modelling (GAME-001 Beginner)
// ---------------------------------------------------------------------------

/**
 * Speaks an elongated speech sound, e.g. "mmmmm".
 *
 * Slower and slightly lower than the word voice, because the point is to let
 * a child hear the sound *held* rather than clipped. Nothing here says a
 * letter name: /m/ is modelled as "mmmmm", never as "em".
 */
function speakSoundModel(model: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(model);
    utterance.rate = 0.6;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) =>
      /female|samantha|victoria|zira|karen|moira|tessa|susan/i.test(voice.name),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Best-effort — the station still shows the sound and its cue.
  }
}

/**
 * Sounds whose clip has already been found to be missing this session.
 *
 * Without this, a Beginner station probes the same absent file — and logs
 * the same 404 — every single time it models the sound, which is several
 * times per visit.
 */
const missingSoundClips = new Set<string>();

/**
 * Plays Miss Maya modelling one speech sound.
 *
 * Prefers a recorded clip at `/audio/maya/sounds/<id>.mp3`. **None of those
 * are recorded yet** — the existing library is word clips — so today every
 * sound falls through to the elongated text-to-speech model. The clip path
 * is still checked first, once per sound per session, so that dropping real
 * recordings in later needs no code change at all.
 */
export function playExampleSound(soundId: string, model: string) {
  if (typeof window === "undefined") return;
  const id = soundId.toLowerCase();
  if (missingSoundClips.has(id)) {
    speakSoundModel(model);
    return;
  }
  const clip = new Audio(`/audio/maya/sounds/${id}.mp3`);
  let fellBack = false;
  const fallback = () => {
    if (fellBack) return;
    fellBack = true;
    missingSoundClips.add(id);
    speakSoundModel(model);
  };
  clip.addEventListener("error", fallback);
  clip.play().catch(fallback);
}

/**
 * Speaks a whole sentence in Miss Maya's fallback voice.
 *
 * Expert sentences have no recorded clips (and would need one per sentence),
 * so this is text-to-speech by design rather than by omission. Paced a
 * little under normal speed so a child can track the words, but not so slow
 * that the sentence stops sounding like connected speech — which is the
 * whole point of the Expert tier.
 */
export function playExampleSentence(sentence: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find((voice) =>
      /female|samantha|victoria|zira|karen|moira|tessa|susan/i.test(voice.name),
    );
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  } catch {
    // Best-effort — the sentence is on screen either way.
  }
}
