import { NextResponse } from "next/server";

import { buildUsgsUrl } from "@/lib/map/usgs";

export const GET = async () => {
  try {
    const url = buildUsgsUrl();
    const response = await fetch(url, {
      next: { revalidate: 600 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `USGS request failed (${response.status})` },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (error) {
    console.error("[USGS] proxy error:", error);
    return NextResponse.json(
      { error: "Failed to fetch USGS earthquakes" },
      { status: 502 },
    );
  }
};
