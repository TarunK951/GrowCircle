"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import citiesData from "@/data/cities.json";
import { EVENT_CATEGORY_PRESETS } from "@/lib/eventCategories";
import {
  addEventQuestion,
  createEvent,
  publishEvent,
} from "@/lib/circle/api";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { getMediaUploadUrl, uploadToPresignedUrl } from "@/lib/circle/mediaApi";
import { circleEventToMeetEvent } from "@/lib/circle/mappers";
import { generateShareToken } from "@/lib/eventsCatalog";
import type { City, MeetEvent, PreJoinQuestion } from "@/lib/types";
import {
  initialHostDraft,
  useSessionStore,
  type HostDraft,
} from "@/stores/session-store";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

const cities = citiesData as City[];

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&auto=format&fit=crop&q=80";

const MAX_IMAGE_BYTES = 750 * 1024;
/** Larger cap when publishing via Circle + S3 presigned upload */
const MAX_IMAGE_BYTES_CIRCLE = 5 * 1024 * 1024;
const STEPS = 10;

async function dataUrlToBlob(
  dataUrl: string,
): Promise<{ blob: Blob; mime: string }> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return { blob, mime: blob.type || "image/jpeg" };
}

function trimLines(lines: string[]): string[] {
  return lines.map((s) => s.trim()).filter(Boolean);
}

function isProbablyUrl(s: string): boolean {
  try {
    const u = new URL(s.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validateDraft(d: HostDraft): string | null {
  if (!d.title.trim()) return "Add a title for your meet.";
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
  return null;
}

export function HostWizard() {
  const router = useRouter();
  const user = useSessionStore((s) => s.user);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const accessToken = useSessionStore((s) => s.accessToken);
  const publishHostedEvent = useSessionStore((s) => s.publishHostedEvent);
  const [publishing, setPublishing] = useState(false);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initialHostDraft());
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [coverDragActive, setCoverDragActive] = useState(false);

  const applyCoverFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, WebP, …).");
      return;
    }
    const circleUpload =
      isCircleApiConfigured() && useSessionStore.getState().accessToken;
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
      setDraft((d) => ({
        ...d,
        imageDataUrl: reader.result as string,
        imageUrl: "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

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

      const startsAtIso = draft.startsAt
        ? new Date(draft.startsAt).toISOString()
        : new Date(Date.now() + 864e5).toISOString();

      const cats = draft.categories.slice(0, 3);
      const primaryCategory = cats[0] ?? "Social";

      let image = DEFAULT_COVER;
      if (draft.imageDataUrl) image = draft.imageDataUrl;
      else if (draft.imageUrl.trim() && isProbablyUrl(draft.imageUrl)) {
        image = draft.imageUrl.trim();
      }

      const whatsIncluded = trimLines(draft.whatsIncludedLines);
      const guestSuggestions = trimLines(draft.guestSuggestions);
      const dos = trimLines(draft.houseDos);
      const donts = trimLines(draft.houseDonts);
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

      if (isCircleApiConfigured() && accessToken) {
        setPublishing(true);
        try {
          const location =
            [draft.venueName, draft.addressLine]
              .map((s) => s.trim())
              .filter(Boolean)
              .join(", ") || "TBD";

          let coverUrl: string | undefined;
          if (
            draft.imageDataUrl &&
            draft.imageDataUrl.startsWith("data:")
          ) {
            const { blob, mime } = await dataUrlToBlob(draft.imageDataUrl);
            const ext = mime.includes("png")
              ? "png"
              : mime.includes("webp")
                ? "webp"
                : "jpg";
            const { uploadUrl, fileUrl } = await getMediaUploadUrl(
              accessToken,
              {
                fileName: `event-cover-${Date.now()}.${ext}`,
                fileType: mime || "image/jpeg",
                folder: "events",
              },
            );
            await uploadToPresignedUrl(
              uploadUrl,
              blob,
              mime || "image/jpeg",
            );
            coverUrl = fileUrl;
          } else if (
            !draft.imageDataUrl &&
            draft.imageUrl.trim() &&
            isProbablyUrl(draft.imageUrl)
          ) {
            coverUrl = draft.imageUrl.trim();
          } else if (!draft.imageDataUrl && image.startsWith("http")) {
            coverUrl = image;
          }

          const created = await createEvent(accessToken, {
            title: draft.title.trim() || "Untitled meet",
            description: draft.description.trim() || "—",
            max_capacity: Math.max(4, draft.capacity),
            price: Math.max(0, draft.priceCents) / 100,
            event_date: startsAtIso,
            location,
            ...(coverUrl ? { cover_image_url: coverUrl } : {}),
            visibility: draft.listingVisibility,
            waitlist_enabled: true,
          });

          for (let i = 0; i < draft.preJoinQuestions.length; i++) {
            const row = draft.preJoinQuestions[i];
            const opts = row.options.map((o) => o.trim()).filter(Boolean);
            if (opts.length < 2) continue;
            await addEventQuestion(accessToken, created.id, {
              question_text: row.prompt.trim(),
              question_type: "single_select",
              options: opts.slice(0, 6),
              is_required: true,
              sort_order: i + 1,
            });
          }

          const published = await publishEvent(accessToken, created.id);
          const ev = circleEventToMeetEvent(published);
          publishHostedEvent({
            ...ev,
            category: primaryCategory,
            categories: cats,
            cityId: draft.cityId,
            moreAbout: draft.moreAbout.trim() || undefined,
            whatsIncluded: whatsIncluded.length ? whatsIncluded : undefined,
            guestSuggestions: guestSuggestions.length
              ? guestSuggestions
              : undefined,
            allowedAndNotes: draft.allowedAndNotes.trim() || undefined,
            houseRules:
              dos.length || donts.length ? { dos, donts } : undefined,
            faqs: faqs.length ? faqs : undefined,
            preJoinQuestions: preJoinQuestions.length
              ? preJoinQuestions
              : undefined,
            joinMode: draft.joinMode,
            shareToken: generateShareToken(),
          });
          toast.success("Meet published — manage it under Bookings.");
          router.push("/bookings");
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : "Could not publish to Circle API",
          );
        } finally {
          setPublishing(false);
        }
        return;
      }

      const ev: MeetEvent = {
        id: `evt_u_${Math.random().toString(36).slice(2, 11)}`,
        title: draft.title.trim() || "Untitled meet",
        description: draft.description.trim() || "—",
        cityId: draft.cityId,
        startsAt: startsAtIso,
        hostUserId: user.id,
        capacity: Math.max(4, draft.capacity),
        category: primaryCategory,
        categories: cats,
        image,
        priceCents: Math.max(0, draft.priceCents),
        venueName: draft.venueName.trim() || undefined,
        addressLine: draft.addressLine.trim() || undefined,
        joinMode: draft.joinMode,
        listingVisibility: draft.listingVisibility,
        shareToken: generateShareToken(),
        spotsTaken: 0,
        moreAbout: draft.moreAbout.trim() || undefined,
        whatsIncluded: whatsIncluded.length ? whatsIncluded : undefined,
        guestSuggestions: guestSuggestions.length ? guestSuggestions : undefined,
        allowedAndNotes: draft.allowedAndNotes.trim() || undefined,
        houseRules:
          dos.length || donts.length
            ? { dos, donts }
            : undefined,
        faqs: faqs.length ? faqs : undefined,
        preJoinQuestions: preJoinQuestions.length ? preJoinQuestions : undefined,
      };

      publishHostedEvent(ev);
      toast.success("Meet published (mock) — manage it under Bookings.");
      router.push("/bookings");
    })();
  };

  const inputClass = cn(
    "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm outline-none transition",
    "placeholder:text-neutral-400",
    "focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10",
  );

  return (
    <div className="mt-10 w-full rounded-(--radius-section) border border-neutral-200 bg-white/90 p-5 shadow-sm sm:p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
        Step {step + 1} / {STEPS}
      </p>
      <div
        className="mt-3 flex gap-1.5"
        role="progressbar"
        aria-valuenow={step + 1}
        aria-valuemin={1}
        aria-valuemax={STEPS}
        aria-label="Wizard progress"
      >
        {Array.from({ length: STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              i <= step ? "bg-neutral-900" : "bg-neutral-200",
            )}
          />
        ))}
      </div>

      {step === 0 && (
        <div className="mt-4 space-y-4">
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
        </div>
      )}

      {step === 1 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900">City</label>
            <select
              className={inputClass}
              value={draft.cityId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, cityId: e.target.value }))
              }
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
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

      {step === 2 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900">Starts at</label>
            <input
              type="datetime-local"
              className={inputClass}
              value={draft.startsAt}
              onChange={(e) =>
                setDraft((d) => ({ ...d, startsAt: e.target.value }))
              }
            />
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
              <label className="text-sm font-semibold text-neutral-900">Price (cents)</label>
              <input
                type="number"
                min={0}
                step={100}
                className={inputClass}
                value={draft.priceCents}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    priceCents: Math.max(0, Number(e.target.value) || 0),
                  }))
                }
              />
              <p className="mt-1 text-xs text-muted">
                e.g. 2500 = $25.00 (mock — no real charge).
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900">Join policy</label>
            <select
              className={inputClass}
              value={draft.joinMode}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  joinMode: e.target.value as "open" | "invite",
                }))
              }
            >
              <option value="open">Open — anyone can join instantly</option>
              <option value="invite">
                Invite — guests request; you approve
              </option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-neutral-900">Listing</label>
            <select
              className={inputClass}
              value={draft.listingVisibility}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  listingVisibility: e.target.value as "public" | "private",
                }))
              }
            >
              <option value="public">Public — shown on Explore</option>
              <option value="private">Private — link only</option>
            </select>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-semibold text-neutral-900">Cover image</p>
            <p className="mt-1 text-xs leading-relaxed text-neutral-600">
              Upload a file from your device, or paste an HTTPS image URL below.
              Uploads stay in this browser only (demo).
            </p>

            <input
              ref={coverFileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Upload cover image"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) applyCoverFile(file);
                e.target.value = "";
              }}
            />

            <div
              role="button"
              tabIndex={0}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCoverDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCoverDragActive(false);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCoverDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file) applyCoverFile(file);
              }}
              onClick={() => coverFileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  coverFileInputRef.current?.click();
                }
              }}
              className={cn(
                "mt-3 flex w-full min-h-[168px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
                coverDragActive
                  ? "border-neutral-900 bg-neutral-100"
                  : "border-neutral-300 bg-neutral-50 hover:border-neutral-500 hover:bg-neutral-100/90",
              )}
            >
              <Upload
                className="h-10 w-10 text-neutral-500"
                strokeWidth={1.5}
                aria-hidden
              />
              <span className="mt-3 text-sm font-semibold text-neutral-900">
                {coverDragActive ? "Drop image here" : "Click to upload"}
              </span>
              <span className="mt-1 text-xs text-neutral-600">
                or drag and drop — PNG, JPG, WebP · max 750KB
              </span>
            </div>

            {draft.imageDataUrl ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="text-xs font-semibold text-neutral-900 underline-offset-2 hover:underline"
                >
                  Replace image
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, imageDataUrl: null }))
                  }
                  className="text-xs font-semibold text-red-700 underline-offset-2 hover:underline"
                >
                  Remove upload
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="host-cover-image-url"
              className="text-sm font-semibold text-neutral-900"
            >
              Image URL (optional)
            </label>
            <p className="mt-1 text-xs text-neutral-600">
              Use a direct link if you prefer not to upload. Entering a URL
              clears an uploaded file.
            </p>
            <input
              id="host-cover-image-url"
              className={inputClass}
              value={draft.imageUrl}
              placeholder="https://…"
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  imageUrl: e.target.value,
                  imageDataUrl: e.target.value ? null : d.imageDataUrl,
                }))
              }
            />
          </div>

          {(draft.imageDataUrl ||
            (draft.imageUrl.trim() && isProbablyUrl(draft.imageUrl))) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Preview
              </p>
              <div className="relative mt-2 aspect-4/3 w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={draft.imageDataUrl ?? draft.imageUrl.trim()}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900">About this meet (longer)</label>
            <textarea
              className={`${inputClass} min-h-[120px] resize-y`}
              value={draft.moreAbout}
              onChange={(e) =>
                setDraft((d) => ({ ...d, moreAbout: e.target.value }))
              }
              placeholder="What happens, tone, accessibility…"
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">What&apos;s included</p>
            <p className="mt-1 text-xs text-muted">
              One line per item (empty lines are ignored).
            </p>
            <div className="mt-2 space-y-2">
              {draft.whatsIncludedLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass + " mt-0"}
                    value={line}
                    onChange={(e) => {
                      const next = [...draft.whatsIncludedLines];
                      next[i] = e.target.value;
                      setDraft((d) => ({ ...d, whatsIncludedLines: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="mt-0 shrink-0 rounded-full border border-primary/20 px-3 text-sm"
                    onClick={() => {
                      const next = draft.whatsIncludedLines.filter(
                        (_, j) => j !== i,
                      );
                      setDraft((d) => ({
                        ...d,
                        whatsIncludedLines:
                          next.length > 0 ? next : [""],
                      }));
                    }}
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
                    whatsIncludedLines: [...d.whatsIncludedLines, ""],
                  }))
                }
              >
                + Add line
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Suggestions for guests</p>
            <p className="mt-1 text-xs text-muted">
              Short tips (one per line); shown on the event page if set.
            </p>
            <div className="mt-2 space-y-2">
              {draft.guestSuggestions.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass + " mt-0"}
                    value={line}
                    onChange={(e) => {
                      const next = [...draft.guestSuggestions];
                      next[i] = e.target.value;
                      setDraft((d) => ({ ...d, guestSuggestions: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="mt-0 shrink-0 rounded-full border border-primary/20 px-3 text-sm"
                    onClick={() => {
                      const next = draft.guestSuggestions.filter(
                        (_, j) => j !== i,
                      );
                      setDraft((d) => ({
                        ...d,
                        guestSuggestions: next.length > 0 ? next : [""],
                      }));
                    }}
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
        </div>
      )}

      {step === 6 && (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-semibold text-neutral-900">
              What&apos;s allowed &amp; good to know
            </label>
            <textarea
              className={`${inputClass} min-h-[100px] resize-y`}
              value={draft.allowedAndNotes}
              onChange={(e) =>
                setDraft((d) => ({ ...d, allowedAndNotes: e.target.value }))
              }
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Do</p>
            <div className="mt-2 space-y-2">
              {draft.houseDos.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass + " mt-0"}
                    value={line}
                    onChange={(e) => {
                      const next = [...draft.houseDos];
                      next[i] = e.target.value;
                      setDraft((d) => ({ ...d, houseDos: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="mt-0 shrink-0 rounded-full border border-primary/20 px-3 text-sm"
                    onClick={() => {
                      const next = draft.houseDos.filter((_, j) => j !== i);
                      setDraft((d) => ({
                        ...d,
                        houseDos: next.length > 0 ? next : [""],
                      }));
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() =>
                  setDraft((d) => ({ ...d, houseDos: [...d.houseDos, ""] }))
                }
              >
                + Add
              </button>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Don&apos;t</p>
            <div className="mt-2 space-y-2">
              {draft.houseDonts.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputClass + " mt-0"}
                    value={line}
                    onChange={(e) => {
                      const next = [...draft.houseDonts];
                      next[i] = e.target.value;
                      setDraft((d) => ({ ...d, houseDonts: next }));
                    }}
                  />
                  <button
                    type="button"
                    className="mt-0 shrink-0 rounded-full border border-primary/20 px-3 text-sm"
                    onClick={() => {
                      const next = draft.houseDonts.filter((_, j) => j !== i);
                      setDraft((d) => ({
                        ...d,
                        houseDonts: next.length > 0 ? next : [""],
                      }));
                    }}
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
      )}

      {step === 7 && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Pick up to three categories. These appear on Explore and on your event
            page.
          </p>
          <div className="flex flex-wrap gap-2">
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
          <p className="text-xs text-muted-foreground">
            Selected: {draft.categories.length ? draft.categories.join(" · ") : "—"}
          </p>
        </div>
      )}

      {step === 8 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
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
        </div>
      )}

      {step === 9 && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted-foreground">
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
              <p className="text-xs font-medium text-muted-foreground">
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
            {publishing
              ? "Publishing…"
              : isCircleApiConfigured() && accessToken
                ? "Publish"
                : "Publish (mock)"}
          </button>
        )}
      </div>
    </div>
  );
}
