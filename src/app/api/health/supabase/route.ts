
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return NextResponse.json(
      { status: "error", message: "Supabase configuration is missing." },
      { status: 500 }
    );
  }

  const supabase = createClient(url, key);

  const { error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    console.error("Supabase check failed:", error.code);

    return NextResponse.json(
      { status: "error", message: "Supabase query failed." },
      { status: 503 }
    );
  }

  return NextResponse.json({
    status: "connected",
    database: "Supabase",
  });
}


