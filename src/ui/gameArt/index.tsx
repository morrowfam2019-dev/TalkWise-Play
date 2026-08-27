import Image from "next/image";

/**
 * Card art for the mini-games — the founder-approved TJ illustrations.
 *
 * ## Why these are images and the first pass was inline SVG
 *
 * The first version of this file drew each card as vector shapes, on the
 * reasoning that six illustrated PNGs would be hundreds of kilobytes on the
 * one screen every session starts from. That reasoning was right about the
 * cost and wrong about the value: these are the approved TJ covers, they put
 * the actual character on every card, and a child picks a game by
 * recognising him. Original character art beats a clever vector diagram.
 *
 * The weight objection is answered rather than ignored — the six panels are
 * cropped from the approved sheet and served as WebP at 512×314, **184 KB
 * for the whole set** where the PNG crops were 1.26 MB. Next's `<Image>`
 * then serves responsive sizes on top of that, and only the cards actually
 * on screen load, because everything below the fold is lazy by default.
 *
 * Source of truth: the approved cover sheet. Re-crop with
 * `scripts/crop-game-art.mjs` if the sheet is ever re-issued.
 */

/** Every mini-game's art key → its panel. */
const ART: Record<string, { src: string; alt: string }> = {
  "bubble-blast": {
    src: "/characters/games/bubble-blast.webp",
    alt: "TJ popping bubbles with letters and pictures inside them",
  },
  "sound-match": {
    src: "/characters/games/sound-match.webp",
    alt: "TJ dropping a picture card into his backpack",
  },
  "color-shape-hunt": {
    src: "/characters/games/color-shape-hunt.webp",
    alt: "TJ pointing at coloured shapes with a magnifying glass",
  },
  "guess-the-sound": {
    src: "/characters/games/guess-the-sound.webp",
    alt: "TJ listening, with question marks and three picture choices",
  },
  "action-dash": {
    src: "/characters/games/action-dash.webp",
    alt: "TJ running along a course toward a finish flag",
  },
  "story-builder": {
    src: "/characters/games/story-builder.webp",
    alt: "TJ building a sentence from word tiles beside a story book",
  },
};

/**
 * The card art for a game, or null when it has none.
 *
 * GAME-001 and GAME-002 deliberately have none: their cards were
 * founder-approved as they are, and this collection does not restyle them.
 * The library falls back to their glyph, exactly as before.
 */
export function GameCardArt({
  artKey,
  priority = false,
}: {
  artKey?: string;
  /** Set on the cards above the fold: they get a preload hint too. */
  priority?: boolean;
}) {
  if (!artKey) return null;
  const art = ART[artKey];
  if (!art) return null;

  return (
    <Image
      src={art.src}
      alt={art.alt}
      width={512}
      height={314}
      // Every card loads eagerly. The whole set is 184 KB, and this is the
      // screen every session opens on — lazy-loading the bottom row buys
      // nothing and shows a child two blank cards until they scroll. The
      // top cards additionally get a preload hint; `priority` and `loading`
      // are mutually exclusive in Next, hence the spread.
      {...(priority ? { priority: true } : { loading: "eager" as const })}
      // The card banner is a fixed height and full width, so the panel is
      // cropped to fill rather than letterboxed. TJ sits centre-left in
      // every panel, so centre-cropping never cuts him out.
      className="h-full w-full object-cover"
      sizes="(max-width: 640px) 50vw, 33vw"
    />
  );
}

export function hasCardArt(artKey?: string): boolean {
  return Boolean(artKey && ART[artKey]);
}
