import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-12 min-w-[140px] items-center justify-center rounded-full px-6 text-sm font-semibold tracking-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

const primaryStyles =
  "bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary/92 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]";

export function PrimaryButton({
  href,
  label,
  className,
  onClick,
  type = "button",
}: {
  href?: string;
  label: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = cn(base, primaryStyles, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {label}
    </button>
  );
}

const secondaryStyles =
  "border-2 border-primary/35 bg-white/90 text-primary shadow-sm backdrop-blur-sm hover:border-primary/50 hover:bg-white";

export function SecondaryButton({
  href,
  label,
  className,
  onClick,
  type = "button",
}: {
  href?: string;
  label: string;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const cls = cn(base, secondaryStyles, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={cls}>
      {label}
    </button>
  );
}
