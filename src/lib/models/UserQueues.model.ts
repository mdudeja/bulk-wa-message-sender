import mongoose from "mongoose"
import {
  TUserQueue,
  TUserQueueContentVariations,
} from "@/lib/interfaces/UserQueues"

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
    enableVariations: {
      type: Boolean,
      default: false,
    },
    variations: new mongoose.Schema<TUserQueueContentVariations>(
      {
        replacethis: {
          type: String,
          required: false,
        },
        withthis: {
          type: String,
          required: false,
        },
        replacethis_1: {
          type: String,
          required: false,
        },
        withthis_1: {
          type: String,
          required: false,
        },
        replacethis_2: {
          type: String,
          required: false,
        },
        withthis_2: {
          type: String,
          required: false,
        },
        replacethis_3: {
          type: String,
          required: false,
        },
        withthis_3: {
          type: String,
          required: false,
        },
      },
      {
        _id: false,
      }
    ),
  },
  {
    timestamps: true,
  }
)

UserQueuesModelSchema.index({ userId: 1, queueName: 1 }, { unique: true })

export default mongoose.models.UserQueues ||
  mongoose.model<TUserQueue>("UserQueues", UserQueuesModelSchema)
