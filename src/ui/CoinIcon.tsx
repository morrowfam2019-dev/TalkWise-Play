/**
 * The TalkWise speech-bubble mark, as a flat icon for 2D UI — the HUD coin
 * counter, the store's prices, the parent view. Matches the 3D pickup in
 * `src/game/scene/Coins.tsx` (same gold body, same tail, same three dots)
 * so a coin reads as the same brand mark everywhere it shows up, instead of
 * the generic grey 🪙 emoji standing in for it.
 */
export function CoinIcon({
  className = "h-[1em] w-[1em]",
}: {
  className?: string;
}) {
  return (
    <svg viewBox="0 0 48 40" className={className} aria-hidden="true">
      <path
        d="M12 2H36C39.3137 2 42 4.68629 42 8V22C42 25.3137 39.3137 28 36 28H21L14 36V28H12C8.68629 28 6 25.3137 6 22V8C6 4.68629 8.68629 2 12 2Z"
        fill="#f5c33b"
      />
      <circle cx="16" cy="15" r="2.6" fill="#ffe08a" />
      <circle cx="24" cy="15" r="2.6" fill="#ffe08a" />
      <circle cx="32" cy="15" r="2.6" fill="#ffe08a" />
    </svg>
  );
}
