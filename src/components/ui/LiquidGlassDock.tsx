"use client";

import { cn } from "@/lib/utils";
import { Mail, Music, LayoutGrid } from "lucide-react";

const bg =
  "https://images.unsplash.com/photo-1694637449947-cfe5552518c2?w=800&auto=format&fit=crop&q=90";

export function LiquidGlassDock({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] w-full max-w-3xl items-center justify-center rounded-2xl bg-cover bg-center bg-no-repeat md:min-h-[400px]",
        className,
      )}
      style={{ backgroundImage: `url('${bg}')` }}
    >
      <div className="glass-panel flex max-w-md gap-2">
        <div className="relative z-10 flex flex-col items-center gap-1">
          <button type="button" className="glass-icon-btn" aria-label="Mail">
            <Mail className="relative z-10 h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="relative z-10 text-xs text-white/90">Mail</span>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-1">
          <button type="button" className="glass-icon-btn" aria-label="Music">
            <Music className="relative z-10 h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="relative z-10 text-xs text-white/90">Music</span>
        </div>
        <div className="relative z-10 flex flex-col items-center gap-1">
          <button type="button" className="glass-icon-btn" aria-label="Apps">
            <LayoutGrid className="relative z-10 h-5 w-5" strokeWidth={1.75} />
          </button>
          <span className="relative z-10 text-xs text-white/90">Apps</span>
        </div>
      </div>
    </div>
  );
}
