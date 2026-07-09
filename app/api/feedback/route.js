import { NextResponse } from "next/server";
import { mockFeedback } from "@/data/mockFeedback";
import { checkLiveFeedbackLimits, validateDemoAccessToken } from "@/lib/demoAccess";

export async function POST(request) {
  let sessionData;

  try {
    sessionData = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON session payload is required." }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      feedback: mockFeedback,
      source: "mock",
      message: "OPENAI_API_KEY is not configured. Returning demo feedback.",
      sessionData
    });
  }

  const access = validateDemoAccessToken(sessionData?.demoAccessToken);
  if (!access.success) {
    return NextResponse.json({
      feedback: mockFeedback,
      source: "mock",
      message: "Demo access was not provided. Returning demo feedback.",
      sessionData
    });
  }

  const limit = checkLiveFeedbackLimits(access.sessionId, sessionData);
  if (!limit.success) {
    return NextResponse.json({
      feedback: mockFeedback,
      source: "mock",
      message: limit.message,
      sessionData
    });
  }

  // TODO: Send the server-side feedback prompt and session data to OpenAI.
  return NextResponse.json({
    feedback: mockFeedback,
    source: "mock",
    message: "OpenAI feedback integration is ready to be connected.",
    sessionData
  });
}
