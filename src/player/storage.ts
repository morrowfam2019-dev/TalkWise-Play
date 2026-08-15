import { DEFAULT_CHARACTER_ID } from "@/content/shop";
import {
  DEFAULT_PROFILE,
  EMPTY_LEVEL_PROGRESS,
  spendableCoins,
  type Household,
  type LevelProgress,
  type Loadout,
  type PlayerProfile,
} from "./types";

/**
 * Storage abstraction for the household's player progress.
 *
 * Modelled as an observable external store so React can read it with
 * `useSyncExternalStore` — no load-on-mount effect, and no hydration mismatch.
 * A future server-backed store only has to satisfy this interface; no gameplay
 * code touches persistence directly.
 */
export interface HouseholdStore {
  subscribe(listener: () => void): () => void;
  /** Current household. Stable by reference until `save` is called. */
  getSnapshot(): Household;
  /** Value used during SSR and hydration. */
  getServerSnapshot(): Household;
  save(household: Household): void;
}

const HOUSEHOLD_STORAGE_KEY = "talkwise-play/household/v1";
/** Pre-multi-profile storage key, read once to migrate existing players'
 * progress into their first child profile instead of losing it. */
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

function sanitizeProfile(raw: unknown): PlayerProfile {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_PROFILE };
  const value = raw as Partial<PlayerProfile>;

  const levels: Record<string, LevelProgress> = {};
  if (typeof value.levels === "object" && value.levels !== null) {
    for (const [id, entry] of Object.entries(value.levels)) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Partial<LevelProgress>;
      levels[id] = {
        bestCheckpoints: Number(record.bestCheckpoints) || 0,
        bestCoins: Number(record.bestCoins) || 0,
        completed: Boolean(record.completed),
      };
    }
  }

  const owned = Array.isArray(value.owned)
    ? value.owned.filter((id): id is string => typeof id === "string")
    : [];
  if (!owned.includes(DEFAULT_CHARACTER_ID)) owned.push(DEFAULT_CHARACTER_ID);

  const rawLoadout =
    typeof value.loadout === "object" && value.loadout !== null
      ? (value.loadout as Partial<Loadout>)
      : {};
  // Only ever equip something the player actually owns — a hand-edited save
  // or a retired item can't leave them wearing something that isn't theirs.
  const equipped = (id: unknown): string | null =>
    typeof id === "string" && owned.includes(id) ? id : null;

  return {
    name: typeof value.name === "string" ? value.name.slice(0, 20) : "",
    totalCoins: Number(value.totalCoins) || 0,
    spentCoins: Number(value.spentCoins) || 0,
    owned,
    loadout: {
      characterId: equipped(rawLoadout.characterId) ?? DEFAULT_CHARACTER_ID,
      auraId: equipped(rawLoadout.auraId),
      boostId: equipped(rawLoadout.boostId),
      hatId: equipped(rawLoadout.hatId),
    },
    levels,
    currentStreak: Number(value.currentStreak) || 0,
    bestStreak: Number(value.bestStreak) || 0,
    lastPlayedDate:
      typeof value.lastPlayedDate === "string" ? value.lastPlayedDate : null,
    micEnabled: value.micEnabled !== false,
    assistMode: value.assistMode === true,
  };
}

function sanitizeHousehold(raw: unknown): Household | null {
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
  return { activeChildId: id, order: [id], children: { [id]: { ...DEFAULT_PROFILE } } };
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
 */
function advanceStreak(
  profile: Pick<PlayerProfile, "currentStreak" | "bestStreak" | "lastPlayedDate">,
  now: Date,
): Pick<PlayerProfile, "currentStreak" | "bestStreak" | "lastPlayedDate"> {
  const today = localDateKey(now);
  if (profile.lastPlayedDate === today) return profile;

  const yesterday = localDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const currentStreak = profile.lastPlayedDate === yesterday ? profile.currentStreak + 1 : 1;

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
        window.localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(household));
      } catch {
        // Private browsing or quota exhausted — the in-memory cache still
        // serves the rest of this session.
      }
    }
    for (const listener of this.listeners) listener();
  };
}

export const householdStore: HouseholdStore = new LocalHouseholdStore();

export function getLevelProgress(
  profile: PlayerProfile,
  levelId: string,
): LevelProgress {
  return profile.levels[levelId] ?? EMPTY_LEVEL_PROGRESS;
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
 * Folds a finished run into a profile, keeping personal bests and advancing
 * the daily streak. `now` is injectable for tests; real callers omit it.
 */
export function mergeRunResult(
  profile: PlayerProfile,
  levelId: string,
  run: { checkpoints: number; coins: number; completed: boolean },
  now: Date = new Date(),
): PlayerProfile {
  const previous = getLevelProgress(profile, levelId);
  return {
    ...profile,
    ...advanceStreak(profile, now),
    totalCoins: profile.totalCoins + run.coins,
    levels: {
      ...profile.levels,
      [levelId]: {
        bestCheckpoints: Math.max(previous.bestCheckpoints, run.checkpoints),
        bestCoins: Math.max(previous.bestCoins, run.coins),
        completed: previous.completed || run.completed,
      },
    },
  };
}

/**
 * Buys a shop item for a profile, if it's affordable and not already owned.
 * Returns the profile unchanged when it isn't — callers show the reason, and
 * nothing here can put a wallet below zero.
 */
export function purchaseItem(
  profile: PlayerProfile,
  item: { id: string; price: number; kind: "character" | "aura" | "boost" | "hat" },
): { profile: PlayerProfile; bought: boolean } {
  if (profile.owned.includes(item.id)) return { profile, bought: false };
  if (spendableCoins(profile) < item.price) return { profile, bought: false };

  const owned = [...profile.owned, item.id];
  // Buying something equips it immediately — a child who just spent their
  // coins should see the thing they bought, not hunt for an Equip button.
  const loadout: Loadout = { ...profile.loadout };
  if (item.kind === "character") loadout.characterId = item.id;
  else if (item.kind === "aura") loadout.auraId = item.id;
  else if (item.kind === "hat") loadout.hatId = item.id;
  else loadout.boostId = item.id;

  return {
    profile: {
      ...profile,
      spentCoins: profile.spentCoins + item.price,
      owned,
      loadout,
    },
    bought: true,
  };
}

/**
 * Equips an owned item. Passing null for an aura or boost takes it off;
 * a character can only ever be swapped, never removed.
 */
export function equipItem(
  profile: PlayerProfile,
  kind: "character" | "aura" | "boost" | "hat",
  id: string | null,
): PlayerProfile {
  if (id !== null && !profile.owned.includes(id)) return profile;

  const loadout: Loadout = { ...profile.loadout };
  if (kind === "character") {
    if (id === null) return profile;
    loadout.characterId = id;
  } else if (kind === "aura") {
    loadout.auraId = id;
  } else if (kind === "hat") {
    loadout.hatId = id;
  } else {
    loadout.boostId = id;
  }
  return { ...profile, loadout };
}

/** Turns the movement/listening assist setting on or off for a profile. */
export function setAssistMode(
  profile: PlayerProfile,
  assistMode: boolean,
): PlayerProfile {
  return { ...profile, assistMode };
}

/** Adds a new child profile to the household and makes it the active one. */
export function addChild(household: Household, name: string): { household: Household; id: string } {
  const id = makeChildId();
  const next: Household = {
    activeChildId: id,
    order: [...household.order, id],
    children: {
      ...household.children,
      [id]: { ...DEFAULT_PROFILE, name: name.slice(0, 20) },
    },
  };
  return { household: next, id };
}

/** Switches the active child. A no-op if the id isn't a known child. */
export function setActiveChild(household: Household, id: string): Household {
  if (!(id in household.children)) return household;
  return { ...household, activeChildId: id };
}
