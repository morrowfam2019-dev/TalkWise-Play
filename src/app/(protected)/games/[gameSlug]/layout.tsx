import { redirect } from "next/navigation";
import { canAccessGame, resolveAccess } from "@/platform/access";
import { listGames } from "@/platform/games/registry";

/**
 * Defense-in-depth route gate for Academy sessions. The Academy launch
 * credential names exactly one permanent GAME-### id. Navigating directly to
 * another game's URL cannot widen that scope.
 *
 * Existing concrete game routes remain unchanged; this layout is retained as
 * the reusable guard for future dynamic game routing work.
 */
export default async function ScopedGameLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ gameSlug: string }>;
}) {
  const { gameSlug } = await params;
  const game = listGames().find((entry) => entry.route === `/games/${gameSlug}`);
  if (!game) redirect("/locked?reason=game");

  const access = await resolveAccess();
  if (!canAccessGame(access, game.id)) redirect("/locked?reason=game");
  return children;
}
