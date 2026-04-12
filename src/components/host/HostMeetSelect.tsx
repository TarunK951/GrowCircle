"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type HostMeetSelectOption = {
  value: string;
  label: string;
};

type HostMeetSelectProps = {
  label: string;
  value: string;
  options: HostMeetSelectOption[];
  onChange: (value: string) => void;
  className?: string;
};

export function HostMeetSelect({
  label,
  value,
  options,
  onChange,
  className,
}: HostMeetSelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const selected = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={rootRef} className={cn("relative", open && "z-20", className)}>
      <label
        id={`${id}-label`}
        className="text-sm font-semibold text-neutral-900"
      >
        {label}
      </label>
      <button
        type="button"
        id={`${id}-btn`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-btn`}
        className={cn(
          "mt-2 flex w-full min-h-[2.75rem] items-center justify-between gap-2 rounded-2xl border border-neutral-300 bg-white px-3.5 py-2.5 text-left text-sm font-medium text-neutral-900 shadow-sm outline-none transition",
          "hover:border-neutral-400 hover:bg-neutral-50/80",
          "focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900/10",
          open && "border-neutral-900 ring-2 ring-neutral-900/10",
        )}
        onClick={() => setOpen(!open)}
      >
        <span className="min-w-0 flex-1 truncate">{selected}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-500 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <ul
          className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-56 overflow-auto rounded-2xl border border-neutral-200 bg-white p-1.5 text-sm shadow-lg ring-1 ring-black/5"
          role="listbox"
          aria-labelledby={`${id}-label`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex w-full rounded-xl px-3 py-2.5 text-left text-neutral-900 transition-colors",
                    isSelected
                      ? "bg-neutral-900 text-white"
                      : "hover:bg-neutral-100",
                  )}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
