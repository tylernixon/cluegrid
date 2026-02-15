import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(
  request: Request,
  { params }: { params: { date: string } },
) {
  // TODO: Implement puzzle fetching from Supabase
  return NextResponse.json(
    { error: "NOT_IMPLEMENTED", message: `Puzzle for ${params.date} not yet available` },
    { status: 501 },
  );
}
