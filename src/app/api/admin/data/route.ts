import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
console.log("user_3KgfBUT0E53rfuK3Y5MCB2H33OX:", userId);
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    // Verify admin permission using the signed-in Clerk user ID.
const { data: admin, error: adminError } = await supabaseServer
  .from("admin_users")
  .select("clerk_user_id")
  .eq("clerk_user_id", userId)
  .maybeSingle();

console.log("Admin check:", {
  found: Boolean(admin),
  error: adminError?.message ?? null,
});
    if (adminError) {
      console.error("Admin permission check failed:", adminError.message);

      return NextResponse.json(
        { error: "Unable to verify admin permission." },
        { status: 500 }
      );
    }
     console.log("Admin record found:", Boolean(admin));
    if (!admin) {
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "")
      .trim()
      .slice(0, 100)
      .toLowerCase();

    const section = searchParams.get("section") || "all";

    if (!["all", "users", "rides", "reviews"].includes(section)) {
      return NextResponse.json(
        { error: "Invalid section." },
        { status: 400 }
      );
    }

    let users: Record<string, any>[] = [];
    let rides: Record<string, any>[] = [];
    let reviews: Record<string, any>[] = [];

    if (section === "all" || section === "users") {
      const { data, error } = await supabaseServer
        .from("users")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      users = data || [];
    }

    if (section === "all" || section === "rides") {
      const { data, error } = await supabaseServer
        .from("rides")
        .select(
          "id, user_id, driver_id, pickup_location, dropoff_location, ride_type, status, created_at, distance_km, estimated_fare"
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      rides = data || [];
    }

    if (section === "all" || section === "reviews") {
      const { data, error } = await supabaseServer
        .from("ride_reviews")
        .select("id, ride_id, passenger_id, rating, comment, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      reviews = data || [];
    }

    const contains = (value: unknown) =>
      String(value ?? "").toLowerCase().includes(search);

    if (search) {
      users = users.filter((user) =>
        [user.full_name, user.role, user.id].some(contains)
      );

      rides = rides.filter((ride) =>
        [
          ride.id,
          ride.user_id,
          ride.driver_id,
          ride.pickup_location,
          ride.dropoff_location,
          ride.status,
          ride.ride_type,
        ].some(contains)
      );

      reviews = reviews.filter((review) =>
        [
          review.ride_id,
          review.passenger_id,
          review.rating,
          review.comment,
        ].some(contains)
      );
    }

    return NextResponse.json({ users, rides, reviews });
  } catch (error) {
    console.error("Admin data error:", error);

    return NextResponse.json(
      { error: "Unable to load admin data." },
      { status: 500 }
    );
  }
}