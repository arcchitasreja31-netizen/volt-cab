"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  console.log("CLERK STATUS:", { isLoaded, isSignedIn });
  console.log("VOLT CAB CLERK USER:", user);
type Ride = {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  ride_type: string;
  status: string;
  created_at: string;
};

const [rides, setRides] = useState<Ride[]>([]);
const [ridesLoading, setRidesLoading] = useState(true);
const [ridesError, setRidesError] = useState("");

type Profile = {
  full_name: string | null;
  phone: string | null;
};

const [profile, setProfile] = useState<Profile>({
  full_name: "",
  phone: "",
});
const [profileLoading, setProfileLoading] = useState(true);
const [profileSaving, setProfileSaving] = useState(false);
const [profileMessage, setProfileMessage] = useState("");


useEffect(() => {
  let cancelled = false;

  async function loadRides() {
    try {
      const response = await fetch("/api/rides");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not load ride history.");
      }

      if (!cancelled) {
        setRides(result.rides ?? []);
      }
    } catch (error) {
      if (!cancelled) {
        setRidesError(
          error instanceof Error ? error.message : "Something went wrong."
        );
      }
    } finally {
      if (!cancelled) {
        setRidesLoading(false);
      }
    }
  }

  if (isLoaded && user) {
    void loadRides();
  } else if (isLoaded) {
    setRidesLoading(false);
  }

  return () => {
    cancelled = true;
  };
}, [isLoaded, user]);

useEffect(() => {
  let cancelled = false;

  async function loadProfile() {
    try {
      const response = await fetch("/api/profile");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Could not load your profile.");
      }

      if (!cancelled) {
        setProfile({
          full_name: result.profile?.full_name ?? "",
          phone: result.profile?.phone ?? "",
        });
      }
    } catch (error) {
      if (!cancelled) {
        setProfileMessage(
          error instanceof Error
            ? error.message
            : "Could not load your profile."
        );
      }
    } finally {
      if (!cancelled) {
        setProfileLoading(false);
      }
    }
  }

  if (isLoaded && user) {
    void loadProfile();
  } else if (isLoaded) {
    setProfileLoading(false);
  }

  return () => {
    cancelled = true;
  };
}, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b14] text-cyan-300">
        Loading your dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link href="/" className="text-2xl font-black tracking-wider text-cyan-300">
            VOLT<span className="text-white">CAB</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
            {user?.fullName || user?.firstName || user?.username || "Passenger"}
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 font-bold text-cyan-300">
              {(user?.firstName?.[0] ?? "V").toUpperCase()}
            </div>
          </div>
        </header>

        <section className="py-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Passenger dashboard
          </p>

          <h1 className="text-4xl font-black sm:text-5xl">
            Welcome back,{" "}
            <span className="text-cyan-300">
              {user?.firstName ?? "Rider"}
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-slate-400">
            Your next ride is just a few clicks away. Where are we taking you?
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/#booking"
              className="rounded-xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Book a ride →
            </Link>

            <Link
              href="/"
              className="rounded-xl border border-white/15 px-6 py-3 font-semibold transition hover:border-cyan-300/60"
            >
              Back to home
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6">
            <p className="text-sm text-slate-400">Your account</p>
            <h2 className="mt-3 text-xl font-bold">Ready to ride</h2>
            <p className="mt-2 text-sm text-slate-400">
              Signed in as {user?.primaryEmailAddress?.emailAddress ?? "your account"}.
            </p>
          </div>

         <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6">
  <p className="text-sm text-slate-400">Ride history</p>
  <h2 className="mt-3 text-xl font-bold">Your journeys</h2>

  {ridesLoading ? (
    <p className="mt-3 text-sm text-slate-400">
      Loading your rides...
    </p>
  ) : ridesError ? (
    <p className="mt-3 text-sm text-red-300">{ridesError}</p>
  ) : rides.length === 0 ? (
    <p className="mt-3 text-sm text-slate-400">
      No rides yet. Book your first ride to get started.
    </p>
  ) : (
    <div className="mt-4 space-y-4">
      {rides.map((ride) => (
        <div
          key={ride.id}
          className="rounded-xl border border-white/10 p-4"
        >
          <p className="font-semibold">
            {ride.pickup_location} → {ride.dropoff_location}
          </p>

          <p className="mt-2 text-sm capitalize text-cyan-300">
            {ride.ride_type} · {ride.status.replaceAll("_", " ")}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {new Date(ride.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  )}
</div>
          <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6">
            <p className="text-sm text-slate-400">Profile</p>
            <h2 className="mt-3 text-xl font-bold">Your details</h2>
            <p className="mt-2 text-sm text-slate-400">
              Profile editing is our next step.
            </p>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-sm text-slate-500">
          Volt Cab · Your journey, powered by electricity.
        </footer>
      </div>
    </main>
  );
}