import { NextResponse } from "next/server";
import { reserveLiveVoiceSession, validateDemoAccessToken, validateDemoCode } from "@/lib/demoAccess";
import {
  elevenLabsDynamicVariableNames,
  requiredElevenLabsDynamicVariables
} from "@/lib/elevenlabsAgentConfig";

export async function POST(request) {
  let sessionConfig;

  try {
    sessionConfig = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON session configuration is required." }, { status: 400 });
  }

  const missingRequiredFields = requiredElevenLabsDynamicVariables.filter((field) => {
    const value = sessionConfig?.[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingRequiredFields.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required ElevenLabs dynamic variables.",
        missing: missingRequiredFields
      },
      { status: 400 }
    );
  }

  const accessToken = sessionConfig?.demoAccessToken;
  const code = sessionConfig?.demoCode;
  const access = accessToken ? validateDemoAccessToken(accessToken) : validateDemoCode(code);

  if (!access.success) {
    return NextResponse.json(
      { success: false, message: "Voice Mode requires demo access." },
      { status: 403 }
    );
  }

  if (!process.env.ELEVENLABS_API_KEY || !process.env.ELEVENLABS_AGENT_ID) {
    return NextResponse.json(
      {
        error: "ElevenLabs voice sessions are not configured.",
        missing: [
          !process.env.ELEVENLABS_API_KEY && "ELEVENLABS_API_KEY",
          !process.env.ELEVENLABS_AGENT_ID && "ELEVENLABS_AGENT_ID"
        ].filter(Boolean),
        demoModeAvailable: true
      },
      { status: 503 }
    );
  }

  const limit = reserveLiveVoiceSession(access.sessionId || "direct-code");
  if (!limit.success) {
    return NextResponse.json(limit, { status: 429 });
  }

  const dynamicVariables = Object.fromEntries(
    elevenLabsDynamicVariableNames.map((field) => [field, String(sessionConfig?.[field] || "")])
  );

  const elevenLabsPayload = {
    agent_id: process.env.ELEVENLABS_AGENT_ID,
    dynamic_variables: dynamicVariables
  };

  // TODO: Create a signed ElevenLabs Conversational AI session on the server.
  // TODO: POST elevenLabsPayload to the ElevenLabs session/conversation endpoint
  // with ELEVENLABS_API_KEY in the server-only Authorization header.
  // TODO: Return only the signed client session details needed by the browser.
  return NextResponse.json(
    {
      success: true,
      status: "placeholder",
      message: "ElevenLabs credentials are configured; live session creation is the next integration step.",
      dynamicVariables
    }
  );
}
