import { GAME_SOUND_MATCH } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_SOUND_MATCH);
  return children;
}
