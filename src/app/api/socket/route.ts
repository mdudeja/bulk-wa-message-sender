import { NextRequest } from "next/server"
import { socketController } from "@/lib/controllers/SocketController"
import { getIsUserLoggedIn } from "@/lib/getSession"

export async function GET(req: NextRequest) {
  const userLoggedIn = await getIsUserLoggedIn()

  if (!userLoggedIn) {
    return new Response("Unauthorized", { status: 401 })
  }

  const purpose = req.nextUrl.searchParams.get("purpose")

  if (!purpose) {
    return new Response("Purpose not found", { status: 400 })
  }

  if (purpose === "qr") {
    socketController.init(
      process.env.NEXT_PUBLIC_QRCODE_SOCKET_SERVER ?? "",
      +(process.env.NEXT_PUBLIC_QRCODE_SOCKET_PORT ?? 3001)
    )

    return new Response("QR code socket server initialized", { status: 200 })
  }

  if (purpose === "messages") {
    socketController.init(
      process.env.NEXT_PUBLIC_MESSAGE_SOCKET_SERVER ?? "",
      +(process.env.NEXT_PUBLIC_MESSAGE_SOCKET_PORT ?? 3002)
    )

    return new Response("Message socket server initialized", { status: 200 })
  }

  return new Response("Purpose not found", { status: 400 })
}
