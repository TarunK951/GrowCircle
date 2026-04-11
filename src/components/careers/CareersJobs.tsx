import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/providers/Reveal";
import type { CareersJob } from "@/lib/types";

export function CareersJobs({
  title,
  jobs,
}: {
  title: string;
  jobs: CareersJob[];
}) {
  return (
    <section
      id="open-positions"
      className="scroll-mt-24 border-t border-primary/10 py-16 sm:py-20"
    >
      <Container>
        <Reveal>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-muted">
            Don&apos;t see a perfect fit? Email us anyway—we hire for trajectory,
            not just titles.
          </p>
        </Reveal>

        {jobs.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-primary/20 bg-white/40 px-6 py-10 text-center text-muted">
            No open roles right now. Follow us on LinkedIn for the next wave of
            openings.
          </p>
        ) : (
          <ul className="mt-10 space-y-3">
            {jobs.map((job) => (
              <Reveal key={job.id}>
                <li>
                  <Link
                    href={job.href}
                    className="group flex flex-col gap-2 rounded-2xl border border-primary/10 bg-white/50 px-5 py-4 backdrop-blur-sm transition hover:border-primary/25 hover:bg-white/80 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary">
                        {job.title}
                      </p>
                      <p className="text-sm text-muted">
                        {job.team} · {job.location} · {job.type}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-primary group-hover:underline">
                      Apply
                    </span>
                  </Link>
                </li>
              </Reveal>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
