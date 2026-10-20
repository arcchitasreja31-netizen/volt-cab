import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    // Verify the signed-in user's driver role.
    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Driver verification failed:", profileError.message);
      return NextResponse.json(
        { error: "Could not verify driver access." },
        { status: 500 }
      );
    }

    if (profile?.role !== "driver") {
      return NextResponse.json(
        { error: "Driver access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const rideId = body.rideId;

    if (
      (typeof rideId !== "string" && typeof rideId !== "number") ||
      String(rideId).trim() === ""
    ) {
      return NextResponse.json(
        { error: "A valid ride ID is required." },
        { status: 400 }
      );
    }

    // Only one request can change a ride from requested to accepted.
    const { data: ride, error: rideError } = await supabaseServer
      .from("rides")
      .update({
        status: "accepted",
        driver_id: userId,
      })
      .eq("id", rideId)
      .eq("status", "requested")
      .is("driver_id", null)
      .select(
        "id, pickup_location, dropoff_location, ride_type, distance_km, status, driver_id"
      )
      .maybeSingle();

    if (rideError) {
      console.error("Accept ride failed:", rideError.message);
      return NextResponse.json(
        { error: "Could not accept this ride." },
        { status: 500 }
      );
    }

    if (!ride) {
      return NextResponse.json(
        { error: "This ride is no longer available. Refresh and try another." },
        { status: 409 }
      );
    }

    return NextResponse.json({ ride }, { status: 200 });
  } catch (error) {
    console.error("Accept ride API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}