"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ok = mqFine.matches && !mqMotion.matches;
    if (!ok) return;

    document.documentElement.classList.add("cursor-none");

    const ringEl = ring.current;
    const dotEl = dot.current;
    if (!ringEl || !dotEl) return;

    gsap.set([ringEl, dotEl], { x: 0, y: 0 });

    const xTo = gsap.quickTo(ringEl, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(ringEl, "y", { duration: 0.45, ease: "power3.out" });
    const xd = gsap.quickTo(dotEl, "x", { duration: 0.15, ease: "power3.out" });
    const yd = gsap.quickTo(dotEl, "y", { duration: 0.15, ease: "power3.out" });

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      xd(e.clientX);
      yd(e.clientY);
    };

    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.classList.remove("cursor-none");
    };
  }, []);

  return (
    <>
      <div
        ref={dot}
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[9998] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary mix-blend-difference"
        aria-hidden
      />
      <div
        ref={ring}
        className="custom-cursor pointer-events-none fixed left-0 top-0 z-[9997] h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 bg-white/5 backdrop-blur-[2px]"
        aria-hidden
      />
    </>
  );
}
