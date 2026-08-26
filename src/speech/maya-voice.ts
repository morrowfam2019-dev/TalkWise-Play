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
 * Speaks a Beginner sound's letter name, e.g. "Em" for /m/.
 *
 * Slower and slightly lower than the word voice, so a child can track it
 * clearly. This is the letter's *name*, not the isolated phoneme held on
 * its own — browser recognition can't reliably hear a held consonant back,
 * but it hears a spoken letter name well.
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
 * Plays Miss Maya modelling one speech sound's letter name.
 *
 * Prefers a recorded clip at `/audio/maya/sounds/<id>.mp3`; falls back to
 * the text-to-speech model if that sound's clip is missing. The clip path
 * is still checked first, once per sound per session, so that dropping a
 * new recording in later needs no code change at all.
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
