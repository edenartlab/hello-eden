import { getSession } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}