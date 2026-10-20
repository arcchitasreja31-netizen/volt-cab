import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export async function GET() {
  try {
    const { userId } = await auth();

    // 1. Verify authentication
    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    // 2. Verify the user's driver role
    const { data: profile, error: profileError } = await supabaseServer
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Driver profile lookup failed:", profileError.message);

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

    // 3. Fetch new ride requests and rides assigned to this driver
    const { data: rides, error: ridesError } = await supabaseServer
      .from("rides")
      .select(
        "id, pickup_location, dropoff_location, ride_type, distance_km, status, created_at, driver_id"
      )
      .or(`status.eq.requested,driver_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (ridesError) {
      console.error("Driver rides lookup failed:", ridesError.message);

      return NextResponse.json(
        { error: "Could not load rides." },
        { status: 500 }
      );
    }

    // 4. Return rides
    return NextResponse.json(
      { rides: rides ?? [] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Driver rides API failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}