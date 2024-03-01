import { NextRequest, NextResponse } from "next/server"
import { join } from "path"
import { writeFile } from "fs/promises"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const uploadDir = join(process.cwd(), "/uploads")

  const formData = await request.formData()
  const file = (formData.get("file") as Blob) || null

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
  const filename = `file-${uniqueSuffix}.csv`
  await writeFile(join(uploadDir, filename), buffer)
  return NextResponse.json(
    {
      message: "File uploaded successfully",
      filename,
    },
    {
      status: 200,
    }
  )
}

export const config = {
  api: {
    bodyParser: false,
  },
}
