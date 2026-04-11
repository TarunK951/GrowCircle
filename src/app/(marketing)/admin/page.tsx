import { Container } from "@/components/layout/Container";

export default function AdminStubPage() {
  return (
    <Container className="py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Optional placeholder from the blueprint. No admin tools are wired in this
        prototype — connect a backend and auth roles here later.
      </p>
    </Container>
  );
}
