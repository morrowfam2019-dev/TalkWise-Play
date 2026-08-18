"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BALLERS,
  JERSEYS,
  type BallerItem,
  type JerseyItem,
} from "@/content/basketball/roster";
import { GAME_BASKETBALL } from "@/platform/games/registry";
import { spendableCoins } from "@/player/types";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { CoinIcon } from "@/ui/CoinIcon";
import { PlatformHeader } from "@/ui/PlatformHeader";

/**
 * GAME-002's own store — completely separate from the Adventure store.
 *
 * Ballers and jerseys are bought into the **Basketball** inventory
 * namespace. An Adventure character, hat, aura or boost is not purchasable
 * here and never appears on this screen; likewise nothing bought here shows
 * up in an adventure. The only thing the two stores share is the platform
 * coin wallet, which is deliberate and documented in `player/types.ts`.
 */

type BasketballTab = "baller" | "jersey";

const TABS: { kind: BasketballTab; label: string }[] = [
  { kind: "baller", label: "Ballers" },
  { kind: "jersey", label: "Jerseys" },
];

function BallerPreview({ baller }: { baller: BallerItem }) {
  const { look } = baller;
  return (
    <div className="relative mx-auto h-16 w-16" aria-hidden>
      {/* Hair silhouette, matching what the 3D baller actually wears. */}
      <span
        className={`absolute left-1/2 -translate-x-1/2 ${
          look.hairStyle === "puff"
            ? "-top-2 h-5 w-14 rounded-full"
            : look.hairStyle === "braids"
              ? "-top-1 h-4 w-12 rounded-t-full"
              : look.hairStyle === "bun"
                ? "-top-3 h-4 w-4 rounded-full"
                : look.hairStyle === "curly"
                  ? "-top-2 h-5 w-13 rounded-full"
                  : "-top-1 h-3 w-12 rounded-t-full"
        }`}
        style={{ background: look.hair }}
      />
      <div
        className="relative grid h-16 w-16 place-items-center rounded-full"
        style={{ background: look.skin }}
      >
        <div className="flex gap-1.5">
          <span className="block h-3 w-3 rounded-full bg-white">
            <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-[#1b2233]" />
          </span>
          <span className="block h-3 w-3 rounded-full bg-white">
            <span className="mx-auto mt-1 block h-1.5 w-1.5 rounded-full bg-[#1b2233]" />
          </span>
        </div>
      </div>
    </div>
  );
}

function JerseyPreview({ jersey }: { jersey: JerseyItem }) {
  return (
    <div
      className="mx-auto grid h-16 w-16 place-items-center rounded-full"
      style={{ background: `${jersey.primary}22` }}
      aria-hidden
    >
      <div
        className="relative h-11 w-10 rounded-md"
        style={{ background: jersey.primary }}
      >
        <span
          className="absolute inset-x-2 top-0 h-2.5 rounded-b-full"
          style={{ background: jersey.secondary }}
        />
        <span
          className="absolute bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-sm"
          style={{ background: jersey.secondary }}
        />
      </div>
    </div>
  );
}

export default function BasketballShopPage() {
  const { profile, basketball, buyItem, equip } = usePlayerProfile();
  const [tab, setTab] = useState<BasketballTab>("baller");
  const [flash, setFlash] = useState<string | null>(null);

  const balance = spendableCoins(profile);
  const items: (BallerItem | JerseyItem)[] = tab === "baller" ? BALLERS : JERSEYS;

  const equippedId =
    tab === "baller" ? basketball.loadout.ballerId : basketball.loadout.jerseyId;

  const handleBuy = (item: BallerItem | JerseyItem) => {
    const bought = buyItem(GAME_BASKETBALL, {
      id: item.id,
      price: item.price,
      kind: item.kind,
    });
    setFlash(
      bought
        ? `${item.name} is yours!`
        : `${item.name} costs ${item.price} coins — you have ${balance}.`,
    );
    window.setTimeout(() => setFlash(null), 2600);
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffe9c2] via-[#ffd9a8] to-[#f0c088]">
      <PlatformHeader
        eyebrow="Speech Basketball"
        title={
          <>
            Basketball <span className="text-[#f5c33b]">Store</span>
          </>
        }
        coins={balance}
        backHref="/games/basketball"
      />

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <p className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-[#4a4a60]">
          These are <strong>basketball</strong> items — they suit up your
          baller on the court. Your adventure characters, hats and boosts live
          in the Adventure Store and stay there.
        </p>

        <div
          className="mt-4 flex gap-2"
          role="tablist"
          aria-label="Basketball store sections"
        >
          {TABS.map((entry) => (
            <button
              key={entry.kind}
              type="button"
              role="tab"
              aria-selected={tab === entry.kind}
              onClick={() => setTab(entry.kind)}
              className={`flex-1 rounded-2xl px-4 py-3 text-base font-black transition ${
                tab === entry.kind
                  ? "bg-[#141420] text-white"
                  : "border-4 border-white bg-white/70 text-[#4a4a60]"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {flash ? (
          <p
            role="status"
            className="mt-4 rounded-2xl border-4 border-[#f5c33b] bg-white px-4 py-3 text-center text-base font-black text-[#141420]"
          >
            {flash}
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const owned = basketball.owned.includes(item.id);
            const isEquipped = equippedId === item.id;
            const affordable = balance >= item.price;

            return (
              <article
                key={item.id}
                className={`rounded-[1.5rem] border-4 bg-white p-5 text-center shadow-lg ${
                  isEquipped ? "border-[#2ecc71]" : "border-white"
                }`}
              >
                {item.kind === "baller" ? (
                  <BallerPreview baller={item as BallerItem} />
                ) : (
                  <JerseyPreview jersey={item as JerseyItem} />
                )}

                <h2 className="mt-3 text-xl font-black tracking-tight text-[#141420]">
                  {item.name}
                </h2>
                <p className="mt-1 min-h-[2.5rem] text-sm font-semibold text-[#6b6b80]">
                  {item.blurb}
                </p>

                {isEquipped ? (
                  <p className="mt-3 w-full rounded-2xl bg-[#e6f9ee] px-4 py-3 text-base font-black text-[#2ecc71]">
                    ★ Suited up
                  </p>
                ) : owned ? (
                  <button
                    type="button"
                    onClick={() => equip(GAME_BASKETBALL, item.kind, item.id)}
                    className="mt-3 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-4 py-3 text-base font-black text-white transition-transform active:translate-y-1 active:border-b-4"
                  >
                    Suit up
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleBuy(item)}
                    disabled={!affordable}
                    className={`mt-3 w-full rounded-2xl px-4 py-3 text-base font-black transition-transform ${
                      affordable
                        ? "border-b-8 border-[#b8860b] bg-[#f5c33b] text-[#141420] active:translate-y-1 active:border-b-4"
                        : "cursor-not-allowed bg-[#eef0f5] text-[#8a8aa0]"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5 align-middle">
                      <CoinIcon className="h-4 w-4" />
                      {item.price}
                    </span>
                    {affordable ? "" : " — keep playing!"}
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/games/basketball"
            className="text-xs font-bold text-[#3c2a12] underline"
          >
            ← Back to Speech Basketball
          </Link>
        </div>
      </div>
    </main>
  );
}
