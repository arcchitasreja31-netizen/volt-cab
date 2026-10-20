import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to view driver ratings." },
        { status: 401 }
      );
    }

    // Find the driver's completed rides.
    const { data: rides, error: ridesError } = await supabaseServer
      .from("rides")
      .select("id")
      .eq("driver_id", userId)
      .eq("status", "completed");

    if (ridesError) {
      console.error("Driver rides lookup failed:", ridesError.message);

      return NextResponse.json(
        { error: "Unable to load driver rides." },
        { status: 500 }
      );
    }

    const rideIds = (rides ?? []).map((ride) => ride.id);

    if (rideIds.length === 0) {
      return NextResponse.json({
        averageRating: null,
        totalReviews: 0,
      });
    }

    // Load reviews belonging to those rides.
    const { data: reviews, error: reviewsError } = await supabaseServer
      .from("ride_reviews")
      .select("rating")
      .in("ride_id", rideIds);

    if (reviewsError) {
      console.error("Driver reviews lookup failed:", reviewsError.message);

      return NextResponse.json(
        { error: "Unable to load driver reviews." },
        { status: 500 }
      );
    }

    const ratings = (reviews ?? []).map((review) => review.rating);

    const averageRating =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((sum, rating) => sum + rating, 0) /
              ratings.length) *
              10
          ) / 10
        : null;

    return NextResponse.json({
      averageRating,
      totalReviews: ratings.length,
    });
  } catch (error) {
    console.error("Driver ratings API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}