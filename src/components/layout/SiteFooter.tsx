import Link from "next/link";
import { Container } from "@/components/layout/Container";

const cols = [
  {
    title: "Product",
    links: [
      { href: "/discover", label: "Discover" },
      { href: "/host-a-meet", label: "Host a meet" },
      { href: "/join-a-meet", label: "Join a meet" },
      { href: "/verify-profile", label: "Verify profile" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
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
            <p className="text-lg font-semibold text-primary">ConnectSphere</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              Curated social discovery: real meets, real people — with a calm,
              glassy interface.
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
                      className="text-sm text-muted transition hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-muted">
          © {new Date().getFullYear()} ConnectSphere. Mock prototype — no real
          bookings or payments.
        </p>
      </Container>
    </footer>
  );
}
