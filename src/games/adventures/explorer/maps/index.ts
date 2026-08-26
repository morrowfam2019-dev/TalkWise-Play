import { soundIsland } from "./soundIsland";
import type { ExplorerMap } from "./types";

/**
 * The Beginner map registry.
 *
 * One world, holding every sound. Kept as an array (rather than a single
 * export) so the rest of the app — the map-select screen, the route, the
 * verifier — needs no restructuring if a second world is ever added.
 */
const MAPS: ExplorerMap[] = [soundIsland];

export function listExplorerMaps(): ExplorerMap[] {
  return MAPS;
}

export function getExplorerMap(id: string): ExplorerMap | undefined {
  return MAPS.find((map) => map.id === id);
}

export { toWorldDefinition } from "./types";
export type {
  ExplorerMap,
  RewardProp,
  RewardPropKind,
  SoundStationAnchor,
  ToyBalloon,
} from "./types";
