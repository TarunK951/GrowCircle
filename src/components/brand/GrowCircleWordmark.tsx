import { cn } from "@/lib/utils";

/**
 * Vector Grow Circle logo — ring + wordmark. No PNG matte or baked background.
 */
export function GrowCircleWordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 240 68"
      className={cn("text-brand", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="38"
        cy="34"
        r="18"
        stroke="currentColor"
        strokeWidth="11"
      />
      <text
        x="82"
        y="32"
        fill="currentColor"
        fontSize="18"
        fontWeight="600"
        fontFamily="var(--font-sui), system-ui, sans-serif"
        letterSpacing="-0.02em"
      >
        GROW
      </text>
      <text
        x="82"
        y="56"
        fill="currentColor"
        fontSize="18"
        fontWeight="600"
        fontFamily="var(--font-sui), system-ui, sans-serif"
        letterSpacing="-0.02em"
      >
        CIRCLE
      </text>
    </svg>
  );
}
