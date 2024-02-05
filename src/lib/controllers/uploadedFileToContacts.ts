import c2j from "csvtojson"
import { join } from "path"

export async function convertUploadedFileToContacts(filename: string) {
  const data = await c2j().fromFile(join(process.cwd(), "/uploads/", filename))
  return data
}
