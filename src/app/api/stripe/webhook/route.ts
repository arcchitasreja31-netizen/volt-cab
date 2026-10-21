
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secretKey || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook is not configured." },
      { status: 500 }
    );
  }

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  const payload = await request.text();
  const stripe = new Stripe(secretKey);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  const paymentId =
    session.metadata?.payment_id ?? session.client_reference_id;

  if (!paymentId) {
    console.error("Stripe session has no payment ID:", session.id);
    return NextResponse.json({ received: true });
  }

  const { data, error } = await supabaseServer
    .from("payments")
    .update({ status: "succeeded" })
    .eq("id", paymentId)
    .eq("stripe_session_id", session.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Updating payment status failed:", error.code);
    return NextResponse.json(
      { error: "Could not update payment status." },
      { status: 500 }
    );
  }

  if (!data) {
    console.error("No matching payment for Stripe session:", session.id);
    return NextResponse.json(
      { error: "Matching payment record was not found." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
