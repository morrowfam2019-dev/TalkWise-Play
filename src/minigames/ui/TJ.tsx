/**
 * TJ — TalkWise Play's kid explorer, in his founder-approved colours.
 *
 * ## Why he is vector here and photographic on the cards
 *
 * The library cards use the approved illustrated covers, because a card is
 * a fixed image a child recognises. In-game TJ is different: he has to
 * *act*. Story Builder poses him per verb (jump, run, spin, clap …) and
 * has him react to a finished sentence. A vector character
 * recolours, squashes, rotates and scales on the compositor for the cost of
 * one class name, and never has to be re-rendered per pose.
 *
 * What changed here is the *design*: he was a generic placeholder kid, and
 * he is now drawn to the approved TJ — warm brown skin, tall rounded
 * dark-brown curly afro, royal-blue hoodie with the white "TJ" chest logo,
 * navy joggers, blue-and-white trainers. Same character a child just saw on
 * the card they tapped.
 *
 * ## Dropping in the photographic render
 *
 * A transparent full-body render of TJ exists (generated from the approved
 * covers via the `tj-talkwise-play` Higgsfield element). To use it instead,
 * save it as `public/characters/tj.png` and set `TJ_PHOTO` below to true —
 * every game picks it up with no other change. It is off by default because
 * the file is not in the repo yet.
 */

import Image from "next/image";

/** Flip to true once `public/characters/tj.png` exists. See the note above. */
const TJ_PHOTO = false;

export type TJMood = "happy" | "cheer" | "think" | "sleep";

/** Approved palette, from the cover sheet. */
const SKIN = "#c98a5b";
const SKIN_SHADOW = "#a86c42";
const HAIR = "#3d2517";
const HOODIE = "#1f6fe0";
const HOODIE_DARK = "#1550ab";
const JOGGERS = "#1e2a44";
const SHOE = "#2f8bf0";

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
  if (TJ_PHOTO) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src="/characters/tj.png"
          alt="TJ"
          width={510}
          height={1200}
          className="h-full w-full object-contain"
          priority
        />
        {accessory ? (
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-3xl" aria-hidden>
            {accessory}
          </span>
        ) : null}
      </div>
    );
  }

  const eyes =
    mood === "sleep" ? (
      <>
        <path d="M35 45q6 5 12 0" stroke="#141420" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M53 45q6 5 12 0" stroke="#141420" strokeWidth="3" fill="none" strokeLinecap="round" />
      </>
    ) : (
      <>
        <ellipse cx="41" cy="44" rx="5.4" ry="6" fill="#ffffff" />
        <ellipse cx="59" cy="44" rx="5.4" ry="6" fill="#ffffff" />
        <circle cx="41.6" cy="44.6" r="3.6" fill="#4a2c14" />
        <circle cx="59.6" cy="44.6" r="3.6" fill="#4a2c14" />
        <circle cx="43" cy="42.6" r="1.5" fill="#ffffff" />
        <circle cx="61" cy="42.6" r="1.5" fill="#ffffff" />
      </>
    );

  const mouth =
    mood === "cheer" ? (
      <>
        <path d="M40 55q10 13 20 0z" fill="#7d2b2b" />
        <path d="M42.5 56q7.5 3 15 0z" fill="#ff8f9b" />
      </>
    ) : mood === "think" ? (
      <circle cx="50" cy="57" r="3.2" fill="#7d2b2b" />
    ) : mood === "sleep" ? (
      <ellipse cx="50" cy="58" rx="4" ry="3" fill="#7d2b2b" />
    ) : (
      <>
        <path d="M41 55q9 10 18 0z" fill="#7d2b2b" />
        <path d="M43 56q7 2.5 14 0z" fill="#ff8f9b" />
      </>
    );

  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden>
      {/* Legs — navy joggers with the white side stripe from the covers. */}
      <rect x="40" y="92" width="8" height="19" rx="4" fill={JOGGERS} />
      <rect x="52" y="92" width="8" height="19" rx="4" fill={JOGGERS} />
      <rect x="40.6" y="95" width="1.6" height="12" rx="0.8" fill="#ffffff" opacity="0.75" />
      {/* Trainers */}
      <ellipse cx="43" cy="113" rx="7.5" ry="4.6" fill={SHOE} />
      <ellipse cx="57" cy="113" rx="7.5" ry="4.6" fill={SHOE} />
      <ellipse cx="43" cy="115.4" rx="7.5" ry="2.4" fill="#ffffff" />
      <ellipse cx="57" cy="115.4" rx="7.5" ry="2.4" fill="#ffffff" />

      {/* Backpack straps peeking at the shoulders */}
      <rect x="31" y="70" width="5" height="20" rx="2.5" fill={HOODIE_DARK} />
      <rect x="64" y="70" width="5" height="20" rx="2.5" fill={HOODIE_DARK} />

      {/* Hoodie body */}
      <rect x="32" y="67" width="36" height="32" rx="13" fill={HOODIE} />
      {/* Hood bunched at the neck */}
      <path d="M36 70q14 9 28 0v-4q-14 6-28 0z" fill={HOODIE_DARK} />
      {/* Chest logo */}
      <text
        x="50"
        y="88"
        textAnchor="middle"
        fontSize="13"
        fontWeight="900"
        fontFamily="system-ui, sans-serif"
        fill="#ffffff"
      >
        TJ
      </text>

      {/* Arms */}
      <rect x="21" y="70" width="13" height="8" rx="4" fill={HOODIE} />
      <rect x="66" y="70" width="13" height="8" rx="4" fill={HOODIE} />
      <circle cx="22" cy="74" r="4.6" fill={SKIN} />
      <circle cx="78" cy="74" r="4.6" fill={SKIN} />

      {/* Head */}
      <circle cx="50" cy="47" r="25" fill={SKIN} />
      {/* Ears */}
      <circle cx="25.5" cy="49" r="4.4" fill={SKIN_SHADOW} />
      <circle cx="74.5" cy="49" r="4.4" fill={SKIN_SHADOW} />
      {/* The afro — a tall rounded silhouette with a bumpy edge, the single
          most recognisable thing about him at small sizes. */}
      <path
        d="M50 13c15 0 26 10 26 23 0 4-1 7-2 9-1-6-4-9-7-10-2-6-8-8-13-7-6-2-12 0-15 5-4 1-7 4-8 12-1-2-2-5-2-9 0-13 6-23 21-23z"
        fill={HAIR}
      />
      <circle cx="32" cy="33" r="7" fill={HAIR} />
      <circle cx="43" cy="25" r="8" fill={HAIR} />
      <circle cx="57" cy="25" r="8" fill={HAIR} />
      <circle cx="68" cy="33" r="7" fill={HAIR} />
      <circle cx="50" cy="22" r="8.5" fill={HAIR} />

      {/* Brows */}
      <path d="M35 36q6-3.5 11-1" stroke={HAIR} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M65 36q-6-3.5-11-1" stroke={HAIR} strokeWidth="2.6" fill="none" strokeLinecap="round" />

      {eyes}
      <ellipse cx="50" cy="51" rx="3" ry="2.2" fill={SKIN_SHADOW} opacity="0.55" />
      {mouth}
      <circle cx="31" cy="54" r="4.4" fill="#e07a6a" opacity="0.4" />
      <circle cx="69" cy="54" r="4.4" fill="#e07a6a" opacity="0.4" />

      {accessory ? (
        <text x="50" y="14" textAnchor="middle" fontSize="22">
          {accessory}
        </text>
      ) : null}
    </svg>
  );
}
