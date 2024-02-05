import { z } from "zod"

export const uploadSchema = z.object({
  file: z.string().url(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters long",
  }),
})

export type TUpload = z.infer<typeof uploadSchema>
