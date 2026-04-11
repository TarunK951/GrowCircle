import { cn } from "@/lib/utils";

export function MarketingPageIntro({
  eyebrow,
  title,
  description,
  className,
  align = "start",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  /** When `center`, heading block is centered (e.g. marketing wizards). */
  align?: "start" | "center";
}) {
  return (
    <header
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto w-full text-center",
        className,
      )}
    >
      {eyebrow ? (
        <div
          className={cn(
            "flex items-center gap-3",
            align === "center" && "justify-center",
          )}
        >
          <span
            className="h-1 w-10 shrink-0 rounded-full bg-primary"
            aria-hidden
          />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
            {eyebrow}
          </p>
        </div>
      ) : null}
      <h1
        className={cn(
          "font-onest text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem] lg:leading-[1.15]",
          eyebrow ? "mt-4" : null,
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}
