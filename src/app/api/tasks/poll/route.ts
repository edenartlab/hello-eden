import { pollTask } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { taskId } = await request.json();

  try {
    const task = await pollTask(taskId);

    if (!task) {
      throw new Error("Task not found");
    }

    const { status, creation } = task;

    if (status === "completed" && creation) {
      return NextResponse.json({ uri: creation.uri });
    }

    if (status === "failed") {
      return NextResponse.json(
        { error: "Task failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({ uri: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}