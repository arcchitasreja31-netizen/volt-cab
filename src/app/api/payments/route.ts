
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";
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

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || !secretKey.startsWith("sk_test_")) {
      return NextResponse.json(
        {
          error:
            "Stripe test mode is not configured. Add an authorized Stripe test secret key.",
        },
        { status: 503 }
      );
    }

    const stripe = new Stripe(secretKey);

    const { data: latestPayment, error: lookupError } =
      await supabaseServer
        .from("payments")
        .select(
          "id, ride_id, user_id, amount, currency, status, created_at, stripe_session_id"
        )
        .eq("ride_id", ride.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lookupError) {
      console.error("Payment lookup failed:", lookupError.code);
      return NextResponse.json(
        { error: "Could not check the payment record." },
        { status: 500 }
      );
    }

    if (
      latestPayment &&
      ["paid", "succeeded"].includes(
        String(latestPayment.status).toLowerCase()
      )
    ) {
      return NextResponse.json(
        { error: "This ride has already been paid." },
        { status: 409 }
      );
    }

    let payment = latestPayment;

    if (!payment || payment.status !== "pending") {
      const { data: newPayment, error: insertError } =
        await supabaseServer
          .from("payments")
          .insert({
            ride_id: ride.id,
            user_id: userId,
            amount,
            currency: "INR",
            status: "pending",
          })
          .select(
            "id, ride_id, user_id, amount, currency, status, created_at, stripe_session_id"
          )
          .single();

      if (insertError || !newPayment) {
        console.error("Payment creation failed:", insertError?.code);
        return NextResponse.json(
          { error: "Could not create the payment record." },
          { status: 500 }
        );
      }

      payment = newPayment;
    }

    if (payment.stripe_session_id) {
      const existingSession = await stripe.checkout.sessions.retrieve(
        payment.stripe_session_id
      );

      if (
        existingSession.payment_status === "paid"
      ) {
        await supabaseServer
          .from("payments")
          .update({ status: "succeeded" })
          .eq("id", payment.id)
          .eq("user_id", userId);

        return NextResponse.json(
          { error: "This ride has already been paid." },
          { status: 409 }
        );
      }

      if (
        existingSession.status === "open" &&
        existingSession.url
      ) {
        return NextResponse.json({
          payment,
          checkoutUrl: existingSession.url,
        });
      }
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
    
      line_items: [
        {
          price_data: {
            currency: String(payment.currency).toLowerCase(),
            product_data: {
              name: "Volt-Cab Ride",
              description: `Payment for ride ${ride.id}`,
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      client_reference_id: payment.id,
      metadata: {
        payment_id: payment.id,
        ride_id: ride.id,
        user_id: userId,
      },
      success_url:
        `${origin}/rides?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${origin}/rides?payment=cancelled&ride_id=${encodeURIComponent(ride.id)}`,
    });

    if (!session.url) {
      throw new Error("Stripe did not return a Checkout URL.");
    }

    const { data: updatedPayment, error: updateError } =
      await supabaseServer
        .from("payments")
        .update({ stripe_session_id: session.id })
        .eq("id", payment.id)
        .eq("user_id", userId)
        .select(
          "id, ride_id, amount, currency, status, created_at, stripe_session_id"
        )
        .single();

    if (updateError || !updatedPayment) {
      console.error("Saving Stripe session failed:", updateError?.code);
      return NextResponse.json(
        { error: "Could not save the Checkout Session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payment: updatedPayment,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error(
      "Payment API failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 }
    );
  }
}
