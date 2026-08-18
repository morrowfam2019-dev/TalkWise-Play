import { GAME_ADVENTURES } from "@/platform/games/registry";
import type { PlayerProfile } from "./types";

/** Everything an achievement's check needs, supplied by the caller so this
 * module never imports the speech-content layer (same reasoning as
 * `isLevelUnlocked`'s structural typing in storage.ts).
 *
 * These are **platform** achievements: the coin and streak ones are earned
 * by playing any TalkWise Play game, since both the wallet and the streak
 * are platform-wide. The adventure-completion ones read GAME-001's namespace
 * explicitly. A future game wanting its own badges should define them in its
 * own module rather than extending this list. */
export interface AchievementContext {
  profile: PlayerProfile;
  /** Total number of levels currently registered. */
  totalLevels: number;
  /** Challenge count per level id, for "finished every checkpoint" checks. */
  levelChallengeCounts: Record<string, number>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  glyph: string;
  check: (ctx: AchievementContext) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-steps",
    title: "First Steps",
    description: "Finish your first adventure.",
    glyph: "🎉",
    check: ({ profile }) => Object.values(profile.games[GAME_ADVENTURES].levels).some((level) => level.completed),
  },
  {
    id: "world-tour",
    title: "World Tour",
    description: "Finish every adventure.",
    glyph: "🌍",
    check: ({ profile, totalLevels }) =>
      totalLevels > 0 &&
      Object.values(profile.games[GAME_ADVENTURES].levels).filter((level) => level.completed).length >= totalLevels,
  },
  {
    id: "word-wizard",
    title: "Word Wizard",
    description: "Find every checkpoint in one run.",
    glyph: "⭐",
    check: ({ profile, levelChallengeCounts }) =>
      Object.entries(profile.games[GAME_ADVENTURES].levels).some(([levelId, progress]) => {
        const total = levelChallengeCounts[levelId];
        return total !== undefined && total > 0 && progress.bestCheckpoints >= total;
      }),
  },
  {
    id: "coin-collector",
    title: "Coin Collector",
    description: "Earn 50 coins.",
    glyph: "🪙",
    check: ({ profile }) => profile.totalCoins >= 50,
  },
  {
    id: "coin-champion",
    title: "Coin Champion",
    description: "Earn 200 coins.",
    glyph: "💰",
    check: ({ profile }) => profile.totalCoins >= 200,
  },
  {
    id: "on-a-roll",
    title: "On a Roll",
    description: "Play 3 days in a row.",
    glyph: "🔥",
    check: ({ profile }) => profile.bestStreak >= 3,
  },
  {
    id: "super-streak",
    title: "Super Streak",
    description: "Play 7 days in a row.",
    glyph: "🏆",
    check: ({ profile }) => profile.bestStreak >= 7,
  },
];

export function getUnlockedAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.filter((achievement) => achievement.check(ctx));
}
