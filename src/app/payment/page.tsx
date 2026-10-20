"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Payment = {
  id: string;
  ride_id: string;
  amount: number;
  currency: string;
  status: string;
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rideId = searchParams.get("ride_id");

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createPayment() {
    if (!rideId) {
      setError("Missing ride ID. Open this page from a completed ride.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ride_id: rideId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create payment.");
      }

      setPayment(data.payment);
      setMessage("Payment record created. No money has been charged.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-10 text-gray-900">
      <section className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold">Volt Cab Payments</h1>

        <p className="mt-2 text-sm text-gray-600">
          Review your completed ride and create a test payment record.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4">
          <p className="text-sm text-gray-500">Ride ID</p>
          <p className="mt-1 break-all font-mono text-sm">
            {rideId || "No ride ID provided"}
          </p>
        </div>

        {payment && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <h2 className="font-semibold">Payment record created</h2>

            <p className="mt-2">
              Amount: {payment.currency}{" "}
              {Number(payment.amount).toFixed(2)}
            </p>

            <p className="mt-1">
              Status: <strong>{payment.status}</strong>
            </p>

            <p className="mt-2 break-all text-xs text-gray-600">
              Payment ID: {payment.id}
            </p>
          </div>
        )}

        {message && (
          <p role="status" className="mt-4 text-sm text-green-700">
            {message}
          </p>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={createPayment}
          disabled={loading || !rideId}
          className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating payment..." : "Create Test Payment"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/rides")}
          className="mt-3 w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold hover:bg-gray-50"
        >
          Back to Ride History
        </button>

        <p className="mt-5 text-center text-xs text-gray-500">
          Development mode only. This page does not process real payments.
        </p>
      </section>
    </main>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-900">
          Loading payment page...
        </main>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}