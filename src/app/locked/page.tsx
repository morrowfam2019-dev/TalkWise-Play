import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TalkWise Play",
  description: "An active TalkWise Academy membership is required.",
};

/**
 * What someone sees when they reach TalkWise Play without a way in —
 * a shared link, a stale bookmark, an expired launch credential, or a
 * membership that has ended.
 *
 * Deliberately shows nothing of the game: no level list, no child profiles,
 * no artwork from inside the product. Knowing the URL is not access.
 */
export default async function LockedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  const headline =
    reason === "membership"
      ? "Your TalkWise Academy membership isn't active"
      : reason === "expired"
        ? "That link has expired"
        : "TalkWise Play";

  const body =
    reason === "membership"
      ? "TalkWise Play is included with an active TalkWise Academy membership. Renew or upgrade in your TalkWise Academy account to keep playing."
      : reason === "expired"
        ? "Launch links are single-use and only last a couple of minutes. Open TalkWise Play again from your TalkWise Academy account to get a fresh one."
        : "An active TalkWise Academy membership is required. Open TalkWise Play from your TalkWise Academy account to start playing.";

  return (
    <main className="grid min-h-[100dvh] place-items-center bg-gradient-to-b from-[#141420] via-[#1b1b34] to-[#141420] p-6">
      <div className="w-full max-w-sm rounded-[2rem] border-8 border-[#f5c33b] bg-white p-7 text-center shadow-2xl">
        <p className="text-[0.65rem] font-black tracking-[0.28em] text-[#8a8aa0] uppercase">
          TalkWise Academy
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-[#141420]">
          TalkWise <span className="text-[#f5c33b]">Play</span>
        </h1>

        <div className="mt-5 text-6xl" aria-hidden>
          🔒
        </div>

        <h2 className="mt-4 text-xl font-black text-[#141420]">{headline}</h2>
        <p className="mt-2 text-base font-semibold text-[#4a4a60]">{body}</p>

        <p className="mt-6 text-xs font-semibold text-[#8a8aa0]">
          Already a member? Open TalkWise Play from inside your TalkWise Academy
          account and it will launch here automatically.
        </p>
      </div>
    </main>
  );
}
