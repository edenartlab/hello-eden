import { getCreations } from "@/lib/eden";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Parse query parameters
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "20");
  const type = searchParams.get("type") as
    | "image"
    | "video"
    | "all"
    | undefined;
  const onlyMine = searchParams.get("onlyMine") === "true";
  const onlyAgents = searchParams.get("onlyAgents") === "true";
  const sort = searchParams.get("sort") || undefined;

  // Build filters array
  const filters: string[] = [];

  // Add custom filters from query params
  searchParams.forEach((value, key) => {
    if (key.startsWith("filter:")) {
      filters.push(`${key.replace("filter:", "")};${value}`);
    }
  });

  try {
    const response = await getCreations({
      cursor,
      limit,
      type: type || "all",
      onlyMine,
      onlyAgents,
      sort,
      filter: filters.length > 0 ? filters : undefined,
    });
    console.log(response);

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error", docs: [], hasMore: false },
      { status: 500 }
    );
  }
}
