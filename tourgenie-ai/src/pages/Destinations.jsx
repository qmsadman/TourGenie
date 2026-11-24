import { useEffect, useMemo, useState } from "react";
import {
  Search, X, Landmark, Building2, CalendarRange, TriangleAlert, Wallet,
  Waves, Mountain, Trees, Plane,
} from "lucide-react";
import AppShell from "../components/AppShell";
import { destinationsApi } from "../lib/api";

// Browse the destination catalogue: search by name, alias, tag or country,
// and narrow by country or kind of place.

// The glyph a card shows in place of a photograph.
// Paired with TYPE_TONE below so the two never disagree about what a type is.
const TYPE_ICON = {
  beach: Waves,
  island: Waves,
  hill: Mountain,
  forest: Trees,
  nature: Trees,
  heritage: Landmark,
  city: Building2,
  metro: Building2,
};

const TYPE_TONE = {
  beach: "bg-teal-light text-teal-dark",
  island: "bg-teal-light text-teal-dark",
  hill: "bg-gold/20 text-ink-800",
  forest: "bg-teal-light text-teal-dark",
  nature: "bg-teal-light text-teal-dark",
  heritage: "bg-sunset-light text-sunset-dark",
  city: "bg-sand/60 text-ink-800",
  metro: "bg-sand/60 text-ink-800",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function bestMonthsLabel(destination) {
  if (destination.peak_season) return destination.peak_season;
  const months = destination.best_months || [];
  if (months.length === 0) return null;
  if (months.length === 12) return "Year-round";
  return months.map((m) => MONTH_ABBR[m - 1]).join(", ");
}

function CardPlaceholder() {
  return (
    <div className="p-4 bg-surface rounded-2xl border border-sand animate-pulse">
      <div className="h-24 -mx-4 -mt-4 mb-3 bg-sand/50" />
      <div className="h-4 w-2/3 bg-sand/60 rounded" />
      <div className="h-3 w-1/3 bg-sand/50 rounded mt-2" />
      <div className="h-3 w-full bg-sand/40 rounded mt-4" />
      <div className="h-3 w-5/6 bg-sand/40 rounded mt-1.5" />
    </div>
  );
}

export default function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    destinationsApi
      .list({ limit: 200 })
      .then((res) => {
        setDestinations(res.destinations || []);
        setCountries(res.countries || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const types = useMemo(
    () => [...new Set(destinations.map((d) => d.type))].sort(),
    [destinations]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return destinations.filter((d) => {
      if (country && d.country_code !== country) return false;
      if (type && d.type !== type) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.aliases?.some((alias) => alias.toLowerCase().includes(q)) ||
        d.summary?.toLowerCase().includes(q) ||
        d.tags?.some((tag) => tag.includes(q)) ||
        d.country?.toLowerCase().includes(q)
      );
    });
  }, [destinations, query, country, type]);

  const filtered = query || country || type;

  return (
    <AppShell
      title="Explore destinations"
      subtitle="Every place TourGenie can plan a trip to — search by name, tag or country."
    >
      {error && (
        <div className="max-w-lg flex items-start gap-3 p-4 mb-6 bg-sunset-light border border-sunset/30 rounded-xl">
          <TriangleAlert className="w-5 h-5 text-sunset-dark shrink-0 mt-0.5" />
          <p className="text-sm text-ink-900/80">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex items-center gap-2 px-3 py-2 bg-surface border border-sand rounded-xl flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-ink-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search destinations…"
            aria-label="Search destinations"
            className="flex-1 min-w-0 bg-transparent text-sm text-ink-900 placeholder:text-ink-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-ink-900/30 hover:text-ink-600" aria-label="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          aria-label="Country"
          className="px-3 py-2 bg-surface border border-sand rounded-xl text-sm text-ink-900 focus:outline-none cursor-pointer"
        >
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.destinations})
            </option>
          ))}
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          aria-label="Kind of place"
          className="px-3 py-2 bg-surface border border-sand rounded-xl text-sm text-ink-900 focus:outline-none cursor-pointer capitalize"
        >
          <option value="">All kinds</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {!loading && !error && (
        <p className="text-sm text-ink-500 mb-4">
          {filtered
            ? `${visible.length} of ${destinations.length} destinations`
            : `${destinations.length} destinations`}
        </p>
      )}

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardPlaceholder key={i} />)}
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-ink-500">No destinations match those filters.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
          {visible.map((d) => {
            const Icon = TYPE_ICON[d.type] || Landmark;
            const season = bestMonthsLabel(d);
            return (
              <article
                key={d.slug}
                className="group p-4 bg-surface rounded-2xl border border-sand overflow-hidden transition hover:shadow-soft"
              >
                <div className={`-mx-4 -mt-4 mb-3 h-24 flex items-center justify-center ${TYPE_TONE[d.type] || "bg-sand/60 text-ink-800"}`}>
                  <Icon className="w-8 h-8 opacity-60" aria-hidden="true" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-base text-ink-900 leading-tight truncate">{d.name}</h2>
                    <p className="text-sm text-ink-500 truncate">
                      {d.country}{d.division ? ` · ${d.division}` : ""}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-3xs font-semibold shrink-0 ${TYPE_TONE[d.type] || "bg-sand/60 text-ink-800"}`}>
                    {d.type}
                  </span>
                </div>

                {d.summary && (
                  <p className="mt-2 text-sm text-ink-600 leading-relaxed line-clamp-3">{d.summary}</p>
                )}

                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 text-2xs text-ink-600">
                  {d.avg_daily_cost > 0 && (
                    <span className="flex items-center gap-1">
                      <Wallet className="w-3 h-3" /> ৳{d.avg_daily_cost.toLocaleString()}/day
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarRange className="w-3 h-3" /> {d.recommended_days} days
                  </span>
                  {d.nearest_airport && (
                    <span className="flex items-center gap-1">
                      <Plane className="w-3 h-3" /> {d.nearest_airport}
                    </span>
                  )}
                </div>

                {season && (
                  <p className="mt-2 text-2xs text-ink-500">Best time: {season}</p>
                )}

                {d.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {d.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-paper border border-sand text-3xs text-ink-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
