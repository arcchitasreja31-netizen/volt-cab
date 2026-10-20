import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json(
      { error: "Valid latitude and longitude are required." },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");

  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "VoltCab/1.0 (development prototype)",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Address lookup is temporarily unavailable." },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      address: data.display_name || "",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not look up this address. Please try again." },
      { status: 502 }
    );
  }
}