/**
 * Original card art for the mini-games.
 *
 * ## Why inline SVG rather than illustration files
 *
 * §12 asks for distinct card art per mini-game that communicates the
 * gameplay **without reading**, and §11 rules out cheap clip-art. §14 and
 * §31 also want the library to load instantly on a phone. Six illustrated
 * PNGs would be hundreds of kilobytes on the one screen every session
 * starts from.
 *
 * These are drawn here in vector: each card is a scene of circles, paths and
 * one character, a few hundred bytes, sharp at every density, and recoloured
 * by props rather than by a second export. Every shape below is original —
 * nothing is traced, imported or adapted.
 *
 * Each scene shows the *verb* of its game: popping, dragging into the
 * backpack, hunting among shapes, listening, running, and a story panel. A
 * three-year-old choosing a card is reading the picture, not the title.
 */

/** A small TalkWise kid, sized for a card scene. */
function CardKid({
  x,
  y,
  scale = 1,
  arms = "down",
}: {
  x: number;
  y: number;
  scale?: number;
  arms?: "down" | "up" | "reach";
}) {
  const armPath =
    arms === "up"
      ? "M-13 4 L-20 -8 M13 4 L20 -8"
      : arms === "reach"
        ? "M-13 4 L-22 0 M13 4 L22 -2"
        : "M-13 4 L-18 12 M13 4 L18 12";

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Legs */}
      <path
        d="M-6 20 L-6 30 M6 20 L6 30"
        stroke="#2f6fd4"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* Body */}
      <rect x="-13" y="-2" width="26" height="24" rx="10" fill="#2ecc71" />
      {/* Arms */}
      <path
        d={armPath}
        stroke="#f0b98a"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Head */}
      <circle cx="0" cy="-16" r="15" fill="#f7c9a3" />
      <path
        d="M-15 -18a15 15 0 0 1 30 0q-4-6-9-4-5-6-11-2-5 1-7 4z"
        fill="#5b3a24"
      />
      <circle cx="-5" cy="-15" r="2.6" fill="#141420" />
      <circle cx="5" cy="-15" r="2.6" fill="#141420" />
      <path
        d="M-5 -8q5 5 10 0"
        stroke="#c1443c"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="-11" cy="-10" r="3" fill="#f7a1a1" opacity="0.6" />
      <circle cx="11" cy="-10" r="3" fill="#f7a1a1" opacity="0.6" />
    </g>
  );
}

const FRAME = "0 0 200 120";

function BubbleBlastArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="bb-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cd0f5" />
          <stop offset="100%" stopColor="#2f7fd4" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#bb-sea)" />
      {/* Bubbles at different sizes, one mid-pop. */}
      <circle cx="46" cy="34" r="19" fill="#ffffff" opacity="0.55" />
      <circle cx="46" cy="34" r="19" fill="none" stroke="#ffffff" strokeWidth="3" />
      <circle cx="40" cy="28" r="5" fill="#ffffff" opacity="0.85" />
      <circle cx="152" cy="30" r="14" fill="#ffffff" opacity="0.5" />
      <circle cx="152" cy="30" r="14" fill="none" stroke="#ffffff" strokeWidth="3" />
      <circle cx="168" cy="72" r="11" fill="#ffffff" opacity="0.45" />
      <circle cx="168" cy="72" r="11" fill="none" stroke="#ffffff" strokeWidth="2.5" />
      {/* The pop: a burst where a bubble just was. */}
      <g stroke="#ffe08a" strokeWidth="4" strokeLinecap="round">
        <path d="M112 30 L112 16 M112 44 L112 58 M97 37 L84 37 M127 37 L140 37" />
        <path d="M101 26 L92 17 M123 26 L132 17 M101 48 L92 57 M123 48 L132 57" />
      </g>
      <circle cx="112" cy="37" r="8" fill="#f5c33b" />
      <CardKid x={100} y={92} scale={1.15} arms="up" />
    </svg>
  );
}

function SoundMatchArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sm-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffc46b" />
          <stop offset="100%" stopColor="#e08a2c" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sm-bg)" />
      {/* The backpack, open and waiting.
          Drawn with shoulder straps, a front pocket and a flap rather than
          a plain box with an arc over it: at card size — which is the size
          it is actually seen at — a box with an arc reads as a padlock, and
          a padlock is the wrong idea entirely for a game about putting
          things in. */}
      <g transform="translate(140 62)">
        {/* Shoulder straps, behind the body. */}
        <path
          d="M-14 -14 q-9 12 -7 30 M14 -14 q9 12 7 30"
          stroke="#8a5c30"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        {/* Body. */}
        <rect x="-25" y="-14" width="50" height="44" rx="13" fill="#a5713f" />
        {/* Open flap, tipped back. */}
        <path
          d="M-25 -6 q25 -22 50 0 v-6 q-25 -20 -50 0 z"
          fill="#8a5c30"
        />
        {/* Front pocket. */}
        <rect x="-15" y="8" width="30" height="16" rx="6" fill="#8a5c30" />
        <rect x="-6" y="13" width="12" height="5" rx="2.5" fill="#f5c33b" />
      </g>

      {/* A card in flight, on its way in. */}
      <g transform="translate(86 40) rotate(-12)">
        <rect x="-19" y="-16" width="38" height="32" rx="8" fill="#ffffff" />
        <circle cx="0" cy="-3" r="8" fill="#2f7fd4" />
        <rect x="-11" y="8" width="22" height="4" rx="2" fill="#c9d4de" />
      </g>
      {/* The dashed path it is travelling. */}
      <path
        d="M72 56 Q100 80 122 62"
        stroke="#ffffff"
        strokeWidth="3"
        strokeDasharray="6 6"
        fill="none"
        opacity="0.8"
      />
      <CardKid x={44} y={80} scale={1.1} arms="reach" />
    </svg>
  );
}

function ColorShapeHuntArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="csh-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff9ecd" />
          <stop offset="100%" stopColor="#a273e8" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#csh-bg)" />
      {/* A scatter of shapes — the thing being hunted through. */}
      <circle cx="36" cy="28" r="14" fill="#2f7fd4" stroke="#1c5292" strokeWidth="3" />
      <rect x="150" y="16" width="28" height="28" rx="5" fill="#f5c33b" stroke="#c2921a" strokeWidth="3" />
      <path d="M164 62 L180 92 L148 92 Z" fill="#3fbf62" stroke="#248441" strokeWidth="3" />
      <path
        d="M40 96 L44 84 L57 83 L47 75 L51 62 L40 70 L29 62 L33 75 L23 83 L36 84 Z"
        fill="#f0483d"
        stroke="#b32b22"
        strokeWidth="3"
      />
      <rect x="82" y="18" width="26" height="18" rx="4" fill="#ff8a3d" stroke="#c95c17" strokeWidth="3" />
      {/* The one being pointed at, ringed. */}
      <circle cx="112" cy="70" r="17" fill="none" stroke="#ffffff" strokeWidth="4" strokeDasharray="7 5" />
      <CardKid x={100} y={98} scale={1.1} arms="reach" />
    </svg>
  );
}

function GuessTheSoundArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="gts-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fe3c4" />
          <stop offset="100%" stopColor="#2f9e8c" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#gts-bg)" />
      {/* Sound waves coming in from the left. */}
      <g stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.9">
        <path d="M22 60 q10 -14 0 -28" />
        <path d="M36 60 q16 -22 0 -44" />
        <path d="M22 60 q10 14 0 28" />
        <path d="M36 60 q16 22 0 44" />
      </g>
      {/* Three mystery choices, one revealed. */}
      <g>
        <rect x="82" y="26" width="34" height="34" rx="9" fill="#ffffff" opacity="0.9" />
        <text x="99" y="51" textAnchor="middle" fontSize="24" fontWeight="900" fill="#2f9e8c">
          ?
        </text>
      </g>
      <g>
        <rect x="126" y="26" width="34" height="34" rx="9" fill="#ffffff" opacity="0.9" />
        <text x="143" y="51" textAnchor="middle" fontSize="24" fontWeight="900" fill="#2f9e8c">
          ?
        </text>
      </g>
      <g>
        <rect x="160" y="66" width="34" height="34" rx="9" fill="#f5c33b" />
        <text x="177" y="91" textAnchor="middle" fontSize="24" fontWeight="900" fill="#141420">
          ?
        </text>
      </g>
      <CardKid x={62} y={98} scale={1.15} arms="up" />
    </svg>
  );
}

function ActionDashArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="ad-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="100%" stopColor="#f0973d" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#ad-bg)" />
      {/* Ground and the box being jumped. */}
      <rect x="0" y="98" width="200" height="6" rx="3" fill="#c97a24" opacity="0.6" />
      <rect x="136" y="76" width="34" height="24" rx="5" fill="#a5713f" stroke="#6f4a26" strokeWidth="3" />
      {/* Speed lines behind the runner. */}
      <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.8">
        <path d="M18 46 L44 46 M12 62 L38 62 M22 78 L46 78" />
      </g>
      {/* An arc showing the jump. */}
      <path
        d="M72 88 Q104 34 148 74"
        stroke="#ffffff"
        strokeWidth="3"
        strokeDasharray="7 6"
        fill="none"
        opacity="0.9"
      />
      <CardKid x={98} y={56} scale={1.2} arms="up" />
    </svg>
  );
}

function StoryBuilderArt() {
  return (
    <svg viewBox={FRAME} className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sb-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c3a4ff" />
          <stop offset="100%" stopColor="#6d3fd4" />
        </linearGradient>
      </defs>
      <rect width="200" height="120" fill="url(#sb-bg)" />
      {/* Comic panels, the middle one being written. */}
      <rect x="14" y="18" width="52" height="52" rx="8" fill="#ffffff" opacity="0.95" />
      <circle cx="40" cy="40" r="11" fill="#ffd76e" />
      <rect x="24" y="56" width="34" height="5" rx="2.5" fill="#c9d4de" />

      <rect x="74" y="18" width="52" height="52" rx="8" fill="#ffffff" opacity="0.95" />
      <path d="M88 46 l10 -12 l10 12 z" fill="#3fbf62" />
      <rect x="84" y="56" width="34" height="5" rx="2.5" fill="#c9d4de" />

      <rect x="134" y="18" width="52" height="52" rx="8" fill="#ffffff" opacity="0.6" strokeDasharray="7 5" stroke="#ffffff" strokeWidth="3" />
      <text x="160" y="52" textAnchor="middle" fontSize="26" fontWeight="900" fill="#6d3fd4">
        +
      </text>

      {/* Word tiles being assembled below. */}
      <rect x="22" y="82" width="40" height="18" rx="6" fill="#f5c33b" />
      <rect x="70" y="82" width="48" height="18" rx="6" fill="#ffffff" opacity="0.9" />
      <rect x="126" y="82" width="34" height="18" rx="6" fill="#ffffff" opacity="0.55" />
      <CardKid x={178} y={98} scale={0.85} arms="up" />
    </svg>
  );
}

const ART: Record<string, () => React.JSX.Element> = {
  "bubble-blast": BubbleBlastArt,
  "sound-match": SoundMatchArt,
  "color-shape-hunt": ColorShapeHuntArt,
  "guess-the-sound": GuessTheSoundArt,
  "action-dash": ActionDashArt,
  "story-builder": StoryBuilderArt,
};

/**
 * The card art for a game, or null when it has none.
 *
 * GAME-001 and GAME-002 deliberately have none: their cards were
 * founder-approved as they are, and this collection does not restyle them.
 * The library falls back to their glyph, exactly as before.
 */
export function GameCardArt({ artKey }: { artKey?: string }) {
  if (!artKey) return null;
  const Art = ART[artKey];
  return Art ? <Art /> : null;
}

export function hasCardArt(artKey?: string): boolean {
  return Boolean(artKey && ART[artKey]);
}
