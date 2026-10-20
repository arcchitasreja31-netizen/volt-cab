
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import { supabaseServer } from "../../lib/supabase/server";

export const runtime = "nodejs";

const BUCKET = "profile-images";
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const SIGNED_URL_LIFETIME = 60 * 60; // 1 hour

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  profile_image_url: string | null;
  created_at: string;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function getImageUrl(
  imagePath: string | null | undefined
): Promise<string | null> {
  if (!imagePath) return null;

  // Preserve existing HTTPS image URLs, such as Clerk profile images.
  if (/^https:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const { data, error } = await supabaseServer.storage
    .from(BUCKET)
    .createSignedUrl(imagePath, SIGNED_URL_LIFETIME);

  if (error) {
  console.error("Profile image URL generation failed:", error.message);
  return null;
}
  return data.signedUrl;
}

async function formatProfile(profile: Profile) {
  return {
    ...profile,
    profile_image_url: await getImageUrl(profile.profile_image_url),
  };
}

// GET: Load the signed-in user's profile.
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Please sign in first.", 401);
  }

  const { data: existingProfile, error: fetchError } =
    await supabaseServer
      .from("users")
      .select("id, full_name, phone, profile_image_url, created_at")
      .eq("id", userId)
      .maybeSingle();

  if (fetchError) {
    console.error("Profile fetch failed:", fetchError.code);
    return errorResponse("Could not load your profile.", 500);
  }

  let profile = existingProfile as Profile | null;

  if (!profile) {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return errorResponse("Could not load your account details.", 401);
    }

    const fullName =
      [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ") || "Volt Cab User";

    const { data, error } = await supabaseServer
      .from("users")
      .upsert(
        {
          id: userId,
          full_name: fullName,
          profile_image_url: clerkUser.imageUrl || null,
        },
        { onConflict: "id" }
      )
      .select("id, full_name, phone, profile_image_url, created_at")
      .single();

    if (error) {
      console.error("Profile creation failed:", error.code);
      return errorResponse("Could not create your profile.", 500);
    }

    profile = data as Profile;
  }

  return NextResponse.json(
    { profile: await formatProfile(profile) },
    { status: 200 }
  );
}

// PATCH: Update the signed-in user's name and phone.
export async function PATCH(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Please sign in first.", 401);
  }

  let body: { full_name?: unknown; phone?: unknown };

  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  if (
    typeof body.full_name !== "string" ||
    typeof body.phone !== "string"
  ) {
    return errorResponse("Enter a valid name and phone number.", 400);
  }

  const fullName = body.full_name.trim();
  const phone = body.phone.trim();

  if (!fullName || fullName.length > 100) {
    return errorResponse(
      "Name is required and must be 100 characters or fewer.",
      400
    );
  }

  if (phone.length > 30) {
    return errorResponse(
      "Phone number must be 30 characters or fewer.",
      400
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
    return errorResponse("Could not save your profile.", 500);
  }

  return NextResponse.json(
    { profile: await formatProfile(data as Profile) },
    { status: 200 }
  );
}

// POST: Upload a profile picture for the signed-in user.
export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Please sign in first.", 401);
  }

  // Reject an obviously oversized request before parsing its form data.
  const contentLength = request.headers.get("content-length");

  if (
    contentLength &&
    Number.isFinite(Number(contentLength)) &&
    Number(contentLength) > MAX_FILE_SIZE + 100_000
  ) {
    return errorResponse("The upload must be smaller than 2 MB.", 413);
  }

  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid upload request.", 400);
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return errorResponse("Choose a profile picture first.", 400);
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    return errorResponse("The image must be 2 MB or smaller.", 400);
  }

  const extension = ALLOWED_TYPES[file.type];

  if (!extension) {
    return errorResponse("Use a JPG, PNG, or WebP image.", 400);
  }

  let fileBuffer: Buffer;

  try {
    fileBuffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return errorResponse("Could not read the uploaded image.", 400);
  }

  // Check the file's actual signature, not just its declared MIME type.
  let detectedType;

  try {
    detectedType = await fileTypeFromBuffer(fileBuffer);
  } catch {
    return errorResponse("Could not validate the uploaded image.", 400);
  }

  if (!detectedType || detectedType.mime !== file.type) {
    return errorResponse(
      "The file contents do not match the selected image type.",
      400
    );
  }

  const imagePath = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabaseServer.storage
    .from(BUCKET)
    .upload(imagePath, fileBuffer, {
      contentType: detectedType.mime,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    console.error("Profile image upload failed:", uploadError.message);
    return errorResponse(
      "Could not upload the picture. Check your Supabase Storage bucket.",
      500
    );
  }

  const { data, error: updateError } = await supabaseServer
    .from("users")
    .upsert(
      {
        id: userId,
        profile_image_url: imagePath,
      },
      { onConflict: "id" }
    )
    .select("id, full_name, phone, profile_image_url, created_at")
    .single();

  if (updateError) {
    console.error("Profile image database update failed:", updateError.code);
    return errorResponse(
      "The picture uploaded, but the profile could not be updated.",
      500
    );
  }

  return NextResponse.json(
    {
      message: "Profile picture updated successfully!",
      profile: await formatProfile(data as Profile),
    },
    { status: 200 }
  );
}