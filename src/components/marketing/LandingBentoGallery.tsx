import Image from "next/image";
import { Container } from "@/components/layout/Container";

/** Curated Unsplash assets — stable IDs for reproducible builds. */
const BENTO_IMAGES = [
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80",
] as const;

function BentoImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] bg-neutral-100 ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}

export function LandingBentoGallery() {
  return (
    <section
      aria-label="Community gallery"
      className="bg-white pb-20 sm:pb-24 lg:pb-28"
    >
      <Container>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-4">
            <BentoImage
              src={BENTO_IMAGES[0]}
              alt="People collaborating at a table"
              className="h-52 sm:h-56"
            />
            <BentoImage
              src={BENTO_IMAGES[1]}
              alt="Outdoor gathering"
              className="min-h-[260px] flex-1 sm:min-h-[280px]"
            />
          </div>
          <div className="flex flex-col gap-4">
            <BentoImage
              src={BENTO_IMAGES[2]}
              alt="Conference or workshop"
              className="min-h-[280px] flex-1 sm:min-h-[300px]"
            />
            <BentoImage
              src={BENTO_IMAGES[3]}
              alt="Coffee meetup"
              className="h-44 sm:h-48"
            />
          </div>
          <div className="flex flex-col gap-4">
            <BentoImage
              src={BENTO_IMAGES[4]}
              alt="Celebration event"
              className="min-h-[320px] flex-1 sm:min-h-[360px]"
            />
            <BentoImage
              src={BENTO_IMAGES[5]}
              alt="Small group discussion"
              className="h-36 w-36 shrink-0 self-end sm:h-40 sm:w-40"
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
