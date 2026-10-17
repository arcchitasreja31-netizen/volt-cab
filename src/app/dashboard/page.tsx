"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Profile = {
  full_name: string | null;
  phone: string | null;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [profileName, setProfileName] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "Could not load your profile."
          );
        }

        const profile: Profile | null = result.profile;

        if (!cancelled && profile) {
          setProfileName(profile.full_name || "");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Could not load profile:", error);
        }
      }
    }

    if (isLoaded && user) {
      void loadProfile();
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

  const displayName =
    profileName.trim() || user?.firstName || "Rider";

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-cyan-300"
          >
            VOLT<span className="text-white">CAB</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">
              {displayName}
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/10 font-bold text-cyan-300">
              {avatarInitial}
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
              {displayName}
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-slate-400">
            Your next ride is just a few clicks away. Where are we
            taking you?
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
            <p className="text-sm text-slate-400">
              Your account
            </p>

            <h2 className="mt-3 text-xl font-bold">
              Ready to ride
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Signed in as{" "}
              {user?.primaryEmailAddress?.emailAddress ||
                "your account"}
              .
            </p>
          </div>

          <div className="rounded-2xl border border-rose-900/40 bg-[#1a1015] p-6">
            <p className="text-sm text-rose-200/70">
              Your journeys
            </p>

            <h2 className="mt-3 text-xl font-bold">
              Ride History
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              View your previous rides and check their status.
            </p>

            <Link
              href="/rides"
              className="mt-5 inline-block rounded-xl bg-[#800020] px-4 py-3 font-semibold text-white transition hover:bg-[#a00030]"
            >
              See Ride History →
            </Link>
          </div>

          <div className="rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6">
            <p className="text-sm text-slate-400">
              Profile
            </p>

            <h2 className="mt-3 text-xl font-bold">
              Your details
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              {profileName
                ? `Profile name: ${profileName}`
                : "Manage your name and phone number."}
            </p>

            <Link
              href="/profile"
              className="mt-5 inline-block rounded-xl border border-cyan-300/40 px-4 py-2 font-semibold text-cyan-300 transition hover:bg-cyan-300/10"
            >
              Edit Profile →
            </Link>
          </div>
        </section>

        <footer className="mt-14 border-t border-white/10 pt-6 text-sm text-slate-500">
          Volt Cab · Your journey, powered by electricity.
        </footer>
      </div>
    </main>
  );
}