import { sendChatMessage, createChatSession } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { sessionId, message, agentId } = await request.json();

  try {
    if (!sessionId && agentId) {
      // Create new session
      const session = await createChatSession(agentId);
      return NextResponse.json({ session });
    }
    
    if (sessionId && message) {
      // Send message to existing session
      const response = await sendChatMessage(sessionId, message);
      return NextResponse.json({ message: response });
    }
    
    return NextResponse.json(
      { error: "Invalid request parameters" },
      { status: 400 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}