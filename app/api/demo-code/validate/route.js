import { NextResponse } from "next/server";
import {
  createDemoAccessToken,
  DEMO_ACCESS_COOKIE_NAME,
  DEMO_ACCESS_MAX_AGE_SECONDS,
  validateDemoCode
} from "@/lib/demoAccess";

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

  const response = NextResponse.json({
    success: true,
    unlocked: true
  });

  response.cookies.set({
    name: DEMO_ACCESS_COOKIE_NAME,
    value: createDemoAccessToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEMO_ACCESS_MAX_AGE_SECONDS
  });

  return response;
}
