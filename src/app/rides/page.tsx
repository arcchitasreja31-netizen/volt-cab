"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Ride = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  ride_type: string;
  distance_km: number | null;
  estimated_fare: number | null;
  status: string;
  created_at: string;
  payment: {
    id: string;
    status: string;
  } | null;
};

type RideNotification = {
  id: string;
  message: string;
};

type SavedReview = {
  ride_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
    case "accepted":
      return "border-blue-500/40 bg-blue-950/40 text-blue-200";
    case "in_progress":
      return "border-amber-500/40 bg-amber-950/40 text-amber-200";
    case "completed":
      return "border-emerald-500/40 bg-emerald-950/40 text-emerald-200";
    case "cancelled":
      return "border-red-500/40 bg-red-950/40 text-red-200";
    default:
      return "border-rose-700/40 bg-rose-950/40 text-rose-200";
  }
}

function getStatusMessage(status: string): string | null {
  switch (status.toLowerCase()) {
    case "accepted":
      return "Your ride has been accepted by a driver!";
    case "in_progress":
      return "Your ride has started. Have a safe journey!";
    case "completed":
      return "Your ride is complete. Thanks for riding with Volt Cab!";
    case "cancelled":
      return "Your ride has been cancelled.";
    default:
      return null;
  }
}

export default function RideHistoryPage() {
  const { isLoaded, user } = useUser();

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notification, setNotification] =
    useState<RideNotification | null>(null);

  // Review form state
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [reviewedRides, setReviewedRides] = useState<string[]>([]);
  const [savedReviews, setSavedReviews] = useState<
    Record<string, SavedReview>
  >({});
  const [reviewMessages, setReviewMessages] = useState<
    Record<string, string>
  >({});
  const [submittingReviews, setSubmittingReviews] = useState<
    Record<string, boolean>
  >({});

  // Remember previously seen ride statuses.
  const previousStatuses = useRef<Map<string, string> | null>(null);

  // Load the passenger's saved reviews from the database.
  const loadReviews = useCallback(async () => {
    try {
      const response = await fetch("/api/reviews", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load your saved reviews.");
      }

      const result = await response.json();
      const reviews: SavedReview[] = result.reviews ?? [];

      const reviewIds = reviews.map((review) => review.ride_id);
      const reviewMap: Record<string, SavedReview> = {};

      for (const review of reviews) {
        reviewMap[review.ride_id] = review;
      }

      setReviewedRides(reviewIds);
      setSavedReviews(reviewMap);
    } catch (err) {
      console.error("Could not load saved reviews:", err);
    }
  }, []);

  // Submit a review for a completed ride.
  async function submitReview(rideId: string) {
    if (reviewedRides.includes(rideId)) {
      return;
    }

    const rating = ratings[rideId] ?? 0;
    const comment = comments[rideId] ?? "";

    if (rating < 1 || rating > 5) {
      setReviewMessages((prev) => ({
        ...prev,
        [rideId]: "Please select a star rating from 1 to 5.",
      }));
      return;
    }

    setSubmittingReviews((prev) => ({
      ...prev,
      [rideId]: true,
    }));

    setReviewMessages((prev) => ({
      ...prev,
      [rideId]: "",
    }));

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ride_id: rideId,
          rating,
          comment,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // If the database says this ride was already reviewed,
        // reload saved reviews and hide the submission form.
        if (response.status === 409) {
          await loadReviews();
        }

        throw new Error(
          result.error || "Unable to submit your review."
        );
      }

      const savedReview: SavedReview = {
        ride_id: result.review.ride_id,
        rating: result.review.rating,
        comment: result.review.comment,
        created_at: result.review.created_at,
      };

      setReviewedRides((prev) =>
        prev.includes(rideId) ? prev : [...prev, rideId]
      );

      setSavedReviews((prev) => ({
        ...prev,
        [rideId]: savedReview,
      }));

      setReviewMessages((prev) => ({
        ...prev,
        [rideId]: "Thanks! Your review was submitted successfully. ⭐",
      }));
    } catch (err) {
      setReviewMessages((prev) => ({
        ...prev,
        [rideId]:
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
      }));
    } finally {
      setSubmittingReviews((prev) => ({
        ...prev,
        [rideId]: false,
      }));
    }
  }

  // Load rides and saved reviews when the passenger signs in.
  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setLoading(false);
      setRides([]);
      setReviewedRides([]);
      setSavedReviews({});
      return;
    }

    let cancelled = false;

    async function loadRides() {
      try {
        const response = await fetch("/api/rides", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not load your ride history."
          );
        }

        if (cancelled) return;

        const nextRides: Ride[] = result.rides ?? [];
        const nextStatuses = new Map<string, string>();

        for (const ride of nextRides) {
          nextStatuses.set(ride.id, ride.status);

          const previousStatus =
            previousStatuses.current?.get(ride.id);

          // Don't notify on the initial page load.
          if (
            previousStatuses.current !== null &&
            previousStatus !== undefined &&
            previousStatus !== ride.status
          ) {
            const message = getStatusMessage(ride.status);

            if (message) {
              setNotification({
                id: `${ride.id}-${ride.status}-${Date.now()}`,
                message,
              });
            }
          }
        }

        previousStatuses.current = nextStatuses;
        setRides(nextRides);
        setError("");
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

    void loadRides();
    void loadReviews();

    // Continue checking for ride-status changes.
    const interval = setInterval(() => {
      void loadRides();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoaded, user, loadReviews]);

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
            View your rides, estimated fares, payments, receipts, and reviews.
          </p>
        </section>

        {notification && (
          <div
            key={notification.id}
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-950/40 p-5 text-emerald-100"
          >
            <div>
              <p className="font-bold">⚡ Volt Cab update</p>
              <p className="mt-1 text-sm">
                {notification.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNotification(null)}
              className="shrink-0 rounded-lg px-3 py-1 text-sm text-emerald-200 hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              Dismiss
            </button>
          </div>
        )}

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
            <h2 className="text-xl font-bold">No rides yet</h2>

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
            {rides.map((ride) => {
              const isCompleted =
                ride.status.toLowerCase() === "completed";

              const savedReview = savedReviews[ride.id];

              return (
                <article
                  key={ride.id}
                  className="rounded-2xl border border-rose-900/40 bg-[#21121a] p-6 transition hover:border-rose-700/60"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h2 className="text-lg font-bold">
                      {ride.pickup_location} → {ride.dropoff_location}
                    </h2>

                    <span
                      className={`rounded-full border px-3 py-1 text-sm capitalize ${getStatusStyle(
                        ride.status
                      )}`}
                    >
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
                      Distance:{" "}
                      <span className="text-rose-200">
                        {ride.distance_km != null
                          ? `${ride.distance_km} km`
                          : "Not recorded"}
                      </span>
                    </p>

                    <p>
                      Requested:{" "}
                      {new Date(ride.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Fare, payment, and receipt */}
                  <div className="mt-5 border-t border-rose-900/40 pt-4">
                    <p className="text-sm text-slate-400">
                      Estimated fare
                    </p>

                    <p className="mt-1 text-2xl font-black text-rose-300">
                      {ride.estimated_fare != null
                        ? `₹${ride.estimated_fare.toLocaleString("en-IN")}`
                        : "Not available"}
                    </p>

                    <div className="mt-4">
                      <p className="text-sm text-slate-400">
                        Payment status
                      </p>

                      <p className="mt-1 font-semibold capitalize text-rose-200">
                        {ride.payment?.status
                          ? ride.payment.status.replaceAll("_", " ")
                          : "Not created"}
                      </p>
                    </div>

                    {isCompleted &&
                      ride.payment?.status !== "succeeded" && (
                        <Link
                          href={`/payment?ride_id=${encodeURIComponent(
                            ride.id
                          )}`}
                          className="mt-4 inline-block rounded-xl bg-[#800020] px-5 py-3 font-bold text-white transition hover:bg-[#a00030]"
                        >
                          Create Test Payment →
                        </Link>
                      )}

                    {isCompleted && (
                      <Link
                        href={`/receipt/${encodeURIComponent(ride.id)}`}
                        className="mt-3 inline-block rounded-xl border border-rose-500/40 px-5 py-3 font-bold text-rose-200 transition hover:bg-rose-950/40"
                      >
                        View Ride Receipt →
                      </Link>
                    )}
                  </div>

                  {/* Ratings and reviews */}
                  {isCompleted && (
                    <div className="mt-6 border-t border-rose-900/40 pt-5">
                      <h3 className="text-lg font-bold text-white">
                        ⭐ Rate Your Ride
                      </h3>

                      {reviewedRides.includes(ride.id) ? (
                        <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">
                          <p className="font-semibold text-emerald-300">
                            ✓ You've already reviewed this ride.
                          </p>

                          {savedReview && (
                            <>
                              <p
                                className="mt-2 text-xl tracking-wider text-yellow-400"
                                aria-label={`${savedReview.rating} out of 5 stars`}
                              >
                                {"★".repeat(savedReview.rating)}
                                <span className="text-slate-600">
                                  {"☆".repeat(5 - savedReview.rating)}
                                </span>
                              </p>

                              {savedReview.comment && (
                                <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
                                  {savedReview.comment}
                                </p>
                              )}

                              <p className="mt-2 text-xs text-slate-500">
                                Reviewed{" "}
                                {new Date(
                                  savedReview.created_at
                                ).toLocaleDateString()}
                              </p>
                            </>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="mt-2 text-sm text-slate-400">
                            How was your experience?
                          </p>

                          <div
                            className="mt-3 flex gap-3"
                            role="group"
                            aria-label={`Rating for ride ${ride.id}`}
                          >
                            {[1, 2, 3, 4, 5].map((star) => {
                              const selected =
                                star <= (ratings[ride.id] ?? 0);

                              return (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() =>
                                    setRatings((prev) => ({
                                      ...prev,
                                      [ride.id]: star,
                                    }))
                                  }
                                  aria-label={`Rate ${star} out of 5 stars`}
                                  aria-pressed={
                                    ratings[ride.id] === star
                                  }
                                  className={`cursor-pointer select-none border-0 bg-transparent p-1 text-4xl leading-none transition-colors ${
                                    selected
                                      ? "text-yellow-400"
                                      : "text-gray-500 hover:text-yellow-300"
                                  }`}
                                >
                                  {selected ? "★" : "☆"}
                                </button>
                              );
                            })}
                          </div>

                          <label
                            htmlFor={`review-${ride.id}`}
                            className="mt-4 block text-sm font-medium text-slate-300"
                          >
                            Comment (optional)
                          </label>

                          <textarea
                            id={`review-${ride.id}`}
                            value={comments[ride.id] ?? ""}
                            onChange={(event) =>
                              setComments((prev) => ({
                                ...prev,
                                [ride.id]: event.target.value.slice(
                                  0,
                                  1000
                                ),
                              }))
                            }
                            placeholder="Tell us about your ride..."
                            maxLength={1000}
                            rows={3}
                            className="mt-2 w-full rounded-xl border border-rose-900/50 bg-[#170910] p-3 text-white placeholder:text-slate-500 focus:border-rose-400 focus:outline-none"
                          />

                          <p className="mt-1 text-right text-xs text-slate-500">
                            {(comments[ride.id] ?? "").length}/1000
                          </p>

                          <button
                            type="button"
                            onClick={() => void submitReview(ride.id)}
                            disabled={!!submittingReviews[ride.id]}
                            className="mt-3 rounded-xl bg-[#800020] px-5 py-3 font-bold text-white transition hover:bg-[#a00030] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {submittingReviews[ride.id]
                              ? "Submitting..."
                              : "Submit Review →"}
                          </button>
                        </>
                      )}

                      {reviewMessages[ride.id] && (
                        <p
                          role="status"
                          aria-live="polite"
                          className="mt-3 text-sm text-rose-200"
                        >
                          {reviewMessages[ride.id]}
                        </p>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <footer className="mt-12 border-t border-rose-900/40 pt-6 text-sm text-slate-500">
          Volt Cab · Your journey, powered by electricity.
        </footer>
      </div>
    </main>
  );
}