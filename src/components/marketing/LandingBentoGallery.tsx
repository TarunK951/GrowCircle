import Image from "next/image";
import { Container } from "@/components/layout/Container";
import { cn } from "@/lib/utils";

const IMG = "auto=format&fit=crop&w=1200&q=82";

/** Curated Unsplash — six distinct scenes; order matches grid slots below. */
const BENTO_ITEMS = [
  {
    src: `https://images.unsplash.com/photo-1522071820081-009f0129c71c?${IMG}`,
    alt: "Team collaborating around a table",
  },
  {
    src: `https://images.unsplash.com/photo-1511578314322-379afb476865?${IMG}`,
    alt: "Outdoor community gathering",
  },
  {
    src: `https://images.unsplash.com/photo-1540575467063-178a50c2df87?${IMG}`,
    alt: "Conference or workshop audience",
  },
  {
    src: `https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?${IMG}`,
    alt: "Coffee shop meetup",
  },
  {
    src: `https://images.unsplash.com/photo-1492684223066-81342ee5ff30?${IMG}`,
    alt: "Evening celebration with string lights",
  },
  {
    src: `https://images.unsplash.com/photo-1528605248644-14dd04022da1?${IMG}`,
    alt: "Small group discussion indoors",
  },
] as const;

function BentoTile({
  src,
  alt,
  priority,
  className,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-neutral-200/90",
        "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-6px_rgba(0,0,0,0.08)]",
        "ring-1 ring-black/6",
        "transition-[box-shadow,transform] duration-300 ease-out",
        "hover:z-10 hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] hover:ring-black/10",
        "motion-reduce:transition-none motion-reduce:hover:transform-none",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 45vw, 28vw"
        className="object-cover transition-transform duration-500 ease-out will-change-transform group-hover:scale-[1.03] motion-reduce:group-hover:scale-100"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

export function LandingBentoGallery() {
  const [a, b, c, d, e, f] = BENTO_ITEMS;

  return (
    <section
      aria-labelledby="landing-bento-heading"
      className="relative bg-[#f3f3f3] pb-10 pt-2 sm:pb-14 sm:pt-3 lg:pb-16"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-black/[0.07] to-transparent"
        aria-hidden
      />
      <Container className="max-w-[1000px] px-4 sm:px-6">
        <div className="mx-auto mb-6 max-w-xl text-center sm:mb-7">
          <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-neutral-500">
            Community
          </p>
          <h2
            id="landing-bento-heading"
            className="text-balance text-lg font-semibold tracking-tight text-[#101010] sm:text-xl"
          >
            Moments from the community
          </h2>
          <p className="mt-1.5 text-pretty text-sm leading-relaxed text-neutral-600 sm:text-[0.9375rem]">
            Real meetups, workshops, and hangouts — curated by hosts who care about the room.
          </p>
        </div>

        {/* Mobile: single column. sm+: 6-col bento (~188px/row × 5 rows vs 300px before). */}
        <div
          className={cn(
            "mx-auto grid max-w-[880px] gap-2.5",
            "max-sm:grid-cols-1 max-sm:auto-rows-min",
            "sm:grid-cols-6 sm:gap-3 sm:auto-rows-[minmax(0,188px)] lg:gap-3.5",
          )}
        >
          <BentoTile
            src={a.src}
            alt={a.alt}
            priority
            className="min-h-[220px] max-sm:aspect-4/3 sm:col-span-3 sm:row-span-2 sm:min-h-0"
          />
          <BentoTile
            src={b.src}
            alt={b.alt}
            className="min-h-[180px] max-sm:aspect-4/3 sm:col-span-2 sm:row-span-2 sm:min-h-0"
          />
          <BentoTile
            src={c.src}
            alt={c.alt}
            className="min-h-[200px] max-sm:aspect-3/4 sm:col-span-1 sm:row-span-2 sm:min-h-0"
          />
          <BentoTile
            src={d.src}
            alt={d.alt}
            className="min-h-[200px] max-sm:aspect-16/10 sm:col-span-3 sm:row-span-2 sm:min-h-0"
          />
          <BentoTile
            src={e.src}
            alt={e.alt}
            className="min-h-[150px] max-sm:aspect-4/3 sm:col-span-3 sm:row-span-1 sm:min-h-0"
          />
          <BentoTile
            src={f.src}
            alt={f.alt}
            className="min-h-[150px] max-sm:aspect-4/3 sm:col-span-3 sm:row-span-1 sm:min-h-0"
          />
        </div>
      </Container>
    </section>
  );
}
