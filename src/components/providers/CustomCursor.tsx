"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const INTERACTIVE =
  'a[href], button:not([disabled]), [role="button"]:not([aria-disabled="true"]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest(INTERACTIVE));
}

export function CustomCursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mqFine = window.matchMedia("(pointer: fine)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const ok = mqFine.matches && !mqMotion.matches;
    if (!ok) return;

    document.documentElement.classList.add("cursor-none");

    const ringEl = ring.current;
    if (!ringEl) return;

    gsap.set(ringEl, { x: 0, y: 0, scale: 1 });

    const xTo = gsap.quickTo(ringEl, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(ringEl, "y", { duration: 0.45, ease: "power3.out" });

    let hovering = false;

    const setHover = (next: boolean) => {
      if (next === hovering) return;
      hovering = next;
      gsap.to(ringEl, {
        scale: next ? 1.55 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const move = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      setHover(isInteractiveTarget(e.target));
    };

    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.classList.remove("cursor-none");
    };
  }, []);

  return (
    <div
      ref={ring}
      className="custom-cursor pointer-events-none fixed left-0 top-0 z-[9997] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        border: "2px solid var(--cursor-ring-border)",
        backgroundColor: "transparent",
        boxShadow: "0 0 0 1px rgba(30, 59, 189, 0.06)",
      }}
      aria-hidden
    />
  );
}
