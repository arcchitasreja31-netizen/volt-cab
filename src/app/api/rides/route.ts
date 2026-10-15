
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  let body: {
    pickup_location?: string;
    dropoff_location?: string;
    ride_type?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const pickup = body.pickup_location?.trim();
  const dropoff = body.dropoff_location?.trim();
  const rideType = body.ride_type ?? "standard";

  if (!pickup || !dropoff || pickup.length > 300 || dropoff.length > 300) {
    return NextResponse.json(
      { error: "Enter valid pickup and drop-off locations." },
      { status: 400 }
    );
  }

  if (!["standard", "premium", "xl"].includes(rideType)) {
    return NextResponse.json(
      { error: "Invalid ride type." },
      { status: 400 }
    );
  }

  const { error: userError } = await supabaseServer
    .from("users")
    .upsert({ id: userId }, { onConflict: "id" });

  if (userError) {
    console.error("User profile upsert failed:", userError.code);
    return NextResponse.json(
      { error: "Could not prepare your user profile." },
      { status: 500 }
    );
  }

  const { data: ride, error: rideError } = await supabaseServer
    .from("rides")
    .insert({
      user_id: userId,
      pickup_location: pickup,
      dropoff_location: dropoff,
      ride_type: rideType,
    })
    .select("id, status, created_at")
    .single();

  if (rideError) {
    console.error("Ride creation failed:", rideError.code);
    return NextResponse.json(
      { error: "Could not create your ride request." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ride }, { status: 201 });
}
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  const { data: rides, error } = await supabaseServer
    .from("rides")
    .select("id, pickup_location, dropoff_location, ride_type, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ride history fetch failed:", error.code);

    return NextResponse.json(
      { error: "Could not load your ride history." },
      { status: 500 }
    );
  }

  return NextResponse.json({ rides }, { status: 200 });
}