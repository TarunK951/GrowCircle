import { Container } from "@/components/layout/Container";

export default function TermsPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1>Terms of service</h1>
      <p>
        This ConnectSphere build is a demonstration prototype. No real services
        are offered, and no contractual relationship is formed by using the
        mock flows.
      </p>
      <h2>Use</h2>
      <p>
        You may navigate the prototype for evaluation purposes. Do not enter
        sensitive personal data — persistence is limited to this browser.
      </p>
    </Container>
  );
}
