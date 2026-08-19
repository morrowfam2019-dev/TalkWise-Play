import {
  GAME_ADVENTURES,
  GAME_BASKETBALL,
  type GameId,
} from "@/platform/games/registry";
import {
  getLevelProgressFrom,
  sanitizeAdventuresState,
  type AdventuresLoadout,
  type LevelProgress,
} from "./games/adventures";
import {
  mergeBasketballRound,
  sanitizeBasketballState,
  type BasketballLoadout,
  type BasketballRoundOutcome,
} from "./games/basketball";
import {
  DEFAULT_PROFILE,
  spendableCoins,
  type Household,
  type PlayerProfile,
} from "./types";

/**
 * Storage abstraction for the household's player progress.
 *
 * Modelled as an observable external store so React can read it with
 * `useSyncExternalStore` — no load-on-mount effect, and no hydration mismatch.
 * The server-backed sync layer in `sync.ts` writes through this same store;
 * no gameplay code touches persistence directly.
 */
export interface HouseholdStore {
  subscribe(listener: () => void): () => void;
  /** Current household. Stable by reference until `save` is called. */
  getSnapshot(): Household;
  /** Value used during SSR and hydration. */
  getServerSnapshot(): Household;
  save(household: Household): void;
}

/**
 * v2 introduced per-game namespacing (`profile.games[GAME_ID]`). v1 and the
 * even older single-profile key are still read once, so an existing player's
 * progress migrates forward instead of being lost — see `sanitizeProfile`.
 */
const HOUSEHOLD_STORAGE_KEY = "talkwise-play/household/v2";
const LEGACY_HOUSEHOLD_STORAGE_KEY = "talkwise-play/household/v1";
const LEGACY_PROFILE_STORAGE_KEY = "talkwise-play/profile/v1";

const DEFAULT_CHILD_ID = "child-1";
const DEFAULT_HOUSEHOLD: Household = {
  activeChildId: DEFAULT_CHILD_ID,
  order: [DEFAULT_CHILD_ID],
  children: { [DEFAULT_CHILD_ID]: DEFAULT_PROFILE },
};

function makeChildId(): string {
  return `child-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Rebuilds a trustworthy profile from whatever was in storage.
 *
 * Handles both shapes:
 * - **v2 (current)** — per-game state under `games`.
 * - **v1 (legacy)** — a flat profile whose `owned`/`loadout`/`levels` were
 *   all Adventures data, because Adventures was the only game. Those fields
 *   are fed straight into the Adventures namespace, which is exactly where
 *   they belonged all along. Nothing is duplicated and no coins are minted:
 *   the wallet, streak and settings are platform-level in both shapes and
 *   carry across untouched.
 */
export function sanitizeProfile(raw: unknown): PlayerProfile {
  if (typeof raw !== "object" || raw === null) {
    return {
      ...DEFAULT_PROFILE,
      games: {
        [GAME_ADVENTURES]: sanitizeAdventuresState(null),
        [GAME_BASKETBALL]: sanitizeBasketballState(null),
      },
    };
  }
  const value = raw as Partial<PlayerProfile> & Record<string, unknown>;

  const namespaced =
    typeof value.games === "object" && value.games !== null
      ? (value.games as unknown as Record<string, unknown>)
      : null;

  // v1 profiles have no `games` key; the whole object *is* the Adventures
  // state as far as owned/loadout/levels are concerned.
  const adventuresRaw = namespaced ? namespaced[GAME_ADVENTURES] : value;
  const basketballRaw = namespaced ? namespaced[GAME_BASKETBALL] : null;

  return {
    name: typeof value.name === "string" ? value.name.slice(0, 20) : "",
    totalCoins: Number(value.totalCoins) || 0,
    spentCoins: Number(value.spentCoins) || 0,
    currentStreak: Number(value.currentStreak) || 0,
    bestStreak: Number(value.bestStreak) || 0,
    lastPlayedDate:
      typeof value.lastPlayedDate === "string" ? value.lastPlayedDate : null,
    micEnabled: value.micEnabled !== false,
    assistMode: value.assistMode === true,
    games: {
      [GAME_ADVENTURES]: sanitizeAdventuresState(adventuresRaw),
      [GAME_BASKETBALL]: sanitizeBasketballState(basketballRaw),
    },
  };
}

export function sanitizeHousehold(raw: unknown): Household | null {
  if (typeof raw !== "object" || raw === null) return null;
  const value = raw as Partial<Household>;
  if (typeof value.children !== "object" || value.children === null) return null;

  const children: Record<string, PlayerProfile> = {};
  for (const [id, entry] of Object.entries(value.children)) {
    children[id] = sanitizeProfile(entry);
  }
  if (Object.keys(children).length === 0) return null;

  const order = Array.isArray(value.order)
    ? value.order.filter(
        (id): id is string => typeof id === "string" && id in children,
      )
    : [];
  for (const id of Object.keys(children)) {
    if (!order.includes(id)) order.push(id);
  }

  const activeChildId =
    typeof value.activeChildId === "string" && value.activeChildId in children
      ? value.activeChildId
      : order[0];

  return { activeChildId, order, children };
}

function freshHousehold(): Household {
  const id = makeChildId();
  return {
    activeChildId: id,
    order: [id],
    children: { [id]: sanitizeProfile(null) },
  };
}

/** YYYY-MM-DD in the player's local timezone — calendar days, not UTC ones. */
function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Advances the daily streak for a run played right now. A second run on the
 * same calendar day is a no-op; a run on the day right after the last one
 * extends the streak; any bigger gap (or a first-ever run) restarts it at 1.
 * Platform-level: practising in either game keeps the streak alive.
 */
function advanceStreak(
  profile: Pick<PlayerProfile, "currentStreak" | "bestStreak" | "lastPlayedDate">,
  now: Date,
): Pick<PlayerProfile, "currentStreak" | "bestStreak" | "lastPlayedDate"> {
  const today = localDateKey(now);
  if (profile.lastPlayedDate === today) return profile;

  const yesterday = localDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const currentStreak =
    profile.lastPlayedDate === yesterday ? profile.currentStreak + 1 : 1;

  return {
    currentStreak,
    bestStreak: Math.max(profile.bestStreak, currentStreak),
    lastPlayedDate: today,
  };
}

class LocalHouseholdStore implements HouseholdStore {
  private cache: Household | null = null;
  private listeners = new Set<() => void>();

  private read(): Household {
    if (typeof window === "undefined") return DEFAULT_HOUSEHOLD;
    try {
      const raw = window.localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
      if (raw) {
        const sanitized = sanitizeHousehold(JSON.parse(raw));
        if (sanitized) return sanitized;
      }

      // Migration path: read the older keys once. `sanitizeProfile` turns
      // their flat shape into the namespaced one; the next `save` writes it
      // back under the v2 key. The old keys are left in place, so rolling
      // this deploy back does not strand anybody's progress.
      const legacyHousehold = window.localStorage.getItem(
        LEGACY_HOUSEHOLD_STORAGE_KEY,
      );
      if (legacyHousehold) {
        const sanitized = sanitizeHousehold(JSON.parse(legacyHousehold));
        if (sanitized) return sanitized;
      }

      const legacyRaw = window.localStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
      if (legacyRaw) {
        const profile = sanitizeProfile(JSON.parse(legacyRaw));
        const id = makeChildId();
        return { activeChildId: id, order: [id], children: { [id]: profile } };
      }
    } catch {
      // Corrupt storage — fall through to a fresh household below.
    }
    return freshHousehold();
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): Household => {
    this.cache ??= this.read();
    return this.cache;
  };

  getServerSnapshot = (): Household => DEFAULT_HOUSEHOLD;

  save = (household: Household): void => {
    this.cache = household;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          HOUSEHOLD_STORAGE_KEY,
          JSON.stringify(household),
        );
      } catch {
        // Private browsing or quota exhausted — the in-memory cache still
        // serves the rest of this session.
      }
    }
    for (const listener of this.listeners) listener();
  };
}

export const householdStore: HouseholdStore = new LocalHouseholdStore();

// ---------------------------------------------------------------------------
// GAME-001 Speech Adventures
// ---------------------------------------------------------------------------

export function getLevelProgress(
  profile: PlayerProfile,
  levelId: string,
): LevelProgress {
  return getLevelProgressFrom(profile.games[GAME_ADVENTURES], levelId);
}

/**
 * Whether a level is playable yet. Takes a structural `{ unlockRequires? }`
 * rather than importing `SpeechLevel`, so the player layer stays independent
 * of the speech-content layer per the architecture split.
 */
export function isLevelUnlocked(
  profile: PlayerProfile,
  level: { unlockRequires?: string },
): boolean {
  if (!level.unlockRequires) return true;
  return getLevelProgress(profile, level.unlockRequires).completed;
}

/**
 * Folds a finished adventure run into a profile, keeping personal bests and
 * advancing the daily streak. Coins land in the shared platform wallet;
 * level records land in the Adventures namespace only. `now` is injectable
 * for tests; real callers omit it.
 */
export function mergeRunResult(
  profile: PlayerProfile,
  levelId: string,
  run: { checkpoints: number; coins: number; completed: boolean },
  now: Date = new Date(),
): PlayerProfile {
  const adventures = profile.games[GAME_ADVENTURES];
  const previous = getLevelProgressFrom(adventures, levelId);
  return {
    ...profile,
    ...advanceStreak(profile, now),
    totalCoins: profile.totalCoins + run.coins,
    games: {
      ...profile.games,
      [GAME_ADVENTURES]: {
        ...adventures,
        levels: {
          ...adventures.levels,
          [levelId]: {
            bestCheckpoints: Math.max(previous.bestCheckpoints, run.checkpoints),
            bestCoins: Math.max(previous.bestCoins, run.coins),
            completed: previous.completed || run.completed,
          },
        },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// GAME-002 Speech Basketball
// ---------------------------------------------------------------------------

/**
 * Folds a finished basketball round into a profile. Same split as an
 * adventure run: coins to the shared wallet and the streak to the platform,
 * records into the Basketball namespace only.
 */
export function mergeBasketballResult(
  profile: PlayerProfile,
  round: BasketballRoundOutcome & { coinsEarned: number },
  now: Date = new Date(),
): PlayerProfile {
  return {
    ...profile,
    ...advanceStreak(profile, now),
    totalCoins: profile.totalCoins + round.coinsEarned,
    games: {
      ...profile.games,
      [GAME_BASKETBALL]: mergeBasketballRound(
        profile.games[GAME_BASKETBALL],
        round,
        now,
      ),
    },
  };
}

// ---------------------------------------------------------------------------
// Shops — one shared wallet, strictly per-game ownership
// ---------------------------------------------------------------------------

/** Which loadout slot a purchased item auto-equips into, per game. */
function equipSlotFor(gameId: GameId, kind: string): string | null {
  if (gameId === GAME_ADVENTURES) {
    if (kind === "character") return "characterId";
    if (kind === "aura") return "auraId";
    if (kind === "hat") return "hatId";
    if (kind === "boost") return "boostId";
    return null;
  }
  if (kind === "baller") return "ballerId";
  if (kind === "jersey") return "jerseyId";
  return null;
}

/** Slots a child must always have filled, so a game is never unplayable. */
function isRequiredSlot(gameId: GameId, slot: string): boolean {
  return (
    (gameId === GAME_ADVENTURES && slot === "characterId") ||
    (gameId === GAME_BASKETBALL && slot === "ballerId")
  );
}

/**
 * Buys a shop item **into one game's inventory**, if it's affordable and not
 * already owned there. Coins come out of the shared platform wallet; the
 * item itself is recorded only under `gameId`, which is what keeps an
 * Adventure hat out of the basketball wardrobe. Returns the profile
 * unchanged when the purchase can't happen — callers show the reason, and
 * nothing here can put a wallet below zero.
 */
export function purchaseItem(
  profile: PlayerProfile,
  gameId: GameId,
  item: { id: string; price: number; kind: string },
): { profile: PlayerProfile; bought: boolean } {
  const state = profile.games[gameId];
  if (state.owned.includes(item.id)) return { profile, bought: false };
  if (spendableCoins(profile) < item.price) return { profile, bought: false };

  const owned = [...state.owned, item.id];
  // Buying something equips it immediately — a child who just spent their
  // coins should see the thing they bought, not hunt for an Equip button.
  const slot = equipSlotFor(gameId, item.kind);
  const loadout = slot
    ? { ...state.loadout, [slot]: item.id }
    : { ...state.loadout };

  return {
    profile: {
      ...profile,
      spentCoins: profile.spentCoins + item.price,
      games: {
        ...profile.games,
        [gameId]: { ...state, owned, loadout },
      },
    } as PlayerProfile,
    bought: true,
  };
}

/**
 * Equips an item a child owns **in that game**. Passing null clears an
 * optional slot; the required slots (Adventures character, Basketball
 * baller) can only ever be swapped, never emptied.
 */
export function equipItem(
  profile: PlayerProfile,
  gameId: GameId,
  kind: string,
  id: string | null,
): PlayerProfile {
  const state = profile.games[gameId];
  if (id !== null && !state.owned.includes(id)) return profile;

  const slot = equipSlotFor(gameId, kind);
  if (!slot) return profile;
  if (id === null && isRequiredSlot(gameId, slot)) return profile;

  return {
    ...profile,
    games: {
      ...profile.games,
      [gameId]: {
        ...state,
        loadout: { ...state.loadout, [slot]: id },
      },
    },
  } as PlayerProfile;
}

/** Turns the movement/listening assist setting on or off for a profile. */
export function setAssistMode(
  profile: PlayerProfile,
  assistMode: boolean,
): PlayerProfile {
  return { ...profile, assistMode };
}

// ---------------------------------------------------------------------------
// Household
// ---------------------------------------------------------------------------

/** Adds a new child profile to the household and makes it the active one. */
export function addChild(
  household: Household,
  name: string,
): { household: Household; id: string } {
  const id = makeChildId();
  const fresh = sanitizeProfile(null);
  const next: Household = {
    activeChildId: id,
    order: [...household.order, id],
    children: {
      ...household.children,
      [id]: { ...fresh, name: name.slice(0, 20) },
    },
  };
  return { household: next, id };
}

/** Switches the active child. A no-op if the id isn't a known child. */
export function setActiveChild(household: Household, id: string): Household {
  if (!(id in household.children)) return household;
  return { ...household, activeChildId: id };
}

export type { AdventuresLoadout, BasketballLoadout, LevelProgress };
