import { NextResponse } from "next/server";
import { createDemoAccessToken, validateDemoCode } from "@/lib/demoAccess";

export async function POST(request) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid demo code" }, { status: 400 });
  }

  const result = validateDemoCode(payload?.code);

  if (!result.success) {
    return NextResponse.json(result, { status: process.env.DEMO_ACCESS_CODE ? 401 : 503 });
  }

  return NextResponse.json({
    success: true,
    accessToken: createDemoAccessToken()
  });
}
