import { GAME_ADVENTURES } from "@/platform/games/registry";
import { requireGameAccess } from "@/platform/require-game-access";

export default async function AdventuresLayout({ children }: { children: React.ReactNode }) {
  await requireGameAccess(GAME_ADVENTURES);
  return children;
}
