"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import {
  addEventQuestion,
  deleteEventQuestion,
  getEventQuestions,
  updateEvent,
  updateEventQuestion,
} from "@/lib/circle/api";
import { CircleApiError } from "@/lib/circle/client";
import { isCircleApiConfigured } from "@/lib/circle/config";
import { CircleHostMeetSection } from "@/components/bookings/CircleHostMeetSection";
import { EventMeetDetail } from "@/components/events/EventMeetDetail";
import { mergeEventCatalog } from "@/lib/eventsCatalog";
import { resolveEventDetail } from "@/lib/eventDetail";
import { formatInrFromCents } from "@/lib/formatCurrency";
import { hostLabelForEvent } from "@/lib/hostName";
import { getMediaUploadUrl, uploadToPresignedUrl } from "@/lib/circle/mediaApi";
import { selectAccessToken, selectUser } from "@/lib/store/authSlice";
import { useAppSelector } from "@/lib/store/hooks";
import { useSessionStore } from "@/stores/session-store";
import { cn } from "@/lib/utils";
import { meetEventGalleryUrls } from "@/lib/events/coverDisplay";
import citiesData from "@/data/cities.json";
import type { PreJoinQuestion } from "@/lib/types";
import type { City } from "@/lib/types";

type Tab = "preview" | "questions" | "approve";
type EditableQuestion = { id?: string; prompt: string; options: string[] };
type EditableFaq = { q: string; a: string };
type EditableDetailDraft = {
  moreAbout: string;
  whatsIncluded: string[];
  guestSuggestions: string[];
  allowedAndNotes: string;
  dos: string[];
  donts: string[];
  faqs: EditableFaq[];
  refundPolicy: string;
};

const MAX_IMAGE_BYTES_LOCAL = 750 * 1024;
const MAX_IMAGE_BYTES_CIRCLE = 5 * 1024 * 1024;
const MAX_IMAGES = 10;

function uniqueFirstN(urls: string[], max = MAX_IMAGES): string[] {
  return Array.from(
    new Set(urls.map((url) => url.trim()).filter(Boolean)),
  ).slice(0, max);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read selected image"));
    reader.readAsDataURL(file);
  });
}

function seatCountForEvent(
  eventId: string,
  bookings: { eventId: string; status: string }[],
): number {
  return bookings.filter(
    (b) =>
      b.eventId === eventId &&
      (b.status === "confirmed" || b.status === "attended"),
  ).length;
}

function trimLines(lines: string[]): string[] {
  return lines.map((line) => line.trim()).filter(Boolean);
}

function detailsFromEvent(event: {
  moreAbout?: string;
  whatsIncluded?: string[];
  guestSuggestions?: string[];
  allowedAndNotes?: string;
  houseRules?: { dos?: string[]; donts?: string[] };
  faqs?: { q: string; a: string }[];
  refundPolicy?: string;
}): EditableDetailDraft {
  return {
    moreAbout: event.moreAbout ?? "",
    whatsIncluded: event.whatsIncluded?.length ? event.whatsIncluded : [""],
    guestSuggestions: event.guestSuggestions?.length ? event.guestSuggestions : [""],
    allowedAndNotes: event.allowedAndNotes ?? "",
    dos: event.houseRules?.dos?.length ? event.houseRules.dos : [""],
    donts: event.houseRules?.donts?.length ? event.houseRules.donts : [""],
    faqs: event.faqs?.length ? event.faqs : [{ q: "", a: "" }],
    refundPolicy: event.refundPolicy ?? "",
  };
}

function normalizeQuestionRows(rows: EditableQuestion[]): EditableQuestion[] {
  return rows.map((q) => ({
    id: q.id,
    prompt: q.prompt.trim(),
    options: q.options.map((x) => x.trim()).filter(Boolean).slice(0, 6),
  }));
}

const editorInputClass =
  "mt-0 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10";
const editorTextareaClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none transition focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10";

export default function HostManagePage() {
  const params = useParams<{ eventId: string }>();
  const searchParams = useSearchParams();
  const hostedEvents = useSessionStore((s) => s.hostedEvents);
  const circleCatalogEvents = useSessionStore((s) => s.circleCatalogEvents);
  const bookings = useSessionStore((s) => s.bookings);
  const approveBooking = useSessionStore((s) => s.approveBooking);
  const removeGuestBooking = useSessionStore((s) => s.removeGuestBooking);
  const markAttendance = useSessionStore((s) => s.markAttendance);
  const updateHostedEvent = useSessionStore((s) => s.updateHostedEvent);
  const user = useAppSelector(selectUser);
  const accessToken = useAppSelector(selectAccessToken);

  const eventId = params.eventId;
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(
    tabParam === "questions" || tabParam === "approve" ? tabParam : "preview",
  );
  const [codeInputs, setCodeInputs] = useState<Record<string, string>>({});
  const [rows, setRows] = useState<EditableQuestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [imagesBusy, setImagesBusy] = useState(false);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [previewEditMode, setPreviewEditMode] = useState(false);
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);
  const [detailDraft, setDetailDraft] = useState<EditableDetailDraft>({
    moreAbout: "",
    whatsIncluded: [""],
    guestSuggestions: [""],
    allowedAndNotes: "",
    dos: [""],
    donts: [""],
    faqs: [{ q: "", a: "" }],
    refundPolicy: "",
  });
  const imageInputRef = useRef<HTMLInputElement>(null);

  const catalog = useMemo(
    () => mergeEventCatalog(hostedEvents, circleCatalogEvents),
    [hostedEvents, circleCatalogEvents],
  );
  const event = catalog.find((ev) => ev.id === eventId) ?? null;

  const canManage = Boolean(user && event && event.hostUserId === user.id);
  const circleMode =
    Boolean(accessToken) &&
    isCircleApiConfigured() &&
    event?.cityId === "circle";
  const cities = citiesData as City[];

  useEffect(() => {
    if (!event) return;
    if (!circleMode) {
      setRows(
        (event.preJoinQuestions ?? []).map((q) => ({
          id: q.id,
          prompt: q.prompt,
          options: q.options,
        })),
      );
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const remote = await getEventQuestions(event.id);
        if (cancelled) return;
        const next = remote
          .filter(
            (q) =>
              q.question_type === "single_select" ||
              q.question_type === "multi_select",
          )
          .map((q) => ({
            id: q.id,
            prompt: q.question_text,
            options: (q.options ?? []).filter(Boolean).slice(0, 6),
          }));
        setRows(next);
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e instanceof CircleApiError ? e.message : "Could not load questions",
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [event, circleMode]);

  useEffect(() => {
    if (!event) return;
    setGalleryDraft(meetEventGalleryUrls(event));
    setDetailDraft(detailsFromEvent(event));
  }, [event]);

  useEffect(() => {
    if (tab !== "preview") setPreviewEditMode(false);
  }, [tab]);

  if (!event || !canManage) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-24 text-neutral-900 sm:px-6 lg:px-8">
        <p className="text-sm font-medium">You cannot manage this meet.</p>
        <Link href="/bookings" className="mt-4 inline-flex text-sm font-semibold underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const localBookings = bookings.filter((b) => b.eventId === event.id);
  const seatCount = seatCountForEvent(event.id, localBookings);
  const previewEvent = {
    ...event,
    image: galleryDraft[0] ?? "",
    additionalImages: galleryDraft.slice(1),
    moreAbout: detailDraft.moreAbout.trim() || undefined,
    whatsIncluded: trimLines(detailDraft.whatsIncluded),
    guestSuggestions: trimLines(detailDraft.guestSuggestions),
    allowedAndNotes: detailDraft.allowedAndNotes.trim() || undefined,
    houseRules: {
      dos: trimLines(detailDraft.dos),
      donts: trimLines(detailDraft.donts),
    },
    faqs: detailDraft.faqs
      .map((row) => ({ q: row.q.trim(), a: row.a.trim() }))
      .filter((row) => row.q && row.a),
    refundPolicy: detailDraft.refundPolicy.trim() || undefined,
  };
  const detail = resolveEventDetail(previewEvent, {
    overrideSpotsTaken: Math.min(previewEvent.capacity, seatCount),
  });
  const city = cities.find((c) => c.id === event.cityId);
  const hostName = hostLabelForEvent(event, user ?? null);
  const priceLabel = formatInrFromCents(event.priceCents, { decimals: 2 });
  const whenLabel = new Date(event.startsAt).toLocaleString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const addImages = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    if (!event) return;
    setImagesBusy(true);
    try {
      const nextUrls: string[] = [];
      const maxBytes = circleMode ? MAX_IMAGE_BYTES_CIRCLE : MAX_IMAGE_BYTES_LOCAL;
      for (const file of Array.from(list)) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name}: please select image files only.`);
          continue;
        }
        if (file.size > maxBytes) {
          toast.error(
            circleMode
              ? `${file.name}: must be under 5MB.`
              : `${file.name}: must be under 750KB for local demo storage.`,
          );
          continue;
        }
        if (circleMode && accessToken) {
          const ext = file.name.includes(".")
            ? file.name.split(".").pop()?.trim() || "jpg"
            : "jpg";
          const mime = file.type || "image/jpeg";
          const { uploadUrl, publicUrl } = await getMediaUploadUrl(accessToken, {
            fileName: `event-manage-${Date.now()}-${nextUrls.length}.${ext}`,
            fileType: mime,
            folder: "events",
          });
          await uploadToPresignedUrl(uploadUrl, file, mime);
          nextUrls.push(publicUrl);
        } else {
          const dataUrl = await fileToDataUrl(file);
          nextUrls.push(dataUrl);
        }
      }
      if (nextUrls.length > 0) {
        setGalleryDraft((prev) => uniqueFirstN([...prev, ...nextUrls]));
      }
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Could not upload selected images",
      );
    } finally {
      setImagesBusy(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const saveImages = async () => {
    if (!event) return;
    const normalized = uniqueFirstN(galleryDraft);
    const cover = normalized[0] ?? "";
    const imageUrls = normalized.slice(1);
    setImagesBusy(true);
    try {
      if (circleMode && accessToken) {
        await updateEvent(accessToken, event.id, {
          cover_image_url: cover || null,
          image_urls: imageUrls,
        });
      }
      updateHostedEvent(event.id, {
        image: cover,
        additionalImages: imageUrls.length > 0 ? imageUrls : undefined,
      });
      toast.success("Images updated.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Could not save images",
      );
    } finally {
      setImagesBusy(false);
    }
  };

  const saveDetails = async () => {
    if (!event) return;
    setDetailsBusy(true);
    try {
      const whatsIncluded = trimLines(detailDraft.whatsIncluded);
      const guestSuggestions = trimLines(detailDraft.guestSuggestions);
      const dos = trimLines(detailDraft.dos);
      const donts = trimLines(detailDraft.donts);
      const faqs = detailDraft.faqs
        .map((row) => ({ q: row.q.trim(), a: row.a.trim() }))
        .filter((row) => row.q && row.a);
      updateHostedEvent(event.id, {
        moreAbout: detailDraft.moreAbout.trim() || undefined,
        whatsIncluded: whatsIncluded.length > 0 ? whatsIncluded : undefined,
        guestSuggestions: guestSuggestions.length > 0 ? guestSuggestions : undefined,
        allowedAndNotes: detailDraft.allowedAndNotes.trim() || undefined,
        houseRules:
          dos.length > 0 || donts.length > 0 ? { dos, donts } : undefined,
        faqs: faqs.length > 0 ? faqs : undefined,
        refundPolicy: detailDraft.refundPolicy.trim() || undefined,
      });
      if (circleMode && accessToken) {
        await updateEvent(accessToken, event.id, {
          faqs: faqs.length > 0 ? faqs : [],
        });
      }
      toast.success("Preview content updated.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Could not save details",
      );
    } finally {
      setDetailsBusy(false);
    }
  };

  const saveQuestions = async () => {
    const normalized = normalizeQuestionRows(rows).filter((q) => q.prompt && q.options.length >= 2);
    setBusy(true);
    try {
      if (circleMode && accessToken) {
        const existingIds = new Set(normalized.map((x) => x.id).filter(Boolean));
        const current = await getEventQuestions(event.id);
        const deletable = current.filter(
          (q) =>
            (q.question_type === "single_select" || q.question_type === "multi_select") &&
            !existingIds.has(q.id),
        );
        for (const q of normalized) {
          if (q.id) {
            await updateEventQuestion(accessToken, event.id, q.id, {
              question_text: q.prompt,
              options: q.options,
              question_type: "single_select",
              is_required: true,
            });
          } else {
            await addEventQuestion(accessToken, event.id, {
              question_text: q.prompt,
              options: q.options,
              question_type: "single_select",
              is_required: true,
            });
          }
        }
        for (const d of deletable) {
          await deleteEventQuestion(accessToken, event.id, d.id);
        }
      }

      const localRows: PreJoinQuestion[] = normalized.map((q, idx) => ({
        id: q.id || `q_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        prompt: q.prompt,
        options: q.options,
      }));
      updateHostedEvent(event.id, {
        preJoinQuestions: localRows.length > 0 ? localRows : undefined,
      });
      toast.success("Questions updated.");
    } catch (e) {
      toast.error(
        e instanceof CircleApiError ? e.message : "Could not save questions",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-14 pt-24 text-neutral-900 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-700">Manage</p>
          <h1 className="font-onest text-2xl font-semibold text-neutral-900">{event.title}</h1>
        </div>
        <Link href="/bookings" className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-100">
          Back
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["preview", "questions", "approve"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold",
              tab === t
                ? "bg-neutral-900 text-white"
                : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
            )}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "preview" && (
        <section className="mt-6 space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-white p-0 shadow-sm">
            <div className="border-b border-neutral-200 px-4 py-3 sm:px-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                Guest preview (same layout as attendee view)
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <EventMeetDetail
                event={previewEvent}
                detail={detail}
                cityName={previewEvent.displayLocation ?? city?.name ?? ""}
                hostName={hostName}
                priceLabel={priceLabel}
                whenLabel={whenLabel}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Preview controls</p>
                <p className="mt-1 text-xs text-neutral-700">
                  Preview is read-only by default. Enable edit mode to modify fields.
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-semibold",
                  previewEditMode
                    ? "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100"
                    : "bg-neutral-900 text-white",
                )}
                onClick={() => setPreviewEditMode((v) => !v)}
              >
                {previewEditMode ? "Done editing" : "Edit options"}
              </button>
            </div>
          </div>

          {previewEditMode && (
            <>
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">Event images (cover + gallery)</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => void addImages(e.target.files)}
                />
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-900 hover:bg-neutral-100"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={imagesBusy}
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden />
                  {imagesBusy ? "Uploading..." : "Upload images"}
                </button>
                <button
                  type="button"
                  className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  onClick={() => void saveImages()}
                  disabled={imagesBusy}
                >
                  Save images
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-neutral-700">
              First image is the cover. You can upload up to {MAX_IMAGES} images.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {galleryDraft.length === 0 ? (
                <p className="text-sm text-neutral-700">No images yet. Upload one to set cover.</p>
              ) : (
                galleryDraft.map((url, idx) => (
                  <div
                    key={`${idx}-${url.slice(0, 24)}`}
                    className="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-1.5 text-xs"
                  >
                    <span className="font-semibold text-neutral-900">
                      {idx === 0 ? "Cover" : `Image ${idx + 1}`}
                    </span>
                    <button
                      type="button"
                      className="rounded-full border border-neutral-300 px-2 py-0.5 text-[11px] font-semibold hover:bg-neutral-100 disabled:opacity-60"
                      disabled={idx === 0 || imagesBusy}
                      onClick={() =>
                        setGalleryDraft((prev) => {
                          const copy = [...prev];
                          const picked = copy[idx];
                          copy.splice(idx, 1);
                          copy.unshift(picked);
                          return copy;
                        })
                      }
                    >
                      Set cover
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-red-200 px-2 py-0.5 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      disabled={imagesBusy}
                      onClick={() =>
                        setGalleryDraft((prev) => prev.filter((_, i) => i !== idx))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-neutral-900">Meet details shown to guests</p>
              <button
                type="button"
                className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                onClick={saveDetails}
                disabled={detailsBusy}
              >
                {detailsBusy ? "Saving..." : "Save details"}
              </button>
            </div>

            <div className="mt-4 space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  About this meet
                </label>
                <textarea
                  className={cn(editorTextareaClass, "mt-2 min-h-20")}
                  value={detailDraft.moreAbout}
                  onChange={(e) =>
                    setDetailDraft((prev) => ({ ...prev, moreAbout: e.target.value }))
                  }
                  placeholder="Add a richer description for guests"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  What&apos;s included
                </label>
                <div className="mt-2 space-y-2">
                  {detailDraft.whatsIncluded.map((line, idx) => (
                    <div key={`wi-${idx}`} className="flex gap-2">
                      <input
                        className={editorInputClass}
                        value={line}
                        onChange={(e) =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            whatsIncluded: prev.whatsIncluded.map((x, i) =>
                              i === idx ? e.target.value : x,
                            ),
                          }))
                        }
                        placeholder={`Included item ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700"
                        onClick={() =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            whatsIncluded:
                              prev.whatsIncluded.length > 1
                                ? prev.whatsIncluded.filter((_, i) => i !== idx)
                                : [""],
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    setDetailDraft((prev) => ({
                      ...prev,
                      whatsIncluded: [...prev.whatsIncluded, ""],
                    }))
                  }
                >
                  + Add item
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
                    Do&apos;s
                  </label>
                  <div className="mt-2 space-y-2">
                    {detailDraft.dos.map((line, idx) => (
                      <div key={`do-${idx}`} className="flex gap-2">
                        <input
                          className={editorInputClass}
                          value={line}
                          onChange={(e) =>
                            setDetailDraft((prev) => ({
                              ...prev,
                              dos: prev.dos.map((x, i) => (i === idx ? e.target.value : x)),
                            }))
                          }
                          placeholder={`Do ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700"
                          onClick={() =>
                            setDetailDraft((prev) => ({
                              ...prev,
                              dos: prev.dos.length > 1 ? prev.dos.filter((_, i) => i !== idx) : [""],
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                    onClick={() =>
                      setDetailDraft((prev) => ({ ...prev, dos: [...prev.dos, ""] }))
                    }
                  >
                    + Add do
                  </button>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">
                    Don&apos;ts
                  </label>
                  <div className="mt-2 space-y-2">
                    {detailDraft.donts.map((line, idx) => (
                      <div key={`dont-${idx}`} className="flex gap-2">
                        <input
                          className={editorInputClass}
                          value={line}
                          onChange={(e) =>
                            setDetailDraft((prev) => ({
                              ...prev,
                              donts: prev.donts.map((x, i) => (i === idx ? e.target.value : x)),
                            }))
                          }
                          placeholder={`Don't ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700"
                          onClick={() =>
                            setDetailDraft((prev) => ({
                              ...prev,
                              donts:
                                prev.donts.length > 1 ? prev.donts.filter((_, i) => i !== idx) : [""],
                            }))
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                    onClick={() =>
                      setDetailDraft((prev) => ({ ...prev, donts: [...prev.donts, ""] }))
                    }
                  >
                    + Add don&apos;t
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  Suggestions
                </label>
                <div className="mt-2 space-y-2">
                  {detailDraft.guestSuggestions.map((line, idx) => (
                    <div key={`gs-${idx}`} className="flex gap-2">
                      <input
                        className={editorInputClass}
                        value={line}
                        onChange={(e) =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            guestSuggestions: prev.guestSuggestions.map((x, i) =>
                              i === idx ? e.target.value : x,
                            ),
                          }))
                        }
                        placeholder={`Suggestion ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700"
                        onClick={() =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            guestSuggestions:
                              prev.guestSuggestions.length > 1
                                ? prev.guestSuggestions.filter((_, i) => i !== idx)
                                : [""],
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    setDetailDraft((prev) => ({
                      ...prev,
                      guestSuggestions: [...prev.guestSuggestions, ""],
                    }))
                  }
                >
                  + Add suggestion
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  Allowed & good to know
                </label>
                <textarea
                  className={cn(editorTextareaClass, "mt-2 min-h-20")}
                  value={detailDraft.allowedAndNotes}
                  onChange={(e) =>
                    setDetailDraft((prev) => ({ ...prev, allowedAndNotes: e.target.value }))
                  }
                  placeholder="Share what is allowed and key notes"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  FAQ
                </label>
                <div className="mt-2 space-y-2">
                  {detailDraft.faqs.map((row, idx) => (
                    <div key={`faq-${idx}`} className="rounded-xl border border-neutral-200 p-3">
                      <input
                        className={editorInputClass}
                        value={row.q}
                        onChange={(e) =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            faqs: prev.faqs.map((x, i) =>
                              i === idx ? { ...x, q: e.target.value } : x,
                            ),
                          }))
                        }
                        placeholder="Question"
                      />
                      <textarea
                        className={cn(editorTextareaClass, "mt-2 min-h-16")}
                        value={row.a}
                        onChange={(e) =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            faqs: prev.faqs.map((x, i) =>
                              i === idx ? { ...x, a: e.target.value } : x,
                            ),
                          }))
                        }
                        placeholder="Answer"
                      />
                      <button
                        type="button"
                        className="mt-2 rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                        onClick={() =>
                          setDetailDraft((prev) => ({
                            ...prev,
                            faqs:
                              prev.faqs.length > 1
                                ? prev.faqs.filter((_, i) => i !== idx)
                                : [{ q: "", a: "" }],
                          }))
                        }
                      >
                        Remove FAQ
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    setDetailDraft((prev) => ({
                      ...prev,
                      faqs: [...prev.faqs, { q: "", a: "" }],
                    }))
                  }
                >
                  + Add FAQ
                </button>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                    Pre-join questions
                  </label>
                  <button
                    type="button"
                    className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    onClick={() => void saveQuestions()}
                    disabled={busy}
                  >
                    {busy ? "Saving..." : "Save questions"}
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {rows.map((row, idx) => (
                    <div key={row.id ?? `preview-q-${idx}`} className="rounded-xl border border-neutral-200 p-3">
                      <input
                        className={editorInputClass}
                        placeholder="Question"
                        value={row.prompt}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x, i) => (i === idx ? { ...x, prompt: e.target.value } : x)),
                          )
                        }
                      />
                      <div className="mt-2 space-y-2">
                        {row.options.map((opt, oi) => (
                          <input
                            key={oi}
                            className={editorInputClass}
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={(e) =>
                              setRows((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        options: x.options.map((v, vi) => (vi === oi ? e.target.value : v)),
                                      }
                                    : x,
                                ),
                              )
                            }
                          />
                        ))}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                          onClick={() =>
                            setRows((prev) =>
                              prev.map((x, i) =>
                                i === idx && x.options.length < 6
                                  ? { ...x, options: [...x.options, ""] }
                                  : x,
                              ),
                            )
                          }
                        >
                          + Option
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                          onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                  onClick={() => setRows((prev) => [...prev, { prompt: "", options: ["", ""] }])}
                >
                  + Add question
                </button>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
                  Refund policy (shown last)
                </label>
                <textarea
                  className={cn(editorTextareaClass, "mt-2 min-h-20")}
                  value={detailDraft.refundPolicy}
                  onChange={(e) =>
                    setDetailDraft((prev) => ({ ...prev, refundPolicy: e.target.value }))
                  }
                  placeholder="Example: Full refund up to 24 hours before start; no refund after that."
                />
              </div>
            </div>
          </div>
            </>
          )}
        </section>
      )}

      {tab === "questions" && (
        <section className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          {rows.map((row, idx) => (
            <div key={row.id ?? `new-${idx}`} className="rounded-xl border border-neutral-200 p-4">
              <input
                className={editorInputClass}
                placeholder="Question"
                value={row.prompt}
                onChange={(e) =>
                  setRows((prev) =>
                    prev.map((x, i) => (i === idx ? { ...x, prompt: e.target.value } : x)),
                  )
                }
              />
              <div className="mt-2 space-y-2">
                {row.options.map((opt, oi) => (
                  <input
                    key={oi}
                    className={editorInputClass}
                    placeholder={`Option ${oi + 1}`}
                    value={opt}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x, i) =>
                          i === idx
                            ? {
                                ...x,
                                options: x.options.map((v, vi) => (vi === oi ? e.target.value : v)),
                              }
                            : x,
                        ),
                      )
                    }
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    setRows((prev) =>
                      prev.map((x, i) =>
                        i === idx && x.options.length < 6
                          ? { ...x, options: [...x.options, ""] }
                          : x,
                      ),
                    )
                  }
                >
                  + Option
                </button>
                <button
                  type="button"
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700"
                  onClick={() => setRows((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold"
              onClick={() => setRows((prev) => [...prev, { prompt: "", options: ["", ""] }])}
            >
              Add question
            </button>
            <button
              type="button"
              disabled={busy}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={() => void saveQuestions()}
            >
              {busy ? "Saving..." : "Save questions"}
            </button>
          </div>
        </section>
      )}

      {tab === "approve" &&
        (circleMode && accessToken ? (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <CircleHostMeetSection eventId={event.id} accessToken={accessToken} active />
          </section>
        ) : (
          <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <ul className="space-y-2">
              {localBookings.length === 0 && (
                <li className="text-sm text-neutral-700">No guest applications yet.</li>
              )}
              {localBookings.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-200 p-3"
                >
                  <p className="text-sm font-semibold text-neutral-900">{b.userId}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {b.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white"
                          onClick={() => approveBooking(b.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                          onClick={() => removeGuestBooking(b.id)}
                        >
                          Remove
                        </button>
                      </>
                    ) : null}
                    {b.status === "confirmed" ? (
                      <>
                        <input
                          className={cn(editorInputClass, "w-24 py-1 text-xs")}
                          placeholder="OTP"
                          value={codeInputs[b.id] ?? ""}
                          onChange={(e) =>
                            setCodeInputs((prev) => ({
                              ...prev,
                              [b.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          type="button"
                          className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold"
                          onClick={() => {
                            const ok = markAttendance(b.id, codeInputs[b.id] ?? "");
                            if (ok) toast.success("Marked attended.");
                            else toast.error("Code does not match.");
                          }}
                        >
                          Mark attended
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
