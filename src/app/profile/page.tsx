"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type Profile = {
  full_name: string;
  phone: string | null;
  profile_image_url?: string | null;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Could not load your profile.");
        }

        const profile: Profile | null = result.profile;

        if (!cancelled && profile) {
          setFullName(profile.full_name || "");
          setPhone(profile.phone || "");
          setProfileImage(profile.profile_image_url || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setMessage("");
    setError("");

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size === 0 || file.size > MAX_FILE_SIZE) {
      setError("Your image must be smaller than 2 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  async function handleImageUpload() {
    if (!selectedFile) {
      setError("Choose a picture first.");
      return;
    }

    setUploading(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/profile", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not upload your picture.");
      }

      setProfileImage(result.profile.profile_image_url || null);
      setSelectedFile(null);
      setMessage("Profile picture updated successfully!");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setUploading(false);
    }
  }

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
        body: JSON.stringify({ full_name: fullName, phone }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not save your profile.");
      }

      setFullName(result.profile.full_name || "");
      setPhone(result.profile.phone || "");
      setProfileImage(result.profile.profile_image_url || profileImage);
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

const [previewUrl, setPreviewUrl] = useState<string | null>(null);

useEffect(() => {
  if (!selectedFile) {
    setPreviewUrl(null);
    return;
  }

  const url = URL.createObjectURL(selectedFile);
  setPreviewUrl(url);

  return () => {
    URL.revokeObjectURL(url);
  };
}, [selectedFile]);
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#170910] bg-cover bg-center bg-fixed px-5 py-8 text-white sm:px-10 sm:py-12"
      style={{
        backgroundImage:
          "linear-gradient(rgba(15, 3, 8, 0.78), rgba(15, 3, 8, 0.94)), url('/images/voltcity.png')",
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-950/10 via-transparent to-black/30" />

      <div className="relative mx-auto max-w-2xl">
        <header className="flex items-center justify-between border-b border-rose-300/20 pb-6">
          <Link
            href="/"
            className="text-2xl font-black tracking-wider text-rose-400 transition hover:text-rose-300"
          >
            VOLT<span className="text-white">CAB</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-full border border-rose-300/25 bg-rose-950/40 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-900/50 hover:text-white"
          >
            ← Dashboard
          </Link>
        </header>

        <section className="mt-12">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8 bg-rose-400" />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-rose-300 sm:text-sm">
              Account settings
            </p>
          </div>

          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Your <span className="text-rose-400">Profile</span>
          </h1>

          <p className="mt-4 max-w-lg leading-7 text-rose-100/70">
            Personalize your account and keep your details up to date.
          </p>

          {loading ? (
            <div className="mt-8 rounded-3xl border border-rose-300/20 bg-[#21121a]/90 p-8 text-rose-100/70">
              Loading your profile...
            </div>
          ) : (
            <>
              {/* Profile picture */}
              <section className="mt-8 rounded-3xl border border-rose-300/20 bg-[#21121a]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8">
                <h2 className="text-lg font-bold">Profile picture</h2>
                <p className="mt-1 text-sm text-rose-100/60">
                  Choose a JPG, PNG, or WebP image up to 2 MB.
                </p>

                <div className="mt-6 flex flex-col items-center gap-5 sm:flex-row">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-rose-300/50 bg-rose-950/60 text-3xl font-black text-rose-200 shadow-lg shadow-rose-950/30">
                    {previewUrl || profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl || profileImage || ""}
                        alt="Profile picture preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      fullName.trim().charAt(0).toUpperCase() || "V"
                    )}
                  </div>

                  <div className="w-full">
                    <label
                      htmlFor="profilePicture"
                      className="mb-2 block text-sm font-semibold text-rose-100"
                    >
                      Choose an image
                    </label>

                    <input
                      ref={fileInputRef}
                      id="profilePicture"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="block w-full cursor-pointer rounded-xl border border-rose-300/20 bg-[#170910] text-sm text-rose-100 file:mr-4 file:cursor-pointer file:border-0 file:bg-rose-950 file:px-4 file:py-3 file:font-semibold file:text-rose-100 hover:file:bg-rose-900"
                    />

                    {selectedFile && (
                      <p className="mt-2 break-all text-xs text-rose-200/70">
                        Selected: {selectedFile.name}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={!selectedFile || uploading}
                      className="mt-4 w-full rounded-xl bg-[#800020] px-5 py-3 font-bold text-white transition hover:bg-[#a00032] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                    >
                      {uploading ? "Uploading..." : "Upload Picture ↑"}
                    </button>
                  </div>
                </div>
              </section>

              {/* Personal information */}
              <form
                onSubmit={handleSubmit}
                className="mt-5 space-y-6 rounded-3xl border border-rose-300/20 bg-[#21121a]/90 p-6 shadow-2xl shadow-black/30 backdrop-blur-md sm:p-8"
              >
                <div className="border-b border-rose-300/15 pb-5">
                  <h2 className="text-lg font-bold">Personal information</h2>
                  <p className="mt-1 text-sm text-rose-100/60">
                    Manage the details associated with your account.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-rose-100"
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
                    autoComplete="name"
                    className="w-full rounded-xl border border-rose-200/20 bg-[#fff7f9] px-4 py-3 text-[#2b0a18] outline-none transition placeholder:text-[#805866] focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-rose-100"
                  >
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    maxLength={30}
                    autoComplete="tel"
                    className="w-full rounded-xl border border-rose-200/20 bg-[#fff7f9] px-4 py-3 text-[#2b0a18] outline-none transition placeholder:text-[#805866] focus:border-rose-400 focus:ring-2 focus:ring-rose-400/30"
                    placeholder="Enter your phone number"
                  />
                </div>

                {message && (
                  <p
                    role="status"
                    className="rounded-xl border border-green-400/25 bg-green-950/40 px-4 py-3 text-sm text-green-300"
                  >
                    ✓ {message}
                  </p>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-400/25 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-xl bg-[#800020] px-6 py-3.5 font-bold text-white shadow-lg shadow-rose-950/30 transition hover:bg-[#a00032] focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 focus:ring-offset-[#21121a] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving your profile..." : "Save Profile →"}
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-xs tracking-wide text-rose-100/40">
            VOLT CAB · YOUR RIDE, YOUR WAY
          </p>
        </section>
      </div>
    </main>
  );
}