import QRCodeDisplayerComponent from "@/components/QRCodeDisplayer"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function connect(filename: string) {
  const response = await fetch(
    encodeURI(`${process.env.BASE_URL}/api/connect?filename=${filename}`),
    {
      cache: "no-store",
    }
  )
  const json = await response.json()

  return json.success
}

export default async function LinkingPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const connected = await connect(searchParams.filename as string)

  if (connected) {
    return (
      <div className="h-screen w-4/6 mx-auto flex flex-col items-center justify-center space-y-4">
        <p>
          Please scan the QR Code below from your WhatsApp Application on phone{" "}
        </p>
        <QRCodeDisplayerComponent clientId={searchParams.filename as string} />
        <p>
          Please click on the button below when your phone shows that the device
          is linked
        </p>
        <Link
          href={`/progress?message=${searchParams.message}&filename=${searchParams.filename}`}
        >
          <Button>It's done</Button>
        </Link>
      </div>
    )
  }

  return <></>
}
