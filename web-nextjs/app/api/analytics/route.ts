import { NextResponse } from "next/server";
import { readAnalyticsData } from "../../../lib/data";

export const dynamic = "force-static";

export async function GET() {
  const data = readAnalyticsData();
  return NextResponse.json(data);
}
