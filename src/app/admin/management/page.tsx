"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type AdminData = {
  users: {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
  }[];
  rides: {
    id: string;
    user_id: string;
    driver_id: string | null;
    pickup_location: string;
    dropoff_location: string;
    ride_type: string;
    status: string;
    created_at: string;
    distance_km: number | null;
    estimated_fare: number | null;
  }[];
  reviews: {
    id: string;
    ride_id: string;
    passenger_id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }[];
};

type Section = "users" | "rides" | "reviews";

const emptyData: AdminData = {
  users: [],
  rides: [],
  reviews: [],
};

const inputClass =
  "rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white";

const buttonClass =
  "rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

export default function AdminManagementPage() {
  const [section, setSection] = useState<Section>("users");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<AdminData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingRoles, setPendingRoles] = useState<Record<string, string>>(
    {}
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        section,
        search: search.trim(),
      });

      const response = await fetch(`/api/admin/data?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load admin data.");
      }

      setData((previous) => ({
        ...previous,
        ...result,
      }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [section, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 250);

    return () => clearTimeout(timer);
  }, [loadData]);

  async function updateRole(userId: string) {
    const role = pendingRoles[userId];

    if (!role) return;

    setSavingId(userId);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/users/${encodeURIComponent(userId)}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update role.");
      }

      setData((previous) => ({
        ...previous,
        users: previous.users.map((user) =>
          user.id === userId ? { ...user, role } : user
        ),
      }));

      setPendingRoles((previous) => {
        const updated = { ...previous };
        delete updated[userId];
        return updated;
      });

      setMessage("User role updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update user role."
      );
    } finally {
      setSavingId(null);
    }
  }

  const tabs: { id: Section; label: string }[] = [
    { id: "users", label: "Users" },
    { id: "rides", label: "Rides" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-cyan-400">
              Volt-Cab Administration
            </p>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Management Center
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Manage users, inspect rides, and review feedback.
            </p>
          </div>

          <Link href="/admin" className={buttonClass}>
            ← Admin Dashboard
          </Link>
        </header>

        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <label
            htmlFor="admin-search"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Search {section}
          </label>

          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search names, IDs, routes, comments..."
            className={`${inputClass} w-full`}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSection(tab.id);
                  setMessage("");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  section === tab.id
                    ? "bg-cyan-400 text-slate-950"
                    : "border border-slate-700 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950/50 p-4 text-sm text-emerald-200"
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
            Loading {section}...
          </div>
        ) : (
          <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900">
            {section === "users" && (
              <>
                <div className="border-b border-slate-800 p-5">
                  <h2 className="text-xl font-semibold">Users</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Change user roles and save your updates.
                  </p>
                </div>

                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-800/70 text-slate-300">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">User ID</th>
                      <th className="p-4">Current role</th>
                      <th className="p-4">Joined</th>
                      <th className="p-4">Change role</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.users.map((user) => {
                      const selectedRole =
                        pendingRoles[user.id] ?? user.role;

                      const isDirty = selectedRole !== user.role;

                      return (
                        <tr
                          key={user.id}
                          className="border-t border-slate-800"
                        >
                          <td className="p-4 font-medium">
                            {user.full_name || "Unnamed user"}
                          </td>

                          <td className="max-w-56 truncate p-4 font-mono text-xs text-slate-400">
                            {user.id}
                          </td>

                          <td className="p-4">
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                              {user.role}
                            </span>
                          </td>

                          <td className="p-4 text-slate-400">
                            {formatDate(user.created_at)}
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                aria-label={`Role for ${user.full_name || user.id}`}
                                className={inputClass}
                                value={selectedRole}
                                onChange={(event) =>
                                  setPendingRoles((previous) => ({
                                    ...previous,
                                    [user.id]: event.target.value,
                                  }))
                                }
                                disabled={
                                  savingId === user.id ||
                                  user.role === "admin" &&
                                    user.id === ""
                                }
                              >
                                <option value="rider">Rider</option>
                                <option value="driver">Driver</option>
                                <option value="admin">Admin</option>
                              </select>

                              <button
                                type="button"
                                className={buttonClass}
                                onClick={() => void updateRole(user.id)}
                                disabled={!isDirty || savingId === user.id}
                              >
                                {savingId === user.id ? "Saving..." : "Save"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {data.users.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-slate-400"
                        >
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {section === "rides" && (
              <>
                <div className="border-b border-slate-800 p-5">
                  <h2 className="text-xl font-semibold">Rides</h2>
                </div>

                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-800/70 text-slate-300">
                    <tr>
                      <th className="p-4">Route</th>
                      <th className="p-4">Ride type</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Distance</th>
                      <th className="p-4">Estimated fare</th>
                      <th className="p-4">Created</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.rides.map((ride) => (
                      <tr key={ride.id} className="border-t border-slate-800">
                        <td className="p-4">
                          <div>{ride.pickup_location}</div>
                          <div className="my-1 text-slate-500">↓</div>
                          <div>{ride.dropoff_location}</div>
                        </td>
                        <td className="p-4">{ride.ride_type}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                            {ride.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {ride.distance_km ?? "—"} km
                        </td>
                        <td className="p-4">
                          {ride.estimated_fare == null
                            ? "—"
                            : `₹${ride.estimated_fare}`}
                        </td>
                        <td className="p-4 text-slate-400">
                          {formatDate(ride.created_at)}
                        </td>
                      </tr>
                    ))}

                    {data.rides.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="p-8 text-center text-slate-400"
                        >
                          No rides found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {section === "reviews" && (
              <>
                <div className="border-b border-slate-800 p-5">
                  <h2 className="text-xl font-semibold">Reviews</h2>
                </div>

                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-800/70 text-slate-300">
                    <tr>
                      <th className="p-4">Rating</th>
                      <th className="p-4">Comment</th>
                      <th className="p-4">Ride ID</th>
                      <th className="p-4">Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.reviews.map((review) => (
                      <tr
                        key={review.id}
                        className="border-t border-slate-800"
                      >
                        <td className="p-4">
                          {"★".repeat(
                            Math.max(0, Math.min(5, review.rating))
                          )}
                          <span className="ml-2 text-slate-400">
                            {review.rating}/5
                          </span>
                        </td>
                        <td className="max-w-md whitespace-pre-wrap p-4">
                          {review.comment || "No comment"}
                        </td>
                        <td className="max-w-48 truncate p-4 font-mono text-xs text-slate-400">
                          {review.ride_id}
                        </td>
                        <td className="p-4 text-slate-400">
                          {formatDate(review.created_at)}
                        </td>
                      </tr>
                    ))}

                    {data.reviews.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-8 text-center text-slate-400"
                        >
                          No reviews found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}
          </section>
        )}

        <footer className="mt-6 text-sm text-slate-500">
          Showing up to 100 records per section, depending on the API response.
        </footer>
      </div>
    </main>
  );
}