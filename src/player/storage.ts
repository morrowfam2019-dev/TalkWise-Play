import {
  DEFAULT_PROFILE,
  EMPTY_LEVEL_PROGRESS,
  type LevelProgress,
  type PlayerProfile,
} from "./types";

/**
 * Storage abstraction for player progress.
 *
 * Modelled as an observable external store so React can read it with
 * `useSyncExternalStore` — no load-on-mount effect, and no hydration mismatch.
 * A future server-backed store only has to satisfy this interface; no gameplay
 * code touches persistence directly.
 */
export interface ProgressStore {
  subscribe(listener: () => void): () => void;
  /** Current profile. Stable by reference until `save` is called. */
  getSnapshot(): PlayerProfile;
  /** Value used during SSR and hydration. */
  getServerSnapshot(): PlayerProfile;
  save(profile: PlayerProfile): void;
}

const STORAGE_KEY = "talkwise-play/profile/v1";

function sanitize(raw: unknown): PlayerProfile {
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

  return {
    name: typeof value.name === "string" ? value.name.slice(0, 20) : "",
    totalCoins: Number(value.totalCoins) || 0,
    levels,
  };
}

class LocalProgressStore implements ProgressStore {
  private cache: PlayerProfile | null = null;
  private listeners = new Set<() => void>();

  private read(): PlayerProfile {
    if (typeof window === "undefined") return DEFAULT_PROFILE;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_PROFILE };
      return sanitize(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_PROFILE };
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): PlayerProfile => {
    this.cache ??= this.read();
    return this.cache;
  };

  getServerSnapshot = (): PlayerProfile => DEFAULT_PROFILE;

  save = (profile: PlayerProfile): void => {
    this.cache = profile;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      } catch {
        // Private browsing or quota exhausted — the in-memory cache still
        // serves the rest of this session.
      }
    }
    for (const listener of this.listeners) listener();
  };
}

export const progressStore: ProgressStore = new LocalProgressStore();

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

/** Folds a finished run into a profile, keeping personal bests. */
export function mergeRunResult(
  profile: PlayerProfile,
  levelId: string,
  run: { checkpoints: number; coins: number; completed: boolean },
): PlayerProfile {
  const previous = getLevelProgress(profile, levelId);
  return {
    ...profile,
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
