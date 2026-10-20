import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseServer } from "../../../../../../app/lib/supabase/server";

const allowedRoles = ["rider", "driver", "admin"] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the current user is an authorized admin.
    const { data: admin, error: adminError } = await supabaseServer
      .from("admin_users")
      .select("clerk_user_id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: targetUserId } = await params;
    const body = await request.json();
    const role = body?.role;

    if (
      typeof role !== "string" ||
      !allowedRoles.includes(role as (typeof allowedRoles)[number])
    ) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Don't allow changing your own role from this endpoint.
    if (targetUserId === userId) {
      return NextResponse.json(
        { error: "You cannot change your own role here." },
        { status: 400 }
      );
    }

    const { data: targetUser, error: targetError } = await supabaseServer
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabaseServer
      .from("users")
      .update({ role })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Role update failed:", updateError.message);

      return NextResponse.json(
        { error: "Could not update user role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      role,
    });
  } catch (error) {
    console.error("Admin role update error:", error);

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}