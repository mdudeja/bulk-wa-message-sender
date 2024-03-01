"use client"

import QRCode from "react-qr-code"
import { Skeleton } from "@/components/ui/skeleton"

export default function QRCodeDisplayerComponent({ qr }: { qr: string }) {
  return qr.length > 0 ? (
    <div className="max-w-64">
      <QRCode
        size={256}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
        value={qr}
        viewBox="0 0 256 256"
      />
    </div>
  ) : (
    <Skeleton className="w-[256px] h-[256px]" />
  )
}
