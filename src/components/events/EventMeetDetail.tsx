import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { MeetEvent } from "@/lib/types";
import type { ResolvedEventDetail } from "@/lib/eventDetail";
import { cn } from "@/lib/utils";
import { JoinMeetButton, SaveEventButton } from "@/components/events/EventMeetActions";

function SectionTitle({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      id={id}
      className={cn(
        "font-onest text-lg font-semibold tracking-tight text-foreground sm:text-xl",
        className,
      )}
    >
      {children}
    </h2>
  );
}

export function EventMeetDetail({
  event,
  detail,
  cityName,
  hostName,
  priceLabel,
  whenLabel,
}: {
  event: MeetEvent;
  detail: ResolvedEventDetail;
  cityName: string;
  hostName: string;
  priceLabel: string;
  whenLabel: string;
}) {
  const left = Math.max(0, event.capacity - detail.spotsTaken);
  const pct =
    event.capacity > 0
      ? Math.min(100, Math.round((detail.spotsTaken / event.capacity) * 100))
      : 0;

  return (
    <>
      <Link
        href="/explore"
        className="text-sm font-medium text-primary hover:underline"
      >
        ← Back to explore
      </Link>

      {/* Hero — title + actions first */}
      <header className="mt-6 border-b border-primary/10 pb-8">
        <p className="text-sm font-semibold text-primary">
          {event.category} · {cityName}
        </p>
        <div className="mt-3 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="font-onest max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>
          <div className="flex shrink-0 flex-wrap gap-3 sm:pt-1">
            <JoinMeetButton eventId={event.id} />
            <SaveEventButton eventId={event.id} />
          </div>
        </div>
      </header>

      {/* Availability */}
      <section className="mt-10" aria-labelledby="event-availability-heading">
        <SectionTitle id="event-availability-heading">
          Available slots
        </SectionTitle>
        <div className="liquid-glass-surface mt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-2xl font-semibold tabular-nums text-foreground">
              {left}{" "}
              <span className="text-base font-normal text-muted-foreground">
                spot{left === 1 ? "" : "s"} left
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {detail.spotsTaken} of {event.capacity} filled
            </p>
          </div>
          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-primary/10"
            role="progressbar"
            aria-valuenow={detail.spotsTaken}
            aria-valuemin={0}
            aria-valuemax={event.capacity}
            aria-label="Registration progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </section>

      {/* Long-form copy */}
      <section className="mt-12" aria-labelledby="event-about-heading">
        <SectionTitle id="event-about-heading">About this meet</SectionTitle>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {detail.moreAbout}
        </p>
      </section>

      <section className="mt-12" aria-labelledby="event-included-heading">
        <SectionTitle id="event-included-heading">What&apos;s included</SectionTitle>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {detail.whatsIncluded.map((line) => (
            <li
              key={line}
              className="flex gap-3 rounded-xl border border-primary/10 bg-white/50 px-4 py-3 text-sm text-foreground"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="event-allowed-heading">
        <SectionTitle id="event-allowed-heading">
          What&apos;s allowed & good to know
        </SectionTitle>
        <div className="liquid-glass-surface mt-4 max-w-3xl">
          <p className="text-base leading-relaxed text-muted-foreground">
            {detail.allowedAndNotes}
          </p>
        </div>
      </section>

      {/* House rules — party dos / don’ts */}
      <section className="mt-12" aria-labelledby="event-rules-heading">
        <SectionTitle id="event-rules-heading">House rules</SectionTitle>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Quick dos and don&apos;ts so everyone enjoys the night — same energy as
          party rules, minus the fuzzy memories.
        </p>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-onest text-sm font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800">
                <Check className="h-4 w-4" aria-hidden />
              </span>
              Do
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              {detail.houseRules.dos.map((line) => (
                <li key={line} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/6 p-5 sm:p-6">
            <h3 className="flex items-center gap-2 font-onest text-sm font-semibold uppercase tracking-wide text-rose-900 dark:text-rose-100">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-800">
                <X className="h-4 w-4" aria-hidden />
              </span>
              Don&apos;t
            </h3>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
              {detail.houseRules.donts.map((line) => (
                <li key={line} className="flex gap-2">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12" aria-labelledby="event-faq-heading">
        <SectionTitle id="event-faq-heading">FAQ</SectionTitle>
        <div className="mt-4 max-w-3xl divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-white/40 px-1">
          {detail.faqs.map((item, i) => (
            <details
              key={`${item.q}-${i}`}
              className="group px-4 py-1 open:bg-white/60"
            >
              <summary className="cursor-pointer list-none py-4 font-medium text-foreground transition hover:text-primary [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-3">
                  <span>{item.q}</span>
                  <span className="mt-1 shrink-0 text-muted-foreground transition group-open:rotate-180">
                    ▾
                  </span>
                </span>
              </summary>
              <p className="pb-4 pl-0 text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Image + recap — moved below */}
      <section
        className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-12"
        aria-labelledby="event-visual-heading"
      >
        <h2 id="event-visual-heading" className="sr-only">
          Photo and meet summary
        </h2>
        <div className="liquid-glass-surface relative aspect-4/3 overflow-hidden p-0! lg:aspect-auto lg:min-h-[320px]">
          <Image
            src={event.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="liquid-glass-surface flex flex-col">
          <p className="text-sm font-semibold text-primary">
            {event.category} · {cityName}
          </p>
          <p className="font-onest mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {event.title}
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            {event.description}
          </p>
          <ul className="mt-6 space-y-2.5 text-sm">
            <li>
              <span className="font-medium text-foreground">When:</span>{" "}
              {whenLabel}
            </li>
            <li>
              <span className="font-medium text-foreground">Where:</span>{" "}
              {event.venueName ?? "Details shared after booking"}
            </li>
            <li>
              <span className="font-medium text-foreground">Host:</span>{" "}
              {hostName}
            </li>
            <li>
              <span className="font-medium text-foreground">Spots:</span>{" "}
              {left} left of {event.capacity}
            </li>
            <li>
              <span className="font-medium text-foreground">Price:</span>{" "}
              {priceLabel}
            </li>
          </ul>
          <div className="mt-8 flex flex-wrap gap-4 border-t border-primary/10 pt-8">
            <JoinMeetButton eventId={event.id} />
            <SaveEventButton eventId={event.id} />
          </div>
        </div>
      </section>
    </>
  );
}
