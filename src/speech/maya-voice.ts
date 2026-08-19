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
