import { useEffect, useState } from "react";
import { Clock, MapPinned, UsersRound } from "lucide-react";
import AppShell from "../components/AppShell";
import { tripsApi } from "../lib/api";

export default function Dashboard() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    tripsApi
      .list()
      .then(({ trips: savedTrips }) => setTrips(savedTrips || []))
      .catch((err) => setError(err.message || "Couldn't load trips"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="My trips" subtitle="Your saved trips, in one place.">
      {error && (
        <div role="alert" className="bg-sunset/10 border border-sunset/30 text-sunset-dark text-sm rounded-lg px-4 py-3 mb-6">
          Couldn't load trips: {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-ink-500">Loading your trips…</p>
      ) : trips.length === 0 ? (
        <div className="card rounded-2xl p-8 text-center">
          <MapPinned className="w-8 h-8 text-teal-dark mx-auto mb-3" />
          <h2 className="font-display text-xl text-ink-900">No trips yet</h2>
          <p className="text-sm text-ink-600 mt-2">Your saved trips will appear here.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trips.map((trip) => (
            <article key={trip._id} className="card rounded-2xl p-5">
              <h2 className="font-display text-lg text-ink-900">
                {trip.title || trip.destination}
              </h2>
              <p className="text-sm text-ink-600 flex items-center gap-2 mt-3">
                <MapPinned className="w-4 h-4 text-teal-dark" />
                {trip.origin} to {trip.destination}
              </p>
              <p className="text-sm text-ink-600 flex items-center gap-2 mt-2">
                <Clock className="w-4 h-4 text-teal-dark" />
                {new Date(trip.start_date).toLocaleDateString()} – {new Date(trip.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-ink-600 flex items-center gap-2 mt-2">
                <UsersRound className="w-4 h-4 text-teal-dark" />
                {trip.travelers} traveler{trip.travelers === 1 ? "" : "s"}
              </p>
              <span className="inline-block mt-4 px-2.5 py-1 rounded-full bg-teal-light text-teal-dark text-xs font-semibold capitalize">
                {trip.status || "draft"}
              </span>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}
