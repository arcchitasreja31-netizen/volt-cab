import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../lib/supabase/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  const { data: existingProfile, error: fetchError } = await supabaseServer
    .from("users")
    .select("id, full_name, phone, profile_image_url, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("Profile fetch failed:", fetchError.code);
    return NextResponse.json(
      { error: "Could not load your profile." },
      { status: 500 }
    );
  }

  if (existingProfile) {
    return NextResponse.json(
      { profile: existingProfile },
      { status: 200 }
    );
  }

  const clerkUser = await currentUser();

  const fullName = [
    clerkUser?.firstName,
    clerkUser?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || null;

  const { data: newProfile, error: createError } = await supabaseServer
    .from("users")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        profile_image_url: clerkUser?.imageUrl ?? null,
      },
      { onConflict: "id" }
    )
    .select("id, full_name, phone, profile_image_url, created_at")
    .single();

  if (createError) {
    console.error("Profile creation failed:", createError.code);
    return NextResponse.json(
      { error: "Could not create your profile." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { profile: newProfile },
    { status: 200 }
  );
}

export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Please sign in first." },
      { status: 401 }
    );
  }

  let body: { full_name?: string; phone?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const fullName = body.full_name?.trim();
  const phone = body.phone?.trim();

  if (!fullName || fullName.length > 100) {
    return NextResponse.json(
      { error: "Name is required and must be 100 characters or fewer." },
      { status: 400 }
    );
  }

  if (phone && phone.length > 30) {
    return NextResponse.json(
      { error: "Phone number must be 30 characters or fewer." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseServer
    .from("users")
    .upsert(
      {
        id: userId,
        full_name: fullName,
        phone: phone || null,
      },
      { onConflict: "id" }
    )
    .select("id, full_name, phone, profile_image_url, created_at")
    .single();

  if (error) {
    console.error("Profile update failed:", error.code);
    return NextResponse.json(
      { error: "Could not save your profile." },
      { status: 500 }
    );
  }

  return NextResponse.json({ profile: data }, { status: 200 });
}