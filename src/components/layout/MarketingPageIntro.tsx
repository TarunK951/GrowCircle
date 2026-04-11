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
        <p className="text-sm font-semibold uppercase tracking-wider text-secondary">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl",
          eyebrow ? "mt-2" : null,
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {description}
        </p>
      ) : null}
    </header>
  );
}
