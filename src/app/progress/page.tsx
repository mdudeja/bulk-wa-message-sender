"use client"

import { useEffect, useState } from "react"

async function getMessagesQueued(filename: string, message: string) {
  const response = await fetch(
    encodeURI(`/api/messages_queued?filename=${filename}&message=${message}`),
    { cache: "no-store" }
  )
  const json = await response.json()

  return json.success
}

async function getMessagesProcessed(filename: string) {
  const response = await fetch(
    encodeURI(`/api/messages_sent?filename=${filename}`),
    { cache: "no-store" }
  )
  const json = await response.json()

  return json
}

export default function ProgressPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const [messagesQueued, setMessagesQueued] = useState<boolean | null>(null)
  const [messagesProcessed, setMessagesProcessed] = useState<
    {
      to: string
      phone: string
      state: string
    }[]
  >([])

  useEffect(() => {
    if (!searchParams.filename || !searchParams.message) {
      return
    }

    getMessagesQueued(
      searchParams.filename as string,
      searchParams.message as string
    ).then((messagesqueued) => {
      setMessagesQueued(messagesqueued)
    })
  }, [searchParams.filename, searchParams.message])

  useEffect(() => {
    if (!messagesQueued) {
      return
    }

    const interval = setInterval(async () => {
      const mp = await getMessagesProcessed(searchParams.filename as string)
      if (mp) {
        setMessagesProcessed(mp.messagesSent)
        if (mp.messagesSent?.length === mp.totalCount) {
          clearInterval(interval)
          alert("All messages sent!")
        }
      }
    }, 5000)
  }, [messagesQueued])

  return (
    <div>
      <h1>Progress</h1>
      <p>
        Messages Queued:{" "}
        {messagesQueued === null ? "Loading..." : messagesQueued ? "Yes" : "No"}
      </p>
      <p>Messages Processed: {messagesProcessed?.length}</p>
      <ul>
        {messagesProcessed?.map((mp, idx) => (
          <li key={idx}>
            {idx + 1} -- {mp.to} -- {mp.phone} -- {mp.state}
          </li>
        ))}
      </ul>
    </div>
  )
}
