import { rainbowRidge } from "./rainbowRidge";
import { sunnyPark } from "./sunnyPark";
import { whisperWoods } from "./whisperWoods";
import type { ExplorerMap } from "./types";

/**
 * The Beginner map registry, in progression order.
 *
 * Maps are **not** locked behind one another. The order is the order the
 * sound groups are usually acquired, so a family with no idea where to start
 * has an obvious first door — but a child who is ready for Rainbow Ridge on
 * day one can walk straight into it.
 */
const MAPS: ExplorerMap[] = [sunnyPark, whisperWoods, rainbowRidge];

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
} from "./types";
