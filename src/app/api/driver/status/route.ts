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

    const body = await request.json();
    const { rideId, status } = body;

    if (!rideId || !["in_progress", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid ride ID or status." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (profile?.role !== "driver") {
      return NextResponse.json(
        { error: "Only drivers can update ride status." },
        { status: 403 }
      );
    }

    const previousStatus =
      status === "in_progress" ? "accepted" : "in_progress";

    const { data: ride, error } = await supabaseServer
      .from("rides")
      .update({ status })
      .eq("id", rideId)
      .eq("driver_id", userId)
      .eq("status", previousStatus)
      .select("id, status")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!ride) {
      return NextResponse.json(
        {
          error:
            "Ride unavailable. Check that you accepted this ride and that its current status allows this action.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, ride });
  } catch (error) {
    console.error("Driver status update failed:", error);

    return NextResponse.json(
      { error: "Could not update the ride status." },
      { status: 500 }
    );
  }
}