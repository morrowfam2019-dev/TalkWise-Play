import { GAME_BUBBLE_BLAST } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_BUBBLE_BLAST);
  return children;
}
