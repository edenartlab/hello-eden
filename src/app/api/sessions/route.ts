import { createSession, sendSessionMessage } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      session_id,
      agent_ids,
      content,
      scenario,
      budget,
      title,
      autonomy_settings,
      attachments,
    } = body;

    // If session_id is provided, this is a message send
    if (session_id) {
      if (!content) {
        return NextResponse.json(
          { error: "content is required when sending a message" },
          { status: 400 }
        );
      }

      const result = await sendSessionMessage(session_id, content, attachments, agent_ids);
      return NextResponse.json(result);
    }

    // Otherwise, this is session creation
    if (!agent_ids || !Array.isArray(agent_ids) || agent_ids.length === 0) {
      return NextResponse.json(
        { error: "agent_ids is required and must be a non-empty array" },
        { status: 400 }
      );
    }

    const result = await createSession({
      agent_ids,
      content,
      scenario,
      budget,
      title,
      autonomy_settings,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to process session request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}