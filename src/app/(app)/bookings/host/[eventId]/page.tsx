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

function normalizeQuestionRows(rows: EditableQuestion[]): EditableQuestion[] {
  return rows.map((q) => ({
    id: q.id,
    prompt: q.prompt.trim(),
    options: q.options.map((x) => x.trim()).filter(Boolean).slice(0, 6),
  }));
}

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
  const [galleryDraft, setGalleryDraft] = useState<string[]>([]);
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
  }, [event]);

  if (!event || !canManage) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-24 text-neutral-900 sm:px-6 lg:px-8">
        <p className="text-sm font-medium">You cannot manage this meet.</p>
        <Link href="/bookings" className="mt-4 inline-flex text-sm font-semibold underline">
          Back to bookings
        </Link>
      </div>
    );
  }

  const localBookings = bookings.filter((b) => b.eventId === event.id);
  const seatCount = seatCountForEvent(event.id, localBookings);
  const detail = resolveEventDetail(event, {
    overrideSpotsTaken: Math.min(event.capacity, seatCount),
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
    <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-24 text-neutral-900 sm:px-6 lg:px-8">
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
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-neutral-700">
              Guest preview (same layout as attendee view)
            </p>
            <EventMeetDetail
              event={{
                ...event,
                image: galleryDraft[0] ?? "",
                additionalImages: galleryDraft.slice(1),
              }}
              detail={detail}
              cityName={event.displayLocation ?? city?.name ?? ""}
              hostName={hostName}
              priceLabel={priceLabel}
              whenLabel={whenLabel}
            />
          </div>
        </section>
      )}

      {tab === "questions" && (
        <section className="mt-6 space-y-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          {rows.map((row, idx) => (
            <div key={row.id ?? `new-${idx}`} className="rounded-xl border border-neutral-200 p-4">
              <input
                className="liquid-glass-input mt-0 w-full text-sm text-neutral-900"
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
                    className="liquid-glass-input mt-0 w-full text-sm text-neutral-900"
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
                          className="liquid-glass-input w-24 py-1 text-xs text-neutral-900"
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
