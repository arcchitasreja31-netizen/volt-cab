import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 }
      );
    }

    // Check the signed-in user's role in Supabase.
// Check the separate admin permissions table.
const { data: admin, error: adminError } = await supabaseServer
  .from("admin_users")
  .select("clerk_user_id")
  .eq("clerk_user_id", userId)
  .maybeSingle();

if (adminError) {
  console.error("Admin permission lookup failed:", adminError);

  return NextResponse.json(
    { error: "Unable to verify admin permissions." },
    { status: 500 }
  );
}

if (!admin) {
  return NextResponse.json(
    { error: "Admin access required." },
    { status: 403 }
  );
}
    // Count users.
    const { count: totalUsers, error: usersError } =
      await supabaseServer
        .from("users")
        .select("*", { count: "exact", head: true });

    // Count drivers.
    const { count: totalDrivers, error: driversError } =
      await supabaseServer
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("role", "driver");

    // Count rides.
    const { count: totalRides, error: ridesError } =
      await supabaseServer
        .from("rides")
        .select("*", { count: "exact", head: true });

    // Count reviews.
    const { count: totalReviews, error: reviewsError } =
      await supabaseServer
        .from("ride_reviews")
        .select("*", { count: "exact", head: true });

    if (usersError || driversError || ridesError || reviewsError) {
      console.error("Admin stats query failed:", {
        usersError,
        driversError,
        ridesError,
        reviewsError,
      });

      return NextResponse.json(
        { error: "Unable to load dashboard statistics." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalDrivers: totalDrivers ?? 0,
      totalRides: totalRides ?? 0,
      totalReviews: totalReviews ?? 0,
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}