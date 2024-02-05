import { WwebClient } from "@/lib/controllers/WWebClient"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get("filename")

  if (!filename) {
    return NextResponse.json({ error: "Filename not found" }, { status: 400 })
  }

  WwebClient.init(filename)
  return NextResponse.json({ success: true })
}
