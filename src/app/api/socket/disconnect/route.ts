import { socketController } from "@/lib/controllers/SocketController"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { clientUserId } = await req.json()

  if (!clientUserId) {
    return NextResponse.json(
      {
        error: "clientUserId is required",
      },
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  const disconnectedClients =
    socketController.disconnectByClientUserId(clientUserId)

  return NextResponse.json(
    {
      message: "Disconnected",
      disconnectedClients,
    },
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  )
}
