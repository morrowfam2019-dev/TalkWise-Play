import { GAME_GUESS_THE_SOUND } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_GUESS_THE_SOUND);
  return children;
}
