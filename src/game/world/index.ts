import type { WorldDefinition } from "./types";
import { bubbleBayOfB } from "./bubbleBayOfB";
import { mountainOfM } from "./mountainOfM";
import { partyPlazaOfP } from "./partyPlazaOfP";

const WORLDS: WorldDefinition[] = [mountainOfM, partyPlazaOfP, bubbleBayOfB];

export function getWorld(id: string): WorldDefinition | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function listWorlds(): WorldDefinition[] {
  return WORLDS;
}

export type * from "./types";
