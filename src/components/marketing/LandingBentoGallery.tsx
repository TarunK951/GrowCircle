import Image from "next/image";
import { Container } from "@/components/layout/Container";

const BENTO_IMAGE =
  "https://images.unsplash.com/photo-1520614073997-2f0f8d4d6db9?auto=format&fit=crop&w=1300&q=80";

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
      className={`relative overflow-hidden rounded-[16px] bg-neutral-100 sm:rounded-[18px] ${className ?? ""}`}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 50vw, 33vw"
        className="object-cover"
      />
    </div>
  );
}

export function LandingBentoGallery() {
  return (
    <section
      aria-label="Community gallery"
      className="bg-[#f3f3f3] pb-14 sm:pb-[4.5rem] lg:pb-24"
    >
      <Container className="max-w-[1050px] px-4 sm:px-6">
        <div className="mx-auto grid max-w-[900px] grid-cols-6 auto-rows-[58px] gap-2.5 sm:auto-rows-[72px] sm:gap-3.5 lg:auto-rows-[96px] lg:gap-4">
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-3 row-span-2"
          />
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-2 row-span-2"
          />
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-3 row-span-2"
          />
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-3 row-span-2"
          />
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-3 row-span-1"
          />
          <BentoImage
            src={BENTO_IMAGE}
            alt="Community member in windblown grass landscape"
            className="col-span-3 row-span-1"
          />
        </div>
      </Container>
    </section>
  );
}
