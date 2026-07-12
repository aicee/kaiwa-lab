import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      status: "placeholder",
      message: "Audio transcription is not enabled yet. The demo flow does not require microphone access."
    },
    { status: 501 }
  );
}
