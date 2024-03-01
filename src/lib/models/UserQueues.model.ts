import mongoose from "mongoose"
import { TUserQueue } from "@/lib/interfaces/UserQueues"

const UserQueuesModelSchema = new mongoose.Schema<TUserQueue>(
  {
    username: {
      type: String,
      required: true,
    },
    queueName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 128,
    },
    status: {
      type: String,
      enum: ["created", "in-progress", "paused", "completed"],
      default: "created",
    },
    file: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
      minlength: 10,
    },
  },
  {
    timestamps: true,
  }
)

UserQueuesModelSchema.index({ userId: 1, queueName: 1 }, { unique: true })

export default mongoose.models.UserQueues ||
  mongoose.model<TUserQueue>("UserQueues", UserQueuesModelSchema)
