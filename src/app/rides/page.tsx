"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Ride = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  ride_type: string;
  status: string;
  created_at: string;
};

export default function RideHistoryPage() {
  const { isLoaded, user } = useUser();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadRides() {
      try {
        const response = await fetch("/api/rides");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not load your ride history."
          );
        }

        if (!cancelled) {
          setRides(result.rides ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (isLoaded && user) {
      void loadRides();
    } else if (isLoaded) {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170910] text-rose-200">
        Loading your account...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#170910] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between border-b border-rose-900/40 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-rose-300"
          >
            VOLT<span className="text-white">CAB</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm text-rose-300 hover:text-rose-200"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="py-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
            Your journeys
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Ride <span className="text-rose-300">History</span>
          </h1>

          <p className="mt-4 text-slate-400">
            View the ride requests associated with your account.
          </p>
        </section>

        {loading ? (
          <div className="rounded-2xl border border-rose-900/40 bg-white/[0.03] p-8 text-slate-400">
            Loading your rides...
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-red-200"
          >
            {error}
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-2xl border border-rose-900/40 bg-white/[0.03] p-8">
            <h2 className="text-xl font-bold">
              No rides yet
            </h2>

            <p className="mt-2 text-slate-400">
              Your ride requests will appear here after you book.
            </p>

            <Link
              href="/book"
              className="mt-5 inline-block rounded-xl bg-[#800020] px-5 py-3 font-bold text-white transition hover:bg-[#a00030]"
            >
              Book a Ride →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <article
                key={ride.id}
                className="rounded-2xl border border-rose-900/40 bg-[#21121a] p-6 transition hover:border-rose-700/60"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-lg font-bold">
                    {ride.pickup_location} → {ride.dropoff_location}
                  </h2>

                  <span className="rounded-full border border-rose-700/40 bg-rose-950/40 px-3 py-1 text-sm capitalize text-rose-200">
                    {ride.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                  <p>
                    Ride type:{" "}
                    <span className="capitalize text-rose-200">
                      {ride.ride_type}
                    </span>
                  </p>

                  <p>
                    Requested:{" "}
                    {new Date(ride.created_at).toLocaleString()}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-rose-900/40 pt-6 text-sm text-slate-500">
          Volt Cab · Your journey, powered by electricity.
        </footer>
      </div>
    </main>
  );
}