"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AURAS,
  BOOSTS,
  CHARACTERS,
  type ShopItem,
  type ShopKind,
} from "@/content/shop";
import { usePlayerProfile } from "@/player/usePlayerProfile";
import { spendableCoins } from "@/player/types";

const TABS: { kind: ShopKind; label: string; items: ShopItem[] }[] = [
  { kind: "character", label: "Characters", items: CHARACTERS },
  { kind: "aura", label: "Auras", items: AURAS },
  { kind: "boost", label: "Boosts", items: BOOSTS },
];

/** The little coloured stand-in shown on a shop card. */
function ItemGlyph({ item }: { item: ShopItem }) {
  if (item.kind === "character") {
    const look = CHARACTERS.find((c) => c.id === item.id)!.look;
    return (
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-full"
        style={{ background: look.skin }}
        aria-hidden
      >
        <div className="flex gap-1.5">
          <span className="block h-3.5 w-3.5 rounded-full bg-white" />
          <span className="block h-3.5 w-3.5 rounded-full bg-white" />
        </div>
      </div>
    );
  }
  if (item.kind === "aura") {
    const aura = AURAS.find((a) => a.id === item.id)!;
    return (
      <div
        className="mx-auto grid h-16 w-16 place-items-center rounded-full border-4"
        style={{ borderColor: aura.color, background: `${aura.color}22` }}
        aria-hidden
      >
        <span className="block h-5 w-5 rounded-full" style={{ background: aura.color }} />
      </div>
    );
  }
  const boost = BOOSTS.find((b) => b.id === item.id)!;
  return (
    <div
      className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf4ff] text-3xl"
      aria-hidden
    >
      {boost.jump > 1 && boost.speed > 1 ? "🚀" : boost.jump > 1 ? "🥾" : "👟"}
    </div>
  );
}

/**
 * The store.
 *
 * Everything here is bought with coins earned by finishing speech
 * challenges, and nothing here touches the speech check — boosts change how
 * a player moves through a world, never how their talking is judged.
 */
export default function ShopPage() {
  const { profile, buyItem, equip } = usePlayerProfile();
  const [tab, setTab] = useState<ShopKind>("character");
  const [flash, setFlash] = useState<string | null>(null);

  const balance = spendableCoins(profile);
  const active = TABS.find((t) => t.kind === tab)!;

  const equippedId = (kind: ShopKind) =>
    kind === "character"
      ? profile.loadout.characterId
      : kind === "aura"
        ? profile.loadout.auraId
        : profile.loadout.boostId;

  const handleBuy = (item: ShopItem) => {
    const bought = buyItem({ id: item.id, price: item.price, kind: item.kind });
    setFlash(
      bought
        ? `${item.name} is yours!`
        : `${item.name} costs ${item.price} coins — you have ${balance}.`,
    );
    window.setTimeout(() => setFlash(null), 2600);
  };

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-[#ffe9c2] via-[#fff6e4] to-[#eaf8e6]">
      <header className="bg-[#141420] px-5 py-4 shadow-lg">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-black tracking-[0.28em] text-[#f5c33b] uppercase">
              TalkWise Academy
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              The <span className="text-[#f5c33b]">Store</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-2xl border-2 border-[#f5c33b]/40 bg-white/5 px-3 py-2 text-right">
              <p className="text-[0.6rem] font-bold tracking-widest text-white/60 uppercase">
                Coins
              </p>
              <p className="text-xl font-black text-[#f5c33b] tabular-nums">
                {balance}
              </p>
            </div>
            <Link
              href="/"
              className="rounded-xl border-2 border-white/30 px-4 py-2 text-sm font-black text-white"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 pt-6 pb-16">
        <div className="flex gap-2" role="tablist" aria-label="Store sections">
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

        {tab === "boost" ? (
          <p className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-semibold text-[#4a4a60]">
            Boosts change how you <strong>move</strong> — how fast you run, how
            high you jump. They never change your speech challenges: you still
            say every word out loud to earn your coins.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {active.items.map((item) => {
            const owned = profile.owned.includes(item.id);
            const isEquipped = equippedId(item.kind) === item.id;
            const affordable = balance >= item.price;

            return (
              <article
                key={item.id}
                className={`rounded-[1.5rem] border-4 bg-white p-5 text-center shadow-lg ${
                  isEquipped ? "border-[#2ecc71]" : "border-white"
                }`}
              >
                <ItemGlyph item={item} />
                <h2 className="mt-3 text-xl font-black tracking-tight text-[#141420]">
                  {item.name}
                </h2>
                <p className="mt-1 min-h-[2.5rem] text-sm font-semibold text-[#6b6b80]">
                  {item.blurb}
                </p>

                {isEquipped ? (
                  <p className="mt-3 w-full rounded-2xl bg-[#e6f9ee] px-4 py-3 text-base font-black text-[#2ecc71]">
                    ★ Wearing it
                  </p>
                ) : owned ? (
                  <button
                    type="button"
                    onClick={() => equip(item.kind, item.id)}
                    className="mt-3 w-full rounded-2xl border-b-8 border-[#25a25a] bg-[#2ecc71] px-4 py-3 text-base font-black text-white transition-transform active:translate-y-1 active:border-b-4"
                  >
                    Wear it
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
                    🪙 {item.price}
                    {affordable ? "" : " — keep playing!"}
                  </button>
                )}

                {/* Auras and boosts can be taken back off; a character can't. */}
                {isEquipped && item.kind !== "character" ? (
                  <button
                    type="button"
                    onClick={() => equip(item.kind, null)}
                    className="mt-2 w-full rounded-xl px-4 py-2 text-sm font-bold text-[#8a8aa0] hover:text-[#141420]"
                  >
                    Take it off
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
