import { Container } from "@/components/layout/Container";

export default function AboutPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">About ConnectSphere</h1>
      <p className="mt-4 max-w-2xl text-muted">
        We are building a calm, glass-forward social discovery experience: city
        meets, host tools, and verification — inspired by products like Playace
        and Timeleft, with an original interface and mock data for rapid iteration.
      </p>
    </Container>
  );
}
