import { getAgent } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await params;
    
    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required" },
        { status: 400 }
      );
    }

    const agent = await getAgent(agentId);
    
    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Failed to get agent:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}