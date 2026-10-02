import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(req: Request) {
  try {
    const authorization = req.headers.get("authorization") || "";

    const response = await fetch(`${API_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: authorization,
      },
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Me proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to SIX20 backend.",
      },
      { status: 500 }
    );
  }
}