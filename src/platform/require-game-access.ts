import "server-only";
import { redirect } from "next/navigation";
import { canAccessGame, resolveAccess } from "./access";
import type { GameId } from "./games/registry";

/**
 * Server-side guard for every concrete game route. Academy sessions are
 * scoped to the single permanent GAME-### id named in the launch token;
 * legacy/standalone sessions keep their existing full-library behaviour.
 */
export async function requireGameAccess(gameId: GameId) {
  const access = await resolveAccess();
  if (!canAccessGame(access, gameId)) {
    redirect("/locked?reason=game");
  }
  return access;
}
