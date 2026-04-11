import Image from "next/image";
import Link from "next/link";
import { formatCategoryEyebrow } from "@/lib/eventCategories";
import type { MeetEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  cityName,
  hostName,
  className,
  priority,
  inactive,
}: {
  event: MeetEvent;
  cityName: string;
  hostName?: string;
  className?: string;
  /** When true, image loads eagerly (use for first cards in grid for LCP). */
  priority?: boolean;
  /** Ended, cancelled, or otherwise dimmed (grayscale). */
  inactive?: boolean;
}) {
  const price =
    event.priceCents === 0
      ? "Free"
      : `$${(event.priceCents / 100).toFixed(0)}`;

  const subtitle = hostName?.trim() || cityName;
  const coverIsDataUrl = event.image.startsWith("data:");
  const coverIsUnsplash = event.image.includes("images.unsplash.com");

  return (
    <Link
      href={`/event/${event.id}`}
      aria-label={event.title}
      className={cn(
        "event-card-depth group overflow-hidden rounded-(--radius-section) liquid-glass liquid-glass-card",
        inactive && "opacity-90",
        className,
      )}
    >
      <div
        className={cn(
          "relative aspect-4/3 w-full overflow-hidden rounded-t-(--radius-section)",
          inactive && "grayscale",
        )}
      >
        {coverIsDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <Image
            src={event.image}
            alt=""
            fill
            priority={priority}
            unoptimized={!coverIsUnsplash}
            className="object-cover transition duration-500 ease-out motion-safe:group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {formatCategoryEyebrow(event)}
            </span>
            <span className="rounded-full bg-black/35 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {cityName}
            </span>
          </div>
        </div>
      </div>
      <div className="rounded-b-(--radius-section) border-t border-black/[0.08] bg-white/90 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[2px]">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-onest line-clamp-2 text-lg font-bold leading-snug text-foreground">
            {event.title}
          </h3>
          {event.priceCents === 0 ? (
            <span className="shrink-0 rounded-full border border-foreground/15 px-2.5 py-0.5 text-xs font-medium text-foreground">
              Free
            </span>
          ) : null}
        </div>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {event.description}
        </p>
        <p className="mt-2 text-sm font-bold text-foreground">{subtitle}</p>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {new Date(event.startsAt).toLocaleString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="shrink-0 font-semibold text-foreground">{price}</span>
        </div>
        <span
          aria-hidden
          className={cn(
            "mt-4 flex w-full items-center justify-center rounded-full py-3 text-center text-sm font-medium",
            inactive
              ? "border border-neutral-300 bg-neutral-100 text-neutral-700"
              : "bg-foreground text-background",
          )}
        >
          {inactive ? "Ended or unavailable" : "View event"}
        </span>
      </div>
    </Link>
  );
}
