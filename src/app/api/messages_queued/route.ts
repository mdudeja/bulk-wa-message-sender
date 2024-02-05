import { WwebClient } from "@/lib/controllers/WWebClient"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename")
  const message = request.nextUrl.searchParams.get("message")

  if (!filename) {
    return NextResponse.json({ error: "Filename not found" }, { status: 400 })
  }

  try {
    WwebClient.startSendingMessages(filename, message ?? "")
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again in some time" },
      { status: 500 }
    )
  }
  return NextResponse.json({ success: true })
}
