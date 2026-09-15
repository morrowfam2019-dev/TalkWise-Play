import { GAME_COLOR_SHAPE_HUNT } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_COLOR_SHAPE_HUNT);
  return children;
}
