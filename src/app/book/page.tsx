"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BookRidePage() {
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [rideType, setRideType] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/rides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pickup_location: pickup.trim(),
          dropoff_location: dropoff.trim(),
          ride_type: rideType,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Could not request your ride."
        );
      }

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-cyan-300"
          >
            VOLT<span className="text-white">CAB</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Your next journey
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Book a <span className="text-cyan-300">Ride.</span>
          </h1>

          <p className="mt-4 text-slate-400">
            Enter your journey details to request a Volt Cab ride.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6 sm:p-8"
          >
            <div>
              <label
                htmlFor="pickup"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                📍 Pickup location
              </label>

              <input
                id="pickup"
                type="text"
                value={pickup}
                onChange={(event) => setPickup(event.target.value)}
                placeholder="Where should we pick you up?"
                required
                maxLength={200}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 outline-none transition focus:border-cyan-300"
              />
            </div>

            <div>
              <label
                htmlFor="dropoff"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                🏁 Drop-off location
              </label>

              <input
                id="dropoff"
                type="text"
                value={dropoff}
                onChange={(event) => setDropoff(event.target.value)}
                placeholder="Where are you going?"
                required
                maxLength={200}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 outline-none transition focus:border-cyan-300"
              />
            </div>

            <div>
              <label
                htmlFor="rideType"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                🚘 Choose your ride
              </label>

              <select
                id="rideType"
                value={rideType}
                onChange={(event) => setRideType(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 outline-none transition focus:border-cyan-300"
              >
                <option value="standard">Standard — Everyday ride</option>
                <option value="premium">Premium — Extra comfort</option>
                <option value="xl">XL — More space</option>
              </select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-cyan-300 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Requesting your ride..." : "Request Ride →"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Your ride request will be saved to your account.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}