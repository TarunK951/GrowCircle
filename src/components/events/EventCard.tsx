import Image from "next/image";
import Link from "next/link";
import { ImageOff } from "lucide-react";
import { formatCategoryEyebrow } from "@/lib/eventCategories";
import type { MeetEvent } from "@/lib/types";
import { formatInrFromCents } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";
import { primaryMeetImage } from "@/lib/events/coverDisplay";

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
  const price = formatInrFromCents(event.priceCents);

  const subtitle = hostName?.trim() || cityName;
  const cover = primaryMeetImage(event);
  const coverIsDataUrl = cover?.startsWith("data:") ?? false;
  const coverIsUnsplash = cover?.includes("images.unsplash.com") ?? false;

  return (
    <Link
      href={`/event/${event.id}`}
      aria-label={event.title}
      className={cn(
        "event-card-depth group flex h-full flex-col overflow-hidden rounded-(--radius-section) liquid-glass liquid-glass-card",
        /* Full card black & white when ended / cancelled */
        inactive && "grayscale opacity-95",
        className,
      )}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-t-(--radius-section)">
        {!cover ? (
          <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
            <ImageOff className="h-7 w-7" aria-hidden />
          </div>
        ) : coverIsDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out motion-safe:group-hover:scale-[1.02]"
          />
        ) : (
          <Image
            src={cover}
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
      <div className="flex flex-1 flex-col rounded-b-(--radius-section) bg-white/90 p-5 backdrop-blur-[2px]">
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
        {event.description.trim().length > 0 ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        ) : null}
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
