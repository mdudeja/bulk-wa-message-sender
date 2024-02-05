import { Client, NoAuth, Message } from "whatsapp-web.js"
import { GlobalRef } from "@/lib/GlobalRef"
import { convertUploadedFileToContacts } from "./uploadedFileToContacts"

type ClientItem = {
  id: string
  client: Client
  inited: boolean
  qr?: string
  authed?: boolean
  ready?: boolean
  messageResponses?: {
    to: string
    phone: string
    state: string
  }[]
  messagesToSend?: number
  in_progress?: boolean
}

class WWebClient {
  private clients: ClientItem[]

  constructor() {
    this.clients = []
  }

  init(clientId: string) {
    const existingClient = this.clients.find((c) => c.id === clientId)
    if (existingClient) {
      return
    }

    const client = new Client({
      authStrategy: new NoAuth(),
    })

    this.clients.push({ id: clientId, client, inited: true })

    this.addListenersAndInit(clientId)
  }

  addListenersAndInit(clientId: string) {
    const clientItem = this.clients.find((c) => c.id === clientId)

    if (!clientItem) {
      return
    }

    const client = clientItem?.client

    if (!client) {
      return
    }

    client.on("qr", (qr) => {
      console.log("QR RECEIVED", qr)
      clientItem.qr = qr
      this.clients = this.clients.map((c) =>
        c.id === clientId ? clientItem : c
      )
    })

    client.on("authenticated", () => {
      console.log("AUTHENTICATED")
      clientItem.authed = true
      this.clients = this.clients.map((c) =>
        c.id === clientId ? clientItem : c
      )
    })

    client.on("ready", () => {
      console.log("READY")
      clientItem.ready = true
      this.clients = this.clients.map((c) =>
        c.id === clientId ? clientItem : c
      )
    })

    client.on("message", (message) => {
      console.log("MESSAGE RECEIVED", message)
    })

    client.on("disconnected", (reason) => {
      console.log("DISCONNECTED", reason)
      client.destroy()
    })

    client.initialize()
  }

  async getState(clientId: string) {
    const client = this.clients.find((c) => c.id === clientId)?.client

    if (!client) {
      return
    }

    const state = await client.getState()
    return state
  }

  getQr(clientId: string) {
    const targetClient = this.clients.find((c) => c.id === clientId)

    const qr = targetClient?.qr

    if (!qr) {
      return
    }

    return qr
  }

  private updateClients(client: ClientItem) {
    this.clients = this.clients.map((c) => (c.id === client.id ? client : c))
  }

  async startSendingMessages(clientId: string, message: string): Promise<void> {
    const clientItem = this.clients.find((c) => c.id === clientId)

    if (
      !clientItem ||
      !clientItem.authed ||
      !clientItem.ready ||
      clientItem.in_progress
    ) {
      return
    }

    clientItem.in_progress = true

    this.updateClients(clientItem)

    const client = clientItem.client

    const contacts = await convertUploadedFileToContacts(clientId)

    if (!contacts) {
      return
    }

    clientItem.messagesToSend = contacts.length

    this.updateClients(clientItem)

    const promiseGenerators = contacts.map((contact) => {
      return () =>
        new Promise(async (resolve) =>
          setTimeout(async () => {
            console.log("SENDING MESSAGE TO", contact.name, contact.phone)
            const res = await client.sendMessage(
              contact.phone + "@c.us",
              message
            )
            if (res.fromMe) {
              clientItem.messageResponses = [
                ...(clientItem.messageResponses || []),
                {
                  to: contact.name,
                  phone: contact.phone,
                  state: "sent",
                },
              ]
              this.updateClients(clientItem)
            }
            resolve(res)
          }, (Math.random() * 5 + 3) * 1000)
        )
    })

    console.log("PROMISE GENERATORS", promiseGenerators.length)

    for (const promiseGenerator of promiseGenerators) {
      await promiseGenerator()
    }
  }

  getMessagesSent(clientId: string) {
    const clientItem = this.clients.find((c) => c.id === clientId)

    if (!clientItem) {
      return
    }

    return {
      messagesSent: clientItem.messageResponses,
      totalCount: clientItem.messagesToSend,
    }
  }
}

const wwebClientRef = new GlobalRef<WWebClient>("WwebClient")

if (!wwebClientRef.value) {
  wwebClientRef.value = new WWebClient()
}

export const WwebClient = wwebClientRef.value
