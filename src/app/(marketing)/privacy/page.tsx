import { Container } from "@/components/layout/Container";

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-16">
      <h1>Privacy policy</h1>
      <p>
        Session state and form submissions in this prototype stay in your
        browser unless you deploy a backend. There is no analytics or tracking
        configured in this repository by default.
      </p>
    </Container>
  );
}
