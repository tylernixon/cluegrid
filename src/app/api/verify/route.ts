import { NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  // TODO: Implement guess verification against Supabase
  return NextResponse.json(
    { error: "NOT_IMPLEMENTED", message: "Verification not yet available" },
    { status: 501 },
  );
}
