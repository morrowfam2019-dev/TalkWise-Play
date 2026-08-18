import type { ShopItem } from "@/content/shop-item";

/**
 * GAME-002 Speech Basketball's own character roster — deliberately not the
 * adventure engine's rounded blob characters. A baller needs to actually
 * look like a basketball player: human proportions, a jersey, sneakers.
 *
 * These are sold in the **Basketball shop only** and land in the Basketball
 * inventory namespace only. The coin wallet is shared platform-wide, but a
 * baller can never turn up in Speech Adventures and an Adventure character
 * can never turn up on the court.
 *
 * The roster is deliberately mixed — girls and boys, a range of skin tones
 * and hairstyles, no two looking alike — so a kid can find someone who
 * looks like them, or just pick whoever looks coolest.
 */
export interface BallerLook {
  skin: string;
  skinDark: string;
  hair: string;
  hairStyle: "fade" | "puff" | "braids" | "bun" | "curly" | "short";
}

export interface BallerItem extends ShopItem {
  kind: "baller";
  look: BallerLook;
}

export const BALLERS: BallerItem[] = [
  {
    id: "zoe",
    kind: "baller",
    name: "Zoe",
    blurb: "Quick first step, quicker smile.",
    price: 0,
    look: {
      skin: "#c98b5e",
      skinDark: "#a86f45",
      hair: "#2b1c14",
      hairStyle: "puff",
    },
  },
  {
    id: "marcus",
    kind: "baller",
    name: "Marcus",
    blurb: "Calls every shot before he takes it.",
    price: 140,
    look: {
      skin: "#5b3a24",
      skinDark: "#432a19",
      hair: "#141414",
      hairStyle: "fade",
    },
  },
  {
    id: "priya",
    kind: "baller",
    name: "Priya",
    blurb: "Practices free throws in her sleep.",
    price: 140,
    look: {
      skin: "#e0ab7a",
      skinDark: "#c08d5c",
      hair: "#2a1810",
      hairStyle: "braids",
    },
  },
  {
    id: "kai",
    kind: "baller",
    name: "Kai",
    blurb: "Never met a corner three they didn't like.",
    price: 180,
    look: {
      skin: "#f2c9a0",
      skinDark: "#d9a877",
      hair: "#3d2b1a",
      hairStyle: "short",
    },
  },
  {
    id: "amara",
    kind: "baller",
    name: "Amara",
    blurb: "The loudest cheer on the bench, the coolest head on the court.",
    price: 180,
    look: {
      skin: "#3d2415",
      skinDark: "#2a1810",
      hair: "#1a1a1a",
      hairStyle: "bun",
    },
  },
  {
    id: "leo",
    kind: "baller",
    name: "Leo",
    blurb: "Big hair, bigger hops.",
    price: 220,
    look: {
      skin: "#f4d9b8",
      skinDark: "#dcb98f",
      hair: "#8a5a2b",
      hairStyle: "curly",
    },
  },
];

/** A jersey colorway, layered onto whichever baller is equipped. */
export interface JerseyItem extends ShopItem {
  kind: "jersey";
  primary: string;
  secondary: string;
}

export const JERSEYS: JerseyItem[] = [
  {
    id: "jersey-home",
    kind: "jersey",
    name: "Home Gold",
    blurb: "TalkWise gold and navy — the starting colors.",
    price: 0,
    primary: "#f5c33b",
    secondary: "#141420",
  },
  {
    id: "jersey-court",
    kind: "jersey",
    name: "Court Green",
    blurb: "Fresh off the hardwood.",
    price: 90,
    primary: "#2ecc71",
    secondary: "#0f3d24",
  },
  {
    id: "jersey-fire",
    kind: "jersey",
    name: "Fire Red",
    blurb: "For a hot streak.",
    price: 90,
    primary: "#e5342f",
    secondary: "#1c1c1c",
  },
  {
    id: "jersey-sky",
    kind: "jersey",
    name: "Sky Blue",
    blurb: "Long-range specialist colors.",
    price: 90,
    primary: "#2f9fe4",
    secondary: "#0a2e4a",
  },
];

export const DEFAULT_BALLER_ID = "zoe";
export const DEFAULT_JERSEY_ID = "jersey-home";

export function getBaller(id: string): BallerItem {
  return BALLERS.find((b) => b.id === id) ?? BALLERS[0];
}

export function getJersey(id: string | null): JerseyItem | null {
  if (!id) return null;
  return JERSEYS.find((j) => j.id === id) ?? null;
}
