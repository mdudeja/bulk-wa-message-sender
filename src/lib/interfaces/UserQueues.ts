import { z } from "zod"

export const UserQueueSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  status: z
    .enum(["created", "in-progress", "paused", "completed"])
    .default("created"),
  queueName: z.string().max(128),
  file: z.string(),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters long",
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type TUserQueue = z.infer<typeof UserQueueSchema>
