"use client";

import { useCallback, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MapWrapper from "../components/MapWrapper";

type LocationPoint = {
  lat: number;
  lng: number;
};

export default function BookRidePage() {
  const router = useRouter();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [rideType, setRideType] = useState("standard");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [distance, setDistance] = useState("");

  const distanceKm = Number(distance);

  const baseFare = 50;

  const ratePerKm = {
    standard: 12,
    premium: 20,
    xl: 16,
  };

  const estimatedFare =
    distance !== "" && distanceKm >= 1 && distanceKm <= 500
      ? baseFare +
        distanceKm *
          (ratePerKm[rideType as keyof typeof ratePerKm] ?? 12)
      : 0;

  const handleDistanceChange = useCallback(
    (distanceKm: number | null) => {
      setRouteDistance(distanceKm);

      if (distanceKm !== null && distanceKm > 0) {
        // The rides API expects an integer number of kilometres.
        setDistance(String(Math.ceil(distanceKm)));
      } else {
        setDistance("");
      }
    },
    []
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (routeDistance === null || distance === "") {
      setError(
        "Please select a pickup and destination on the map and wait for the driving distance."
      );
      return;
    }

    if (
      !Number.isFinite(distanceKm) ||
      distanceKm < 1 ||
      distanceKm > 500
    ) {
      setError("The driving distance must be between 1 and 500 km.");
      return;
    }

    if (!pickup.trim() || !dropoff.trim()) {
      setError("Please enter both pickup and destination addresses.");
      return;
    }

    setLoading(true);

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
          distance_km: distanceKm,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not request your ride.");
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
    <main
      className="relative min-h-screen overflow-hidden bg-[#170910] bg-cover bg-center bg-fixed px-5 py-10 text-white sm:px-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 3, 8, 0.55), rgba(15, 3, 8, 0.88)), url('/images/voltcity.png')",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-rose-950/10" />

      <div className="relative z-10 mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-rose-200/15 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-white transition hover:text-rose-200"
          >
            VOLT<span className="text-rose-400">CAB</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-rose-400/30 bg-[#250d18]/80 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300 hover:bg-rose-900/40"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-rose-300">
            Your next journey
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Book a <span className="text-rose-400">Ride.</span>
          </h1>

          <p className="mt-4 text-rose-100/75">
            Select your journey on the map to calculate your driving distance
            and estimated fare.
          </p>

          {/* Interactive Map */}
          <div className="mt-8 overflow-hidden rounded-2xl border border-rose-300/20 bg-white p-2 shadow-xl">
            <h2 className="mb-2 px-2 pt-2 text-lg font-bold text-gray-900">
              📍 Choose your locations
            </h2>

            <MapWrapper
              onPickupSelect={async (point: LocationPoint) => {
                setError("");
                setPickup("Finding pickup address...");

                try {
                  const response = await fetch(
                    `/api/geocode/reverse?lat=${point.lat}&lon=${point.lng}`
                  );

                  const result = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      result.error || "Address lookup failed."
                    );
                  }

                  setPickup(
                    result.address ||
                      `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
                  );
                } catch {
                  setPickup(
                    `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
                  );

                  setError(
                    "Couldn't find the pickup address. Coordinates are shown instead."
                  );
                }
              }}
              onDropoffSelect={async (point: LocationPoint) => {
                setError("");
                setDropoff("Finding destination address...");

                try {
                  const response = await fetch(
                    `/api/geocode/reverse?lat=${point.lat}&lon=${point.lng}`
                  );

                  const result = await response.json();

                  if (!response.ok) {
                    throw new Error(
                      result.error || "Address lookup failed."
                    );
                  }

                  setDropoff(
                    result.address ||
                      `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
                  );
                } catch {
                  setDropoff(
                    `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`
                  );

                  setError(
                    "Couldn't find the destination address. Coordinates are shown instead."
                  );
                }
              }}
              onDistanceChange={handleDistanceChange}
            />

            {routeDistance !== null && (
              <p className="px-2 pb-2 text-sm font-semibold text-blue-700">
                Estimated driving distance: {routeDistance.toFixed(1)} km
              </p>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-3xl border border-rose-300/20 bg-[#1b0b12]/90 p-6 shadow-2xl shadow-rose-950/30 backdrop-blur-md sm:p-8"
          >
            <div>
              <label
                htmlFor="pickup"
                className="mb-2 block text-sm font-medium text-rose-100"
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
                className="w-full rounded-xl border border-rose-200/20 bg-[#170910] px-4 py-3 text-white outline-none transition placeholder:text-rose-100/40 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="dropoff"
                className="mb-2 block text-sm font-medium text-rose-100"
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
                className="w-full rounded-xl border border-rose-200/20 bg-[#170910] px-4 py-3 text-white outline-none transition placeholder:text-rose-100/40 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="rideType"
                className="mb-2 block text-sm font-medium text-rose-100"
              >
                🚘 Choose your ride
              </label>

              <select
                id="rideType"
                value={rideType}
                onChange={(event) => setRideType(event.target.value)}
                className="w-full rounded-xl border border-rose-200/20 bg-[#170910] px-4 py-3 text-white outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="standard">Standard — Everyday ride</option>
                <option value="premium">Premium — Extra comfort</option>
                <option value="xl">XL — More space</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="distance"
                className="mb-2 block text-sm font-medium text-rose-100"
              >
                🛣️ Driving distance (km)
              </label>

              <input
                id="distance"
                type="number"
                min="1"
                max="500"
                step="1"
                value={distance}
                readOnly
                required
                placeholder="Select two points on the map"
                className="w-full rounded-xl border border-rose-200/20 bg-[#170910] px-4 py-3 text-white outline-none placeholder:text-rose-100/40"
              />

              <p className="mt-2 text-xs text-rose-100/60">
                Calculated automatically from your selected route.
              </p>
            </div>

            {/* Estimated Fare */}
            <div className="rounded-2xl border border-rose-400/30 bg-rose-950/30 p-5">
              <p className="text-sm text-rose-200/75">
                Estimated fare ·{" "}
                {distance !== "" && distanceKm >= 1 && distanceKm <= 500
                  ? `${distanceKm} km`
                  : "—"}
              </p>

              <p className="mt-2 text-3xl font-black text-white">
                ₹{estimatedFare.toLocaleString("en-IN")}
              </p>

              <p className="mt-1 text-xs text-rose-100/60">
                Includes a ₹50 base fare and the selected ride&apos;s
                per-kilometer rate.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/30 bg-red-950/40 p-3 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || routeDistance === null}
              className="w-full rounded-xl bg-gradient-to-r from-rose-800 to-red-900 px-6 py-4 font-bold text-white shadow-lg shadow-rose-950/40 transition hover:from-rose-700 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Requesting your ride..." : "Request Ride →"}
            </button>

            <p className="text-center text-xs text-rose-100/60">
              Your ride request will be saved to your account.
            </p>
          </form>
        </section>

        <footer className="border-t border-rose-200/15 py-5 text-center text-xs text-rose-100/50">
          VOLT CAB · RIDE INTO THE FUTURE
        </footer>
      </div>
    </main>
  );
}