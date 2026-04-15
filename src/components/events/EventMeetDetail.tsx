import Image from "next/image";
import Link from "next/link";
import { EventDetailCloseButton } from "@/components/events/EventDetailCloseButton";
import {
  Banknote,
  Building2,
  Check,
  Clock,
  Lightbulb,
  Mail,
  MapPin,
  ExternalLink,
  Percent,
  Phone,
  User,
  UserCheck,
  Users,
  X,
  ImageOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MeetEvent } from "@/lib/types";
import type { ResolvedEventDetail } from "@/lib/eventDetail";
import { formatCategoryEyebrow } from "@/lib/eventCategories";
import { cn } from "@/lib/utils";
import { JoinMeetButton, SaveEventButton } from "@/components/events/EventMeetActions";
import { meetEventGalleryUrls } from "@/lib/events/coverDisplay";
import { shouldRenderNativeImg } from "@/lib/events/remoteImageUrl";
import { labelForLocationType } from "@/lib/hostLocationTypes";

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

function MetaRow({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:grid sm:grid-cols-[5.5rem_1fr] sm:items-start sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="flex gap-2 text-sm text-foreground">
        {Icon ? (
          <Icon
            className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
            aria-hidden
          />
        ) : null}
        <span className="min-w-0">{children}</span>
      </dd>
    </div>
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

  const ctaGroup = (
    <div className="flex flex-wrap gap-3">
      <JoinMeetButton event={event} />
      <SaveEventButton eventId={event.id} />
    </div>
  );

  const whereContent =
    event.venueName || event.addressLine ? (
      <>
        {event.venueName ? (
          <span className="block">{event.venueName}</span>
        ) : null}
        {event.addressLine ? (
          <span className="mt-1 block text-muted-foreground">
            {event.addressLine}
          </span>
        ) : null}
      </>
    ) : (
      "Details shared after booking"
    );

  const eligibilityParts: string[] = [];
  if (event.minAge != null && event.minAge > 0) {
    eligibilityParts.push(`Ages ${event.minAge}+`);
  }
  const mvt = event.minVerificationTier ?? 0;
  if (mvt >= 2) {
    eligibilityParts.push("Strong verification (tier 2)");
  } else if (mvt >= 1) {
    eligibilityParts.push("Verified guests only");
  }
  if (event.termsRequired) {
    eligibilityParts.push("Terms acceptance required");
  }

  const registrationParts: string[] = [];
  if (event.registrationOpensAt) {
    try {
      registrationParts.push(
        `Opens ${new Date(event.registrationOpensAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
      );
    } catch {
      registrationParts.push(`Opens ${event.registrationOpensAt}`);
    }
  }
  if (event.registrationClosesAt) {
    try {
      registrationParts.push(
        `Closes ${new Date(event.registrationClosesAt).toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        })}`,
      );
    } catch {
      registrationParts.push(`Closes ${event.registrationClosesAt}`);
    }
  }

  const galleryUrls = meetEventGalleryUrls(event);
  const cover = galleryUrls[0] ?? null;
  const coverUseNative = Boolean(cover && shouldRenderNativeImg(cover));
  /** Next/Image: Unsplash can use default optimizer; other known CDNs use unoptimized. */
  const coverIsUnsplash = cover?.includes("images.unsplash.com") ?? false;

  return (
    <>
      <div className="flex items-center justify-end">
        <EventDetailCloseButton />
      </div>

      {/* 1 — Photo + summary first */}
      <section
        className="mt-4"
        aria-labelledby="event-visual-heading"
      >
        <h2 id="event-visual-heading" className="sr-only">
          Photo and meet summary
        </h2>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="flex min-h-0 flex-col gap-3 lg:h-full">
            <figure className="relative min-h-[min(72vw,22rem)] w-full overflow-hidden rounded-(--radius-section) border border-white/70 shadow-[0_8px_40px_-12px_rgba(30,59,189,0.18)] lg:min-h-0 lg:flex-1">
              {/* Mobile: fixed aspect. Desktop: stretch to match details column; image fills via absolute inset */}
              <div className="relative aspect-4/3 w-full lg:absolute lg:inset-0 lg:aspect-auto lg:h-full lg:min-h-0">
                {!cover ? (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-500">
                    <ImageOff className="h-8 w-8" aria-hidden />
                  </div>
                ) : coverUseNative ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data/http/unknown CDN hosts
                  <img
                    src={cover}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <Image
                    src={cover}
                    alt=""
                    fill
                    priority
                    unoptimized={!coverIsUnsplash}
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
              </div>
            </figure>
            {galleryUrls.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {galleryUrls.slice(1).map((url, i) => {
                  const extraUnsplash = url.includes("images.unsplash.com");
                  const extraNative = shouldRenderNativeImg(url);
                  return (
                    <div
                      key={`${i}-${url.slice(0, 32)}`}
                      className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-neutral-200/80 bg-neutral-100 shadow-sm"
                    >
                      {extraNative ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image
                          src={url}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="112px"
                          unoptimized={!extraUnsplash}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col justify-between rounded-(--radius-section) border border-primary/10 bg-white/75 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <div>
              <p className="text-sm font-semibold text-primary">
                {formatCategoryEyebrow(event)} · {cityName}
              </p>
              <p className="font-onest mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {event.title}
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                {event.description}
              </p>

              <dl className="mt-8 space-y-4 border-t border-primary/10 pt-8">
                <MetaRow label="When" icon={Clock}>
                  {whenLabel}
                </MetaRow>
                <MetaRow label="Where" icon={MapPin}>
                  {whereContent}
                </MetaRow>
                {event.latitude != null &&
                event.longitude != null &&
                Number.isFinite(event.latitude) &&
                Number.isFinite(event.longitude) ? (
                  <MetaRow label="Map" icon={MapPin}>
                    <a
                      href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Open in Google Maps
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    </a>
                  </MetaRow>
                ) : null}
                {event.locationType ? (
                  <MetaRow label="Location type" icon={Building2}>
                    {labelForLocationType(event.locationType)}
                  </MetaRow>
                ) : null}
                <MetaRow label="Host" icon={User}>
                  {hostName}
                </MetaRow>
                <MetaRow label="Spots" icon={Users}>
                  {left} left of {event.capacity}
                </MetaRow>
                <MetaRow label="Price" icon={Banknote}>
                  {priceLabel}
                  {event.currency && event.currency !== "INR" ? (
                    <span className="ml-1 text-muted-foreground">
                      ({event.currency})
                    </span>
                  ) : null}
                </MetaRow>
                {event.taxPercentage != null &&
                Number.isFinite(event.taxPercentage) ? (
                  <MetaRow label="Tax" icon={Percent}>
                    {event.taxPercentage}%
                    {event.currency ? ` ${event.currency}` : ""}
                  </MetaRow>
                ) : null}
                {eligibilityParts.length > 0 ? (
                  <MetaRow label="Requirements" icon={UserCheck}>
                    {eligibilityParts.join(" · ")}
                  </MetaRow>
                ) : null}
                {registrationParts.length > 0 ? (
                  <MetaRow label="Registration" icon={Clock}>
                    {registrationParts.join(" · ")}
                  </MetaRow>
                ) : null}
                {event.contactEmail || event.contactPhone ? (
                  <MetaRow label="Contact" icon={Mail}>
                    <span className="flex flex-col gap-1">
                      {event.contactEmail ? (
                        <a
                          href={`mailto:${event.contactEmail}`}
                          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                        >
                          <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {event.contactEmail}
                        </a>
                      ) : null}
                      {event.contactPhone ? (
                        <a
                          href={`tel:${event.contactPhone.replace(/\s/g, "")}`}
                          className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {event.contactPhone}
                        </a>
                      ) : null}
                    </span>
                  </MetaRow>
                ) : null}
              </dl>
            </div>

            <div className="mt-8 border-t border-primary/10 pt-8 lg:mt-10">
              {ctaGroup}
            </div>
          </aside>
        </div>
      </section>

      {/* 2 — Availability */}
      <section
        className="mt-14 sm:mt-16"
        aria-labelledby="event-availability-heading"
      >
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

      {detail.moreAbout ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="event-about-heading">
          <SectionTitle id="event-about-heading">About this meet</SectionTitle>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {detail.moreAbout}
          </p>
        </section>
      ) : null}

      {detail.whatsIncluded.length > 0 ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="event-included-heading">
          <SectionTitle id="event-included-heading">
            What&apos;s included
          </SectionTitle>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {detail.whatsIncluded.map((line, i) => (
              <li
                key={`included-${i}`}
                className="flex gap-3 rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm text-foreground shadow-sm"
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
      ) : null}

      {event.guestSuggestions && event.guestSuggestions.length > 0 ? (
        <section
          className="mt-12 sm:mt-14"
          aria-labelledby="event-suggestions-heading"
        >
          <SectionTitle id="event-suggestions-heading">
            Suggestions
          </SectionTitle>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {event.guestSuggestions.map((line, i) => (
              <li
                key={`suggestion-${i}`}
                className="flex gap-3 rounded-xl border border-primary/10 bg-white/60 px-4 py-3 text-sm text-foreground shadow-sm"
              >
                <Lightbulb
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
                  aria-hidden
                />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {detail.allowedAndNotes ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="event-allowed-heading">
          <SectionTitle id="event-allowed-heading">
            What&apos;s allowed & good to know
          </SectionTitle>
          <div className="liquid-glass-surface mt-4 max-w-3xl">
            <p className="text-base leading-relaxed text-muted-foreground">
              {detail.allowedAndNotes}
            </p>
          </div>
        </section>
      ) : null}

      {detail.eventRules ? (
        <section
          className="mt-12 sm:mt-14"
          aria-labelledby="event-written-rules-heading"
        >
          <SectionTitle id="event-written-rules-heading">Rules</SectionTitle>
          <div className="liquid-glass-surface mt-4 max-w-3xl">
            <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {detail.eventRules}
            </p>
          </div>
        </section>
      ) : null}

      {detail.houseRules.dos.length > 0 || detail.houseRules.donts.length > 0 ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="event-rules-heading">
          <SectionTitle id="event-rules-heading">Do&apos;s &amp; don&apos;ts</SectionTitle>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Quick dos and don&apos;ts so everyone enjoys the meet — clear
            expectations, zero guesswork.
          </p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {detail.houseRules.dos.length > 0 ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/6 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 font-onest text-sm font-semibold uppercase tracking-wide text-emerald-900 dark:text-emerald-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-800">
                    <Check className="h-4 w-4" aria-hidden />
                  </span>
                  Do
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                  {detail.houseRules.dos.map((line, i) => (
                    <li key={`house-do-${i}`} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {detail.houseRules.donts.length > 0 ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/6 p-5 sm:p-6">
                <h3 className="flex items-center gap-2 font-onest text-sm font-semibold uppercase tracking-wide text-rose-900 dark:text-rose-100">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-500/20 text-rose-800">
                    <X className="h-4 w-4" aria-hidden />
                  </span>
                  Don&apos;t
                </h3>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-foreground">
                  {detail.houseRules.donts.map((line, i) => (
                    <li key={`house-dont-${i}`} className="flex gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {detail.faqs.length > 0 ? (
        <section className="mt-12 sm:mt-14" aria-labelledby="event-faq-heading">
          <SectionTitle id="event-faq-heading">FAQ</SectionTitle>
          <div className="mt-4 w-full divide-y divide-primary/10 rounded-2xl border border-primary/10 bg-white/50 px-2 py-1 shadow-sm sm:px-3 sm:py-2">
            {detail.faqs.map((item, i) => (
              <details
                key={`${item.q}-${i}`}
                className="group px-3 py-0 open:bg-white/80 sm:px-6 sm:py-1"
              >
                <summary className="cursor-pointer list-none py-4 text-base font-medium text-foreground transition hover:text-primary sm:py-5 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0 flex-1 pr-2">{item.q}</span>
                    <span className="mt-0.5 shrink-0 text-muted-foreground transition group-open:rotate-180">
                      ▾
                    </span>
                  </span>
                </summary>
                <p className="max-w-none pb-5 pl-0 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      {/* Bottom — repeat Join / Save */}
      <section
        className="mt-14 sm:mt-16"
        aria-labelledby="event-bottom-cta-heading"
      >
        <div className="rounded-(--radius-section) border border-primary/12 bg-linear-to-br from-white/90 to-primary/4 p-6 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div id="event-bottom-cta-heading" className="min-w-0">
            <p className="font-onest text-lg font-semibold text-foreground">
              Ready to join?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Save for later or reserve your spot — same actions as above.
            </p>
          </div>
          <div className="mt-6 shrink-0 sm:mt-0">{ctaGroup}</div>
        </div>
      </section>

      <section
        className="mt-10 sm:mt-12"
        aria-labelledby="event-refund-heading"
      >
        <h2
          id="event-refund-heading"
          className="font-onest text-lg font-semibold tracking-tight text-foreground sm:text-xl"
        >
          Refunds & cancellations
        </h2>
        <div className="liquid-glass-surface mt-4 w-full">
          <p className="text-base leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-foreground">
              Prototype notice:
            </strong>{" "}
            Grow Circle doesn&apos;t process real payments yet, so nothing is
            charged and there&apos;s nothing to refund through this demo.
          </p>
          {detail.refundPolicy ? (
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              <span className="font-semibold text-foreground">Host policy:</span>{" "}
              {detail.refundPolicy}
            </p>
          ) : null}
          {event.refundFullBeforeHours != null ||
          event.refundPartialBeforeHours != null ||
          event.refundPartialPercentage != null ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {event.refundFullBeforeHours != null ? (
                <>
                  Full refund if you cancel at least{" "}
                  <strong className="text-foreground">
                    {event.refundFullBeforeHours}h
                  </strong>{" "}
                  before start
                </>
              ) : null}
              {event.refundFullBeforeHours != null &&
              (event.refundPartialBeforeHours != null ||
                event.refundPartialPercentage != null)
                ? " · "
                : null}
              {event.refundPartialBeforeHours != null &&
              event.refundPartialPercentage != null ? (
                <>
                  Partial refund ({event.refundPartialPercentage}%) if{" "}
                  <strong className="text-foreground">
                    {event.refundPartialBeforeHours}h
                  </strong>{" "}
                  or more before start
                </>
              ) : null}
            </p>
          ) : null}
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            When hosts go live for real, refunds will follow each meet&apos;s
            policy — typically shown at checkout. Common patterns:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            <li>
              <span className="text-foreground">Full refund</span> if you cancel
              within the host&apos;s stated window (often 24–48 hours before the
              start time).
            </li>
            <li>
              <span className="text-foreground">Partial or no refund</span> for
              late cancellations or no-shows, depending on venue or minimum
              spend commitments.
            </li>
            <li>
              <span className="text-foreground">Weather or venue changes:</span>{" "}
              if the host cancels or reschedules, you&apos;ll be offered a refund
              or transfer to a new date when payments are enabled.
            </li>
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Always check the confirmation email (in production) for the exact
            policy for this specific meet.
          </p>
        </div>
      </section>
    </>
  );
}
