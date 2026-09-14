import { GAME_BASKETBALL } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function BasketballLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_BASKETBALL);
  return children;
}
