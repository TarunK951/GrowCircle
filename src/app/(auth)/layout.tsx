import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="sticky top-0 z-50 border-b border-primary/10 bg-canvas/85 px-4 py-4 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex h-10 max-w-6xl items-center">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            ConnectSphere
          </Link>
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
