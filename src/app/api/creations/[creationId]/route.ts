import { getCreation } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { creationId: string } }
) {
  try {
    const { creationId } = params;
    
    if (!creationId) {
      return NextResponse.json(
        { error: "Creation ID is required" },
        { status: 400 }
      );
    }

    const creation = await getCreation(creationId);
    
    if (!creation) {
      return NextResponse.json(
        { error: "Creation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ creation });
  } catch (error) {
    console.error("Error fetching creation:", error);
    return NextResponse.json(
      { error: "Failed to fetch creation" },
      { status: 500 }
    );
  }
}