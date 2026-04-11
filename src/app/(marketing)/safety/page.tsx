import { Container } from "@/components/layout/Container";

export default function SafetyPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Trust & safety</h1>
      <p className="mt-4 max-w-2xl text-muted">
        In a production social discovery product, you would publish community
        guidelines, reporting flows, and moderation SLAs. This prototype
        focuses on UI and client-side flows only — treat all meets as fictional.
      </p>
    </Container>
  );
}
