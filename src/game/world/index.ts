import type { WorldDefinition } from "./types";
import { mountainOfM } from "./mountainOfM";

const WORLDS: WorldDefinition[] = [mountainOfM];

export function getWorld(id: string): WorldDefinition | undefined {
  return WORLDS.find((world) => world.id === id);
}

export type * from "./types";
