import { Container } from "@/components/layout/Container";
import { EventCard } from "@/components/events/EventCard";
import { listEvents } from "@/lib/mockApi";
import citiesData from "@/data/cities.json";
import type { City } from "@/lib/types";
import { Reveal } from "@/components/providers/Reveal";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; category?: string }>;
}) {
  const sp = await searchParams;
  const allForMeta = await listEvents();
  const events = await listEvents({
    cityId: sp.city || undefined,
    category: sp.category,
  });
  const cities = citiesData as City[];
  const categories = Array.from(new Set(allForMeta.map((e) => e.category)));
  const cityById = Object.fromEntries(cities.map((c) => [c.id, c.name]));

  return (
    <Container className="py-12">
      <Reveal>
        <h1 className="text-3xl font-semibold tracking-tight">Discover meets</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Filter by city — query params update the mock list (
          <code className="rounded bg-primary/5 px-1">?city=sf</code>).
        </p>
      </Reveal>

      <form
        className="mt-8 flex flex-wrap gap-3"
        method="get"
      >
        <label className="text-sm font-medium text-foreground">
          City
          <select
            name="city"
            defaultValue={sp.city ?? ""}
            className="ml-2 rounded-xl border border-primary/15 bg-white/60 px-3 py-2 text-sm"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-foreground">
          Category
          <select
            name="category"
            defaultValue={sp.category ?? "all"}
            className="ml-2 rounded-xl border border-primary/15 bg-white/60 px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Apply
        </button>
      </form>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <Reveal key={e.id}>
            <EventCard event={e} cityName={cityById[e.cityId] ?? ""} />
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
