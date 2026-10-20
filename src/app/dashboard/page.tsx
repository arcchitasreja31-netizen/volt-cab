"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
type Profile = {
  full_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
};

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [profileName, setProfileName] = useState("");
const [profileImage, setProfileImage] = useState<string | null>(null);
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
          setProfileImage(profile.profile_image_url || null);
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
      <main
        className="flex min-h-screen items-center justify-center bg-[#170910] text-rose-300"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 3, 8, 0.88), rgba(15, 3, 8, 0.94)), url('/images/voltcity.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-rose-300/20 border-t-rose-400" />
          Loading your dashboard...
        </div>
      </main>
    );
  }

  const displayName =
    profileName.trim() || user?.firstName || "Rider";

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#170910] bg-cover bg-center bg-fixed px-5 py-8 text-white sm:px-10 sm:py-10"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 3, 8, 0.78), rgba(15, 3, 8, 0.94)), url('/images/voltcity.png')",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-950/10 via-transparent to-black/30" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-rose-300/20 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-rose-400 transition hover:text-rose-300"
          >
            VOLT<span className="text-white">CAB</span>
          </Link>

          <div className="flex items-center gap-3 rounded-full border border-rose-300/20 bg-[#21121a]/80 py-2 pl-4 pr-2 backdrop-blur-md">
            <div className="text-right">
              <p className="text-xs text-rose-200/60">Welcome back</p>
              <p className="max-w-40 truncate text-sm font-semibold text-white">
                {displayName}
              </p>
            </div>

           <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-300/50 bg-rose-900/60 font-bold text-rose-100">
  {profileImage ? (
    <img
      src={profileImage}
      alt="Your profile"
      className="h-full w-full object-cover"
    />
  ) : (
    avatarInitial
  )}
</div>
          </div>
        </header>

        {/* Welcome section */}
        <section className="py-12 sm:py-16">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-rose-400" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-300 sm:text-sm">
              Passenger dashboard
            </p>
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Welcome back,
            <br className="hidden sm:block" />{" "}
            <span className="text-rose-400">{displayName}</span>
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-rose-100/70 sm:text-lg">
            Your next journey starts here. Choose your destination and
            let Volt Cab take you there.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/book"
              className="rounded-xl bg-[#800020] px-7 py-3.5 font-bold text-white shadow-lg shadow-rose-950/40 transition hover:-translate-y-0.5 hover:bg-[#a00032] focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              Book a Ride →
            </Link>

            <Link
              href="/rides"
              className="rounded-xl border border-rose-300/30 bg-[#21121a]/70 px-7 py-3.5 font-semibold text-rose-100 backdrop-blur-sm transition hover:border-rose-300/60 hover:bg-rose-950/50"
            >
              View My Rides
            </Link>
          </div>
        </section>

        {/* Dashboard cards */}
        <section
          aria-label="Dashboard shortcuts"
          className="grid gap-5 md:grid-cols-3"
        >
          {/* Account card */}
          <article className="group rounded-2xl border border-rose-300/20 bg-[#21121a]/85 p-6 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-rose-300/40">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-950/60 text-2xl">
              ⚡
            </div>

            <p className="text-sm font-medium text-rose-200/70">
              Your account
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Ready to ride
            </h2>

            <p className="mt-3 break-words text-sm leading-6 text-rose-100/60">
              Signed in as{" "}
              {user?.primaryEmailAddress?.emailAddress ||
                "your account"}
              .
            </p>

            <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rose-300">
              Account active <span aria-hidden="true">✓</span>
            </div>
           <button
  type="button"
  onClick={async () => {
    try {
      await signOut({ redirectUrl: "/sign-in" });
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }}
  className="mt-5 block w-full rounded-xl border border-rose-300/30 bg-rose-950/60 px-4 py-3 text-sm font-bold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-900 hover:text-white"
>
  Sign Out
</button>
          </article>

          {/* Ride history card */}
          <article className="group rounded-2xl border border-rose-300/20 bg-[#21121a]/85 p-6 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-rose-300/40">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-950/60 text-2xl">
              🚘
            </div>

            <p className="text-sm font-medium text-rose-200/70">
              Your journeys
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Ride History
            </h2>

            <p className="mt-3 text-sm leading-6 text-rose-100/60">
              View previous rides and check the status of your
              bookings.
            </p>

            <Link
              href="/rides"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-4 py-3 text-sm font-bold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-950/50 hover:text-white"
            >
              See Ride History <span aria-hidden="true">→</span>
            </Link>
          </article>

          {/* Profile card */}
          <article className="group rounded-2xl border border-rose-300/20 bg-[#21121a]/85 p-6 backdrop-blur-md transition duration-200 hover:-translate-y-1 hover:border-rose-300/40">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-950/60 text-2xl">
              👤
            </div>

            <p className="text-sm font-medium text-rose-200/70">
              Account settings
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Your Profile
            </h2>

            <p className="mt-3 text-sm leading-6 text-rose-100/60">
              {profileName
                ? `Your profile name is ${profileName}.`
                : "Manage your name and phone number."}
            </p>

            <Link
              href="/profile"
              className="mt-5 inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-4 py-3 text-sm font-bold text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-950/50 hover:text-white"
            >
              Edit Profile <span aria-hidden="true">→</span>
            </Link>
          </article>
        </section>

        {/* Footer */}
        <footer className="mt-12 border-t border-rose-300/15 py-6 text-center text-xs tracking-wide text-rose-100/40 sm:text-left sm:text-sm">
          VOLT CAB <span className="mx-2">·</span> Your journey, powered
          by electricity.
        </footer>
      </div>
    </main>
  );
}