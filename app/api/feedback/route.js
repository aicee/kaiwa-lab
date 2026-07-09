import { NextResponse } from "next/server";
import { mockFeedback } from "@/data/mockFeedback";

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

  // TODO: Send the server-side feedback prompt and session data to OpenAI.
  return NextResponse.json({
    feedback: mockFeedback,
    source: "mock",
    message: "OpenAI feedback integration is ready to be connected.",
    sessionData
  });
}
