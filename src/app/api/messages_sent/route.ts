import { WwebClient } from "@/lib/controllers/WWebClient"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename not found" }, { status: 400 })
  }

  try {
    const messagesSent = WwebClient.getMessagesSent(filename)
    return NextResponse.json({ ...messagesSent })
  } catch (error) {
    return NextResponse.json(
      { error: "Something went wrong. Please try again in some time" },
      { status: 500 }
    )
  }
}
