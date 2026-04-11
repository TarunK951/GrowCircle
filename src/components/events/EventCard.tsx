import Image from "next/image";
import Link from "next/link";
import type { MeetEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EventCard({
  event,
  cityName,
  className,
}: {
  event: MeetEvent;
  cityName: string;
  className?: string;
}) {
  const price =
    event.priceCents === 0
      ? "Free"
      : `$${(event.priceCents / 100).toFixed(0)}`;

  return (
    <Link
      href={`/events/${event.id}`}
      className={cn(
        "group overflow-hidden rounded-2xl border border-primary/10 bg-white/50 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image
          src={event.image}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width:768px) 100vw, 33vw"
        />
      </div>
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-primary/80">
          {event.category} · {cityName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-semibold text-foreground">
          {event.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-muted">{event.description}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted">
            {new Date(event.startsAt).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          <span className="font-semibold text-primary">{price}</span>
        </div>
      </div>
    </Link>
  );
}
