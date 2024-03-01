import mongoose from "mongoose"
import { TQueueReceiver } from "@/lib/interfaces/QueueReceivers"

const QueueReceiverModelSchema = new mongoose.Schema<TQueueReceiver>(
  {
    queueId: {
      type: String,
      required: true,
    },
    queueName: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 128,
    },
    name: {
      type: String,
      maxlength: 128,
    },
    phoneNumber: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 15,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    delivered: {
      type: Boolean,
      default: false,
    },
    responses: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

QueueReceiverModelSchema.index(
  { queueId: 1, phoneNumber: 1 },
  { unique: false }
)

export default mongoose.models.QueueReceivers ||
  mongoose.model<TQueueReceiver>("QueueReceivers", QueueReceiverModelSchema)
