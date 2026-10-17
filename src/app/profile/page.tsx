"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

type Profile = {
  full_name: string;
  phone: string | null;
};

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load your profile.");
        }

        const profile: Profile | null = result.profile;

        if (profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save your profile.");
      }

      setFullName(result.profile.full_name || "");
      setPhone(result.profile.phone || "");
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b14] px-5 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-2xl">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <Link href="/" className="text-2xl font-black tracking-wider text-cyan-300">
            VOLT<span className="text-white">CAB</span>
          </Link>

          <Link
            href="/dashboard"
            className="text-sm text-cyan-300 hover:text-cyan-200"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mt-12">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Account settings
          </p>

          <h1 className="mt-3 text-4xl font-black">Your Profile</h1>

          <p className="mt-3 text-slate-400">
            Update your details for your Volt Cab account.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6 rounded-2xl border border-cyan-300/20 bg-white/[0.03] p-6 sm:p-8"
          >
            {loading ? (
              <p className="text-slate-400">Loading your profile...</p>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Full name
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                    maxLength={100}
                    className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-300"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    maxLength={30}
                    className="w-full rounded-xl border border-white/15 bg-[#0b1220] px-4 py-3 outline-none focus:border-cyan-300"
                    placeholder="Enter your phone number"
                  />
                </div>

                {message && (
                  <p role="status" className="text-sm text-green-300">
                    {message}
                  </p>
                )}

                {error && (
                  <p role="alert" className="text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </>
            )}
          </form>
        </section>
      </div>
    </main>
  );
}