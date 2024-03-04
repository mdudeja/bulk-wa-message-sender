import { Client, MessageAck, NoAuth } from "whatsapp-web.js"
import { socketController } from "@/lib/controllers/SocketController"
import { GlobalRef } from "@/lib/GlobalRef"
import {
  fetchPendingReceiversByQueueId,
  updateReceiverById,
  updateReceiverResponsesByPhoneNumber,
} from "./QueueReceiverController"
import { TUserQueue } from "../interfaces/UserQueues"
import { fetchQueueById, updateQueueById } from "./UserQueuesController"

type TClientItem = {
  id: string
  client?: Client
  authed?: boolean
  ready?: boolean
  in_progress?: boolean
  currentQueueId?: string
  promiseGenerators?: (() => Promise<void>)[]
  is_paused?: boolean
  qrcodesCount: number
}

class WWebClient {
  private clients: TClientItem[]

  constructor() {
    this.clients = []
  }

  async attachListeners(client: Client, clientId: string) {
    if (!client) {
      return
    }

    client.on("qr", (qr) => {
      const targetClient = this.clients.find((c) => c.id === clientId)

      if (!targetClient) {
        return
      }

      if (targetClient.qrcodesCount > 3) {
        socketController.sendMessageByClientUserIdAndPath(
          "/socket/qr",
          clientId,
          "error",
          "Failed to generate QR code"
        )
        targetClient.client?.destroy()
        this.clients = this.clients.filter((c) => c.id !== clientId)
        return
      }

      socketController.sendMessageByClientUserIdAndPath(
        "/socket/qr",
        clientId,
        "qr",
        qr
      )

      targetClient.qrcodesCount += 1
      this.updateClients(targetClient)
    })

    client.on("authenticated", () => {
      this.clients = this.clients.map((c) => {
        if (c.id === clientId) {
          return { ...c, authed: true }
        }

        return c
      })
    })

    client.on("message", (message) => {
      const targetClient = this.clients.find((c) => c.id === clientId)
      updateReceiverResponsesByPhoneNumber(
        targetClient?.currentQueueId ?? "",
        message.from?.replace("@c.us", "") ?? "",
        message.body ?? ""
      )
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "responseReceived",
        {
          response: message.body,
          phoneNumber: message.from.replace("@c.us", ""),
        }
      )
    })

    // client.on("message_create", (message) => {
    //   console.log("MESSAGE CREATED", message)
    //   const targetClient = this.clients.find((c) => c.id === clientId)
    //   updateReceiverResponsesByPhoneNumber(
    //     targetClient?.currentQueueId ?? "",
    //     message.from?.replace("@c.us", "") ?? "",
    //     message.body ?? ""
    //   )
    //   socketController.sendMessageByClientUserIdAndPath(
    //     "/socket/messages",
    //     clientId,
    //     "responseReceived",
    //     {
    //       response: message.body,
    //       phoneNumber: message.from.replace("@c.us", ""),
    //     }
    //   )
    // })

    client.on("disconnected", (reason) => {
      this.clients = this.clients.filter((c) => c.id !== clientId)
      client.destroy()
    })

    client.on("ready", () => {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/qr",
        clientId,
        "isReady",
        true
      )
      this.clients = this.clients.map((c) =>
        c.id === clientId ? { ...c, ready: true } : c
      )
    })

    return client
  }

  async prepare(clientId: string) {
    const existingClient = this.clients.find((c) => c.id === clientId)
    if (existingClient) {
      return
    }

    const client = new Client({
      authStrategy: new NoAuth(),
      puppeteer: {
        args: ["--no-sandbox"],
      },
    })

    client.initialize()

    const c = await this.attachListeners(client, clientId)

    this.clients.push({ id: clientId, client: c, qrcodesCount: 0 })
  }

  updateClients(clientItem: TClientItem) {
    this.clients = this.clients.map((c) =>
      c.id === clientItem.id ? clientItem : c
    )
  }

  getMessageVariations(queue: TUserQueue, howMany: number): string[] {
    if (!queue.enableVariations || !queue.variations) {
      const unformattedMessages = []
      for (let i = 0; i < howMany; i++) {
        unformattedMessages.push(queue.message)
      }
      return unformattedMessages
    }

    const formatter = Object.entries(queue.variations)
      .reduce((acc: string[][], variation) => {
        if (variation[0].includes("replacethis")) {
          return [
            ...acc,
            [
              variation[1],
              (queue.variations as any)?.[
                variation[0].replace("replace", "with")
              ] as string,
            ],
          ]
        }
        return acc
      }, [])
      .filter((v) => v.length > 0 && v[0]?.length > 0 && v[1]?.length > 0)

    let formattedMessages: string[] = []

    for (let i = 0; i < howMany; i++) {
      let message = queue.message

      formatter.forEach((v) => {
        const options = v[1].split("|")
        const randomIndex = Math.floor(Math.random() * (options.length + 1))
        if (randomIndex < options.length) {
          message = message.replace(new RegExp(v[0], "g"), options[randomIndex])
        }
        formattedMessages.push(message)
      })
    }

    return formattedMessages
  }

  async processQueue(clientId: string, queueId: string): Promise<void> {
    const clientItem = this.clients.find((c) => c.id === clientId)
    const queue = await fetchQueueById(queueId)

    if (!queue) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Queue not found"
      )
      return
    }

    if (
      !clientItem ||
      !clientItem.authed ||
      !clientItem.ready ||
      clientItem.in_progress ||
      clientItem.is_paused ||
      queue.status === "paused" ||
      queue.status === "completed"
    ) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Client not authorized or Queue Already in Progress or Paused or Completed"
      )
      return
    }

    clientItem.in_progress = true
    clientItem.currentQueueId = queueId

    this.updateClients(clientItem)

    const client = clientItem.client

    if (!client) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Client not found"
      )
      return
    }

    const contacts = await fetchPendingReceiversByQueueId(queue._id ?? "", 50)

    if (!contacts) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "error",
        "Failed to fetch contacts"
      )
      return
    }

    if (contacts.length === 0) {
      socketController.sendMessageByClientUserIdAndPath(
        "/socket/messages",
        clientId,
        "allMessagesSent",
        "No more Contacts left to send message to"
      )

      await updateQueueById(queue._id ?? "", { status: "completed" })
      clientItem.in_progress = false
      this.updateClients(clientItem)

      return
    }

    const messagesToSend = this.getMessageVariations(queue, contacts.length)

    clientItem.promiseGenerators = contacts.map((contact, idx) => {
      return () =>
        new Promise<void>(async (resolve) =>
          setTimeout(async () => {
            if (!messagesToSend[idx]) {
              console.log("NO MESSAGE TO SEND")
              resolve()
              return
            }

            console.log("SENDING MESSAGE TO", contact.name, contact.phoneNumber)
            const res = await client.sendMessage(
              contact.phoneNumber + "@c.us",
              messagesToSend[idx].replace(/{{name}}/g, contact.name ?? "")
            )
            socketController.sendMessageByClientUserIdAndPath(
              "/socket/messages",
              clientId,
              "messageSent",
              {
                name: contact.name,
                phoneNumber: contact.phoneNumber,
                ack: res.ack,
              }
            )
            await updateReceiverById(contact._id ?? "", {
              processed: true,
              delivered: res.ack !== MessageAck.ACK_ERROR,
            })
            resolve()
          }, (Math.random() * 5 + 3) * 1000)
        )
    })

    this.updateClients(clientItem)

    for (const promiseGenerator of clientItem.promiseGenerators ?? []) {
      if (!clientItem.is_paused) {
        await promiseGenerator()
      }
    }

    clientItem.in_progress = false
    this.updateClients(clientItem)
    this.processQueue(clientId, queueId)
  }

  isAuthed(clientId: string) {
    const client = this.clients.find((c) => c.id === clientId)
    return !!(client && client.authed)
  }

  pauseProcessing(queueId: string) {
    const client = this.clients.find((c) => c.currentQueueId === queueId)
    if (client) {
      client.is_paused = true
      client.in_progress = false
      client.promiseGenerators = []
      this.updateClients(client)
    }
  }

  resumeProcessing(queueId: string) {
    const client = this.clients.find((c) => c.currentQueueId === queueId)
    if (client) {
      client.is_paused = false
      this.updateClients(client)
    }
  }
}

const wwebClientRef = new GlobalRef<WWebClient>("WwebClient")

if (!wwebClientRef.value) {
  wwebClientRef.value = new WWebClient()
}

export const WwebClient = wwebClientRef.value
