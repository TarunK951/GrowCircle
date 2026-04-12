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
  /** Override label styles (e.g. uppercase eyebrow on settings). */
  labelClassName?: string;
};

export function HostMeetSelect({
  label,
  value,
  options,
  onChange,
  className,
  labelClassName,
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
    <div ref={rootRef} className={cn("relative", open && "z-30", className)}>
      <label
        id={`${id}-label`}
        htmlFor={`${id}-btn`}
        className={cn(
          "text-sm font-semibold text-neutral-900",
          labelClassName,
        )}
      >
        {label}
      </label>
      {/* Single bordered shell: trigger + list share one box so no seam/double border */}
      <div
        className={cn(
          "mt-2 overflow-hidden rounded-2xl border border-neutral-300 bg-white shadow-sm transition-shadow",
          open && "shadow-md ring-2 ring-neutral-900/10",
        )}
      >
        <button
          type="button"
          id={`${id}-btn`}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${id}-label`}
          className={cn(
            "flex w-full min-h-11 items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-medium text-neutral-900 outline-none transition",
            "hover:bg-neutral-50/90",
            "focus-visible:bg-neutral-50/90 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/15",
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
            className="max-h-56 overflow-auto border-t border-neutral-200 bg-white py-1"
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
                      "flex w-full px-3 py-2.5 text-left text-sm text-neutral-900 transition-colors",
                      isSelected
                        ? "bg-neutral-100 font-medium"
                        : "hover:bg-neutral-50",
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
    </div>
  );
}
