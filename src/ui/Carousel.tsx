"use client";

import { useRef, useState } from "react";

export type CarouselSlide = {
  key: string;
  src: string;
  alt: string;
};

/** Snap-scrolling image carousel with dot pagination and prev/next arrows.
 * Scroll position drives the active dot via `scroll` + IntersectionObserver-free
 * math (slide width * index), so it stays in sync with touch swipes too. */
export function Carousel({ slides, className = "" }: { slides: CarouselSlide[]; className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  function scrollToIndex(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(index, slides.length - 1));
    const slideWidth = track.clientWidth;
    track.scrollTo({ left: slideWidth * clamped, behavior: "smooth" });
    setActive(clamped);
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const slideWidth = track.clientWidth;
    if (slideWidth === 0) return;
    setActive(Math.round(track.scrollLeft / slideWidth));
  }

  if (slides.length === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex w-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide) => (
          <div key={slide.key} className="w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary runtime slide sources */}
            <img src={slide.src} alt={slide.alt} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => scrollToIndex(active - 1)}
            disabled={active === 0}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => scrollToIndex(active + 1)}
            disabled={active === slides.length - 1}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white disabled:opacity-30"
          >
            ›
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={`h-2 w-2 rounded-full transition-opacity ${
                  i === active ? "bg-white opacity-100" : "bg-white opacity-40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
