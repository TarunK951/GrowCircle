"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { getLandmarkForCityId } from "@/data/cityLandmarks";
import { cn } from "@/lib/utils";
import type { CityOption } from "./filterTypes";

export function CityPickerModal({
  open,
  onClose,
  cities,
  selectedId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  cities: CityOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Close city picker"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-zinc-200/80 bg-[var(--glass-bg,#fff)] shadow-2xl sm:max-h-[85vh] sm:rounded-2xl dark:border-white/10 dark:bg-zinc-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="city-picker-title"
      >
        <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-white/10 sm:px-5">
          <h2
            id="city-picker-title"
            className="font-onest text-lg font-semibold text-foreground"
          >
            Choose a city
          </h2>
          <button
            type="button"
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                onSelect("");
                onClose();
              }}
              className={cn(
                "group flex flex-col overflow-hidden rounded-xl border-2 text-left transition",
                selectedId === ""
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-zinc-200/90 hover:border-primary/40 dark:border-white/15",
              )}
            >
              <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80&auto=format&fit=crop"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width:640px) 100vw, 360px"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                <span className="absolute bottom-2 left-2 right-2 text-sm font-bold text-white drop-shadow">
                  All cities
                </span>
              </div>
              <p className="px-3 py-2 text-xs text-muted">Everywhere we list</p>
            </button>

            {cities.map((c) => {
              const lm = getLandmarkForCityId(c.id);
              const img = lm?.image ?? "";
              const landmark = lm?.landmark ?? "";
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  className={cn(
                    "group flex flex-col overflow-hidden rounded-xl border-2 text-left transition",
                    selectedId === c.id
                      ? "border-primary ring-2 ring-primary/25"
                      : "border-zinc-200/90 hover:border-primary/40 dark:border-white/15",
                  )}
                >
                  <div className="relative aspect-[16/10] w-full bg-zinc-100 dark:bg-zinc-800">
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover transition group-hover:scale-[1.02]"
                        sizes="(max-width:640px) 100vw, 360px"
                      />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute bottom-2 left-2 right-2 text-sm font-bold text-white drop-shadow">
                      {c.name}
                    </span>
                  </div>
                  {landmark ? (
                    <p className="truncate px-3 py-2 text-xs text-muted">
                      {landmark}
                    </p>
                  ) : (
                    <p className="px-3 py-2 text-xs text-muted">&nbsp;</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
