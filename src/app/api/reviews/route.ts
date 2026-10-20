import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    // 1. Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to submit a review." },
        { status: 401 }
      );
    }

    // 2. Read and validate request body
    const body = await request.json();

    const rideId =
      typeof body.ride_id === "string" ? body.ride_id.trim() : "";

    const rating = Number(body.rating);

    const comment =
      typeof body.comment === "string" ? body.comment.trim() : "";

    if (!rideId) {
      return NextResponse.json(
        { error: "A ride ID is required." },
        { status: 400 }
      );
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number from 1 to 5." },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        { error: "Review comments must be 1000 characters or fewer." },
        { status: 400 }
      );
    }

    // 3. Connect to Supabase
    const supabase = supabaseServer;

    // 4. Verify that this ride belongs to the signed-in passenger
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, user_id, status")
      .eq("id", rideId)
      .eq("user_id", userId)
      .maybeSingle();

    if (rideError) {
      console.error("Review ride lookup failed:", rideError.message);

      return NextResponse.json(
        { error: "Unable to verify this ride." },
        { status: 500 }
      );
    }

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found or you do not have access to it." },
        { status: 404 }
      );
    }

    // 5. Only allow reviews for completed rides
    if (
      typeof ride.status !== "string" ||
      ride.status.toLowerCase() !== "completed"
    ) {
      return NextResponse.json(
        { error: "Only completed rides can be reviewed." },
        { status: 400 }
      );
    }

    // 6. Save the review
    const { data: review, error: reviewError } = await supabase
      .from("ride_reviews")
      .insert({
        ride_id: rideId,
        passenger_id: userId,
        rating,
        comment: comment || null,
      })
      .select("id, ride_id, rating, comment, created_at")
      .single();

    if (reviewError) {
      // The database prevents more than one review per ride.
      if (reviewError.code === "23505") {
        return NextResponse.json(
          { error: "You've already reviewed this ride." },
          { status: 409 }
        );
      }

      console.error("Review insert failed:", reviewError.message);

      return NextResponse.json(
        { error: "Unable to save your review. Check database permissions." },
        { status: 500 }
      );
    }

    // 7. Return the saved review
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error("Review API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in to view your reviews." },
        { status: 401 }
      );
    }

    const { data: reviews, error } = await supabaseServer
      .from("ride_reviews")
      .select("ride_id, rating, comment, created_at")
      .eq("passenger_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Review lookup failed:", error.message);

      return NextResponse.json(
        { error: "Unable to load your reviews." },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews: reviews ?? [] });
  } catch (error) {
    console.error("Review GET API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}