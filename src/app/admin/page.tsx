"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AdminStats = {
  totalUsers: number;
  totalDrivers: number;
  totalRides: number;
  totalReviews: number;
};

const statCards = [
  {
    key: "totalUsers",
    label: "Total Users",
    icon: "👥",
    description: "Registered accounts",
  },
  {
    key: "totalDrivers",
    label: "Total Drivers",
    icon: "🚗",
    description: "Registered drivers",
  },
  {
    key: "totalRides",
    label: "Total Rides",
    icon: "🛣️",
    description: "All recorded rides",
  },
  {
    key: "totalReviews",
    label: "Total Reviews",
    icon: "⭐",
    description: "Passenger reviews",
  },
] as const;

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/stats", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load admin statistics."
        );
      }

      setStats(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStats();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Volt Cab
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-400">
              Monitor your ride-booking platform.
            </p>
          </div>

          <button
            onClick={() => void loadStats()}
            disabled={loading}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "↻ Refresh Stats"}
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-700 bg-amber-950/50 p-5"
          >
            <h2 className="font-semibold text-amber-300">
              Admin dashboard unavailable
            </h2>

            <p className="mt-2 text-sm text-amber-100">
              {error}
            </p>

            {error.includes("Admin access required") && (
              <p className="mt-2 text-sm text-slate-300">
                Your account needs an authorized admin role to
                view these statistics.
              </p>
            )}

            <button
              onClick={() => void loadStats()}
              className="mt-4 rounded-lg border border-amber-600 px-4 py-2 text-sm hover:bg-amber-900"
            >
              Try Again
            </button>
          </div>
        )}

        {loading && !stats && !error && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
            Loading dashboard statistics...
          </div>
        )}

        {stats && (
          <>
            <section className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <article
                  key={card.key}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-400">
                      {card.label}
                    </p>

                    <span className="text-3xl" aria-hidden="true">
                      {card.icon}
                    </span>
                  </div>

                  <p className="mt-5 text-4xl font-bold">
                    {stats[card.key]}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    {card.description}
                  </p>
                </article>
              ))}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-bold">
                Platform Overview
              </h2>

              <p className="mt-2 text-slate-400">
                Your dashboard statistics were loaded successfully.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-800/70 p-5">
                  <p className="text-sm text-slate-400">
                    Drivers among registered users
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {stats.totalUsers > 0
                      ? `${Math.round(
                          (stats.totalDrivers / stats.totalUsers) * 100
                        )}%`
                      : "0%"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-800/70 p-5">
                  <p className="text-sm text-slate-400">
                    Reviews per recorded ride
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {stats.totalRides > 0
                      ? (
                          stats.totalReviews / stats.totalRides
                        ).toFixed(2)
                      : "0.00"}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

      <footer className="mt-10 flex flex-wrap gap-4 border-t border-slate-800 pt-6">
  <Link
    href="/dashboard"
    className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
  >
    ← Back to Dashboard
  </Link>

  <Link
    href="/admin/management"
    className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
  >
    Manage Users, Rides & Reviews →
  </Link>
</footer>
      </div>
    </main>
  );
}