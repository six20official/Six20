import { NextResponse } from "next/server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Login proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to SIX20 backend.",
      },
      { status: 500 }
    );
  }
}