import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function PUT(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || "";
    const body = await req.json();

    const response = await fetch(`${API_URL}/api/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Profile update proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to SIX20 profile service.",
      },
      { status: 500 }
    );
  }
}
