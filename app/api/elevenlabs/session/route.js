import { NextResponse } from "next/server";
import { DEMO_ACCESS_COOKIE_NAME, validateDemoAccessToken } from "@/lib/demoAccess";
import {
  elevenLabsDynamicVariableNames,
  requiredElevenLabsDynamicVariables
} from "@/lib/elevenlabsAgentConfig";

async function requestTemporaryCredential(agentId) {
  const url = new URL("https://api.elevenlabs.io/v1/convai/conversation/token");
  url.searchParams.set("agent_id", agentId);

  const tokenResponse = await fetch(url, {
    method: "GET",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY
    },
    cache: "no-store"
  });

  const tokenData = await tokenResponse.json().catch(() => ({}));

  if (tokenResponse.ok && (tokenData?.token || tokenData?.conversation_token)) {
    return { conversationToken: tokenData.token || tokenData.conversation_token };
  }

  const signedUrl = new URL("https://api.elevenlabs.io/v1/convai/conversation/get-signed-url");
  signedUrl.searchParams.set("agent_id", agentId);

  const signedResponse = await fetch(signedUrl, {
    method: "GET",
    headers: {
      "xi-api-key": process.env.ELEVENLABS_API_KEY
    },
    cache: "no-store"
  });

  const signedData = await signedResponse.json().catch(() => ({}));

  if (signedResponse.ok && (signedData?.signed_url || signedData?.signedUrl)) {
    return { signedUrl: signedData.signed_url || signedData.signedUrl };
  }

  throw new Error("Unable to create ElevenLabs temporary conversation credential.");
}

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

  const accessToken = request.cookies.get(DEMO_ACCESS_COOKIE_NAME)?.value;
  const access = validateDemoAccessToken(accessToken);
  const voiceRequestEligible = access.success && missingRequiredFields.length === 0;

  if (process.env.NODE_ENV === "development") {
    console.info("Kaiwa voice access", {
      demoAccessValid: access.success,
      voiceRequestEligible
    });
  }

  if (!access.success) {
    return NextResponse.json(
      {
        success: false,
        code: "INVALID_DEMO_ACCESS",
        message: "Voice Mode requires demo access."
      },
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

  const dynamicVariables = Object.fromEntries(
    elevenLabsDynamicVariableNames.map((field) => [field, String(sessionConfig?.[field] || "")])
  );

  const elevenLabsPayload = {
    agent_id: process.env.ELEVENLABS_AGENT_ID,
    dynamic_variables: dynamicVariables
  };

  try {
    const temporaryCredential = await requestTemporaryCredential(elevenLabsPayload.agent_id);

    return NextResponse.json({
      success: true,
      ...temporaryCredential,
      dynamicVariables
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to start Voice Mode right now. Please try again or continue with Demo Mode.",
        demoModeAvailable: true
      },
      { status: 502 }
    );
  }
}
