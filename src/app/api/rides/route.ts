import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

const bookingAttempts = new Map<string, number[]>();

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;

const RIDE_RATES = {
  standard: 12,
  premium: 20,
  xl: 16,
} as const;

const BASE_FARE = 50;

function isRateLimited(userId: string): boolean {
  const now = Date.now();

  const recentAttempts = (bookingAttempts.get(userId) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS
  );

  if (recentAttempts.length >= RATE_LIMIT) {
    bookingAttempts.set(userId, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  bookingAttempts.set(userId, recentAttempts);

  return false;
}

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  if (isRateLimited(userId)) {
    return NextResponse.json(
      {
        error: "Too many booking attempts. Please wait a minute and try again.",
      },
      {
        status: 429,
        headers: { "Retry-After": "60" },
      }
    );
  }

  let body: {
    pickup_location?: string;
    dropoff_location?: string;
    ride_type?: string;
    distance_km?: number;
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
  const distanceKm = body.distance_km;

  if (!pickup || !dropoff || pickup.length > 300 || dropoff.length > 300) {
    return NextResponse.json(
      { error: "Enter valid pickup and drop-off locations." },
      { status: 400 }
    );
  }

  if (
    typeof rideType !== "string" ||
    !Object.hasOwn(RIDE_RATES, rideType)
  ) {
    return NextResponse.json(
      { error: "Invalid ride type." },
      { status: 400 }
    );
  }

  if (
    typeof distanceKm !== "number" ||
    !Number.isInteger(distanceKm) ||
    distanceKm < 1 ||
    distanceKm > 500
  ) {
    return NextResponse.json(
      { error: "Distance must be a whole number between 1 and 500 km." },
      { status: 400 }
    );
  }

  const estimatedFare = BASE_FARE + distanceKm * RIDE_RATES[
    rideType as keyof typeof RIDE_RATES
  ];

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
      distance_km: distanceKm,
      estimated_fare: estimatedFare,
    })
    .select(
      "id, pickup_location, dropoff_location, ride_type, distance_km, estimated_fare, status, created_at"
    )
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
    .select(
      "id, pickup_location, dropoff_location, ride_type, distance_km, estimated_fare, status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Ride history fetch failed:", error.code);

    return NextResponse.json(
      { error: "Could not load your ride history." },
      { status: 500 }
    );
  }

  const rideIds = (rides ?? []).map((ride) => ride.id);

  let payments: {
    id: string;
    ride_id: string;
    status: string;
  }[] = [];

  if (rideIds.length > 0) {
    const { data: paymentRows, error: paymentError } =
      await supabaseServer
        .from("payments")
        .select("id, ride_id, status")
        .eq("user_id", userId)
        .in("ride_id", rideIds)
        .order("created_at", { ascending: false });

    if (paymentError) {
      console.error("Payment status fetch failed:", paymentError.code);

      return NextResponse.json(
        { error: "Could not load payment statuses." },
        { status: 500 }
      );
    }

    payments = paymentRows ?? [];
  }

  const latestPaymentByRide = new Map<
    string,
    { id: string; status: string }
  >();

  for (const payment of payments) {
    if (!latestPaymentByRide.has(payment.ride_id)) {
      latestPaymentByRide.set(payment.ride_id, {
        id: payment.id,
        status: payment.status,
      });
    }
  }

  const ridesWithPayment = (rides ?? []).map((ride) => ({
    ...ride,
    payment: latestPaymentByRide.get(ride.id) ?? null,
  }));

  return NextResponse.json(
    { rides: ridesWithPayment },
    { status: 200 }
  );
}