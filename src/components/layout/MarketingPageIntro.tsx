import { cn } from "@/lib/utils";

export function MarketingPageIntro({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("max-w-2xl", className)}>
      {eyebrow ? (
        <div className="flex items-center gap-3">
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
