/**
 * The one thing every TalkWise Play shop item has in common, regardless of
 * which game sells it.
 *
 * Deliberately tiny. Each game defines its own item *kinds* and its own
 * catalogue; this only fixes the fields the shared coin wallet and the
 * generic purchase path need to read. GAME-001 must never have to import
 * GAME-002's catalogue (or vice versa) just to describe a price tag.
 */
export interface ShopItem {
  id: string;
  /** Game-defined discriminator, e.g. "character" or "jersey". */
  kind: string;
  name: string;
  /** One line a child can read, describing what they get. */
  blurb: string;
  /** Cost in coins. Zero means it's owned from the start. */
  price: number;
}
