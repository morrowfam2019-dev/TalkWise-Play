/**
 * Placeholder cards on the home screen. These establish that M Adventure sits
 * inside a larger TalkWise Play universe. They are not playable.
 */
export interface ComingSoonEntry {
  title: string;
  soundLabel: string;
  glyph: string;
}

export const COMING_SOON: ComingSoonEntry[] = [
  { title: "W Woods", soundLabel: "/W/", glyph: "🌲" },
];
