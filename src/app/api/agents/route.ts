import { listAgents, getAgent } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const agentId = searchParams.get('id');

  try {
    if (agentId) {
      const agent = await getAgent(agentId);
      if (!agent) {
        return NextResponse.json(
          { error: "Agent not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ agent });
    }
    
    const agents = await listAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}