"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import { EVENT_CATEGORY_PRESETS } from "@/lib/eventCategories";
import { HOST_LOCATION_TYPE_OPTIONS } from "@/lib/hostLocationTypes";
import {
  addEventQuestion,
  createEvent,
  getEventById,
  getMyProfile,
  isCircleProfileComplete,
  publishEvent,
  updateEvent,
} from "@/lib/circle/api";
import { CircleApiError, formatCircleError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import {
  ensureCircleAccessToken,
  refreshCircleAccessToken,
} from "@/lib/circle/sessionBridge";
import { getMediaUploadUrl, uploadToPresignedUrl } from "@/lib/circle/mediaApi";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { circleApi } from "@/lib/store/circleApi";
import { generateShareToken } from "@/lib/eventsCatalog";
import type { City, PreJoinQuestion } from "@/lib/types";
import {
  selectAccessToken,
  selectIsAuthenticated,
  selectUser,
} from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { store } from "@/lib/store/store";
import {
  initialHostDraft,
  normalizeHostDraft,
  useSessionStore,
  type HostCoverSlot,
  type HostDraft,
} from "@/stores/session-store";
import { HostMeetSelect } from "@/components/host/HostMeetSelect";
import {
  defaultScheduleParts,
  joinDateTimeLocal,
  nowHHMMLocal,
  splitDateTimeLocal,
  todayYYYYMMDDLocal,
} from "@/lib/date/datetimeLocalParts";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

const cities = citiesData as City[];

const MAX_IMAGE_BYTES = 750 * 1024;
/** Larger cap when publishing via Circle + S3 presigned upload */
const MAX_IMAGE_BYTES_CIRCLE = 5 * 1024 * 1024;
const STEPS = 6;

function WizardStepIntro({
  stepIndex,
  title,
  purpose,
}: {
  stepIndex: number;
  title: string;
  /** Omit to show only the step title line. */
  purpose?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-neutral-900">
        Step {stepIndex + 1} — {title}
      </p>
      {purpose ? (
        <p className="text-xs text-neutral-600">{purpose}</p>
      ) : null}
    </div>
  );
}

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "UTC",
] as const;

const MIN_AGE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "All ages" },
  { value: "13", label: "13+" },
  { value: "16", label: "16+" },
  { value: "18", label: "18+" },
  { value: "21", label: "21+" },
];

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function tagsPayloadFromDraft(d: HostDraft): string[] {
  const fromCats = d.categories.slice(1);
  const fromComma = d.tagsComma
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return [...new Set([...fromCats, ...fromComma])];
}

async function dataUrlToBlob(
  dataUrl: string,
): Promise<{ blob: Blob; mime: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return { blob, mime: blob.type || "image/jpeg" };
}

function isProbablyUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function trimWizardLines(lines: string[]): string[] {
  return lines.map((s) => s.trim()).filter(Boolean);
}

function validateDraft(d: HostDraft): string | null {
  if (!d.title.trim()) return "Add a title for your meet.";
  if (!d.startsAt?.trim()) return "Choose a date and time for your meet.";
  const startMs = new Date(d.startsAt).getTime();
  if (Number.isNaN(startMs)) return "Enter a valid date and time.";
  if (startMs <= Date.now()) return "Schedule the meet in the future (today’s time must be after now).";
  if (!d.categories.length) return "Pick at least one category.";
  if (d.preJoinQuestions.length > 5) return "At most 5 pre-join questions.";
  for (let i = 0; i < d.preJoinQuestions.length; i++) {
    const pq = d.preJoinQuestions[i];
    if (!pq.prompt.trim()) return `Pre-join question ${i + 1}: add a prompt.`;
    const opts = pq.options.map((x) => x.trim()).filter(Boolean);
    if (opts.length < 2) {
      return `Pre-join question ${i + 1}: add at least two answer options.`;
    }
    if (opts.length > 6) {
      return `Pre-join question ${i + 1}: at most six options per question.`;
    }
  }
  if (d.priceCents > 0 && !d.refundPolicy.trim()) {
    return "Add a refund policy (paid meets need clear refund terms).";
  }
  if (d.contactEmail.trim() && !looksLikeEmail(d.contactEmail)) {
    return "Enter a valid event contact email, or leave it blank.";
  }
  const regOpen = d.registrationOpensAt.trim();
  const regClose = d.registrationClosesAt.trim();
  if (regOpen && regClose) {
    const t0 = new Date(regOpen).getTime();
    const t1 = new Date(regClose).getTime();
    if (!Number.isNaN(t0) && !Number.isNaN(t1) && t1 < t0) {
      return "Registration must close on or after it opens.";
    }
  }
  const endTrim = d.endsAt.trim();
  if (endTrim) {
    const endMs = new Date(endTrim).getTime();
    const startMs = new Date(d.startsAt).getTime();
    if (Number.isNaN(endMs)) return "Enter a valid end date and time.";
    if (!Number.isNaN(startMs) && endMs <= startMs) {
      return "End time must be after the start time.";
    }
  }
  return null;
}

function slotHasVisual(s: HostCoverSlot): boolean {
  return Boolean(
    (s.dataUrl && s.dataUrl.length > 0) ||
      (s.url.trim() && isProbablyUrl(s.url)),
  );
}

export function HostWizard() {
  const router = useRouter();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const accessToken = useAppSelector(selectAccessToken);
  const publishHostedEvent = useSessionStore((s) => s.publishHostedEvent);
  const setHostDraft = useSessionStore((s) => s.setHostDraft);
  const setHostWizardStep = useSessionStore((s) => s.setHostWizardStep);

  const [publishing, setPublishing] = useState(false);
  const [persistReady, setPersistReady] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<HostDraft>(() => initialHostDraft());

  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [fileTargetSlot, setFileTargetSlot] = useState(0);
  const [coverDragSlot, setCoverDragSlot] = useState<number | null>(null);

  useEffect(() => {
    const applyHydrated = () => {
      const { hostDraft, hostWizardStep } = useSessionStore.getState();
      if (hostDraft != null) {
        setDraft(normalizeHostDraft(hostDraft));
        setStep(Math.min(hostWizardStep ?? 0, STEPS - 1));
      }
      setPersistReady(true);
    };

    if (useSessionStore.persist.hasHydrated()) {
      applyHydrated();
    } else {
      return useSessionStore.persist.onFinishHydration(applyHydrated);
    }
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    if (draft.startsAt.trim()) return;
    const { date, time } = defaultScheduleParts();
    setDraft((d) => ({ ...d, startsAt: joinDateTimeLocal(date, time) }));
  }, [step, draft.startsAt]);

  useEffect(() => {
    if (!persistReady) return;
    try {
      setHostDraft(draft);
      setHostWizardStep(step);
    } catch {
      toast.error(
        "Could not save draft (storage may be full). Try image URLs instead of large uploads.",
      );
    }
  }, [persistReady, draft, step, setHostDraft, setHostWizardStep]);

  const applyCoverFile = (slotIndex: number, file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, WebP, …).");
      return;
    }
    const circleUpload =
      isCircleApiConfigured() && store.getState().auth.accessToken;
    const maxBytes = circleUpload ? MAX_IMAGE_BYTES_CIRCLE : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      toast.error(
        circleUpload
          ? "Image must be under 5MB for upload."
          : "Image must be under 750KB for local demo storage.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((d) => {
        const next = [...d.coverSlots];
        if (!next[slotIndex]) return d;
        next[slotIndex] = {
          dataUrl: reader.result as string,
          url: "",
        };
        return { ...d, coverSlots: next };
      });
    };
    reader.readAsDataURL(file);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const scheduleParts = useMemo(
    () => splitDateTimeLocal(draft.startsAt),
    [draft.startsAt],
  );
  const endScheduleParts = useMemo((): { date: string; time: string } => {
    const v = draft.endsAt.trim();
    if (!v || !v.includes("T")) return { date: "", time: "" };
    const [date, rest] = v.split("T");
    const time = (rest ?? "").slice(0, 5);
    return {
      date: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : "",
      time: /^\d{2}:\d{2}$/.test(time) ? time : "",
    };
  }, [draft.endsAt]);
  const todayMin = todayYYYYMMDDLocal();
  const minTimeIfToday =
    scheduleParts.date === todayMin ? nowHHMMLocal() : undefined;
  const minTimeEndIfSameDayAsStart =
    endScheduleParts.date &&
    scheduleParts.date &&
    endScheduleParts.date === scheduleParts.date
      ? scheduleParts.time
      : undefined;

  const setScheduleFromParts = (date: string, time: string) => {
    let nextTime = time;
    if (date === todayMin && nextTime < nowHHMMLocal()) {
      nextTime = nowHHMMLocal();
    }
    setDraft((d) => ({
      ...d,
      startsAt: joinDateTimeLocal(date, nextTime),
    }));
  };

  const setEndScheduleFromParts = (date: string, time: string) => {
    let nextTime = time;
    if (
      date === scheduleParts.date &&
      nextTime &&
      nextTime < scheduleParts.time
    ) {
      nextTime = scheduleParts.time;
    }
    setDraft((d) => ({
      ...d,
      endsAt: joinDateTimeLocal(date, nextTime),
    }));
  };

  const toggleCategory = (label: string) => {
    setDraft((d) => {
      const set = new Set(d.categories);
      if (set.has(label)) set.delete(label);
      else if (set.size < 3) set.add(label);
      else toast.message("You can pick at most 3 categories.");
      return { ...d, categories: [...set] };
    });
  };

  const submit = () => {
    void (async () => {
      if (!isAuthenticated || !user) {
        toast.error("Sign in to publish a meet.");
        router.push("/login?returnUrl=/host-a-meet");
        return;
      }
      const err = validateDraft(draft);
      if (err) {
        toast.error(err);
        return;
      }

      const startsAtIso = new Date(draft.startsAt).toISOString();

      const cats = draft.categories.slice(0, 3);
      const primaryCategory = cats[0] ?? "Meet";
      const tagPayload = tagsPayloadFromDraft(draft);

      const faqs = draft.faqs
        .map((f) => ({ q: f.q.trim(), a: f.a.trim() }))
        .filter((f) => f.q && f.a);

      const preJoinQuestions: PreJoinQuestion[] = draft.preJoinQuestions.map(
        (row, i) => ({
          id: `pj_${i}_${Math.random().toString(36).slice(2, 9)}`,
          prompt: row.prompt.trim(),
          options: row.options.map((o) => o.trim()).filter(Boolean).slice(0, 6),
        }),
      );

      // Publishing uses Circle HTTP API + bearer token (see `src/lib/circle/config.ts`).
      if (!isCircleApiConfigured()) {
        toast.error(
          "Circle auth is disabled or API URL is missing. Set NEXT_PUBLIC_USE_CIRCLE_AUTH (not false) and NEXT_PUBLIC_CIRCLE_API_BASE in .env.local, then restart the dev server.",
        );
        return;
      }
      let token = accessToken;
      if (!token) {
        token = await ensureCircleAccessToken();
      }
      if (!token) {
        toast.error(
          "Sign in with Circle to publish — use Phone OTP. App-only email/password sign-in does not receive API tokens.",
        );
        router.push("/login?returnUrl=/host-a-meet");
        return;
      }

      try {
        let me;
        try {
          me = await getMyProfile(token);
        } catch (e) {
          if (e instanceof CircleApiError && e.status === 401) {
            await refreshCircleAccessToken();
            const next = store.getState().auth.accessToken;
            if (!next) throw e;
            token = next;
            me = await getMyProfile(token);
          } else {
            throw e;
          }
        }
        if (!isCircleProfileComplete(me)) {
          toast.error("Complete your profile before hosting a meet.");
          router.push(
            `/login?returnUrl=${encodeURIComponent("/host-a-meet")}&circleProfile=1`,
          );
          return;
        }
      } catch (e) {
        toast.error(formatCircleError(e));
        return;
      }

      setPublishing(true);
      try {
        const location =
          [draft.venueName, draft.addressLine]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(", ") || "TBD";

        const resolvedUrls: string[] = [];
        for (const slot of draft.coverSlots) {
          const dataRaw = (slot.dataUrl ?? "").trim();
          const urlRaw = slot.url.trim();
          if (dataRaw.startsWith("data:")) {
            const { blob, mime } = await dataUrlToBlob(dataRaw);
            const ext = mime.includes("png")
              ? "png"
              : mime.includes("webp")
                ? "webp"
                : "jpg";
            const { uploadUrl, publicUrl } = await getMediaUploadUrl(
              token,
              {
                fileName: `event-cover-${Date.now()}-${resolvedUrls.length}.${ext}`,
                fileType: mime || "image/jpeg",
                folder: "events",
              },
            );
            await uploadToPresignedUrl(
              uploadUrl,
              blob,
              mime || "image/jpeg",
            );
            resolvedUrls.push(publicUrl);
          } else if (urlRaw && isProbablyUrl(urlRaw)) {
            resolvedUrls.push(urlRaw);
          }
        }

        if (
          draft.coverSlots.some((s) => slotHasVisual(s)) &&
          resolvedUrls.length === 0
        ) {
          toast.error(
            "Could not attach your images. Wait for uploads to finish, or paste a full https:// image URL.",
          );
          return;
        }

        const coverUrl = resolvedUrls[0]?.trim() ?? "";
        const additionalImages = resolvedUrls.slice(1);

        const contactEmailTrim = draft.contactEmail.trim();
        const contactPhoneTrim = draft.contactPhone.trim();
        const regOpenTrim = draft.registrationOpensAt.trim();
        const regCloseTrim = draft.registrationClosesAt.trim();
        const regOpenIso = regOpenTrim
          ? new Date(regOpenTrim).toISOString()
          : null;
        const regCloseIso = regCloseTrim
          ? new Date(regCloseTrim).toISOString()
          : null;
        const refundPolicyTrim = draft.refundPolicy.trim();

        const endTrim = draft.endsAt.trim();
        const endIso = endTrim ? new Date(endTrim).toISOString() : null;

        const created = await createEvent(token, {
          title: draft.title.trim() || "Untitled meet",
          description: draft.description.trim() || "—",
          max_capacity: Math.max(4, draft.capacity),
          price: Math.max(0, draft.priceCents) / 100,
          event_date: startsAtIso,
          start_time: startsAtIso,
          timezone: draft.timezone.trim() || "Asia/Kolkata",
          location,
          ...(primaryCategory ? { category: primaryCategory } : {}),
          ...(tagPayload.length > 0 ? { tags: tagPayload } : {}),
          cover_image_url: coverUrl || null,
          image_urls: additionalImages,
          contact_email: contactEmailTrim || null,
          contact_phone: contactPhoneTrim || null,
          visibility: draft.listingVisibility,
          waitlist_enabled: draft.waitlistEnabled,
          ...(draft.minAge != null ? { min_age: draft.minAge } : {}),
          min_verification_tier: draft.requireVerifiedGuests ? 1 : 0,
          terms_required: draft.termsRequired,
          ...(refundPolicyTrim ? { refund_policy: refundPolicyTrim } : {}),
          refund_full_before_hours: draft.refundFullBeforeHours,
          refund_partial_before_hours: draft.refundPartialBeforeHours,
          refund_partial_percentage: draft.refundPartialPercentage,
          ...(regOpenIso ? { registration_opens_at: regOpenIso } : {}),
          ...(regCloseIso ? { registration_closes_at: regCloseIso } : {}),
          ...(endIso ? { end_time: endIso } : {}),
        });

        const whatsIncluded = trimWizardLines(draft.whatsIncluded);
        const guestSuggestions = trimWizardLines(draft.guestSuggestions);
        const houseDos = trimWizardLines(draft.houseDos);
        const houseDonts = trimWizardLines(draft.houseDonts);
        const moreAboutTrim = draft.moreAbout.trim();
        const allowedTrim = draft.allowedAndNotes.trim();
        const eventRulesTrim = draft.eventRules.trim();
        const locationTypeTrim = draft.locationType.trim();

        await updateEvent(token, created.id, {
          event_date: startsAtIso,
          start_time: startsAtIso,
          timezone: draft.timezone.trim() || "Asia/Kolkata",
          ...(primaryCategory ? { category: primaryCategory } : {}),
          ...(tagPayload.length > 0 ? { tags: tagPayload } : {}),
          cover_image_url: coverUrl || null,
          image_urls: additionalImages,
          contact_email: contactEmailTrim || null,
          contact_phone: contactPhoneTrim || null,
          ...(faqs.length > 0 ? { faqs } : {}),
          ...(moreAboutTrim ? { more_about: moreAboutTrim } : {}),
          ...(whatsIncluded.length > 0 ? { whats_included: whatsIncluded } : {}),
          ...(guestSuggestions.length > 0
            ? { guest_suggestions: guestSuggestions }
            : {}),
          ...(allowedTrim ? { allowed_and_notes: allowedTrim } : {}),
          ...(houseDos.length > 0 || houseDonts.length > 0
            ? { house_rules: { dos: houseDos, donts: houseDonts } }
            : {}),
          ...(eventRulesTrim ? { event_rules: eventRulesTrim } : {}),
          ...(locationTypeTrim ? { location_type: locationTypeTrim } : {}),
          ...(draft.minAge != null ? { min_age: draft.minAge } : {}),
          min_verification_tier: draft.requireVerifiedGuests ? 1 : 0,
          terms_required: draft.termsRequired,
          ...(refundPolicyTrim ? { refund_policy: refundPolicyTrim } : {}),
          refund_full_before_hours: draft.refundFullBeforeHours,
          refund_partial_before_hours: draft.refundPartialBeforeHours,
          refund_partial_percentage: draft.refundPartialPercentage,
          ...(regOpenIso ? { registration_opens_at: regOpenIso } : {}),
          ...(regCloseIso ? { registration_closes_at: regCloseIso } : {}),
          ...(endIso ? { end_time: endIso } : {}),
        });

        for (let i = 0; i < draft.preJoinQuestions.length; i++) {
          const row = draft.preJoinQuestions[i];
          const opts = row.options.map((o) => o.trim()).filter(Boolean);
          if (opts.length < 2) continue;
          await addEventQuestion(token, created.id, {
            question_text: row.prompt.trim(),
            question_type: "single_select",
            options: opts.slice(0, 6),
            is_required: true,
            sort_order: i + 1,
          });
        }

        await publishEvent(token, created.id);
        let finalRaw;
        try {
          finalRaw = await getEventById(created.id, token);
        } catch {
          finalRaw = created;
        }
        const ev = circleEventToMeetEvent(finalRaw, {
          defaultHostUserId: user.id,
        });
        publishHostedEvent({
          ...ev,
          category: primaryCategory,
          categories: cats.length ? cats : ev.categories,
          cityId: draft.cityId,
          moreAbout: moreAboutTrim || undefined,
          whatsIncluded:
            whatsIncluded.length > 0 ? whatsIncluded : undefined,
          guestSuggestions:
            guestSuggestions.length > 0 ? guestSuggestions : undefined,
          allowedAndNotes: allowedTrim || undefined,
          houseRules:
            houseDos.length > 0 || houseDonts.length > 0
              ? { dos: houseDos, donts: houseDonts }
              : undefined,
          eventRules: eventRulesTrim || undefined,
          locationType: locationTypeTrim || undefined,
          preJoinQuestions: preJoinQuestions.length
            ? preJoinQuestions
            : undefined,
          shareToken: generateShareToken(),
          additionalImages:
            additionalImages.length > 0 ? additionalImages : undefined,
          refundPolicy: refundPolicyTrim || undefined,
          refundFullBeforeHours: draft.refundFullBeforeHours,
          refundPartialBeforeHours: draft.refundPartialBeforeHours,
          refundPartialPercentage: draft.refundPartialPercentage,
          minAge: draft.minAge ?? undefined,
          minVerificationTier: draft.requireVerifiedGuests ? 1 : 0,
          termsRequired: draft.termsRequired,
          contactEmail: contactEmailTrim || undefined,
          contactPhone: contactPhoneTrim || undefined,
          registrationOpensAt: regOpenIso ?? undefined,
          registrationClosesAt: regCloseIso ?? undefined,
        });
        store.dispatch(
          circleApi.util.invalidateTags([{ type: "HostedEvents", id: "LIST" }]),
        );
        setDraft(initialHostDraft());
        setStep(0);
        toast.success("Meet published — manage it under Bookings.");
        router.push("/bookings");
      } catch (e) {
        toast.error(formatCircleError(e));
      } finally {
        setPublishing(false);
      }
    })();
  };

  const inputClass = cn(
    "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition",
    "placeholder:text-neutral-700",
    "focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10",
  );

  const rupeesValue =
    draft.priceCents === 0
      ? ""
      : (draft.priceCents / 100).toString();

  return (
    <div className="mt-10 w-full rounded-(--radius-section) border border-neutral-200 bg-white/90 p-5 shadow-sm sm:p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Step {step + 1} / {STEPS}
      </p>
      <div
        className="mt-3 flex gap-1.5"
        role="group"
        aria-label={`Wizard steps, step ${step + 1} of ${STEPS}`}
      >
        {Array.from({ length: STEPS }).map((_, i) => {
          const doneOrCurrent = i <= step;
          const segmentClass = cn(
            "h-1.5 flex-1 rounded-full transition-colors",
            doneOrCurrent ? "bg-neutral-900" : "bg-neutral-200",
            doneOrCurrent &&
              "cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 focus-visible:ring-offset-1",
          );
          if (!doneOrCurrent) {
            return (
              <div
                key={i}
                className={segmentClass}
                aria-hidden
              />
            );
          }
          return (
            <button
              key={i}
              type="button"
              className={segmentClass}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1} of ${STEPS}`}
              aria-current={i === step ? "step" : undefined}
            />
          );
        })}
      </div>

      {step === 0 && (
        <div className="mt-4 space-y-4">
          <WizardStepIntro
            stepIndex={0}
            title="Basics"
            purpose="Title, short description, categories (up to three), and optional comma-separated tags."
          />
          <div>
            <label className="text-sm font-semibold text-neutral-900">Title</label>
            <input
              className={inputClass}
              value={draft.title}
              onChange={(e) =>
                setDraft((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">Description</label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={draft.description}
              onChange={(e) =>
                setDraft((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div>
            <p className="text-sm text-neutral-900">
              Categories (up to 3). The first is stored as the primary{" "}
              <span className="font-medium">category</span> on the server; extras
              go to <span className="font-medium">tags</span>.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EVENT_CATEGORY_PRESETS.map((c) => {
                const on = draft.categories.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCategory(c)}
                    className={
                      on
                        ? "rounded-full bg-primary px-4 py-2 text-sm font-medium text-white"
                        : "rounded-full border border-primary/25 bg-white/50 px-4 py-2 text-sm font-medium text-foreground"
                    }
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-neutral-700">
              Selected:{" "}
              {draft.categories.length ? draft.categories.join(" · ") : "—"}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              Extra tags (optional)
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Comma-separated — merged with any categories after the first.
            </p>
            <input
              className={inputClass}
              value={draft.tagsComma}
              onChange={(e) =>
                setDraft((d) => ({ ...d, tagsComma: e.target.value }))
              }
              placeholder="e.g. outdoors, beginners"
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-4 space-y-5">
          <WizardStepIntro stepIndex={1} title="Story & rules" />
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              More about the event
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Longer story beyond the short description above (optional).
            </p>
            <textarea
              className={`${inputClass} mt-2 min-h-[88px] resize-y`}
              value={draft.moreAbout}
              onChange={(e) =>
                setDraft((d) => ({ ...d, moreAbout: e.target.value }))
              }
              placeholder="What makes this meet special?"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              What&apos;s included / available
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              One item per line — e.g. snacks, materials, equipment.
            </p>
            <div className="mt-2 space-y-2">
              {draft.whatsIncluded.map((line, idx) => (
                <div key={`wi-${idx}`} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={line}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft((d) => {
                        const next = [...d.whatsIncluded];
                        next[idx] = v;
                        return { ...d, whatsIncluded: next };
                      });
                    }}
                    placeholder="e.g. Tea and coffee"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-neutral-200 px-2 text-xs text-neutral-600 hover:bg-neutral-50"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        whatsIncluded:
                          d.whatsIncluded.length > 1
                            ? d.whatsIncluded.filter((_, i) => i !== idx)
                            : [""],
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    whatsIncluded: [...d.whatsIncluded, ""],
                  }))
                }
              >
                + Add line
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              Suggestions for guests
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Shown as tips — API field <span className="font-mono text-[11px]">guest_suggestions</span>.
            </p>
            <div className="mt-2 space-y-2">
              {draft.guestSuggestions.map((line, idx) => (
                <div key={`gs-${idx}`} className="flex gap-2">
                  <input
                    className={inputClass}
                    value={line}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraft((d) => {
                        const next = [...d.guestSuggestions];
                        next[idx] = v;
                        return { ...d, guestSuggestions: next };
                      });
                    }}
                    placeholder="e.g. Wear comfortable shoes"
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-neutral-200 px-2 text-xs text-neutral-600 hover:bg-neutral-50"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        guestSuggestions:
                          d.guestSuggestions.length > 1
                            ? d.guestSuggestions.filter((_, i) => i !== idx)
                            : [""],
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    guestSuggestions: [...d.guestSuggestions, ""],
                  }))
                }
              >
                + Add line
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              Notes (what&apos;s allowed, accessibility, etc.)
            </label>
            <textarea
              className={`${inputClass} mt-2 min-h-[72px] resize-y`}
              value={draft.allowedAndNotes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, allowedAndNotes: e.target.value }))
              }
              placeholder="Optional — parking, access, allergies…"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              Do&apos;s &amp; don&apos;ts (bullets)
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Short lines — API <span className="font-mono text-[11px]">house_rules.dos</span> /{" "}
              <span className="font-mono text-[11px]">house_rules.donts</span>.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-900">Do&apos;s</label>
              <div className="mt-2 space-y-2">
                {draft.houseDos.map((line, idx) => (
                  <div key={`do-${idx}`} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={line}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d) => {
                          const next = [...d.houseDos];
                          next[idx] = v;
                          return { ...d, houseDos: next };
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-neutral-200 px-2 text-xs text-neutral-600 hover:bg-neutral-50"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          houseDos:
                            d.houseDos.length > 1
                              ? d.houseDos.filter((_, i) => i !== idx)
                              : [""],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      houseDos: [...d.houseDos, ""],
                    }))
                  }
                >
                  + Add
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-900">
                Don&apos;ts
              </label>
              <div className="mt-2 space-y-2">
                {draft.houseDonts.map((line, idx) => (
                  <div key={`dont-${idx}`} className="flex gap-2">
                    <input
                      className={inputClass}
                      value={line}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDraft((d) => {
                          const next = [...d.houseDonts];
                          next[idx] = v;
                          return { ...d, houseDonts: next };
                        });
                      }}
                    />
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-neutral-200 px-2 text-xs text-neutral-600 hover:bg-neutral-50"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          houseDonts:
                            d.houseDonts.length > 1
                              ? d.houseDonts.filter((_, i) => i !== idx)
                              : [""],
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      houseDonts: [...d.houseDonts, ""],
                    }))
                  }
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-neutral-900">
              Written rules (optional)
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Overall rules in one place — API field{" "}
              <span className="font-mono text-[11px]">event_rules</span> (separate from the
              bullets above).
            </p>
            <textarea
              className={`${inputClass} mt-2 min-h-[88px] resize-y`}
              value={draft.eventRules}
              onChange={(e) =>
                setDraft((d) => ({ ...d, eventRules: e.target.value }))
              }
              placeholder="e.g. Age 18+, refunds, late entry…"
            />
          </div>

          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <p className="text-sm font-semibold text-neutral-900">Refunds</p>
            <p className="text-xs text-neutral-600">
              Shown on the event page. Required for paid meets. Numeric windows map
              to <span className="font-mono text-[11px]">refund_*</span> on the API.
            </p>
            <div>
              <label className="text-sm font-semibold text-neutral-900">
                Refund policy
              </label>
              <textarea
                className={`${inputClass} mt-2 min-h-[88px] resize-y`}
                value={draft.refundPolicy}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, refundPolicy: e.target.value }))
                }
                placeholder="e.g. Full refund up to 48h before start; partial after that…"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-neutral-900">
                  Full refund (hours before)
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.refundFullBeforeHours}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      refundFullBeforeHours: Math.max(
                        0,
                        Math.floor(Number(e.target.value)) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-900">
                  Partial refund (hours before)
                </label>
                <input
                  type="number"
                  min={0}
                  className={inputClass}
                  value={draft.refundPartialBeforeHours}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      refundPartialBeforeHours: Math.max(
                        0,
                        Math.floor(Number(e.target.value)) || 0,
                      ),
                    }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-neutral-900">
                  Partial refund (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={draft.refundPartialPercentage}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      refundPartialPercentage: Math.min(
                        100,
                        Math.max(0, Math.round(Number(e.target.value)) || 0),
                      ),
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 space-y-4">
          <WizardStepIntro
            stepIndex={2}
            title="Location"
            purpose="City, venue, address, and location type for the listing."
          />
          <HostMeetSelect
            label="City"
            value={draft.cityId}
            options={cities.map((c) => ({ value: c.id, label: c.name }))}
            onChange={(cityId) => setDraft((d) => ({ ...d, cityId }))}
          />
          <HostMeetSelect
            label="Type of location"
            value={draft.locationType}
            options={HOST_LOCATION_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onChange={(locationType) => setDraft((d) => ({ ...d, locationType }))}
          />
          <p className="text-xs text-neutral-600">
            Sent as <span className="font-mono">location_type</span> on the event (slug).
          </p>
          <div>
            <label className="text-sm font-semibold text-neutral-900">Venue name</label>
            <input
              className={inputClass}
              value={draft.venueName}
              onChange={(e) =>
                setDraft((d) => ({ ...d, venueName: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">Address (optional)</label>
            <input
              className={inputClass}
              value={draft.addressLine}
              onChange={(e) =>
                setDraft((d) => ({ ...d, addressLine: e.target.value }))
              }
              placeholder="Street, suite, access notes"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 space-y-4">
          <WizardStepIntro
            stepIndex={3}
            title="Schedule & policies"
            purpose="Start and optional end time, timezone, capacity, price, age and verification, terms, and registration window."
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Starts at</p>
            <p className="mt-1 text-xs text-neutral-600">
              Pick a date (past days are disabled) and a start time. If you choose
              today, only times after now are allowed.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="host-meet-date"
                  className="text-xs font-medium text-neutral-700"
                >
                  Date
                </label>
                <input
                  id="host-meet-date"
                  type="date"
                  min={todayMin}
                  className={inputClass}
                  value={scheduleParts.date}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    if (!nextDate) return;
                    setScheduleFromParts(nextDate, scheduleParts.time);
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="host-meet-time"
                  className="text-xs font-medium text-neutral-700"
                >
                  Time
                </label>
                <input
                  id="host-meet-time"
                  type="time"
                  className={inputClass}
                  value={scheduleParts.time}
                  min={minTimeIfToday}
                  onChange={(e) => {
                    const nextTime = e.target.value;
                    if (!nextTime) return;
                    setScheduleFromParts(scheduleParts.date, nextTime);
                  }}
                />
              </div>
            </div>
          </div>
          <HostMeetSelect
            label="Timezone"
            value={draft.timezone}
            options={TIMEZONE_OPTIONS.map((z) => ({ value: z, label: z }))}
            onChange={(timezone) => setDraft((d) => ({ ...d, timezone }))}
          />
          <div>
            <p className="text-sm font-semibold text-neutral-900">Ends at (optional)</p>
            <p className="mt-1 text-xs text-neutral-600">
              Leave blank for a single start time only. Sent as{" "}
              <span className="font-mono text-[11px]">end_time</span> on the API.
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="host-meet-end-date"
                  className="text-xs font-medium text-neutral-700"
                >
                  Date
                </label>
                <input
                  id="host-meet-end-date"
                  type="date"
                  min={scheduleParts.date || todayMin}
                  className={inputClass}
                  value={endScheduleParts.date}
                  onChange={(e) => {
                    const nextDate = e.target.value;
                    if (!nextDate) {
                      setDraft((d) => ({ ...d, endsAt: "" }));
                      return;
                    }
                    const startD = scheduleParts.date;
                    if (startD && nextDate < startD) {
                      setEndScheduleFromParts(startD, endScheduleParts.time || scheduleParts.time);
                      return;
                    }
                    setEndScheduleFromParts(
                      nextDate,
                      endScheduleParts.time || scheduleParts.time,
                    );
                  }}
                />
              </div>
              <div>
                <label
                  htmlFor="host-meet-end-time"
                  className="text-xs font-medium text-neutral-700"
                >
                  Time
                </label>
                <input
                  id="host-meet-end-time"
                  type="time"
                  className={inputClass}
                  value={endScheduleParts.time}
                  min={minTimeEndIfSameDayAsStart}
                  onChange={(e) => {
                    const nextTime = e.target.value;
                    if (!nextTime) return;
                    const dPart =
                      endScheduleParts.date || scheduleParts.date;
                    if (!dPart) return;
                    setEndScheduleFromParts(dPart, nextTime);
                  }}
                />
              </div>
            </div>
            {draft.endsAt.trim() ? (
              <button
                type="button"
                className="mt-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
                onClick={() => setDraft((d) => ({ ...d, endsAt: "" }))}
              >
                Clear end time
              </button>
            ) : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-neutral-900">Capacity (max slots)</label>
              <input
                type="number"
                min={4}
                className={inputClass}
                value={draft.capacity}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    capacity: Number(e.target.value) || 8,
                  }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-900">Price (rupees)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                value={rupeesValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setDraft((d) => ({ ...d, priceCents: 0 }));
                    return;
                  }
                  const n = Number.parseFloat(raw);
                  if (Number.isNaN(n)) return;
                  setDraft((d) => ({
                    ...d,
                    priceCents: Math.max(0, Math.round(n * 100)),
                  }));
                }}
              />
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <p className="text-sm font-semibold text-neutral-900">Who can join</p>
            <HostMeetSelect
              label="Minimum age"
              value={draft.minAge === null ? "none" : String(draft.minAge)}
              options={MIN_AGE_OPTIONS}
              onChange={(v) =>
                setDraft((d) => ({
                  ...d,
                  minAge: v === "none" ? null : Number.parseInt(v, 10),
                }))
              }
            />
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary focus:ring-primary/30"
                checked={draft.requireVerifiedGuests}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    requireVerifiedGuests: e.target.checked,
                  }))
                }
              />
              <span className="text-sm text-neutral-900">
                <span className="font-semibold">Require verified guests</span>
                <span className="block text-xs text-neutral-600">
                  Only guests with a verified profile can register (
                  <span className="font-mono text-[11px]">min_verification_tier</span>
                  ).
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300 text-primary focus:ring-primary/30"
                checked={draft.termsRequired}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    termsRequired: e.target.checked,
                  }))
                }
              />
              <span className="text-sm text-neutral-900">
                <span className="font-semibold">Require terms acceptance</span>
                <span className="block text-xs text-neutral-600">
                  Guests must accept terms before joining (
                  <span className="font-mono text-[11px]">terms_required</span>
                  ).
                </span>
              </span>
            </label>
          </div>

          <div className="border-t border-neutral-200 pt-6 space-y-3">
            <p className="text-sm font-semibold text-neutral-900">
              Registration window (optional)
            </p>
            <p className="text-xs text-neutral-600">
              Leave blank for no restriction. Times use your device clock; event
              timezone is <span className="font-medium">{draft.timezone}</span>.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="host-reg-opens"
                  className="text-xs font-medium text-neutral-700"
                >
                  Opens
                </label>
                <input
                  id="host-reg-opens"
                  type="datetime-local"
                  className={inputClass}
                  value={draft.registrationOpensAt}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      registrationOpensAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="host-reg-closes"
                  className="text-xs font-medium text-neutral-700"
                >
                  Closes
                </label>
                <input
                  id="host-reg-closes"
                  type="datetime-local"
                  className={inputClass}
                  value={draft.registrationClosesAt}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      registrationClosesAt: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 space-y-5">
          <WizardStepIntro
            stepIndex={4}
            title="Contact & media"
            purpose="Guest-facing contact, waitlist and listing visibility, and up to three images (first is the cover)."
          />
          <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50/40 p-4">
            <p className="text-sm font-semibold text-neutral-900">
              Event contact (optional)
            </p>
            <p className="text-xs text-neutral-600">
              Shown to guests who need to reach you about this meet. Maps to{" "}
              <span className="font-mono text-[11px]">contact_email</span> /{" "}
              <span className="font-mono text-[11px]">contact_phone</span>.
            </p>
            <div>
              <label className="text-sm font-semibold text-neutral-900">Email</label>
              <input
                type="email"
                className={inputClass}
                value={draft.contactEmail}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, contactEmail: e.target.value }))
                }
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-neutral-900">Phone</label>
              <input
                type="tel"
                className={inputClass}
                value={draft.contactPhone}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, contactPhone: e.target.value }))
                }
                placeholder="+91 …"
                autoComplete="tel"
              />
            </div>
          </div>

          <HostMeetSelect
            label="Waitlist"
            value={draft.waitlistEnabled ? "on" : "off"}
            options={[
              {
                value: "on",
                label: "Enabled — guests can join the waitlist when full",
              },
              {
                value: "off",
                label: "Disabled — no waitlist for this meet",
              },
            ]}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                waitlistEnabled: v === "on",
              }))
            }
          />
          <HostMeetSelect
            label="Listing"
            value={draft.listingVisibility}
            options={[
              { value: "public", label: "Public — shown on Explore" },
              { value: "private", label: "Private — link only" },
            ]}
            onChange={(v) =>
              setDraft((d) => ({
                ...d,
                listingVisibility: v as "public" | "private",
              }))
            }
          />

          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Upload cover image"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) applyCoverFile(fileTargetSlot, file);
              e.target.value = "";
            }}
          />

          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Cover and gallery images
            </p>
            <p className="mt-1 text-xs text-neutral-900">
              Cover is used as the listing hero; gallery is optional. Paste a URL
              or upload — max{" "}
              {isCircleApiConfigured() && store.getState().auth.accessToken
                ? "5MB"
                : "750KB"}{" "}
              per file.
            </p>
          </div>

          {draft.coverSlots.map((slot, slotIndex) => {
            const hasVisual = slotHasVisual(slot);
            const maxLabel =
              isCircleApiConfigured() && store.getState().auth.accessToken
                ? "5MB"
                : "750KB";
            const slotTitle =
              slotIndex === 0 ? "Cover image" : "Gallery image";

            return (
              <div
                key={slotIndex}
                className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-900">
                  {slotTitle}
                </p>

                {hasVisual ? (
                  <div className="mt-2 flex flex-wrap items-stretch gap-3 sm:flex-nowrap">
                    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slot.dataUrl ?? slot.url.trim()}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setFileTargetSlot(slotIndex);
                            coverFileInputRef.current?.click();
                          }}
                          className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-900 shadow-sm hover:bg-neutral-50"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => {
                              const next = [...d.coverSlots];
                              next[slotIndex] = { dataUrl: null, url: "" };
                              return { ...d, coverSlots: next };
                            })
                          }
                          className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        id={`host-cover-url-${slotIndex}`}
                        className={cn(inputClass, "mt-0")}
                        value={slot.url}
                        placeholder="HTTPS image URL (optional)"
                        onChange={(e) =>
                          setDraft((d) => {
                            const next = [...d.coverSlots];
                            next[slotIndex] = {
                              dataUrl: e.target.value
                                ? null
                                : next[slotIndex].dataUrl,
                              url: e.target.value,
                            };
                            return { ...d, coverSlots: next };
                          })
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCoverDragSlot(slotIndex);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCoverDragSlot(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCoverDragSlot(null);
                        const file = e.dataTransfer.files?.[0];
                        if (file) applyCoverFile(slotIndex, file);
                      }}
                      onClick={() => {
                        setFileTargetSlot(slotIndex);
                        coverFileInputRef.current?.click();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setFileTargetSlot(slotIndex);
                          coverFileInputRef.current?.click();
                        }
                      }}
                      className={cn(
                        "mt-2 flex min-h-[72px] w-full cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed px-3 py-2.5 transition outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
                        coverDragSlot === slotIndex
                          ? "border-neutral-900 bg-neutral-100"
                          : "border-neutral-300 bg-white hover:border-neutral-500 hover:bg-neutral-50",
                      )}
                    >
                      <Upload
                        className="h-6 w-6 shrink-0 text-neutral-500"
                        strokeWidth={1.5}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <p className="text-sm font-semibold text-neutral-900">
                          {coverDragSlot === slotIndex
                            ? "Drop image here"
                            : "Upload or click"}
                        </p>
                        <p className="text-xs text-neutral-900">
                          PNG, JPG, WebP · max {maxLabel}
                        </p>
                      </div>
                    </div>
                    <label
                      className="mt-2 block text-xs font-semibold text-neutral-900"
                      htmlFor={`host-cover-url-${slotIndex}`}
                    >
                      Or paste URL
                    </label>
                    <input
                      id={`host-cover-url-${slotIndex}`}
                      className={inputClass}
                      value={slot.url}
                      placeholder="https://…"
                      onChange={(e) =>
                        setDraft((d) => {
                          const next = [...d.coverSlots];
                          next[slotIndex] = {
                            dataUrl: e.target.value
                              ? null
                              : next[slotIndex].dataUrl,
                            url: e.target.value,
                          };
                          return { ...d, coverSlots: next };
                        })
                      }
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {step === 5 && (
        <div className="mt-4 space-y-4">
          <WizardStepIntro
            stepIndex={5}
            title="FAQs & pre-join"
            purpose="Optional FAQ pairs for the event page and up to five multiple-choice questions before guests join."
          />
          <p className="text-sm text-neutral-900">
            Add question and answer pairs for the FAQ accordion on the event page.
          </p>
          {draft.faqs.map((row, i) => (
            <div
              key={i}
              className="rounded-xl border border-primary/10 bg-white/40 p-4 space-y-3"
            >
              <input
                className={inputClass + " mt-0"}
                placeholder="Question"
                value={row.q}
                onChange={(e) => {
                  const next = [...draft.faqs];
                  next[i] = { ...next[i], q: e.target.value };
                  setDraft((d) => ({ ...d, faqs: next }));
                }}
              />
              <textarea
                className={`${inputClass} mt-0 min-h-[72px] resize-y`}
                placeholder="Answer"
                value={row.a}
                onChange={(e) => {
                  const next = [...draft.faqs];
                  next[i] = { ...next[i], a: e.target.value };
                  setDraft((d) => ({ ...d, faqs: next }));
                }}
              />
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  const next = draft.faqs.filter((_, j) => j !== i);
                  setDraft((d) => ({
                    ...d,
                    faqs: next.length > 0 ? next : [{ q: "", a: "" }],
                  }));
                }}
              >
                Remove pair
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-medium text-primary hover:underline"
            onClick={() =>
              setDraft((d) => ({ ...d, faqs: [...d.faqs, { q: "", a: "" }] }))
            }
          >
            + Add FAQ
          </button>

          <div className="mt-8 space-y-4 border-t border-neutral-200 pt-8">
          <p className="text-sm font-semibold text-neutral-900">Pre-join questions</p>
          <p className="text-sm text-neutral-900">
            Optional: up to 5 multiple-choice questions guests must answer before
            joining. Each needs a prompt and at least two options.
          </p>
          {draft.preJoinQuestions.map((pq, qi) => (
            <div
              key={qi}
              className="rounded-xl border border-primary/10 bg-white/40 p-4 space-y-3"
            >
              <input
                className={inputClass + " mt-0"}
                placeholder="Question"
                value={pq.prompt}
                onChange={(e) => {
                  const next = [...draft.preJoinQuestions];
                  next[qi] = { ...next[qi], prompt: e.target.value };
                  setDraft((d) => ({ ...d, preJoinQuestions: next }));
                }}
              />
              <p className="text-xs font-medium text-neutral-900">
                Answer options (radios)
              </p>
              {pq.options.map((opt, oi) => (
                <input
                  key={oi}
                  className={inputClass + " mt-0"}
                  placeholder={`Option ${oi + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...draft.preJoinQuestions];
                    const opts = [...next[qi].options];
                    opts[oi] = e.target.value;
                    next[qi] = { ...next[qi], options: opts };
                    setDraft((d) => ({ ...d, preJoinQuestions: next }));
                  }}
                />
              ))}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    if (pq.options.length >= 6) {
                      toast.message("At most 6 options per question.");
                      return;
                    }
                    const next = [...draft.preJoinQuestions];
                    next[qi] = {
                      ...next[qi],
                      options: [...next[qi].options, ""],
                    };
                    setDraft((d) => ({ ...d, preJoinQuestions: next }));
                  }}
                >
                  + Option
                </button>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => {
                    const next = draft.preJoinQuestions.filter(
                      (_, j) => j !== qi,
                    );
                    setDraft((d) => ({ ...d, preJoinQuestions: next }));
                  }}
                >
                  Remove question
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="rounded-full border border-primary/25 bg-white/60 px-4 py-2 text-sm font-medium"
            disabled={draft.preJoinQuestions.length >= 5}
            onClick={() => {
              if (draft.preJoinQuestions.length >= 5) return;
              setDraft((d) => ({
                ...d,
                preJoinQuestions: [
                  ...d.preJoinQuestions,
                  { prompt: "", options: ["", ""] },
                ],
              }));
            }}
          >
            + Add pre-join question
          </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-3">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="rounded-full border border-neutral-300 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        {step < STEPS - 1 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={publishing}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-md shadow-primary/20 transition hover:bg-primary/92 disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        )}
      </div>
    </div>
  );
}
