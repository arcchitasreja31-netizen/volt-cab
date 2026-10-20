"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function ReceiptPage() {
  const params = useParams<{ rideId: string }>();
  const router = useRouter();
  const { isLoaded, user } = useUser();

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadReceipt() {
      try {
        const response = await fetch("/api/rides");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load ride receipt.");
        }

        const foundRide = (data.rides ?? []).find(
          (item: Ride) => item.id === params.rideId
        );

        if (!foundRide) {
          throw new Error("Ride not found or you do not have access to it.");
        }

        if (!cancelled) {
          setRide(foundRide);
          setError("");
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

    if (isLoaded && user && params.rideId) {
      void loadReceipt();
    } else if (isLoaded && !user) {
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user, params.rideId]);

  if (!isLoaded || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#170910] text-rose-200">
        Loading receipt...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#170910] p-6 text-white">
        <h1 className="text-2xl font-bold">Sign in to view your receipt</h1>
        <button
          onClick={() => router.push("/sign-in")}
          className="rounded-xl bg-[#800020] px-5 py-3 font-bold"
        >
          Sign In
        </button>
      </main>
    );
  }

  if (error || !ride) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#170910] p-6 text-white">
        <p role="alert" className="text-center text-red-300">
          {error || "Receipt not found."}
        </p>

        <Link
          href="/rides"
          className="rounded-xl bg-[#800020] px-5 py-3 font-bold"
        >
          Back to Ride History
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#170910] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            href="/rides"
            className="text-rose-300 hover:text-rose-200"
          >
            ← Ride History
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-xl bg-[#800020] px-5 py-3 font-bold hover:bg-[#a00030]"
          >
            Print / Save as PDF
          </button>
        </div>

        <article className="rounded-2xl border border-rose-900/40 bg-[#21121a] p-6 shadow-xl sm:p-10 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black print:shadow-none">
          <header className="border-b border-rose-900/40 pb-6 print:border-gray-300">
            <p className="text-sm font-semibold tracking-[0.3em] text-rose-300 print:text-gray-600">
              RIDE RECEIPT
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-wider text-rose-300 print:text-black">
              VOLT<span className="text-white print:text-black">CAB</span>
            </h1>

            <p className="mt-2 text-sm text-slate-400 print:text-gray-600">
              Your journey, powered by electricity.
            </p>

            <div className="mt-6">
              <p className="text-sm text-slate-400 print:text-gray-600">
                Ride ID
              </p>
              <p className="mt-1 break-all font-mono text-sm">
                {ride.id}
              </p>
            </div>
          </header>

          <section className="border-b border-rose-900/40 py-6 print:border-gray-300">
            <h2 className="text-lg font-bold">Journey details</h2>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Pickup
                </p>
                <p className="mt-1 font-semibold">
                  {ride.pickup_location}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Drop-off
                </p>
                <p className="mt-1 font-semibold">
                  {ride.dropoff_location}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Ride type
                </p>
                <p className="mt-1 capitalize">{ride.ride_type}</p>
              </div>

              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Distance
                </p>
                <p className="mt-1">
                  {ride.distance_km != null
                    ? `${ride.distance_km} km`
                    : "Not recorded"}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Ride date
                </p>
                <p className="mt-1">
                  {new Date(ride.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-400 print:text-gray-600">
                  Ride status
                </p>
                <p className="mt-1 capitalize">
                  {ride.status.replaceAll("_", " ")}
                </p>
              </div>
            </div>
          </section>

          <section className="border-b border-rose-900/40 py-6 print:border-gray-300">
            <h2 className="text-lg font-bold">Fare summary</h2>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-slate-400 print:text-gray-600">
                Recorded estimated fare
              </span>

              <span className="text-2xl font-black text-rose-300 print:text-black">
                {ride.estimated_fare != null
                  ? `₹${Number(ride.estimated_fare).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : "Not available"}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <span className="text-slate-400 print:text-gray-600">
                Payment status
              </span>

              <span className="font-semibold capitalize">
                {ride.payment?.status
                  ? ride.payment.status.replaceAll("_", " ")
                  : "Not created"}
              </span>
            </div>
          </section>

          <footer className="pt-6 text-sm text-slate-400 print:text-gray-600">
            <p>
              This receipt displays the ride information currently recorded
              by Volt Cab.
            </p>

            <p className="mt-2">
              Payment status reflects the database record; it is not proof
              of a verified financial transaction.
            </p>
          </footer>
        </article>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }

          body {
            background: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </main>
  );
}