import { z } from "zod"

export const QueueReceiverSchema = z.object({
  _id: z.string().optional(),
  queueId: z.string(),
  queueName: z.string().max(128),
  name: z.string().max(128).optional(),
  phoneNumber: z.string().max(15),
  processed: z.boolean().default(false),
  delivered: z.boolean().default(false),
  responses: z.array(z.string()).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type TQueueReceiver = z.infer<typeof QueueReceiverSchema>
