import { z } from "zod"

export const UserQueueContentVariationsSchema = z.object({
  replacethis: z.string().optional(),
  withthis: z.string().optional(),
  replacethis_1: z.string().optional(),
  withthis_1: z.string().optional(),
  replacethis_2: z.string().optional(),
  withthis_2: z.string().optional(),
  replacethis_3: z.string().optional(),
  withthis_3: z.string().optional(),
})

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
  enableVariations: z.boolean().default(false),
  variations: UserQueueContentVariationsSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type TUserQueue = z.infer<typeof UserQueueSchema>
export type TUserQueueContentVariations = z.infer<
  typeof UserQueueContentVariationsSchema
>
