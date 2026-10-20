import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const rideId = body?.ride_id;

    if (typeof rideId !== "string" || !rideId.trim()) {
      return NextResponse.json(
        { error: "A valid ride ID is required." },
        { status: 400 }
      );
    }

    // Only allow the authenticated passenger to pay for their own ride.
    const { data: ride, error: rideError } = await supabaseServer
      .from("rides")
      .select("id, user_id, estimated_fare, status")
      .eq("id", rideId)
      .eq("user_id", userId)
      .maybeSingle();

    if (rideError) {
      console.error("Payment ride lookup failed:", rideError.code);

      return NextResponse.json(
        { error: "Could not verify the ride." },
        { status: 500 }
      );
    }

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found." },
        { status: 404 }
      );
    }

    if (ride.status !== "completed") {
      return NextResponse.json(
        { error: "Payment is available only for completed rides." },
        { status: 409 }
      );
    }

    const amount = Number(ride.estimated_fare);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "The ride has an invalid fare." },
        { status: 400 }
      );
    }

    // Reuse an existing pending payment rather than creating duplicates.
    const { data: existingPayment, error: existingError } =
      await supabaseServer
        .from("payments")
        .select("id, ride_id, amount, currency, status, created_at")
        .eq("ride_id", ride.id)
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

    if (existingError) {
      console.error(
        "Pending payment lookup failed:",
        existingError.code
      );

      return NextResponse.json(
        { error: "Could not check existing payments." },
        { status: 500 }
      );
    }

    if (existingPayment) {
      return NextResponse.json(
        { payment: existingPayment },
        { status: 200 }
      );
    }

    const { data: payment, error: paymentError } = await supabaseServer
      .from("payments")
      .insert({
        ride_id: ride.id,
        user_id: userId,
        amount,
        currency: "INR",
        status: "pending",
      })
      .select("id, ride_id, amount, currency, status, created_at")
      .single();

    if (paymentError) {
      console.error("Payment creation failed:", paymentError.code);

      return NextResponse.json(
        { error: "Could not create the payment record." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        payment,
        message:
          "Pending payment created. No money has been charged.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment API failed:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}