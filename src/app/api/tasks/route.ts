import { createTask } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { text_input, type = 'image' } = await request.json();

  try {
    const { taskId } = await createTask(text_input, type);
    return NextResponse.json({ taskId });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}