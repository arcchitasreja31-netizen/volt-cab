
"use client";

import { useState } from "react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  Show,
} from "@clerk/nextjs";

export default function Home() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  return (
   <main
  className="min-h-screen overflow-hidden bg-[#170910] bg-cover bg-center bg-fixed text-white"
  style={{
    backgroundImage:
      "linear-gradient(rgba(15, 3, 8, 0.45), rgba(15, 3, 8, 0.78)), url('/images/voltcity.png')",
  }}
>
      <nav className="flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-16">
        <a href="#home" className="text-2xl font-black tracking-wider">
          VOLT<span className="text-rose-400">CAB</span>
        </a>

        <div className="hidden gap-8 text-sm text-gray-300 md:flex">
          <a href="#home" className="hover:text-rose-400">Home</a>
          <a href="#book" className="hover:text-rose-400">Book a Ride</a>
          <a href="#features" className="hover:text-rose-400">Features</a>
        </div>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-cyan-400/60 px-5 py-2 text-sm text-cyan-300 hover:bg-cyan-400/10">
                Sign In
              </button>
            </SignInButton>

            <SignUpButton mode="modal">
              <button className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-bold text-[#070816] hover:bg-cyan-300">
                Sign Up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </nav>

      <section
        id="home"
        className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:px-16 md:py-28"
      >
        <div className="absolute left-1/4 top-24 -z-0 h-64 w-64 rounded-full bg-purple-600/20 blur-[120px]" />

        <div className="relative z-10">
          <p className="mb-5 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/5 px-4 py-2 text-xs tracking-[0.25em] text-cyan-300">
            THE FUTURE OF URBAN MOBILITY
          </p>

          <h1 className="text-5xl font-black leading-tight tracking-tight md:text-7xl">
            YOUR CITY.
            <br />
            YOUR RIDE.
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              YOUR VOLT.
            </span>
          </h1>

          <p className="mt-6 max-w-lg leading-7 text-gray-400">
            Your next journey starts here. Find a ride, choose your destination,
            and get ready to move through the city in a whole new way.
          </p>

          <a
            href="#book"
            className="mt-8 inline-flex rounded-full bg-cyan-400 px-7 py-3.5 font-bold text-[#070816] transition hover:scale-105 hover:bg-cyan-300"
          >
            Book Your Ride ↗
          </a>

          <div className="mt-12 flex gap-10">
            <div>
              <p className="text-2xl font-bold text-cyan-300">24/7</p>
              <p className="mt-1 text-xs text-gray-500">Ride access</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-300">LIVE</p>
              <p className="mt-1 text-xs text-gray-500">Ride updates*</p>
            </div>
            <div>
              <p className="text-2xl font-bold">ONE</p>
              <p className="mt-1 text-xs text-gray-500">Simple platform</p>
            </div>
          </div>
        </div>

        <div id="book" className="relative z-10">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-cyan-400/30 to-purple-600/30 blur-xl" />

          <div className="relative rounded-3xl border border-white/10 bg-[#101225]/95 p-7 shadow-2xl md:p-9">
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs tracking-[0.2em] text-cyan-300">
                  VOLT BOOKING
                </p>
                <h2 className="mt-2 text-2xl font-bold">Where to next?</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-2xl">
                ↗
              </div>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                alert(
                  `Ride request preview\nPickup: ${pickup}\nDestination: ${destination}\n\nReal booking and driver matching will be connected later.`
                );
              }}
              className="space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Pickup location
                </label>
                <input
                  value={pickup}
                  onChange={(event) => setPickup(event.target.value)}
                  placeholder="Enter your pickup point"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#080b19] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Your destination
                </label>
                <input
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Where are you going?"
                  required
                  className="w-full rounded-xl border border-white/10 bg-[#080b19] px-4 py-4 text-white outline-none transition placeholder:text-gray-600 focus:border-purple-400"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 py-4 font-bold text-[#070816] transition hover:brightness-110"
              >
                Find My Ride →
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-500">
              Booking preview only · Real ride matching comes later
            </p>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="border-t border-white/10 px-6 py-12 text-center md:px-16"
      >
        <p className="text-sm tracking-[0.25em] text-purple-300">
          MOVE DIFFERENTLY
        </p>
        <h2 className="mt-3 text-2xl font-bold">
          Built for your next journey.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-400">
          A futuristic interface today. Maps, authentication, driver matching,
          live updates, and payments will be developed in the upcoming project
          stages.
        </p>
      </section>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-gray-500">
        © 2026 Volt Cab · Ride into the future.
      </footer>
    </main>
  );
}
