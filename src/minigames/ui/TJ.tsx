/**
 * TJ — TalkWise Play's kid explorer, drawn as inline SVG.
 *
 * ## Why original vector art rather than a sprite sheet
 *
 * §12 and §2 pull in the same direction: original TalkWise visuals, and
 * mini-games that load instantly. A character built from circles and paths
 * is a few hundred bytes, scales perfectly on every phone, recolours for a
 * power-up without a second asset, and animates through CSS transforms
 * rather than frames. Every part of him below is drawn here — nothing is
 * traced, imported or adapted from anywhere.
 *
 * His expression is a prop rather than a variant so a mini-game can react
 * to what a child did — cheering on a correct answer, thinking during a
 * prompt — with one state change and no extra art.
 */

export type TJMood = "happy" | "cheer" | "think" | "sleep";

export function TJ({
  mood = "happy",
  className = "h-32 w-32",
  /** Power-up costume glyph, floated above him. Temporary by design. */
  accessory,
}: {
  mood?: TJMood;
  className?: string;
  accessory?: string;
}) {
  const eyeShape =
    mood === "sleep" ? (
      <>
        <path d="M36 44q5 4 10 0" stroke="#141420" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M54 44q5 4 10 0" stroke="#141420" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="41" cy="44" r="4.5" fill="#141420" />
        <circle cx="59" cy="44" r="4.5" fill="#141420" />
        <circle cx="42.5" cy="42.5" r="1.6" fill="#ffffff" />
        <circle cx="60.5" cy="42.5" r="1.6" fill="#ffffff" />
      </>
    );

  const mouth =
    mood === "cheer" ? (
      <ellipse cx="50" cy="57" rx="8" ry="7" fill="#c1443c" />
    ) : mood === "think" ? (
      <circle cx="50" cy="57" r="3.4" fill="#c1443c" />
    ) : mood === "sleep" ? (
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#c1443c" />
    ) : (
      <path d="M42 55q8 8 16 0" stroke="#c1443c" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    );

  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden>
      {/* Legs */}
      <rect x="40" y="92" width="7" height="20" rx="3.5" fill="#2f6fd4" />
      <rect x="53" y="92" width="7" height="20" rx="3.5" fill="#2f6fd4" />
      <ellipse cx="43" cy="114" rx="7" ry="4.5" fill="#f5c33b" />
      <ellipse cx="57" cy="114" rx="7" ry="4.5" fill="#f5c33b" />

      {/* Body */}
      <rect x="33" y="68" width="34" height="30" rx="12" fill="#2ecc71" />
      <rect x="33" y="68" width="34" height="9" rx="4.5" fill="#25a25a" />

      {/* Arms */}
      <rect x="22" y="70" width="12" height="7" rx="3.5" fill="#f0b98a" />
      <rect x="66" y="70" width="12" height="7" rx="3.5" fill="#f0b98a" />

      {/* Head */}
      <circle cx="50" cy="46" r="26" fill="#f7c9a3" />
      {/* Hair */}
      <path
        d="M24 44a26 26 0 0 1 52 0q-6-9-14-6-8-9-18-4-9 1-12 6-5 1-8 4z"
        fill="#5b3a24"
      />
      {eyeShape}
      {mouth}
      {/* Cheeks */}
      <circle cx="31" cy="53" r="4.5" fill="#f7a1a1" opacity="0.65" />
      <circle cx="69" cy="53" r="4.5" fill="#f7a1a1" opacity="0.65" />

      {accessory ? (
        <text x="50" y="18" textAnchor="middle" fontSize="24">
          {accessory}
        </text>
      ) : null}
    </svg>
  );
}
