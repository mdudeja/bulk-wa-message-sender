"use client"

import { getQr } from "@/app/actions/getqr"
import { useEffect, useState } from "react"
import QRCode from "react-qr-code"
import { Skeleton } from "@/components/ui/skeleton"

export default function QRCodeDisplayerComponent({
  clientId,
}: {
  clientId: string
}) {
  const [qrcode, setQRCode] = useState<string | null>(null)
  const [fetchAttempts, setFetchAttempts] = useState(0)

  useEffect(() => {
    if (!qrcode && fetchAttempts < 10) {
      setTimeout(() => {
        console.log("fetching qr code, fetchAttempts: ", fetchAttempts)
        getQr(clientId).then((code) => {
          if (code) {
            console.log("fetched qr code: ", code)
            setQRCode(code)
          } else {
            setFetchAttempts(fetchAttempts + 1)
          }
        })
      }, 1000)
    }
  }, [qrcode, fetchAttempts, clientId])

  return qrcode ? (
    <div className="max-w-64">
      <QRCode
        size={256}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={qrcode}
        viewBox="0 0 256 256"
      />
    </div>
  ) : (
    <Skeleton className="w-[256px] h-[256px]" />
  )
}
