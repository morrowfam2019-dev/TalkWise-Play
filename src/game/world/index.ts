import type { WorldDefinition } from "./types";
import { bubbleBayOfB } from "./bubbleBayOfB";
import { fallsOfF } from "./fallsOfF";
import { lagoonOfL } from "./lagoonOfL";
import { mountainOfM } from "./mountainOfM";
import { partyPlazaOfP } from "./partyPlazaOfP";
import { summitOfS } from "./summitOfS";
import { woodsOfW } from "./woodsOfW";

const WORLDS: WorldDefinition[] = [
  mountainOfM,
  partyPlazaOfP,
  bubbleBayOfB,
  woodsOfW,
  summitOfS,
  lagoonOfL,
  fallsOfF,
];

export function getWorld(id: string): WorldDefinition | undefined {
  return WORLDS.find((world) => world.id === id);
}

export function listWorlds(): WorldDefinition[] {
  return WORLDS;
}

export type * from "./types";
