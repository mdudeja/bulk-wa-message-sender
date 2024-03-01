import { fetchReceiversByQueueId } from "@/lib/controllers/QueueReceiverController"
import { getIsUserLoggedIn } from "@/lib/getSession"
import { NextRequest } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: { queueId: string } }
) {
  const userLoggedIn = await getIsUserLoggedIn()

  if (!userLoggedIn) {
    return new Response("Unauthorized", { status: 401 })
  }

  const queueId = params.queueId
  const receivers = await fetchReceiversByQueueId(queueId)

  if (!receivers || receivers.length === 0) {
    return new Response("No receivers found", { status: 404 })
  }

  let vcf_string = ""

  receivers.forEach((receiver) => {
    vcf_string += `BEGIN:VCARD
VERSION:2.1
N:WWEB_BJA_${receiver.name ?? ""};;;;
TEL;CELL;PREF:+${receiver.phoneNumber ?? "910000000000"}
END:VCARD
`
  })

  const buffer = new TextEncoder().encode(vcf_string)
  const headers = new Headers()
  headers.append(
    "Content-Disposition",
    `attachment; filename="${params.queueId}.vcf"`
  )
  headers.append("Content-Type", "text/vcard")

  return new Response(buffer, {
    status: 200,
    headers,
  })
}
