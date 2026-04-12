import Link from "next/link";
import { GrowCircleWordmark } from "@/components/brand/GrowCircleWordmark";
import { Container } from "@/components/layout/Container";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/explore", label: "Explore" },
      { href: "/locations", label: "Locations" },
      { href: "/host", label: "Host a meet" },
      { href: "/join", label: "Join a meet" },
      { href: "/verify-profile", label: "Verify profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact" },
      { href: "/faqs", label: "FAQs" },
      { href: "/safety", label: "Trust & safety" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-primary/10 bg-canvas/90 py-14">
      <Container>
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link
              href="/"
              className="inline-block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              aria-label="Grow Circle home"
            >
              <GrowCircleWordmark alt="" className="h-10 max-w-[220px] sm:h-11" />
            </Link>
            <p className="mt-2 max-w-xs text-sm text-black">
              Curated social discovery: real meets, real people — clear, calm,
              and built for continuity.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-sm font-semibold text-foreground">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-black transition hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-black">
          © {new Date().getFullYear()} Grow Circle. Mock prototype — no real
          bookings or payments.
        </p>
      </Container>
    </footer>
  );
}
