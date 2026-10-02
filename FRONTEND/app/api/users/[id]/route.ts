import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const response = await fetch(
      `${API_URL}/api/users/${params.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("User profile proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to SIX20 backend.",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authorization = req.headers.get("authorization") || "";

    const response = await fetch(
      `${API_URL}/api/users/${params.id}/follow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Follow proxy error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to connect to SIX20 backend.",
      },
      { status: 500 }
    );
  }
}
