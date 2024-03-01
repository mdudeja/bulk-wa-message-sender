import { fetchReceiversByQueueId } from "@/lib/controllers/QueueReceiverController"
import { getIsUserLoggedIn } from "@/lib/getSession"
import { NextRequest } from "next/server"
import jsonexport from "jsonexport"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userLoggedIn = await getIsUserLoggedIn()

  if (!userLoggedIn) {
    return new Response("Unauthorized", { status: 401 })
  }

  const queueId = params.id
  const receivers = await fetchReceiversByQueueId(queueId)

  if (!receivers || receivers.length === 0) {
    return new Response("No receivers found", { status: 404 })
  }

  const receiverDataToSend = receivers.map((receiver) => ({
    name: receiver.name,
    phoneNumber: receiver.phoneNumber,
    processed: receiver.processed,
    delivered: receiver.delivered,
    responses: receiver.responses,
  }))

  try {
    const csv = await jsonexport(receiverDataToSend)
    const buffer = new TextEncoder().encode(csv)
    const headers = new Headers()
    headers.append(
      "Content-Disposition",
      `attachment; filename="${params.id}.csv"`
    )
    headers.append("Content-Type", "text/csv")

    return new Response(buffer, {
      status: 200,
      headers,
    })
  } catch (e) {
    console.error(e)
    return new Response("Failed to export data", { status: 500 })
  }
}
