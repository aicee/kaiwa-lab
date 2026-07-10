import { NextResponse } from "next/server";
import { DEMO_ACCESS_COOKIE_NAME, validateDemoAccessToken } from "@/lib/demoAccess";

export async function GET(request) {
  const accessToken = request.cookies.get(DEMO_ACCESS_COOKIE_NAME)?.value;
  const access = validateDemoAccessToken(accessToken);

  return NextResponse.json({
    success: true,
    unlocked: access.success
  });
}
