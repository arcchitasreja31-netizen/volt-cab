"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Ride = {
  id: string | number;
  pickup_location: string;
  dropoff_location: string;
  ride_type: string;
  distance_km: number | null;
  status: string;
  created_at: string;
};

type DriverRating = {
  averageRating: number | null;
  totalReviews: number;
};

export default function DriverDashboard() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const [acceptingRideId, setAcceptingRideId] = useState<
    string | number | null
  >(null);

  const [updatingRideId, setUpdatingRideId] = useState<
    string | number | null
  >(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [driverRating, setDriverRating] = useState<DriverRating>({
    averageRating: null,
    totalReviews: 0,
  });

  const [ratingLoading, setRatingLoading] = useState(true);
  const [ratingError, setRatingError] = useState("");

  async function loadRides() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/driver/rides", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load rides.");
      }

      setRides((result.rides ?? []) as Ride[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load rides."
      );
      setRides([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDriverRating() {
    setRatingLoading(true);
    setRatingError("");

    try {
      const response = await fetch("/api/driver/ratings", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load driver rating.");
      }

      setDriverRating({
        averageRating:
          typeof result.averageRating === "number"
            ? result.averageRating
            : null,
        totalReviews:
          typeof result.totalReviews === "number"
            ? result.totalReviews
            : 0,
      });
    } catch (error) {
      setRatingError(
        error instanceof Error
          ? error.message
          : "Unable to load driver rating."
      );
    } finally {
      setRatingLoading(false);
    }
  }

  async function acceptRide(rideId: string | number) {
    if (!window.confirm("Do you want to accept this ride?")) {
      return;
    }

    setAcceptingRideId(rideId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/driver/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rideId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not accept this ride.");
      }

      setSuccessMessage(`Ride #${rideId} accepted successfully!`);
      await loadRides();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not accept this ride."
      );
      await loadRides();
    } finally {
      setAcceptingRideId(null);
    }
  }

  async function updateRideStatus(
    rideId: string | number,
    status: "in_progress" | "completed"
  ) {
    const action = status === "in_progress" ? "start" : "complete";

    if (!window.confirm(`Are you sure you want to ${action} this ride?`)) {
      return;
    }

    setUpdatingRideId(rideId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/driver/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rideId, status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update ride status.");
      }

      setSuccessMessage(
        `Ride #${rideId} is now ${status.replaceAll("_", " ")}.`
      );

      await loadRides();

      if (status === "completed") {
        await loadDriverRating();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not update ride status."
      );
    } finally {
      setUpdatingRideId(null);
    }
  }

  useEffect(() => {
    void loadRides();
    void loadDriverRating();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Volt Cab — Driver Dashboard
        </h1>

        <p className="mt-2 text-gray-600">
          Welcome to the driver portal.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Driver Status */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-xl font-semibold">Driver Status</h2>

            <p className="mt-3 text-gray-600">
              You are currently offline.
            </p>

            <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm">
              Driver availability will be configured next.
            </p>
          </section>

          {/* Driver Rating */}
          <section className="rounded-2xl bg-white p-6 shadow">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">⭐ Driver Rating</h2>

              <button
                onClick={() => void loadDriverRating()}
                disabled={ratingLoading}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {ratingLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            {ratingLoading ? (
              <p className="mt-4 text-gray-600">
                Loading your rating...
              </p>
            ) : ratingError ? (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-700"
              >
                <p>{ratingError}</p>

                <button
                  onClick={() => void loadDriverRating()}
                  className="mt-2 font-semibold underline"
                >
                  Try again
                </button>
              </div>
            ) : driverRating.totalReviews === 0 ? (
              <div className="mt-4 rounded-xl bg-gray-100 p-4">
                <p className="text-lg font-semibold">No ratings yet</p>

                <p className="mt-1 text-sm text-gray-600">
                  Complete rides and receive passenger reviews to build your
                  rating.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl bg-yellow-50 p-5">
                <p className="text-3xl font-bold text-gray-900">
                  ⭐ {driverRating.averageRating?.toFixed(1)} / 5
                </p>

                <p className="mt-2 text-sm text-gray-700">
                  Based on {driverRating.totalReviews}{" "}
                  {driverRating.totalReviews === 1 ? "review" : "reviews"}
                </p>
              </div>
            )}
          </section>

          {/* Ride Requests */}
          <section className="rounded-2xl bg-white p-6 shadow md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Ride Requests</h2>

              <button
                onClick={() => void loadRides()}
                disabled={
                  loading ||
                  acceptingRideId !== null ||
                  updatingRideId !== null
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              View new requests and manage your assigned rides.
            </p>

            {successMessage && (
              <p
                role="status"
                className="mt-4 rounded-lg bg-green-100 p-4 text-sm text-green-800"
              >
                {successMessage}
              </p>
            )}

            {loading && (
              <p className="mt-4 rounded-lg bg-gray-100 p-4">
                Loading rides...
              </p>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-red-100 p-4 text-sm text-red-700"
              >
                <p className="font-semibold">
                  Could not complete the request.
                </p>
                <p className="mt-1">{errorMessage}</p>
              </div>
            )}

            {!loading && !errorMessage && rides.length === 0 && (
              <p className="mt-4 rounded-lg bg-gray-100 p-4 text-gray-600">
                No new requests or assigned rides right now.
              </p>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {rides.map((ride) => (
                <article
                  key={ride.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">Ride #{ride.id}</h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        ride.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : ride.status === "in_progress"
                            ? "bg-amber-100 text-amber-800"
                            : ride.status === "accepted"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {ride.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold">Pickup:</span>{" "}
                      {ride.pickup_location}
                    </p>

                    <p>
                      <span className="font-semibold">Drop-off:</span>{" "}
                      {ride.dropoff_location}
                    </p>

                    <p>
                      <span className="font-semibold">Ride type:</span>{" "}
                      {ride.ride_type}
                    </p>

                    <p>
                      <span className="font-semibold">Distance:</span>{" "}
                      {ride.distance_km != null
                        ? `${ride.distance_km} km`
                        : "Not recorded"}
                    </p>

                    <p className="text-xs text-gray-500">
                      Requested: {new Date(ride.created_at).toLocaleString()}
                    </p>
                  </div>

                  {ride.status === "requested" && (
                    <button
                      onClick={() => void acceptRide(ride.id)}
                      disabled={
                        acceptingRideId !== null ||
                        updatingRideId !== null ||
                        loading
                      }
                      className="mt-4 w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {acceptingRideId === ride.id
                        ? "Accepting..."
                        : "Accept Ride"}
                    </button>
                  )}

                  {ride.status === "accepted" && (
                    <button
                      onClick={() =>
                        void updateRideStatus(ride.id, "in_progress")
                      }
                      disabled={
                        updatingRideId !== null ||
                        acceptingRideId !== null ||
                        loading
                      }
                      className="mt-4 w-full rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {updatingRideId === ride.id
                        ? "Starting..."
                        : "Start Ride"}
                    </button>
                  )}

                  {ride.status === "in_progress" && (
                    <button
                      onClick={() =>
                        void updateRideStatus(ride.id, "completed")
                      }
                      disabled={
                        updatingRideId !== null ||
                        acceptingRideId !== null ||
                        loading
                      }
                      className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {updatingRideId === ride.id
                        ? "Completing..."
                        : "Complete Ride"}
                    </button>
                  )}

                  {ride.status === "completed" && (
                    <p className="mt-4 rounded-lg bg-green-100 p-3 text-center font-semibold text-green-800">
                      ✓ Ride completed
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>

        <Link
          href="/dashboard"
          className="mt-6 inline-block text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </main>
  );
}