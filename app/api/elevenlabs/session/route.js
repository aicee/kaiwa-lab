import { NextResponse } from "next/server";

export async function POST(request) {
  let sessionConfig;

  try {
    sessionConfig = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON session configuration is required." }, { status: 400 });
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

  // TODO: Create a signed ElevenLabs conversation session on the server.
  return NextResponse.json(
    {
      status: "placeholder",
      message: "ElevenLabs credentials are configured; live session creation is the next integration step.",
      sessionConfig
    },
    { status: 501 }
  );
}
